// Template configuration for manga sites
// Copy this file and modify the values to create a new site configuration

module.exports = {
  name: 'Site Name',
  baseUrl: 'https://example.com',
  searchUrl: 'https://example.com/search', // Usually baseUrl + '/search' or just baseUrl
  selectors: {
    search: {
      // Input field where users type search terms
      input: 'input[type="search"]',
      
      // Container elements for each search result
      results: '.manga-item',
      
      // Title element within each result
      title: 'h3',
      
      // Link element within each result (should link to manga page)
      link: 'a',
      
      // Cover image within each result
      image: 'img'
    },
    chapters: {
      // List items containing chapter information
      list: '.chapter-item',
      
      // Title/name element within each chapter item
      title: '.chapter-title',
      
      // Link element within each chapter item (should link to chapter reader)
      link: 'a'
    },
    reader: {
      // Image elements containing manga pages (try multiple selectors for fallback)
      images: [
        '#readerarea img',
        '.reading-content img',
        '.reader img',
        '.chapter-content img'
      ]
    }
  },
  customLogic: {
    // Optional: Custom logic to run before scraping chapter images
    beforeChapterScrape: async (page) => {
      try {
        // Example: Switch to single page mode
        await page.click('#single-page-mode').catch(() => {});
        
        // Example: Wait for lazy-loaded images
        await page.evaluate(() => {
          const images = document.querySelectorAll('img[data-src]');
          images.forEach(img => {
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
          });
        });
        
        // Example: Scroll to load all images
        await page.evaluate(() => {
          return new Promise(resolve => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // Always include try-catch to avoid breaking the download process
      }
    }
  }
};
