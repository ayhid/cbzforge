module.exports = {
  name: 'MangaDx',
  baseUrl: 'https://mangadx.org',
  searchUrl: 'https://mangadx.org/',
  selectors: {
    search: {
      input: 'input[type="search"], input[placeholder*="search" i]',
      results: '.manga-item, .search-result, .item',
      title: 'h3, h2, .title, .name',
      link: 'a',
      image: 'img'
    },
    chapters: {
      list: '.chapter-item, .episode-item, li[class*="chapter"]',
      title: '.chapter-title, .title, a',
      link: 'a'
    },
    reader: {
      images: [
        '.reading-content img',
        '#readerarea img',
        '.reader img',
        '.chapter-content img',
        '.entry-content img'
      ]
    }
  },
  customLogic: {
    beforeChapterScrape: async (page) => {
      try {
        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to switch to single page mode
        await page.click('.single-page').catch(() => {});
        await page.click('#readingmode').catch(() => {});
        
        // Scroll to load lazy images
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
        // Ignore errors
      }
    }
  }
};
