# 🚀 Multi-Site Manga Downloader

A powerful and extensible Node.js application for downloading manga chapters from various websites and packaging them into CBZ files for offline reading. Features an automatic site configuration generator to easily add support for new manga websites.

## ✨ Features

- **Multi-site support** - Download from multiple manga websites using a plugin architecture
- **CBZ file creation** - Package downloaded images into standard comic book format
- **Flexible chapter selection** - Support ranges (1-10), specific chapters (1,3,5), or all chapters
- **Automatic site configuration** - Tool to analyze websites and generate configurations automatically
- **Interactive CLI** - User-friendly command-line interface with progress indicators
- **Batch downloads** - Handle multiple chapters efficiently with concurrent image downloading
- **Error handling** - Robust retry logic and graceful error recovery
- **Anti-detection measures** - Realistic user agents, rate limiting, and proper headers

## 🏗️ Supported Sites

- **SushiScan** (French) - https://sushiscan.net
- **MangaDx** (Multi-language) - https://mangadx.org  
- **Mangakakalot** (English) - https://mangakakalot.com

*More sites can be added using the automatic configuration generator!*

## 📦 Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm (comes with Node.js)

### Setup
```bash
# Clone or download the project
git clone https://github.com/ayhid/cbzforge.git manga-downloader
cd manga-downloader

# Install dependencies
npm install

# Make scripts executable (optional)
chmod +x multi-site-downloader.js
chmod +x site-config-generator.js
```

## 🎯 Quick Start

### Interactive Mode (Recommended for beginners)
```bash
npm start
# or
node multi-site-downloader.js
```

Follow the interactive prompts to:
1. Select a manga site
2. Enter manga title
3. Choose chapter range
4. Start downloading

### Command Line Mode
```bash
# Download specific chapters
node multi-site-downloader.js "Naruto" "1-10" sushiscan

# Download all chapters
node multi-site-downloader.js "One Piece" "all" mangakakalot

# Download specific chapters
node multi-site-downloader.js "Attack on Titan" "1,5,10,15" mangadx
```

### List Available Sites
```bash
node multi-site-downloader.js --list-sites
```

### Help
```bash
node multi-site-downloader.js --help
```

## 📖 Usage Examples

### Basic Usage
```bash
# Interactive mode - easiest for new users
npm start

# Download first 10 chapters of Naruto from SushiScan
node multi-site-downloader.js "Naruto" "1-10" sushiscan

# Download all available chapters
node multi-site-downloader.js "One Piece" "all" mangakakalot
```

### Advanced Chapter Selection
```bash
# Download specific chapters (1, 3, 5, 7, 9)
node multi-site-downloader.js "Bleach" "1,3,5,7,9" mangadx

# Download chapters 1-5 and 10-15
node multi-site-downloader.js "Dragon Ball" "1-5,10-15" sushiscan

# Download only chapter 100
node multi-site-downloader.js "One Piece" "100" mangakakalot
```

## 🛠️ Adding New Sites

### Automatic Configuration (Recommended)
Use the built-in site configuration generator:

```bash
# Interactive mode
npm run config
# or
node site-config-generator.js

# Command line mode
node site-config-generator.js "https://new-manga-site.com" "Site Name" "sitekey"
```

The generator will:
1. Analyze the website structure
2. Test selectors with real data
3. Generate a working configuration
4. Save it ready to use

### Manual Configuration
See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for detailed instructions on creating configurations manually.

## 📁 Output

Downloaded manga will be saved in the `downloads/` directory as CBZ files:
```
downloads/
├── Naruto - Chapter 1.cbz
├── Naruto - Chapter 2.cbz
└── One Piece - Chapter 1000.cbz
```

CBZ files can be read with:
- **Windows**: CDisplay, ComicRack, Perfect Viewer
- **macOS**: Simple Comic, YACReader
- **Linux**: Evince, Okular, MComix
- **Mobile**: Perfect Viewer (Android), ComicZeal (iOS)

## ⚙️ Configuration

### Environment Variables
You can set these environment variables to customize behavior:
```bash
export MANGA_DL_DOWNLOAD_DIR="./my-manga"
export MANGA_DL_TEMP_DIR="./temp"
export MANGA_DL_CONCURRENT_DOWNLOADS="5"
```

### Site Configurations
Site configurations are stored in `site-configs/` directory:
```
site-configs/
├── sushiscan.js
├── mangadx.js
├── mangakakalot.js
└── template.js      # Template for new sites
```

## 🚨 Legal Disclaimer

This tool is for educational and personal use only. Please:
- Respect website terms of service
- Support official manga releases when possible
- Use responsibly with appropriate delays between requests
- Check local laws regarding content downloading

## 🛡️ Anti-Detection Features

- Realistic browser user agents
- Random delays between requests
- Proper referer headers
- Rate limiting to avoid overwhelming servers
- Session management

## 🐛 Troubleshooting

### Common Issues

**"No images found on chapter page"**
- The site may have changed its structure
- Try generating a new configuration with the config generator
- Check if the site requires JavaScript or has anti-bot protection

**"Search failed" or "Could not find search results"**
- Verify the site is accessible
- The search functionality may have changed
- Try running the configuration generator to update selectors

**"Browser initialization failed"**
- Ensure you have sufficient system resources
- Try running with `--no-sandbox` flag on Linux systems
- Update Node.js to the latest version

**Download stuck or very slow**
- Check your internet connection
- Some sites have rate limiting - the app includes delays
- Try downloading fewer chapters at once

### Getting Help
1. Check the [troubleshooting guide](docs/USAGE.md#troubleshooting)
2. Look at existing [configurations](site-configs/) for reference
3. Try regenerating site configurations with the built-in tool

## 🔧 Development

### Project Structure
```
manga-downloader/
├── multi-site-downloader.js     # Main application
├── site-config-generator.js     # Automatic config generator  
├── site-configs/                # Site configurations
│   ├── sushiscan.js
│   ├── mangadx.js
│   ├── mangakakalot.js
│   └── template.js
├── downloads/                   # Output directory
├── temp/                       # Temporary files
└── docs/                       # Documentation
    ├── USAGE.md
    ├── CONFIGURATION.md
    └── API.md
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request

### Testing New Configurations
```bash
# Test a specific site configuration
node multi-site-downloader.js "test manga" "1" your_site_key

# Generate and test a new site
node site-config-generator.js "https://example.com" "Example Site" "example"
node multi-site-downloader.js "Naruto" "1" example
```

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Puppeteer](https://github.com/puppeteer/puppeteer) for web automation
- [Axios](https://github.com/axios/axios) for HTTP requests  
- [Archiver](https://github.com/archiverjs/node-archiver) for CBZ creation
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) for CLI interface
- [Nanospinner](https://github.com/usmanyunusov/nanospinner) for progress indicators

## 🔄 Version History

- **v1.0.0** - Initial release with multi-site support and automatic configuration generator
