// Tab Spaces Manager - Background Service Worker

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Tab Spaces Manager installed');

    // Set up context menu (optional)
    chrome.contextMenus.create({
        id: 'addToSpace',
        title: 'Add to Tab Space',
        contexts: ['page']
    });
});

// Handle context menu clicks
// not working
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'addToSpace' && tab) {
        // Save the tab URL/title to storage for use in popup.js
        await chrome.storage.local.set({
            pendingTab: {
                url: tab.url,
                title: tab.title,
                timestamp: Date.now()
            }
        });

        // Optionally show a notification
        chrome.notifications?.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Tab Saved',
            message: 'Tab info saved for your Tab Spaces!'
        });

        // Optionally open the extension popup (works only on Chrome, not all browsers)
        chrome.action.openPopup?.();
    }
});

// Handle keyboard shortcuts (optional)
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'open-tab-spaces') {
        chrome.action.openPopup();
    } else if (command === 'save-current-tab') {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            await chrome.storage.local.set({
                pendingTab: {
                    url: tab.url,
                    title: tab.title,
                    timestamp: Date.now()
                }
            });
            chrome.action.openPopup();
        }
    }
});

// Listen for tab updates to potentially auto-categorize tabs (future feature)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Future: Could implement auto-categorization logic here
        // For now, just log for debugging
        console.log('Tab updated:', tab.title, tab.url);
    }
});

// Handle storage changes to sync across extension pages
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.tabSpaces) {
        console.log('Tab spaces updated');
    }
});

// Cleanup old data periodically (optional)
chrome.alarms.create('cleanup', { periodInMinutes: 60 * 24 }); // Daily cleanup

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanup') {
        // Clean up old pending tabs (older than 1 hour)
        const result = await chrome.storage.local.get(['pendingTab']);
        if (result.pendingTab && Date.now() - result.pendingTab.timestamp > 60 * 60 * 1000) {
            await chrome.storage.local.remove(['pendingTab']);
        }
    }
});

// Export spaces data (optional helper function for backup)
async function exportSpaces() {
    try {
        const result = await chrome.storage.local.get(['tabSpaces']);
        const dataStr = JSON.stringify(result.tabSpaces, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download
        const url = URL.createObjectURL(dataBlob);
        await chrome.downloads.download({
            url: url,
            filename: `tab-spaces-backup-${new Date().toISOString().split('T')[0]}.json`,
            saveAs: true
        });

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting spaces:', error);
    }
}

// Import spaces data (optional helper function for restore)
async function importSpaces(jsonData) {
    try {
        const spaces = JSON.parse(jsonData);
        await chrome.storage.local.set({ tabSpaces: spaces });
        console.log('Spaces imported successfully');
    } catch (error) {
        console.error('Error importing spaces:', error);
    }
}