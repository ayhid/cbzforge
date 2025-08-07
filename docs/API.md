# 🔧 API Documentation

This document provides technical details about the Multi-Site Manga Downloader's architecture and APIs for developers who want to extend or integrate the system.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [MultiSiteMangaDownloader Class](#multisitemangadownloader-class)
- [SiteConfigGenerator Class](#siteconfiggenerator-class)
- [Configuration API](#configuration-api)
- [Plugin System](#plugin-system)
- [Error Handling](#error-handling)
- [Integration Examples](#integration-examples)

## Architecture Overview

The application follows a plugin-based architecture with the following components:

```
┌─────────────────────────────────────────┐
│           CLI Interface                 │
├─────────────────────────────────────────┤
│      MultiSiteMangaDownloader          │
├─────────────────────────────────────────┤
│         Site Plugins                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │SushiScan│ │ MangaDx │ │Kakalot  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│    Browser Automation (Puppeteer)      │
├─────────────────────────────────────────┤
│     File System & Archive Creation     │
└─────────────────────────────────────────┘
```

## MultiSiteMangaDownloader Class

### Constructor
```javascript
new MultiSiteMangaDownloader()
```

Creates a new downloader instance with default settings.

**Properties:**
- `browser` - Puppeteer browser instance
- `page` - Current browser page
- `downloadDir` - Download directory path (default: './downloads')
- `tempDir` - Temporary directory path (default: './temp')
- `currentSite` - Currently selected site configuration

### Methods

#### async init()
Initializes the browser and sets up the environment.

```javascript
const downloader = new MultiSiteMangaDownloader();
await downloader.init();
```

**Returns:** Promise<void>
**Throws:** Error if browser initialization fails

#### setSite(siteKey)
Sets the active site configuration.

```javascript
downloader.setSite('sushiscan');
```

**Parameters:**
- `siteKey` (string) - Key identifying the site configuration

**Throws:** Error if site is not supported

#### async searchManga(title)
Searches for manga on the current site.

```javascript
const results = await downloader.searchManga('Naruto');
```

**Parameters:**
- `title` (string) - Manga title to search for

**Returns:** Promise<Array<Object>>
```javascript
[
  {
    title: "Manga Title",
    url: "https://site.com/manga/title",
    image: "https://site.com/cover.jpg"
  }
]
```

**Throws:** Error if search fails

#### async getChapters(mangaUrl)
Retrieves chapter list from a manga page.

```javascript
const chapters = await downloader.getChapters('https://site.com/manga/title');
```

**Parameters:**
- `mangaUrl` (string) - URL of the manga page

**Returns:** Promise<Array<Object>>
```javascript
[
  {
    title: "Chapter 1",
    url: "https://site.com/chapter/1",
    number: 1
  }
]
```

#### async downloadChapterImages(chapterUrl, chapterTitle)
Downloads images for a specific chapter.

```javascript
const result = await downloader.downloadChapterImages(
  'https://site.com/chapter/1',
  'Chapter 1'
);
```

**Parameters:**
- `chapterUrl` (string) - URL of the chapter to download
- `chapterTitle` (string) - Title for file naming

**Returns:** Promise<Object>
```javascript
{
  directory: "/path/to/temp/chapter",
  imageCount: 20,
  failed: []
}
```

#### async createCBZ(imagesDir, outputPath)
Creates a CBZ file from downloaded images.

```javascript
await downloader.createCBZ(
  '/temp/chapter-dir',
  '/downloads/manga-chapter.cbz'
);
```

**Parameters:**
- `imagesDir` (string) - Path to directory containing images
- `outputPath` (string) - Output path for CBZ file

**Returns:** Promise<void>

#### parseChapterRange(rangeStr, availableChapters)
Parses chapter range string and returns matching chapters.

```javascript
const selected = downloader.parseChapterRange(
  '1-5,10',
  availableChapters
);
```

**Parameters:**
- `rangeStr` (string) - Range specification ("1-5", "all", "1,3,5")
- `availableChapters` (Array) - Available chapters array

**Returns:** Array<Object> - Filtered chapters

#### async download(title, chapterRange, siteKey)
Main download method that orchestrates the entire process.

```javascript
await downloader.download('Naruto', '1-10', 'sushiscan');
```

**Parameters:**
- `title` (string) - Manga title to search for
- `chapterRange` (string) - Chapter range specification
- `siteKey` (string) - Site configuration key

**Returns:** Promise<void>

#### static listSites()
Lists all available site configurations.

```javascript
MultiSiteMangaDownloader.listSites();
```

**Returns:** void (prints to console)

## SiteConfigGenerator Class

### Constructor
```javascript
new SiteConfigGenerator()
```

Creates a new configuration generator instance.

### Methods

#### async analyzeWebsite(baseUrl, siteName, testSearchTerm)
Performs complete website analysis and generates configuration.

```javascript
const generator = new SiteConfigGenerator();
await generator.init();
const analysis = await generator.analyzeWebsite(
  'https://manga-site.com',
  'Manga Site',
  'Naruto'
);
```

**Parameters:**
- `baseUrl` (string) - Website base URL
- `siteName` (string) - Display name for the site
- `testSearchTerm` (string) - Term to use for testing search

**Returns:** Promise<Object> - Analysis results

#### generateConfig(analysis)
Generates site configuration from analysis results.

```javascript
const config = generator.generateConfig(analysis);
```

**Parameters:**
- `analysis` (Object) - Results from analyzeWebsite()

**Returns:** Object - Site configuration

#### async saveConfig(config, siteKey)
Saves configuration to file system.

```javascript
await generator.saveConfig(config, 'mysite');
```

**Parameters:**
- `config` (Object) - Configuration object
- `siteKey` (string) - Unique key for the site

**Returns:** Promise<void>

## Configuration API

### Site Configuration Schema

```javascript
{
  // Required fields
  name: String,                    // Display name
  baseUrl: String,                // Base URL
  searchUrl: String,              // Search page URL
  
  selectors: {
    search: {
      input: String,              // Search input selector
      results: String,            // Search results container
      title: String,              // Result title selector
      link: String,               // Result link selector
      image: String               // Result image selector
    },
    chapters: {
      list: String,               // Chapter list selector
      title: String,              // Chapter title selector
      link: String                // Chapter link selector
    },
    reader: {
      images: Array<String>       // Image selectors (fallback array)
    }
  },
  
  // Optional fields
  customLogic: {
    beforeChapterScrape: Function // Custom pre-download logic
  }
}
```

### Adding New Sites Programmatically

```javascript
// 1. Create configuration
const newSiteConfig = {
  name: 'My Manga Site',
  baseUrl: 'https://my-manga-site.com',
  // ... rest of configuration
};

// 2. Save to file
const fs = require('fs');
const path = require('path');
const configPath = path.join('site-configs', 'mysite.js');
fs.writeFileSync(
  configPath,
  `module.exports = ${JSON.stringify(newSiteConfig, null, 2)};`
);

// 3. Add to downloader
const SITE_PLUGINS = {
  // ... existing sites
  mysite: require('./site-configs/mysite.js')
};
```

## Plugin System

### Creating Custom Plugins

Plugins are JavaScript modules that export a configuration object:

```javascript
// site-configs/custom-site.js
module.exports = {
  name: 'Custom Manga Site',
  baseUrl: 'https://custom-site.com',
  searchUrl: 'https://custom-site.com/search',
  
  selectors: {
    search: {
      input: '#search-input',
      results: '.manga-result',
      title: '.title',
      link: 'a',
      image: 'img'
    },
    chapters: {
      list: '.chapter-item',
      title: '.chapter-name',
      link: 'a'
    },
    reader: {
      images: ['.page-image', '#reader img']
    }
  },
  
  customLogic: {
    beforeChapterScrape: async (page) => {
      // Custom logic here
      await page.click('.single-page-mode');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
```

### Plugin Registration

To register a new plugin:

```javascript
// In multi-site-downloader.js
const SITE_PLUGINS = {
  sushiscan: require('./site-configs/sushiscan.js'),
  mangadx: require('./site-configs/mangadx.js'),
  mangakakalot: require('./site-configs/mangakakalot.js'),
  customsite: require('./site-configs/custom-site.js')  // Add here
};
```

### Dynamic Plugin Loading

For dynamic plugin loading:

```javascript
const fs = require('fs');
const path = require('path');

function loadPlugins() {
  const pluginsDir = './site-configs';
  const plugins = {};
  
  fs.readdirSync(pluginsDir)
    .filter(file => file.endsWith('.js') && file !== 'template.js')
    .forEach(file => {
      const pluginName = path.basename(file, '.js');
      plugins[pluginName] = require(path.join(pluginsDir, file));
    });
    
  return plugins;
}

const SITE_PLUGINS = loadPlugins();
```

## Error Handling

### Error Types

The application defines several error categories:

```javascript
class MangaDownloadError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'MangaDownloadError';
    this.type = type;
    this.details = details;
  }
}

// Error types:
// - 'SITE_NOT_SUPPORTED'
// - 'SEARCH_FAILED' 
// - 'NO_RESULTS_FOUND'
// - 'CHAPTER_NOT_FOUND'
// - 'DOWNLOAD_FAILED'
// - 'CBZ_CREATION_FAILED'
```

### Error Handling Patterns

```javascript
try {
  await downloader.download('Manga', '1-10', 'site');
} catch (error) {
  if (error.type === 'SEARCH_FAILED') {
    console.log('Search functionality may have changed');
    // Handle search errors
  } else if (error.type === 'DOWNLOAD_FAILED') {
    console.log('Network or image download issues');
    // Handle download errors
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

### Retry Logic Implementation

```javascript
async function downloadWithRetry(downloadFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await downloadFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Integration Examples

### Using as a Library

```javascript
const MultiSiteMangaDownloader = require('./multi-site-downloader');

async function downloadManga() {
  const downloader = new MultiSiteMangaDownloader();
  
  try {
    await downloader.init();
    downloader.setSite('sushiscan');
    
    const searchResults = await downloader.searchManga('Naruto');
    const manga = searchResults[0];
    
    const chapters = await downloader.getChapters(manga.url);
    const selectedChapters = downloader.parseChapterRange('1-5', chapters);
    
    for (const chapter of selectedChapters) {
      console.log(`Downloading ${chapter.title}...`);
      
      const result = await downloader.downloadChapterImages(
        chapter.url,
        chapter.title
      );
      
      if (result.imageCount > 0) {
        const cbzPath = `./downloads/${manga.title} - ${chapter.title}.cbz`;
        await downloader.createCBZ(result.directory, cbzPath);
        console.log(`Created: ${cbzPath}`);
      }
    }
  } finally {
    if (downloader.browser) {
      await downloader.browser.close();
    }
  }
}
```

### Custom Download Manager

```javascript
class CustomDownloadManager {
  constructor() {
    this.downloader = new MultiSiteMangaDownloader();
    this.queue = [];
    this.isRunning = false;
  }
  
  async init() {
    await this.downloader.init();
  }
  
  addToQueue(title, chapters, site) {
    this.queue.push({ title, chapters, site });
  }
  
  async processQueue() {
    this.isRunning = true;
    
    while (this.queue.length > 0 && this.isRunning) {
      const { title, chapters, site } = this.queue.shift();
      
      try {
        await this.downloader.download(title, chapters, site);
        console.log(`Completed: ${title}`);
      } catch (error) {
        console.error(`Failed: ${title} - ${error.message}`);
      }
      
      // Rate limiting between downloads
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  stop() {
    this.isRunning = false;
  }
}
```

### REST API Wrapper

```javascript
const express = require('express');
const app = express();

app.use(express.json());

const downloader = new MultiSiteMangaDownloader();
downloader.init();

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { title, site } = req.body;
    downloader.setSite(site);
    const results = await downloader.searchManga(title);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download endpoint
app.post('/api/download', async (req, res) => {
  try {
    const { title, chapters, site } = req.body;
    
    // Start download asynchronously
    downloader.download(title, chapters, site)
      .then(() => console.log('Download completed'))
      .catch(error => console.error('Download failed:', error));
    
    res.json({ success: true, message: 'Download started' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
```

### Configuration Generator Integration

```javascript
const SiteConfigGenerator = require('./site-config-generator');

async function generateAndTestConfig(url, name, key) {
  const generator = new SiteConfigGenerator();
  
  try {
    await generator.init();
    
    // Generate configuration
    const analysis = await generator.analyzeWebsite(url, name);
    const config = generator.generateConfig(analysis);
    
    // Save configuration
    await generator.saveConfig(config, key);
    
    // Test the configuration
    const downloader = new MultiSiteMangaDownloader();
    await downloader.init();
    downloader.setSite(key);
    
    const testResults = await downloader.searchManga('Naruto');
    console.log(`Configuration test: ${testResults.length} results found`);
    
    return { config, testResults };
  } finally {
    await generator.close();
  }
}
```

## Events and Hooks

### Progress Events

You can extend the downloader to emit progress events:

```javascript
const EventEmitter = require('events');

class ExtendedMangaDownloader extends MultiSiteMangaDownloader {
  constructor() {
    super();
    this.events = new EventEmitter();
  }
  
  async downloadChapterImages(chapterUrl, chapterTitle) {
    this.events.emit('chapterStart', { title: chapterTitle });
    
    try {
      const result = await super.downloadChapterImages(chapterUrl, chapterTitle);
      this.events.emit('chapterComplete', { title: chapterTitle, ...result });
      return result;
    } catch (error) {
      this.events.emit('chapterError', { title: chapterTitle, error });
      throw error;
    }
  }
}

// Usage
const downloader = new ExtendedMangaDownloader();
downloader.events.on('chapterStart', (data) => {
  console.log(`Starting: ${data.title}`);
});
```

This API documentation provides the foundation for extending and integrating the Multi-Site Manga Downloader into larger applications or workflows.
