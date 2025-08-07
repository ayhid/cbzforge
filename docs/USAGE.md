# 📖 Usage Guide

This guide covers everything you need to know about using the Multi-Site Manga Downloader.

## Table of Contents
- [Getting Started](#getting-started)
- [Interactive Mode](#interactive-mode)
- [Command Line Mode](#command-line-mode)
- [Chapter Selection](#chapter-selection)
- [Output and CBZ Files](#output-and-cbz-files)
- [Performance Tips](#performance-tips)
- [Troubleshooting](#troubleshooting)

## Getting Started

### First Run
When you first run the application, it will:
1. Initialize a headless browser (may take a few seconds)
2. Set up necessary directories (`downloads/`, `temp/`)
3. Load site configurations

### Choosing Between Modes

**Interactive Mode** (Recommended for beginners)
- Guided prompts for all options
- Shows available choices
- Easier to use for first-time users

**Command Line Mode** (For advanced users)
- Direct command execution
- Scriptable and automatable
- Faster for repeated downloads

## Interactive Mode

Start interactive mode with:
```bash
npm start
# or
node multi-site-downloader.js
```

### Step-by-Step Walkthrough

1. **Select Manga Site**
   ```
   ? Select manga site: › 
     SushiScan (https://sushiscan.net)
   ❯ MangaDx (https://mangadx.org)
     Mangakakalot (https://mangakakalot.com)
   ```

2. **Enter Manga Title**
   ```
   ? Enter manga title: › Naruto
   ```
   Tips:
   - Use the exact or similar title as it appears on the site
   - Try different variations if no results found
   - Some sites are case-sensitive

3. **Choose Chapter Range**
   ```
   ? Enter chapter range (e.g., "1-10", "1,3,5", "all"): › (all)
   ```
   See [Chapter Selection](#chapter-selection) for details.

4. **Select Manga** (if multiple results)
   ```
   ? Select manga: › 
   ❯ Naruto (Original Series)
     Naruto: Shippuden
     Naruto: The Last
   ```

5. **Download Process**
   The application will:
   - Show progress for each chapter
   - Display download statistics
   - Create CBZ files in the downloads directory

## Command Line Mode

### Basic Syntax
```bash
node multi-site-downloader.js "[title]" "[chapters]" [site]
```

### Parameters

**title** (required)
- Manga title to search for
- Use quotes if the title contains spaces
- Example: `"Attack on Titan"`

**chapters** (required)
- Chapter range specification
- See [Chapter Selection](#chapter-selection) for formats
- Example: `"1-10"`, `"all"`, `"1,5,10"`

**site** (required)
- Site key identifier
- Available: `sushiscan`, `mangadx`, `mangakakalot`
- Example: `sushiscan`

### Examples

```bash
# Download chapters 1-10 of Naruto from SushiScan
node multi-site-downloader.js "Naruto" "1-10" sushiscan

# Download all chapters of One Piece from Mangakakalot
node multi-site-downloader.js "One Piece" "all" mangakakalot

# Download specific chapters from MangaDx
node multi-site-downloader.js "Attack on Titan" "1,5,10,15,20" mangadx

# Download single chapter
node multi-site-downloader.js "Dragon Ball" "100" sushiscan
```

### Utility Commands

```bash
# List all supported sites
node multi-site-downloader.js --list-sites

# Show help information
node multi-site-downloader.js --help
```

## Chapter Selection

The application supports flexible chapter selection formats:

### Range Format: `"start-end"`
Downloads consecutive chapters from start to end.
```bash
"1-10"    # Chapters 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
"50-55"   # Chapters 50, 51, 52, 53, 54, 55
"1-1"     # Just chapter 1
```

### List Format: `"num1,num2,num3"`
Downloads specific chapters only.
```bash
"1,3,5"       # Chapters 1, 3, and 5 only
"1,10,25,50"  # Chapters 1, 10, 25, and 50
```

### Combined Format: Mix ranges and lists
```bash
"1-5,10,15-20"  # Chapters 1-5, 10, and 15-20
"1,3-5,10"      # Chapters 1, 3-5, and 10
```

### Special Keywords
```bash
"all"    # Downloads all available chapters
```

### Decimal Chapter Numbers
Some manga have decimal chapter numbers (e.g., 1.5, 2.5):
```bash
"1-2.5"      # Includes chapters 1, 1.5, 2, 2.5
"1.5,2.5"    # Only chapters 1.5 and 2.5
```

## Output and CBZ Files

### File Structure
Downloaded files are organized as follows:
```
downloads/
├── Naruto - Chapter 1.cbz
├── Naruto - Chapter 2.cbz
├── One Piece - Chapter 1000.cbz
└── Attack on Titan - Chapter 1.cbz
```

### CBZ File Format
CBZ files are ZIP archives containing manga images:
- Images are numbered sequentially (001.jpg, 002.jpg, etc.)
- Compatible with most comic book readers
- Can be renamed to .zip and extracted manually

### File Naming
- Format: `[Manga Title] - [Chapter Title].cbz`
- Special characters are replaced with underscores
- Files are safe for all operating systems

### Temporary Files
- Images are temporarily stored in `temp/` directory
- Automatically cleaned up after CBZ creation
- Safe to delete manually if needed

### Recommended Comic Readers

**Windows:**
- ComicRack (Free)
- CDisplay Ex (Free)
- Sumatra PDF (Free)

**macOS:**
- Simple Comic (Free)
- YACReader (Free)
- Skim (Free)

**Linux:**
- Evince (Free)
- Okular (Free)
- MComix (Free)

**Mobile:**
- Perfect Viewer (Android, Free)
- ComicZeal (iOS, Paid)
- ComiCat (Android, Free)

## Performance Tips

### Download Speed
1. **Internet Connection**: Faster connection = faster downloads
2. **Site Load**: Popular sites may be slower during peak hours
3. **Chapter Range**: Download smaller batches for better reliability
4. **Rate Limiting**: Built-in delays prevent overwhelming servers

### System Resources
1. **Memory**: Each browser instance uses ~100MB RAM
2. **Storage**: Ensure enough disk space for downloads
3. **CPU**: Minimal CPU usage, mostly waiting for network

### Optimizing Downloads

**For Large Collections:**
```bash
# Instead of downloading 100 chapters at once:
node multi-site-downloader.js "Manga" "all" site

# Break into smaller chunks:
node multi-site-downloader.js "Manga" "1-25" site
node multi-site-downloader.js "Manga" "26-50" site
node multi-site-downloader.js "Manga" "51-75" site
node multi-site-downloader.js "Manga" "76-100" site
```

**For Reliability:**
- Download during off-peak hours
- Use stable internet connection
- Don't run multiple instances simultaneously

## Troubleshooting

### Common Error Messages

#### "No manga found with title 'X'"
**Causes:**
- Title spelling doesn't match site's listing
- Manga not available on selected site
- Site search functionality changed

**Solutions:**
1. Try different title variations:
   ```bash
   "Naruto"
   "NARUTO"
   "naruto"
   "Naruto Uzumaki"
   ```
2. Check if manga exists on the site manually
3. Try a different site
4. Use the configuration generator to update site settings

#### "No images found on chapter page"
**Causes:**
- Site changed its page structure
- Chapter requires JavaScript to load images
- Anti-bot protection blocking access

**Solutions:**
1. Regenerate site configuration:
   ```bash
   node site-config-generator.js "https://site.com" "Site Name" "sitekey"
   ```
2. Try a different site
3. Wait and try again later

#### "Search failed" or timeouts
**Causes:**
- Site is down or slow
- Network connectivity issues
- Site blocking automated access

**Solutions:**
1. Check site accessibility in browser
2. Try again later
3. Use a different site
4. Check your internet connection

#### "Browser initialization failed"
**Causes:**
- Insufficient system resources
- Missing system dependencies
- Puppeteer installation issues

**Solutions:**
1. Restart your computer
2. Update Node.js to latest version
3. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode

For detailed error information, you can modify the main script to enable debug output:

```javascript
// In multi-site-downloader.js, change:
headless: 'new'
// To:
headless: false  // Shows browser window
```

### Getting More Help

1. **Check site configurations** in `site-configs/` directory
2. **Test configurations** with single chapter downloads first
3. **Update site configurations** using the generator tool
4. **Try different sites** if one isn't working

### Reporting Issues

When reporting issues, include:
1. **Command used** (exact command line)
2. **Error message** (complete error output)
3. **Site and manga** you were trying to download
4. **System information** (OS, Node.js version)
5. **Network conditions** (connection speed, proxy usage)

### Recovery from Interruptions

If downloads are interrupted:
1. **Partial downloads** - Restart with same parameters
2. **Corrupted CBZ files** - Delete and re-download affected chapters
3. **Temporary files** - Safe to delete `temp/` directory contents
4. **Browser crashes** - Application will restart browser automatically
