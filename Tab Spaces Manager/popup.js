// Tab Spaces Manager - Popup JavaScript

class TabSpacesManager {
    constructor() {
        this.currentSpace = null;
        this.spaces = [];
        this.init();
    }

    async init() {
        await this.loadSpaces();
        this.setupEventListeners();
        this.renderSpaces();

        // Load first space if available
        if (this.spaces.length > 0) {
            this.selectSpace(this.spaces[0].id);
        }
    }

    async loadSpaces() {
        try {
            const result = await chrome.storage.local.get(['tabSpaces']);
            this.spaces = result.tabSpaces || [
                {
                    id: 'work',
                    name: 'Work',
                    description: 'Work-related tabs',
                    tabs: [],
                    createdAt: Date.now()
                },
                {
                    id: 'personal',
                    name: 'Personal', 
                    description: 'Personal browsing',
                    tabs: [],
                    createdAt: Date.now()
                },
                {
                    id: 'research',
                    name: 'Research',
                    description: 'Research and learning',
                    tabs: [],
                    createdAt: Date.now()
                }
            ];
            await this.saveSpaces();
        } catch (error) {
            console.error('Error loading spaces:', error);
        }
    }

    async saveSpaces() {
        try {
            await chrome.storage.local.set({ tabSpaces: this.spaces });
        } catch (error) {
            console.error('Error saving spaces:', error);
        }
    }

    setupEventListeners() {
        // Export Tabs Data
        document.getElementById('exportBtn').addEventListener('click', async () => {
            try {
                const result = await chrome.storage.local.get(['tabSpaces']);
                if (!result.tabSpaces) {
                    alert('No data to export!');
                    return;
                }
                const dataStr = JSON.stringify(result.tabSpaces, null, 2);
                const blob = new Blob([dataStr], {type: "application/json"});
                const url = URL.createObjectURL(blob);

                // Create download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `tab-spaces-backup-${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert('Tabs exported successfully!');
            } catch (err) {
                alert('Failed to export tabs!');
            }
        });

        // Import Tabs Data
        document.getElementById('importInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (!Array.isArray(imported)) throw new Error("Invalid format");
                    if (!confirm('Importing will overwrite your current spaces. Continue?')) return;
                    await chrome.storage.local.set({ tabSpaces: imported });
                    location.reload(); // reload to update UI
                    alert('Tabs imported successfully!');
                } catch (err) {
                    alert('Import failed! Invalid backup file.');
                }
            };
            reader.readAsText(file);
        });

        // Create space button
        document.getElementById('createSpaceBtn').addEventListener('click', () => {
            this.showModal('createSpaceModal');
        });

        // Add tabs button
        document.getElementById('addTabsBtn').addEventListener('click', () => {
            if (!this.currentSpace) {
                alert('Please select a space first');
                return;
            }
            this.showModal('addTabModal');
        });

        // Select open tabs button
        document.getElementById('selectTabsBtn').addEventListener('click', () => {
            if (!this.currentSpace) {
                alert('Please select a space first');
                return;
            }
            this.showSelectOpenTabsModal();
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.dataset.modal);
            });
        });

        // Create space modal
        document.getElementById('confirmCreateSpace').addEventListener('click', () => {
            this.createSpace();
        });
        document.getElementById('cancelCreateSpace').addEventListener('click', () => {
            this.hideModal('createSpaceModal');
        });

        // Add tab modal
        document.getElementById('confirmAddTab').addEventListener('click', () => {
            this.addTabFromUrl();
        });
        document.getElementById('cancelAddTab').addEventListener('click', () => {
            this.hideModal('addTabModal');
        });

        // Select tabs modal
        document.getElementById('confirmSelectTabs').addEventListener('click', () => {
            this.addSelectedTabs();
        });
        document.getElementById('cancelSelectTabs').addEventListener('click', () => {
            this.hideModal('selectOpenTabsModal');
        });

        // Select all checkbox
        document.getElementById('selectAllTabs').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.open-tabs-list input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTabs(e.target.value);
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    renderSpaces() {
        const spacesList = document.getElementById('spacesList');
        spacesList.innerHTML = '';

        this.spaces.forEach(space => {
            const spaceEl = document.createElement('div');
            spaceEl.className = `space-item ${this.currentSpace === space.id ? 'active' : ''}`;
            spaceEl.innerHTML = `
                <div class="space-info">
                    <div class="space-name">${this.escapeHtml(space.name)}</div>
                    <div class="space-description">${this.escapeHtml(space.description || '')}</div>
                </div>
                <div class="space-tab-count">${space.tabs.length}</div>
                <div class="space-actions">
                    <button class="delete-space" data-space-id="${space.id}" title="Delete space">×</button>
                </div>
            `;

            spaceEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-space')) {
                    this.selectSpace(space.id);
                }
            });

            const deleteBtn = spaceEl.querySelector('.delete-space');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSpace(space.id);
            });

            spacesList.appendChild(spaceEl);
        });
    }

    renderTabs() {
        const tabsGrid = document.getElementById('tabsGrid');
        const emptyState = document.getElementById('emptyState');
        const currentSpaceName = document.getElementById('currentSpaceName');

        if (!this.currentSpace) {
            tabsGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            currentSpaceName.textContent = 'Select a Space';
            return;
        }

        const space = this.spaces.find(s => s.id === this.currentSpace);
        if (!space) return;

        currentSpaceName.textContent = space.name;

        if (space.tabs.length === 0) {
            tabsGrid.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            tabsGrid.style.display = 'grid';
            emptyState.style.display = 'none';

            tabsGrid.innerHTML = '';
            space.tabs.forEach(tab => {
                const tabEl = document.createElement('div');
                tabEl.className = 'tab-card';
                tabEl.innerHTML = `
                    <div class="tab-actions">
                        <button class="tab-action-btn open" title="Open tab">⧉</button>
                        <button class="tab-action-btn remove" title="Remove from space">×</button>
                    </div>
                    <div class="tab-favicon">${this.getFavicon(tab.url)}</div>
                    <div class="tab-title" title="${this.escapeHtml(tab.title)}">${this.escapeHtml(tab.title)}</div>
                    <div class="tab-url" title="${this.escapeHtml(tab.url)}">${this.getDomain(tab.url)}</div>
                `;

                const openBtn = tabEl.querySelector('.open');
                const removeBtn = tabEl.querySelector('.remove');

                openBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openTab(tab.url);
                });

                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeTab(tab.id);
                });

                tabEl.addEventListener('click', () => {
                    this.openTab(tab.url);
                });

                tabsGrid.appendChild(tabEl);
            });
        }
    }

    selectSpace(spaceId) {
        this.currentSpace = spaceId;
        this.renderSpaces();
        this.renderTabs();
    }

    async createSpace() {
        const nameInput = document.getElementById('spaceNameInput');
        const descriptionInput = document.getElementById('spaceDescriptionInput');

        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter a space name');
            return;
        }

        const newSpace = {
            id: 'space_' + Date.now(),
            name: name,
            description: descriptionInput.value.trim(),
            tabs: [],
            createdAt: Date.now()
        };

        this.spaces.push(newSpace);
        await this.saveSpaces();
        this.renderSpaces();
        this.selectSpace(newSpace.id);

        nameInput.value = '';
        descriptionInput.value = '';
        this.hideModal('createSpaceModal');
    }

    async deleteSpace(spaceId) {
        if (confirm('Are you sure you want to delete this space? All tabs will be removed.')) {
            this.spaces = this.spaces.filter(s => s.id !== spaceId);
            if (this.currentSpace === spaceId) {
                this.currentSpace = this.spaces.length > 0 ? this.spaces[0].id : null;
            }
            await this.saveSpaces();
            this.renderSpaces();
            this.renderTabs();
        }
    }

    async addTabFromUrl() {
        const urlInput = document.getElementById('tabUrlInput');
        const titleInput = document.getElementById('tabTitleInput');

        const url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            alert('Please enter a valid URL');
            return;
        }

        const title = titleInput.value.trim() || this.extractTitle(url);

        const newTab = {
            id: 'tab_' + Date.now(),
            url: url,
            title: title,
            addedAt: Date.now()
        };

        const space = this.spaces.find(s => s.id === this.currentSpace);
        if (space) {
            space.tabs.push(newTab);
            await this.saveSpaces();
            this.renderTabs();
        }

        urlInput.value = '';
        titleInput.value = '';
        this.hideModal('addTabModal');
    }

    async showSelectOpenTabsModal() {
        try {
            // Get current tabs
            const tabs = await chrome.tabs.query({});
            this.populateOpenTabsList(tabs);
            this.showModal('selectOpenTabsModal');
        } catch (error) {
            console.error('Error getting tabs:', error);
            // Fallback to simulated tabs for demo
            const simulatedTabs = [
                { id: 1, title: 'Gmail', url: 'https://mail.google.com', favIconUrl: null },
                { id: 2, title: 'GitHub', url: 'https://github.com', favIconUrl: null },
                { id: 3, title: 'YouTube', url: 'https://youtube.com', favIconUrl: null },
                { id: 4, title: 'Stack Overflow', url: 'https://stackoverflow.com', favIconUrl: null }
            ];
            this.populateOpenTabsList(simulatedTabs);
            this.showModal('selectOpenTabsModal');
        }
    }

    populateOpenTabsList(tabs) {
        const openTabsList = document.getElementById('openTabsList');
        openTabsList.innerHTML = '';

        tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'open-tab-item';
            tabEl.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" value="${tab.id}" data-url="${tab.url}" data-title="${this.escapeHtml(tab.title)}">
                    <span class="open-tab-favicon">${this.getFavicon(tab.url)}</span>
                    <div class="open-tab-info">
                        <div class="open-tab-title">${this.escapeHtml(tab.title)}</div>
                        <div class="open-tab-url">${this.getDomain(tab.url)}</div>
                    </div>
                </label>
            `;
            openTabsList.appendChild(tabEl);
        });
    }

    async addSelectedTabs() {
        const selectedCheckboxes = document.querySelectorAll('.open-tabs-list input[type="checkbox"]:checked');

        if (selectedCheckboxes.length === 0) {
            alert('Please select at least one tab');
            return;
        }

        const space = this.spaces.find(s => s.id === this.currentSpace);
        if (!space) return;

        selectedCheckboxes.forEach(checkbox => {
            const newTab = {
                id: 'tab_' + Date.now() + '_' + checkbox.value,
                url: checkbox.dataset.url,
                title: checkbox.dataset.title,
                addedAt: Date.now()
            };
            space.tabs.push(newTab);
        });

        await this.saveSpaces();
        this.renderTabs();
        this.hideModal('selectOpenTabsModal');
    }

    async removeTab(tabId) {
        const space = this.spaces.find(s => s.id === this.currentSpace);
        if (space) {
            space.tabs = space.tabs.filter(t => t.id !== tabId);
            await this.saveSpaces();
            this.renderTabs();
            this.renderSpaces(); // Update tab count
        }
    }

    async openTab(url) {
        try {
            await chrome.tabs.create({ url: url });
        } catch (error) {
            console.error('Error opening tab:', error);
            // Fallback to window.open
            window.open(url, '_blank');
        }
    }

    searchTabs(query) {
        if (!query.trim()) {
            this.renderTabs();
            return;
        }

        const tabsGrid = document.getElementById('tabsGrid');
        const emptyState = document.getElementById('emptyState');

        // Search across all spaces
        const matchingTabs = [];
        this.spaces.forEach(space => {
            space.tabs.forEach(tab => {
                if (tab.title.toLowerCase().includes(query.toLowerCase()) || 
                    tab.url.toLowerCase().includes(query.toLowerCase()) ||
                    space.name.toLowerCase().includes(query.toLowerCase())) {
                    matchingTabs.push({ ...tab, spaceName: space.name });
                }
            });
        });

        if (matchingTabs.length === 0) {
            tabsGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.innerHTML = '<p>No tabs found matching your search.</p>';
        } else {
            tabsGrid.style.display = 'grid';
            emptyState.style.display = 'none';

            tabsGrid.innerHTML = '';
            matchingTabs.forEach(tab => {
                const tabEl = document.createElement('div');
                tabEl.className = 'tab-card';
                tabEl.innerHTML = `
                    <div class="tab-actions">
                        <button class="tab-action-btn open" title="Open tab">⧉</button>
                    </div>
                    <div class="tab-favicon">${this.getFavicon(tab.url)}</div>
                    <div class="tab-title" title="${this.escapeHtml(tab.title)}">${this.escapeHtml(tab.title)}</div>
                    <div class="tab-url" title="${this.escapeHtml(tab.url)}">${this.getDomain(tab.url)}</div>
                    <div style="font-size: 11px; color: #657786; margin-top: 4px;">in ${this.escapeHtml(tab.spaceName)}</div>
                `;

                const openBtn = tabEl.querySelector('.open');
                openBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openTab(tab.url);
                });

                tabEl.addEventListener('click', () => {
                    this.openTab(tab.url);
                });

                tabsGrid.appendChild(tabEl);
            });
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    getFavicon(url) {
        // Simple favicon mapping
        const domain = this.getDomain(url).toLowerCase();
        const faviconMap = {
            'gmail.com': '📧', 'mail.google.com': '📧',
            'youtube.com': '📺', 'youtu.be': '📺',
            'github.com': '💻',
            'stackoverflow.com': '❓',
            'medium.com': '📝',
            'linkedin.com': '💼',
            'twitter.com': '🐦', 'x.com': '🐦',
            'drive.google.com': '📁',
            'notion.so': '📋',
            'slack.com': '💬',
            'netflix.com': '🎬',
            'amazon.com': '🛒',
            'reddit.com': '🤖',
            'wikipedia.org': '📚',
            'docs.google.com': '📄'
        };
        return faviconMap[domain] || '🌐';
    }

    getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    extractTitle(url) {
        const domain = this.getDomain(url);
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TabSpacesManager();
});