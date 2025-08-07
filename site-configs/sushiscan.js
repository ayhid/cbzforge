module.exports = {
  name: 'SushiScan',
  baseUrl: 'https://sushiscan.net',
  searchUrl: 'https://sushiscan.net/',
  selectors: {
    search: {
      input: 'input[type="search"]',
      results: '.manga-item, .series-item',
      title: 'h3, .title',
      link: 'a',
      image: 'img'
    },
    chapters: {
      list: '.chapter-item, li[class*="chapter"]',
      title: '.chapter-title, .title, a',
      link: 'a'
    },
    reader: {
      images: [
        '#readerarea img',
        '.reading-content img',
        '.reader img',
        '.chapter-content img',
        '.pages img'
      ]
    }
  },
  customLogic: {
    beforeChapterScrape: async (page) => {
      try {
        // Try to switch to single page mode if available
        await page.click('#single-page-mode').catch(() => {});
        await page.click('[data-mode="single"]').catch(() => {});
        await page.evaluate(() => {
          // Try to disable lazy loading
          const images = document.querySelectorAll('img[data-src]');
          images.forEach(img => {
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
          });
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // Ignore errors
      }
    }
  }
};
