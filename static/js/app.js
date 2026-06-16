// Application State
let state = {
    releases: [],
    filteredReleases: [],
    activeFilter: 'all',
    searchQuery: '',
    selectedItem: null,
    selectedStyle: 'hype'
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    btnSpinner: document.getElementById('btn-spinner'),
    lastUpdated: document.getElementById('last-updated'),
    searchInput: document.getElementById('search-input'),
    statTotal: document.getElementById('stat-total'),
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    feedTimeline: document.getElementById('feed-timeline'),
    
    // Filter buttons
    filterBtns: document.querySelectorAll('.nav-btn'),
    
    // Modal Elements
    tweetModal: document.getElementById('tweet-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalBadge: document.getElementById('modal-badge'),
    modalDate: document.getElementById('modal-date'),
    modalSourceText: document.getElementById('modal-source-text'),
    styleBtns: document.querySelectorAll('.style-opt-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    btnCopy: document.getElementById('btn-copy'),
    btnPublishX: document.getElementById('btn-publish-x'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Refresh feed
    elements.refreshBtn.addEventListener('click', fetchReleases);
    
    // Export CSV
    if (elements.exportCsvBtn) {
        elements.exportCsvBtn.addEventListener('click', exportToCSV);
    }
    
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        applyFiltersAndSearch();
    });
    
    // Filter Navigation
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeFilter = btn.dataset.filter;
            applyFiltersAndSearch();
        });
    });
    
    // Modal Close
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) closeModal();
    });
    
    // Tweet style switches
    elements.styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedStyle = btn.dataset.style;
            generateTweetText();
        });
    });
    
    // Tweet textarea character counting
    elements.tweetTextarea.addEventListener('input', (e) => {
        updateCharCounter(e.target.value.length);
    });
    
    // Copy button
    elements.btnCopy.addEventListener('click', () => {
        elements.tweetTextarea.select();
        document.execCommand('copy');
        showToast('Текст твіту скопійовано!');
    });
    
    // Publish to X button
    elements.btnPublishX.addEventListener('click', () => {
        const text = elements.tweetTextarea.value;
        const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        closeModal();
    });
}

// Fetch Release Notes
async function fetchReleases() {
    setLoading(true);
    showToast('Оновлення реліз-нотаток...');
    
    try {
        const response = await fetch('/api/releases');
        const data = await response.json();
        
        if (data.status === 'success') {
            state.releases = data.releases;
            setLastUpdatedTime();
            applyFiltersAndSearch();
            showToast('Дані успішно оновлено!', 'success');
        } else {
            showToast(`Помилка: ${data.message}`, 'error');
        }
    } catch (error) {
        showToast(`Помилка підключення: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// Set Loading State UI
function setLoading(isLoading) {
    if (isLoading) {
        elements.refreshBtn.classList.add('loading');
        elements.loadingState.classList.remove('hidden');
        elements.feedTimeline.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.refreshBtn.classList.remove('loading');
        elements.loadingState.classList.add('hidden');
        elements.feedTimeline.classList.remove('hidden');
    }
}

// Set Last Updated Time
function setLastUpdatedTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.lastUpdated.textContent = `Оновлено о ${timeStr}`;
}

// Apply Category Filter and Search Query
function applyFiltersAndSearch() {
    const filtered = [];
    let matchCount = 0;
    
    state.releases.forEach(release => {
        // Filter items within this release date
        const matchingItems = release.items.filter(item => {
            // Category check
            const itemType = item.type.toLowerCase();
            let matchesCategory = false;
            
            if (state.activeFilter === 'all') {
                matchesCategory = true;
            } else if (state.activeFilter === 'feature' && itemType.includes('feature')) {
                matchesCategory = true;
            } else if (state.activeFilter === 'change' && itemType.includes('change')) {
                matchesCategory = true;
            } else if (state.activeFilter === 'deprecated' && (itemType.includes('deprecat') || itemType.includes('remove'))) {
                matchesCategory = true;
            } else if (state.activeFilter === 'issue' && (itemType.includes('issue') || itemType.includes('bug') || itemType.includes('known'))) {
                matchesCategory = true;
            }
            
            // Search text check
            const matchesSearch = !state.searchQuery || 
                item.text.toLowerCase().includes(state.searchQuery) ||
                item.type.toLowerCase().includes(state.searchQuery) ||
                release.date.toLowerCase().includes(state.searchQuery);
                
            return matchesCategory && matchesSearch;
        });
        
        if (matchingItems.length > 0) {
            filtered.push({
                ...release,
                items: matchingItems
            });
            matchCount += matchingItems.length;
        }
    });
    
    state.filteredReleases = filtered;
    elements.statTotal.textContent = matchCount;
    
    if (matchCount === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.feedTimeline.classList.add('hidden');
    } else {
        elements.emptyState.classList.add('hidden');
        elements.feedTimeline.classList.remove('hidden');
        renderTimeline();
    }
}

// Render Timeline to DOM
function renderTimeline() {
    elements.feedTimeline.innerHTML = '';
    
    state.filteredReleases.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'timeline-group';
        
        const dot = document.createElement('div');
        dot.className = 'timeline-dot';
        
        const dateEl = document.createElement('h2');
        dateEl.className = 'timeline-date';
        dateEl.textContent = group.date;
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'timeline-cards-container';
        
        group.items.forEach(item => {
            const card = document.createElement('div');
            // Add custom modifier class for color coding
            const typeClass = getNormalizeTypeClass(item.type);
            card.className = `release-card type-${typeClass}`;
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="badge type-${typeClass}">${item.type}</span>
                </div>
                <div class="card-body">
                    ${item.html}
                </div>
                <div class="card-footer">
                    <button class="btn btn-secondary btn-copy-card" style="font-size: 0.8rem; padding: 6px 12px; margin-right: 8px;">
                        Копіювати
                    </button>
                    <button class="btn btn-tweet-trigger">
                        <svg class="x-logo" style="width:12px; height:12px; margin-right:6px; fill:currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Твітнути це
                    </button>
                </div>
            `;
            
            // Event listener for copy button
            card.querySelector('.btn-copy-card').addEventListener('click', () => {
                navigator.clipboard.writeText(item.text)
                    .then(() => showToast('Текст оновлення скопійовано!', 'success'))
                    .catch(() => showToast('Не вдалося скопіювати текст', 'error'));
            });
            
            // Event listener for tweet button
            card.querySelector('.btn-tweet-trigger').addEventListener('click', () => {
                openTweetModal(item, group.date, group.link);
            });
            
            cardsContainer.appendChild(card);
        });
        
        groupEl.appendChild(dot);
        groupEl.appendChild(dateEl);
        groupEl.appendChild(cardsContainer);
        
        elements.feedTimeline.appendChild(groupEl);
    });
}

// Normalize Update Type for CSS classing
function getNormalizeTypeClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'feature';
    if (t.includes('change')) return 'change';
    if (t.includes('deprecat') || t.includes('remove')) return 'deprecated';
    if (t.includes('issue') || t.includes('bug') || t.includes('known')) return 'issue';
    return 'general';
}

// Modal Management
function openTweetModal(item, date, link) {
    state.selectedItem = { ...item, date, link };
    
    // Set UI preview fields
    elements.modalBadge.className = `preview-badge type-${getNormalizeTypeClass(item.type)}`;
    elements.modalBadge.textContent = item.type;
    elements.modalDate.textContent = date;
    elements.modalSourceText.textContent = item.text;
    
    // Reset style selection back to 'hype'
    state.selectedStyle = 'hype';
    elements.styleBtns.forEach(btn => {
        if (btn.dataset.style === 'hype') btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    // Generate text
    generateTweetText();
    
    // Open modal
    elements.tweetModal.classList.remove('hidden');
}

function closeModal() {
    elements.tweetModal.classList.add('hidden');
    state.selectedItem = null;
}

// Call Flask API to generate tweet
async function generateTweetText() {
    if (!state.selectedItem) return;
    
    elements.tweetTextarea.value = "Генерація твіту...";
    
    try {
        const response = await fetch('/api/generate-tweet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: state.selectedItem.text,
                type: state.selectedItem.type,
                link: state.selectedItem.link,
                style: state.selectedStyle
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            elements.tweetTextarea.value = data.tweet;
            updateCharCounter(data.tweet.length);
        } else {
            elements.tweetTextarea.value = `Помилка генерації: ${data.message}`;
        }
    } catch (error) {
        elements.tweetTextarea.value = `Помилка з'єднання: ${error.message}`;
    }
}

// Character counter update
function updateCharCounter(length) {
    elements.charCounter.textContent = `${length} / 280`;
    
    elements.charCounter.className = 'char-counter';
    if (length > 280) {
        elements.charCounter.classList.add('danger');
    } else if (length > 250) {
        elements.charCounter.classList.add('warning');
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    // Add checkmark or warning icon based on type
    const icon = type === 'error' ? '⚠️' : '✓';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    elements.toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export parsed release notes to CSV
function exportToCSV() {
    if (!state.releases || state.releases.length === 0) {
        showToast('Немає даних для експорту', 'error');
        return;
    }
    
    // Prepare CSV rows
    let csvRows = ["Date,Type,Description,Link"];
    
    state.releases.forEach(release => {
        const date = release.date.replace(/"/g, '""');
        const link = release.link.replace(/"/g, '""');
        
        release.items.forEach(item => {
            const type = item.type.replace(/"/g, '""');
            const text = item.text.replace(/"/g, '""');
            csvRows.push(`"${date}","${type}","${text}","${link}"`);
        });
    });
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bigquery_release_notes.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
    showToast('CSV файл успішно експортовано!', 'success');
}
