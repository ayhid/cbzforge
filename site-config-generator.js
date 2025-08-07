#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');
const { createSpinner } = require('nanospinner');

// Common selector patterns for different elements
const SELECTOR_PATTERNS = {
  search: {
    input: [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'input[name*="search" i]',
      '.search-input',
      '#search',
      '#search-input',
      '.search-box input',
      '.search-form input'
    ],
    results: [
      '.manga-item',
      '.search-result',
      '.result-item',
      '.item',
      '.card',
      '.manga-card',
      '.search-item',
      '.series-item',
      'li[class*="item"]',
      '.grid-item'
    ],
    title: [
      'h3',
      'h2',
      '.title',
      '.name',
      '.manga-title',
      '.series-title',
      'a[title]',
      '.item-title'
    ],
    link: [
      'a',
      '.title a',
      '.name a',
      'h3 a',
      'h2 a'
    ],
    image: [
      'img',
      '.cover img',
      '.thumbnail img',
      '.image img'
    ]
  },
  chapters: {
    list: [
      '.chapter-item',
      '.episode-item',
      '.chapter',
      '.episode',
      'li[class*="chapter"]',
      'li[class*="episode"]',
      '.list-item',
      '.chapter-list li',
      '.episode-list li',
      'tr',
      '.table-row'
    ],
    title: [
      '.chapter-title',
      '.episode-title',
      '.title',
      '.name',
      'a',
      'span[class*="title"]',
      'td:first-child'
    ],
    link: [
      'a',
      '.title a',
      '.name a'
    ]
  },
  reader: {
    images: [
      '#readerarea img',
      '.reading-content img',
      '.reader img',
      '.chapter-content img',
      '.pages img',
      '.page img',
      '.comic-page img',
      '.entry-content img',
      '.post-content img',
      '#chapter-reader img',
      '.viewer img'
    ]
  }
};

// Test search terms for validation
const TEST_SEARCHES = [
  'Naruto',
  'One Piece',
  'Attack on Titan',
  'Dragon Ball',
  'Bleach'
];

class SiteConfigGenerator {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    const spinner = createSpinner('Initializing browser...').start();
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      this.page = await this.browser.newPage();
      
      // Set realistic user agent
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

  async testSelector(selector, description) {
    try {
      await this.page.waitForSelector(selector, { timeout: 3000 });
      const elements = await this.page.$$(selector);
      return {
        selector,
        found: elements.length > 0,
        count: elements.length,
        score: elements.length
      };
    } catch (error) {
      return {
        selector,
        found: false,
        count: 0,
        score: 0
      };
    }
  }

  async findBestSelector(patterns, description) {
    const results = [];
    
    for (const pattern of patterns) {
      const result = await this.testSelector(pattern, description);
      results.push(result);
      
      // If we found a good match, we can stop early
      if (result.count > 0 && result.count < 50) {
        break;
      }
    }
    
    // Sort by score (number of matching elements, but prefer reasonable amounts)
    results.sort((a, b) => {
      if (a.count === 0) return 1;
      if (b.count === 0) return -1;
      
      // Prefer selectors that find reasonable amounts of elements
      const aScore = a.count > 100 ? a.count * 0.1 : a.count;
      const bScore = b.count > 100 ? b.count * 0.1 : b.count;
      
      return bScore - aScore;
    });
    
    return results[0] || { selector: patterns[0], found: false, count: 0 };
  }

  async analyzeSearch(baseUrl, testTerm = 'Naruto') {
    const spinner = createSpinner(`Analyzing search functionality with "${testTerm}"...`).start();
    
    try {
      await this.page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Find search input
      const searchInput = await this.findBestSelector(
        SELECTOR_PATTERNS.search.input,
        'search input'
      );
      
      if (!searchInput.found) {
        spinner.error({ text: 'Could not find search input field' });
        return null;
      }
      
      // Perform search
      await this.page.type(searchInput.selector, testTerm);
      await this.page.keyboard.press('Enter');
      
      // Wait for results page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Find search results
      const searchResults = await this.findBestSelector(
        SELECTOR_PATTERNS.search.results,
        'search results'
      );
      
      if (!searchResults.found) {
        spinner.error({ text: 'Could not find search results' });
        return null;
      }
      
      // Find title and link selectors within results
      const title = await this.findBestSelector(
        SELECTOR_PATTERNS.search.title,
        'result titles'
      );
      
      const link = await this.findBestSelector(
        SELECTOR_PATTERNS.search.link,
        'result links'
      );
      
      const image = await this.findBestSelector(
        SELECTOR_PATTERNS.search.image,
        'result images'
      );
      
      spinner.success({ text: `Search analysis completed (${searchResults.count} results found)` });
      
      return {
        input: searchInput.selector,
        results: searchResults.selector,
        title: title.selector,
        link: link.selector,
        image: image.selector,
        searchUrl: this.page.url()
      };
    } catch (error) {
      spinner.error({ text: `Search analysis failed: ${error.message}` });
      return null;
    }
  }

  async analyzeChapters(mangaUrl) {
    const spinner = createSpinner('Analyzing chapter list...').start();
    
    try {
      await this.page.goto(mangaUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Find chapter list
      const chapterList = await this.findBestSelector(
        SELECTOR_PATTERNS.chapters.list,
        'chapter list items'
      );
      
      if (!chapterList.found) {
        spinner.error({ text: 'Could not find chapter list' });
        return null;
      }
      
      // Find title and link selectors within chapters
      const title = await this.findBestSelector(
        SELECTOR_PATTERNS.chapters.title,
        'chapter titles'
      );
      
      const link = await this.findBestSelector(
        SELECTOR_PATTERNS.chapters.link,
        'chapter links'
      );
      
      spinner.success({ text: `Chapter analysis completed (${chapterList.count} chapters found)` });
      
      return {
        list: chapterList.selector,
        title: title.selector,
        link: link.selector
      };
    } catch (error) {
      spinner.error({ text: `Chapter analysis failed: ${error.message}` });
      return null;
    }
  }

  async analyzeReader(chapterUrl) {
    const spinner = createSpinner('Analyzing chapter reader...').start();
    
    try {
      await this.page.goto(chapterUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Find manga images
      const images = await this.findBestSelector(
        SELECTOR_PATTERNS.reader.images,
        'manga images'
      );
      
      if (!images.found) {
        spinner.error({ text: 'Could not find manga images' });
        return null;
      }
      
      // Get all possible image selectors that work
      const workingSelectors = [];
      for (const selector of SELECTOR_PATTERNS.reader.images) {
        const result = await this.testSelector(selector, 'images');
        if (result.found && result.count > 0) {
          workingSelectors.push(selector);
        }
      }
      
      spinner.success({ text: `Reader analysis completed (${images.count} images found)` });
      
      return {
        images: workingSelectors.length > 0 ? workingSelectors : [images.selector]
      };
    } catch (error) {
      spinner.error({ text: `Reader analysis failed: ${error.message}` });
      return null;
    }
  }

  async analyzeWebsite(baseUrl, siteName, testSearchTerm = 'Naruto') {
    const spinner = createSpinner(`Analyzing website: ${baseUrl}`).start();
    
    try {
      // Validate URL
      new URL(baseUrl);
      
      const analysis = {
        baseUrl,
        siteName,
        searchUrl: baseUrl
      };
      
      // Analyze search functionality
      const searchAnalysis = await this.analyzeSearch(baseUrl, testSearchTerm);
      if (!searchAnalysis) {
        throw new Error('Failed to analyze search functionality');
      }
      analysis.search = searchAnalysis;
      
      // Get a manga URL for further analysis
      let mangaUrl = null;
      try {
        // Try to get the first search result URL
        await this.page.goto(searchAnalysis.searchUrl, { waitUntil: 'networkidle0' });
        const firstResult = await this.page.$(searchAnalysis.results + ':first-child ' + searchAnalysis.link);
        if (firstResult) {
          mangaUrl = await firstResult.evaluate(el => el.href);
        }
      } catch (e) {
        console.log('Could not get manga URL automatically');
      }
      
      if (!mangaUrl) {
        const { provideMangaUrl } = await inquirer.prompt([{
          type: 'confirm',
          name: 'provideMangaUrl',
          message: 'Could not automatically find a manga page. Would you like to provide one manually?',
          default: true
        }]);
        
        if (provideMangaUrl) {
          const { url } = await inquirer.prompt([{
            type: 'input',
            name: 'url',
            message: 'Enter a manga page URL for analysis:',
            validate: input => {
              try {
                new URL(input);
                return true;
              } catch {
                return 'Please enter a valid URL';
              }
            }
          }]);
          mangaUrl = url;
        }
      }
      
      if (mangaUrl) {
        // Analyze chapters
        const chapterAnalysis = await this.analyzeChapters(mangaUrl);
        if (chapterAnalysis) {
          analysis.chapters = chapterAnalysis;
          
          // Try to get a chapter URL for reader analysis
          let chapterUrl = null;
          try {
            await this.page.goto(mangaUrl, { waitUntil: 'networkidle0' });
            const firstChapter = await this.page.$(chapterAnalysis.list + ':first-child ' + chapterAnalysis.link);
            if (firstChapter) {
              chapterUrl = await firstChapter.evaluate(el => el.href);
            }
          } catch (e) {
            console.log('Could not get chapter URL automatically');
          }
          
          if (chapterUrl) {
            // Analyze reader
            const readerAnalysis = await this.analyzeReader(chapterUrl);
            if (readerAnalysis) {
              analysis.reader = readerAnalysis;
            }
          }
        }
      }
      
      spinner.success({ text: 'Website analysis completed' });
      return analysis;
      
    } catch (error) {
      spinner.error({ text: `Website analysis failed: ${error.message}` });
      throw error;
    }
  }

  generateConfig(analysis) {
    const config = {
      name: analysis.siteName,
      baseUrl: analysis.baseUrl,
      searchUrl: analysis.search?.searchUrl || analysis.baseUrl,
      selectors: {
        search: {
          input: analysis.search?.input || 'input[type="search"]',
          results: analysis.search?.results || '.manga-item',
          title: analysis.search?.title || 'h3',
          link: analysis.search?.link || 'a',
          image: analysis.search?.image || 'img'
        },
        chapters: {
          list: analysis.chapters?.list || '.chapter-item',
          title: analysis.chapters?.title || '.chapter-title',
          link: analysis.chapters?.link || 'a'
        },
        reader: {
          images: analysis.reader?.images || ['#readerarea img', '.reading-content img']
        }
      },
      customLogic: {
        beforeChapterScrape: async (page) => {
          // Site-specific logic can be added here
          // For example, switching to single page mode
          try {
            // Common patterns for single page mode
            await page.click('#single-page-mode').catch(() => {});
            await page.click('[data-mode="single"]').catch(() => {});
            await page.click('.single-page').catch(() => {});
          } catch (e) {
            // Ignore errors - these are just attempts
          }
        }
      }
    };
    
    return config;
  }

  async saveConfig(config, siteKey) {
    const configsDir = './site-configs';
    await fs.mkdir(configsDir, { recursive: true });
    
    // Save as JavaScript module
    const jsContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    const jsPath = path.join(configsDir, `${siteKey}.js`);
    await fs.writeFile(jsPath, jsContent);
    
    // Save as JSON for reference
    const jsonPath = path.join(configsDir, `${siteKey}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(config, null, 2));
    
    console.log(`\\n📁 Configuration saved:`);
    console.log(`   JavaScript: ${jsPath}`);
    console.log(`   JSON: ${jsonPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🛠️  Site Configuration Generator

Usage:
  node site-config-generator.js [url] [site-name] [site-key]
  node site-config-generator.js --interactive

Arguments:
  url       Base URL of the manga site
  site-name Display name for the site
  site-key  Short key for the site (used as filename)

Examples:
  node site-config-generator.js "https://mangakakalot.com" "Mangakakalot" "mangakakalot"
  node site-config-generator.js --interactive
`);
    return;
  }
  
  const generator = new SiteConfigGenerator();
  
  try {
    await generator.init();
    
    let url, siteName, siteKey, testTerm;
    
    if (args.length >= 2) {
      // Command line mode
      [url, siteName, siteKey] = args;
      testTerm = 'Naruto';
      
      if (!siteKey) {
        siteKey = siteName.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    } else {
      // Interactive mode
      console.log('🛠️  Site Configuration Generator - Interactive Mode\\n');
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter the base URL of the manga site:',
          validate: input => {
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL (including http:// or https://)';
            }
          }
        },
        {
          type: 'input',
          name: 'siteName',
          message: 'Enter a display name for the site:',
          validate: input => input.trim().length > 0 || 'Please enter a site name'
        },
        {
          type: 'input',
          name: 'siteKey',
          message: 'Enter a short key for the site (used as filename):',
          validate: input => /^[a-z0-9_]+$/.test(input) || 'Please use only lowercase letters, numbers, and underscores'
        },
        {
          type: 'list',
          name: 'testTerm',
          message: 'Choose a test search term:',
          choices: TEST_SEARCHES,
          default: 'Naruto'
        }
      ]);
      
      ({ url, siteName, siteKey, testTerm } = answers);
    }
    
    console.log(`\\n🔍 Analyzing ${siteName} (${url})...\\n`);
    
    // Perform analysis
    const analysis = await generator.analyzeWebsite(url, siteName, testTerm);
    
    // Generate configuration
    const config = generator.generateConfig(analysis);
    
    // Show preview
    console.log('\\n📋 Generated Configuration Preview:');
    console.log(JSON.stringify(config, null, 2));
    
    // Confirm save
    const { shouldSave } = await inquirer.prompt([{
      type: 'confirm',
      name: 'shouldSave',
      message: 'Save this configuration?',
      default: true
    }]);
    
    if (shouldSave) {
      await generator.saveConfig(config, siteKey);
      
      console.log(`\\n✅ Configuration generated successfully!`);
      console.log(`\\nTo use this configuration, add it to your main downloader:`);
      console.log(`const ${siteKey} = require('./site-configs/${siteKey}.js');`);
      console.log(`\\nTest it with:`);
      console.log(`node multi-site-downloader.js "${testTerm}" "1" "${siteKey}"`);
    }
    
  } catch (error) {
    console.error('\\n💥 Configuration generation failed:', error.message);
    process.exit(1);
  } finally {
    await generator.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SiteConfigGenerator;
