module.exports = {
  name: 'Mangakakalot',
  baseUrl: 'https://mangakakalot.com',
  searchUrl: 'https://mangakakalot.com/',
  selectors: {
    search: {
      input: 'input[type="search"], #search_story',
      results: '.story_item',
      title: 'h3 a',
      link: 'h3 a',
      image: 'img'
    },
    chapters: {
      list: '.chapter-list .row',
      title: 'span a',
      link: 'span a'
    },
    reader: {
      images: [
        '.container-chapter-reader img',
        '#vungdoc img',
        '.reader-content img'
      ]
    }
  },
  customLogic: {
    beforeChapterScrape: async (page) => {
      try {
        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Scroll down to load all images
        await page.evaluate(async () => {
          await new Promise(resolve => {
            let totalHeight = 0;
            const distance = 200;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight - window.innerHeight){
                clearInterval(timer);
                setTimeout(resolve, 1000);
              }
            }, 200);
          });
        });
        
      } catch (e) {
        // Ignore errors
      }
    }
  }
};
