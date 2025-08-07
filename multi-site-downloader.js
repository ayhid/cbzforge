#!/usr/bin/env node

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const inquirer = require('inquirer');
const { createSpinner } = require('nanospinner');

// Site configurations
const SITE_PLUGINS = {
  sushiscan: require('./site-configs/sushiscan.js'),
  mangadx: require('./site-configs/mangadx.js'),
  mangakakalot: require('./site-configs/mangakakalot.js')
};

class MultiSiteMangaDownloader {
  constructor() {
    this.browser = null;
    this.page = null;
    this.downloadDir = './downloads';
    this.tempDir = './temp';
    this.currentSite = null;
  }

  async init() {
    const spinner = createSpinner('Initializing browser...').start();
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      this.page = await this.browser.newPage();
      
      // Set realistic user agent and viewport
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      spinner.success({ text: 'Browser initialized successfully' });
    } catch (error) {
      spinner.error({ text: `Failed to initialize browser: ${error.message}` });
      throw error;
    }
  }

  setSite(siteKey) {
    if (!SITE_PLUGINS[siteKey]) {
      throw new Error(`Site '${siteKey}' not supported. Available sites: ${Object.keys(SITE_PLUGINS).join(', ')}`);
    }
    this.currentSite = SITE_PLUGINS[siteKey];
    console.log(`🌐 Selected site: ${this.currentSite.name} (${this.currentSite.baseUrl})`);
  }

  async searchManga(title) {
    if (!this.currentSite) {
      throw new Error('No site selected. Use setSite() first.');
    }

    const spinner = createSpinner(`Searching for "${title}" on ${this.currentSite.name}...`).start();
    
    try {
      await this.page.goto(this.currentSite.searchUrl, { waitUntil: 'networkidle0' });
      
      // Wait for search input and enter title
      await this.page.waitForSelector(this.currentSite.selectors.search.input, { timeout: 10000 });
      await this.page.type(this.currentSite.selectors.search.input, title);
      await this.page.keyboard.press('Enter');
      
      // Wait for results
      await this.page.waitForSelector(this.currentSite.selectors.search.results, { timeout: 15000 });
      
      // Extract search results
      const results = await this.page.evaluate((selectors) => {
        const resultElements = document.querySelectorAll(selectors.search.results);
        const results = [];
        
        resultElements.forEach((element, index) => {
          if (index >= 10) return; // Limit to top 10 results
          
          const titleEl = element.querySelector(selectors.search.title);
          const linkEl = element.querySelector(selectors.search.link);
          const imageEl = element.querySelector(selectors.search.image);
          
          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent.trim(),
              url: linkEl.href,
              image: imageEl ? imageEl.src : null
            });
          }
        });
        
        return results;
      }, this.currentSite.selectors);
      
      spinner.success({ text: `Found ${results.length} results` });
      return results;
    } catch (error) {
      spinner.error({ text: `Search failed: ${error.message}` });
      throw error;
    }
  }

  async getChapters(mangaUrl) {
    const spinner = createSpinner('Fetching chapter list...').start();
    
    try {
      await this.page.goto(mangaUrl, { waitUntil: 'networkidle0' });
      
      // Wait for chapter list
      await this.page.waitForSelector(this.currentSite.selectors.chapters.list, { timeout: 10000 });
      
      // Extract chapters
      const chapters = await this.page.evaluate((selectors) => {
        const chapterElements = document.querySelectorAll(selectors.chapters.list);
        const chapters = [];
        
        // Helper function to extract chapter number
        function extractChapterNumber(title) {
          const match = title.match(/(?:chapter|ch\.?|episode|ep\.?)\s*(\d+(?:\.\d+)?)/i);
          return match ? parseFloat(match[1]) : 0;
        }
        
        chapterElements.forEach((element) => {
          const titleEl = element.querySelector(selectors.chapters.title);
          const linkEl = element.querySelector(selectors.chapters.link);
          
          if (titleEl && linkEl) {
            chapters.push({
              title: titleEl.textContent.trim(),
              url: linkEl.href,
              number: extractChapterNumber(titleEl.textContent)
            });
          }
        });
        
        return chapters;
      }, this.currentSite.selectors);
      
      // Sort chapters by number (ascending)
      chapters.sort((a, b) => a.number - b.number);
      
      spinner.success({ text: `Found ${chapters.length} chapters` });
      return chapters;
    } catch (error) {
      spinner.error({ text: `Failed to get chapters: ${error.message}` });
      throw error;
    }
  }

  extractChapterNumber(title) {
    const match = title.match(/(?:chapter|ch\.?|episode|ep\.?)\s*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  }

  async downloadChapterImages(chapterUrl, chapterTitle) {
    const spinner = createSpinner(`Downloading images for "${chapterTitle}"...`).start();
    
    try {
      await this.page.goto(chapterUrl, { waitUntil: 'networkidle0' });
      
      // Execute custom logic if defined
      if (this.currentSite.customLogic?.beforeChapterScrape) {
        await this.currentSite.customLogic.beforeChapterScrape(this.page);
      }
      
      // Try multiple selectors for images
      let imageUrls = [];
      for (const selector of this.currentSite.selectors.reader.images) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          imageUrls = await this.page.evaluate((sel) => {
            const images = document.querySelectorAll(sel);
            return Array.from(images)
              .map(img => img.src)
              .filter(src => src && !src.includes('data:image'));
          }, selector);
          
          if (imageUrls.length > 0) break;
        } catch (e) {
          continue;
        }
      }
      
      if (imageUrls.length === 0) {
        throw new Error('No images found on chapter page');
      }
      
      // Create chapter directory
      const chapterDir = path.join(this.tempDir, this.sanitizeFilename(chapterTitle));
      await fs.mkdir(chapterDir, { recursive: true });
      
      // Download images with retry logic
      const downloadPromises = imageUrls.map(async (url, index) => {
        const fileName = `${String(index + 1).padStart(3, '0')}.jpg`;
        const filePath = path.join(chapterDir, fileName);
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const response = await axios.get(url, {
              responseType: 'arraybuffer',
              headers: {
                'Referer': chapterUrl,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              timeout: 30000
            });
            
            await fs.writeFile(filePath, response.data);
            return { success: true, fileName };
          } catch (error) {
            if (attempt === 3) {
              return { success: false, fileName, error: error.message };
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      });
      
      const results = await Promise.all(downloadPromises);
      const successful = results.filter(r => r.success).length;
      
      spinner.success({ text: `Downloaded ${successful}/${results.length} images` });
      
      return {
        directory: chapterDir,
        imageCount: successful,
        failed: results.filter(r => !r.success)
      };
    } catch (error) {
      spinner.error({ text: `Failed to download chapter: ${error.message}` });
      throw error;
    }
  }

  async createCBZ(imagesDir, outputPath) {
    const spinner = createSpinner('Creating CBZ file...').start();
    
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        spinner.success({ text: `CBZ created: ${path.basename(outputPath)} (${sizeInMB} MB)` });
        resolve();
      });
      
      archive.on('error', (err) => {
        spinner.error({ text: `CBZ creation failed: ${err.message}` });
        reject(err);
      });
      
      archive.pipe(output);
      archive.directory(imagesDir, false);
      archive.finalize();
    });
  }

  parseChapterRange(rangeStr, availableChapters) {
    const chapters = availableChapters.sort((a, b) => a.number - b.number);
    
    if (rangeStr.toLowerCase() === 'all') {
      return chapters;
    }
    
    const selected = [];
    const parts = rangeStr.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range like "1-10"
        const [start, end] = part.split('-').map(n => parseFloat(n.trim()));
        const rangeChapters = chapters.filter(ch => ch.number >= start && ch.number <= end);
        selected.push(...rangeChapters);
      } else {
        // Single chapter like "5"
        const num = parseFloat(part);
        const chapter = chapters.find(ch => ch.number === num);
        if (chapter) selected.push(chapter);
      }
    }
    
    // Remove duplicates
    return selected.filter((ch, index, self) => 
      index === self.findIndex(c => c.number === ch.number)
    );
  }

  sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
  }

  async download(title, chapterRange, siteKey) {
    try {
      await this.init();
      this.setSite(siteKey);
      
      // Search for manga
      const searchResults = await this.searchManga(title);
      if (searchResults.length === 0) {
        throw new Error(`No manga found with title "${title}"`);
      }
      
      // Use first result or let user choose
      let selectedManga = searchResults[0];
      if (searchResults.length > 1) {
        const { manga } = await inquirer.prompt([{
          type: 'list',
          name: 'manga',
          message: 'Select manga:',
          choices: searchResults.map(manga => ({
            name: `${manga.title}`,
            value: manga
          }))
        }]);
        selectedManga = manga;
      }
      
      console.log(`📚 Selected: ${selectedManga.title}`);
      
      // Get chapters
      const chapters = await this.getChapters(selectedManga.url);
      const selectedChapters = this.parseChapterRange(chapterRange, chapters);
      
      if (selectedChapters.length === 0) {
        throw new Error(`No chapters found for range "${chapterRange}"`);
      }
      
      console.log(`📖 Will download ${selectedChapters.length} chapters`);
      
      // Ensure directories exist
      await fs.mkdir(this.downloadDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Download each chapter
      for (const [index, chapter] of selectedChapters.entries()) {
        console.log(`\\n[${index + 1}/${selectedChapters.length}] ${chapter.title}`);
        
        try {
          const result = await this.downloadChapterImages(chapter.url, chapter.title);
          
          if (result.imageCount > 0) {
            const cbzName = `${this.sanitizeFilename(selectedManga.title)} - ${this.sanitizeFilename(chapter.title)}.cbz`;
            const cbzPath = path.join(this.downloadDir, cbzName);
            
            await this.createCBZ(result.directory, cbzPath);
            
            // Clean up temp directory
            await fs.rm(result.directory, { recursive: true, force: true });
          } else {
            console.log(`⚠️  No images downloaded for ${chapter.title}`);
          }
        } catch (error) {
          console.error(`❌ Failed to download ${chapter.title}: ${error.message}`);
          continue;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`\\n✅ Download completed! Check the ${this.downloadDir} directory.`);
      
    } catch (error) {
      console.error(`\\n❌ Download failed: ${error.message}`);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  static listSites() {
    console.log('\\n🌐 Available manga sites:');
    Object.entries(SITE_PLUGINS).forEach(([key, site]) => {
      console.log(`  ${key}: ${site.name} (${site.baseUrl})`);
    });
    console.log();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Multi-Site Manga Downloader

Usage:
  node multi-site-downloader.js [title] [chapters] [site]
  node multi-site-downloader.js --list-sites
  node multi-site-downloader.js --interactive

Arguments:
  title     Manga title to search for
  chapters  Chapter range (e.g., "1-10", "1,3,5", "all")
  site      Site key (sushiscan, mangadx, mangakakalot)

Examples:
  node multi-site-downloader.js "Naruto" "1-10" sushiscan
  node multi-site-downloader.js "One Piece" "all" mangadx
  node multi-site-downloader.js "Attack on Titan" "1,5,10" mangakakalot
`);
    return;
  }
  
  if (args.includes('--list-sites')) {
    MultiSiteMangaDownloader.listSites();
    return;
  }
  
  const downloader = new MultiSiteMangaDownloader();
  
  try {
    if (args.length >= 3) {
      // Direct command line usage
      const [title, chapters, site] = args;
      await downloader.download(title, chapters, site);
    } else {
      // Interactive mode
      console.log('🚀 Multi-Site Manga Downloader - Interactive Mode\\n');
      
      const { site } = await inquirer.prompt([{
        type: 'list',
        name: 'site',
        message: 'Select manga site:',
        choices: Object.entries(SITE_PLUGINS).map(([key, plugin]) => ({
          name: `${plugin.name} (${plugin.baseUrl})`,
          value: key
        }))
      }]);
      
      const { title } = await inquirer.prompt([{
        type: 'input',
        name: 'title',
        message: 'Enter manga title:',
        validate: input => input.trim().length > 0 || 'Please enter a manga title'
      }]);
      
      const { chapters } = await inquirer.prompt([{
        type: 'input',
        name: 'chapters',
        message: 'Enter chapter range (e.g., "1-10", "1,3,5", "all"):',
        default: 'all',
        validate: input => input.trim().length > 0 || 'Please enter a chapter range'
      }]);
      
      await downloader.download(title.trim(), chapters.trim(), site);
    }
  } catch (error) {
    console.error('\\n💥 Application error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MultiSiteMangaDownloader;
