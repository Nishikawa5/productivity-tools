# Tab Spaces Manager - Chrome Extension

A browser extension for organizing your tabs into spaces, inspired by Workona. Keep your browsing organized by creating unlimited different spaces for work, personal, research, and more.

## 🚀 Features

- **Create Multiple Spaces**: Organize tabs into different contexts (Work, Personal, Research, etc.)
- **Add Tabs Easily**: Add tabs by pasting URLs or selecting from currently open tabs
- **Search Functionality**: Search across all spaces and tabs
- **Persistent Storage**: Your spaces and tabs are saved locally in your browser
- **Export/Import**: You can easily export tabs data to import in other browser or maintain it as backup 
- **Quick Actions**: Open, remove, and organize tabs with simple clicks

## 📦 Installation Steps

1. **Extract the files**:
   - Extract all files from the ZIP to a folder called `tab-spaces-manager`

2. **Open Chrome Extensions page**:
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or go to Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle "Developer mode" in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the folder containing the extracted files
   - The extension should now appear in your extensions list

5. **Pin the extension**:
   - Click the Extensions icon in the Chrome toolbar (puzzle piece)
   - Find "Tab Spaces Manager" and click the pin icon

## 🎯 How to Use

### Creating Spaces
1. Click the extension icon → "+ New Space" → Enter name and description

### Adding Tabs
- **Paste URL**: Select space → "+ Add Tabs" → Paste URL
- **Select Open**: Select space → "Select Open Tabs" → Choose tabs

### Managing
- **Open Tab**: Click any tab card
- **Remove Tab**: Hover over tab → click × button
- **Search**: Use search bar to find tabs across all spaces
- **Delete Space**: Hover over space → click × button

## Files Included

- `manifest.json` - Extension configuration (FIXED - no icon references)
- `popup.html` - Main interface
- `popup.js` - JavaScript functionality  
- `styles.css` - Styling
- `background.js` - Background service worker
- `README.md` - This file