# ⚙️ Configuration Guide

This guide explains how to create and modify site configurations for the Multi-Site Manga Downloader.

## Table of Contents
- [Configuration Overview](#configuration-overview)
- [Automatic Configuration](#automatic-configuration)
- [Manual Configuration](#manual-configuration)
- [Configuration Structure](#configuration-structure)
- [Selector Patterns](#selector-patterns)
- [Custom Logic](#custom-logic)
- [Testing Configurations](#testing-configurations)
- [Troubleshooting](#troubleshooting)

## Configuration Overview

Site configurations tell the downloader how to interact with different manga websites. Each configuration includes:
- **Site information** (name, URLs)
- **CSS selectors** for finding elements
- **Custom logic** for site-specific behaviors

### Configuration Files
Configurations are stored in the `site-configs/` directory as JavaScript modules:
```
site-configs/
├── sushiscan.js       # SushiScan configuration
├── mangadx.js         # MangaDx configuration  
├── mangakakalot.js    # Mangakakalot configuration
├── template.js        # Template for new sites
└── your-site.js       # Your custom configuration
```

## Automatic Configuration

The **recommended** way to create configurations is using the built-in generator.

### Interactive Generator
```bash
npm run config
# or
node site-config-generator.js
```

Follow the prompts to:
1. Enter the website URL
2. Provide a display name
3. Choose a unique site key
4. Select a test search term

### Command Line Generator
```bash
node site-config-generator.js "https://manga-site.com" "Site Name" "sitekey"
```

### How the Generator Works

The generator performs these steps:
1. **Analyzes search functionality** - Tests different selector patterns to find search inputs and results
2. **Extracts manga page structure** - Identifies chapter lists and navigation
3. **Examines chapter readers** - Locates image containers and reading interfaces
4. **Validates selectors** - Tests each selector with real data
5. **Generates configuration** - Creates working JavaScript and JSON files

## Manual Configuration

For advanced users or when the automatic generator doesn't work perfectly.

### Basic Template
Start with the template file:
```bash
cp site-configs/template.js site-configs/mysite.js
```

### Step-by-Step Manual Configuration

#### 1. Site Information
```javascript
module.exports = {
  name: 'My Manga Site',                    // Display name
  baseUrl: 'https://manga-site.com',        // Home page URL
  searchUrl: 'https://manga-site.com/search' // Search page URL (optional)
};
```

#### 2. Search Selectors
Navigate to the site and inspect the search functionality:

```javascript
selectors: {
  search: {
    input: 'input[type="search"]',     // Search input field
    results: '.manga-item',            // Individual search result containers
    title: 'h3',                       // Title within each result
    link: 'a',                         // Link within each result
    image: 'img'                       // Cover image within each result
  }
}
```

**How to find selectors:**
1. Open the website in your browser
2. Right-click on the search input → "Inspect Element"
3. Copy the CSS selector or create a custom one
4. Test with `document.querySelector('your-selector')` in browser console

#### 3. Chapter List Selectors
Navigate to a manga page and inspect the chapter list:

```javascript
chapters: {
  list: '.chapter-item',              // Individual chapter containers
  title: '.chapter-title',            // Chapter title/name
  link: 'a'                          // Chapter link
}
```

#### 4. Reader Selectors
Navigate to a chapter and inspect the reading area:

```javascript
reader: {
  images: [                          // Multiple selectors for fallback
    '#readerarea img',
    '.reading-content img',
    '.reader img'
  ]
}
```

## Configuration Structure

### Complete Configuration Example
```javascript
module.exports = {
  // Site identification
  name: 'Example Manga Site',
  baseUrl: 'https://example-manga.com',
  searchUrl: 'https://example-manga.com/search',
  
  // CSS selectors for different page elements
  selectors: {
    search: {
      input: 'input[name="search"]',
      results: '.search-result',
      title: '.result-title',
      link: '.result-link a',
      image: '.result-cover img'
    },
    chapters: {
      list: '.chapter-list-item',
      title: '.chapter-name',
      link: '.chapter-link a'
    },
    reader: {
      images: [
        '.reading-area img',
        '#chapter-images img',
        '.page-image'
      ]
    }
  },
  
  // Optional custom behavior
  customLogic: {
    beforeChapterScrape: async (page) => {
      // Site-specific actions before downloading
    }
  }
};
```

### Required Fields
- `name` - Display name for the site
- `baseUrl` - Website's main URL
- `selectors.search.input` - Search input selector
- `selectors.search.results` - Search results selector
- `selectors.chapters.list` - Chapter list selector
- `selectors.reader.images` - Image selectors (array)

### Optional Fields
- `searchUrl` - Custom search page (defaults to baseUrl)
- `selectors.search.title/link/image` - Search result details
- `selectors.chapters.title/link` - Chapter details
- `customLogic` - Site-specific functions

## Selector Patterns

### Common Search Patterns

**Search Input:**
```javascript
// Most common patterns
'input[type="search"]'
'input[placeholder*="search" i]'
'#search-input'
'.search-box input'

// WordPress sites
'#s'
'.search-field'

// Custom implementations
'input[name="q"]'
'input[name="query"]'
```

**Search Results:**
```javascript
// Common container patterns
'.manga-item'
'.search-result'
'.post'
'.entry'

// List-based layouts
'li.result'
'li.item'

// Card-based layouts
'.card'
'.grid-item'
```

### Chapter List Patterns

```javascript
// Common chapter patterns
'.chapter-item'
'.episode-item'
'li[class*="chapter"]'

// Table-based layouts
'tr'
'tbody tr'

// WordPress patterns
'.wp-manga-chapter'
'.listing-chapters_wrap li'
```

### Reader Image Patterns

```javascript
// Most common patterns
'#readerarea img'           // Generic reader
'.reading-content img'      // Content-based readers
'.entry-content img'        // WordPress

// Site-specific patterns
'#vungdoc img'             // Vietnamese sites
'.container-chapter-reader img' // Specific implementations

// Lazy loading patterns
'img[data-src]'            // Lazy loaded images
'img.lazyload'             // LazyLoad.js
```

## Custom Logic

Custom logic allows site-specific behavior before downloading chapter images.

### Common Use Cases

#### Switch to Single Page Mode
```javascript
customLogic: {
  beforeChapterScrape: async (page) => {
    try {
      // Try common single-page mode selectors
      await page.click('#single-page-mode').catch(() => {});
      await page.click('[data-mode="single"]').catch(() => {});
      await page.click('.single-page-btn').catch(() => {});
      
      // Wait for page to update
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Always use try-catch to prevent breaking downloads
    }
  }
}
```

#### Handle Lazy Loading
```javascript
customLogic: {
  beforeChapterScrape: async (page) => {
    try {
      // Load lazy images
      await page.evaluate(() => {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
        });
      });
      
      // Scroll to load all images
      await page.evaluate(() => {
        return new Promise(resolve => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if(totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
    } catch (e) {
      // Ignore errors
    }
  }
}
```

#### Wait for Dynamic Content
```javascript
customLogic: {
  beforeChapterScrape: async (page) => {
    try {
      // Wait for images to load
      await page.waitForSelector('.page-image', { timeout: 5000 });
      
      // Additional wait for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // Continue even if wait fails
    }
  }
}
```

### Best Practices for Custom Logic

1. **Always use try-catch** - Prevents breaking the download process
2. **Use short timeouts** - Don't wait too long for elements
3. **Provide fallbacks** - Try multiple approaches
4. **Test thoroughly** - Verify with different chapters
5. **Keep it simple** - Complex logic is more likely to break

## Testing Configurations

### Testing New Configurations

1. **Save your configuration** in `site-configs/yoursite.js`

2. **Add to main downloader** (edit `multi-site-downloader.js`):
```javascript
const SITE_PLUGINS = {
  sushiscan: require('./site-configs/sushiscan.js'),
  mangadx: require('./site-configs/mangadx.js'),
  mangakakalot: require('./site-configs/mangakakalot.js'),
  yoursite: require('./site-configs/yoursite.js')  // Add this line
};
```

3. **Test with a single chapter**:
```bash
node multi-site-downloader.js "Test Manga" "1" yoursite
```

### Debugging Configurations

#### Enable Browser Visibility
Modify the browser launch options to see what's happening:
```javascript
// In multi-site-downloader.js, change:
headless: 'new'
// To:
headless: false
```

#### Test Selectors in Browser Console
1. Navigate to the target website
2. Open browser developer tools (F12)
3. Test your selectors in the console:
```javascript
// Test if selector finds elements
document.querySelectorAll('your-selector')

// Test specific functionality
document.querySelector('input[type="search"]').value = 'test';
```

#### Validate Step by Step
Test each part of your configuration:

1. **Search functionality**:
   - Can the selector find the search input?
   - Does typing and pressing Enter work?
   - Are search results found?

2. **Chapter detection**:
   - Navigate to a manga page manually
   - Check if chapter selectors work
   - Verify chapter links are valid

3. **Image extraction**:
   - Navigate to a chapter page manually
   - Test image selectors in console
   - Check if images load properly

## Troubleshooting

### Common Issues

#### "Could not find search input field"
**Problem**: Search input selector is wrong or site structure changed

**Solutions**:
1. Inspect the search input element
2. Try different selector patterns:
   ```javascript
   'input[type="search"]'
   '#search'
   '.search-input'
   'input[placeholder*="search" i]'
   ```
3. Check if search is in a form or modal

#### "Could not find search results"  
**Problem**: Results selector doesn't match the page structure

**Solutions**:
1. Search for a popular manga manually
2. Inspect individual result containers
3. Try broader selectors:
   ```javascript
   '.result'
   '.item'
   '.manga'
   'li'
   '.card'
   ```

#### "No images found on chapter page"
**Problem**: Image selector doesn't match or images are dynamically loaded

**Solutions**:
1. Check if images require scrolling to load
2. Add custom logic to handle lazy loading
3. Try multiple image selectors:
   ```javascript
   reader: {
     images: [
       'img',                    // Broadest selector
       '.content img',           // More specific
       '#reader img',            // Most specific
     ]
   }
   ```
4. Check if site requires single-page mode

### Advanced Troubleshooting

#### Dynamic Content Loading
Some sites load content with JavaScript:
```javascript
customLogic: {
  beforeChapterScrape: async (page) => {
    // Wait for content to load
    await page.waitForSelector('.chapter-image', { timeout: 10000 });
    
    // Trigger any lazy loading
    await page.evaluate(() => {
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for images to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}
```

#### Anti-Bot Protection
If the site has protection mechanisms:
```javascript
customLogic: {
  beforeChapterScrape: async (page) => {
    // Wait longer between actions
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simulate human behavior
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
  }
}
```

### Configuration Validation Checklist

Before finalizing a configuration:

- [ ] Site information is correct (name, URLs)
- [ ] Search input selector works
- [ ] Search results selector finds results
- [ ] Chapter list selector finds chapters
- [ ] Chapter links are valid URLs
- [ ] Image selectors find manga pages
- [ ] Custom logic doesn't break the process
- [ ] Test with multiple manga titles
- [ ] Test with different chapter numbers
- [ ] Images download successfully
- [ ] CBZ files are created properly

### Getting Help

If you're having trouble creating a configuration:

1. **Use the automatic generator** first - it handles most sites
2. **Check existing configurations** for similar sites
3. **Test selectors manually** in browser console
4. **Start with the template** and modify step by step
5. **Test frequently** with single chapters
6. **Ask for help** with specific error messages and site URLs
