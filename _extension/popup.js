// popup.js - Manages the extension UI

const $ = (id) => document.getElementById(id);

let currentState = null;
let currentSession = null;

// Initialize
function init() {
    $('startBtn').addEventListener('click', startScrape);
    
    // Listen for state updates from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'STATE_UPDATE') {
            updateUI(currentSession, message.state);
        }
    });

    // Initial state fetch
    fetchState();
}

function fetchState() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (response) {
            currentSession = response.session;
            updateUI(response.session, response.state);
        }
    });
}

function updateUI(session, state) {
    currentState = state;
    
    // Update Session Status
    if (session && session.sessionId && session.proctorId) {
        $('statusDot').classList.add('connected');
        $('sessionStatus').textContent = `Connected as: ${session.proctorId}`;
        
        // Enable button if not currently scraping
        $('startBtn').disabled = state.isScraping;
    } else {
        $('statusDot').classList.remove('connected');
        $('sessionStatus').textContent = 'Not detected (Login to MSR-Insight)';
        $('startBtn').disabled = true;
    }

    // Update System Status
    $('systemStatus').textContent = state.statusMessage || 'Idle';
    
    // Update Progress UI
    const progressContainer = $('progressContainer');
    
    if (state.isScraping || state.students.length > 0) {
        progressContainer.classList.add('active');
        
        if (state.currentStudent) {
            $('currentStudent').textContent = `Processing: ${state.currentStudent}`;
        } else if (!state.isScraping) {
            $('currentStudent').textContent = 'Finished.';
        }
        
        const total = state.students.length;
        const current = state.isScraping ? state.currentIndex + 1 : total;
        const percent = total > 0 ? (current / total) * 100 : 0;
        
        $('progressBar').style.width = `${percent}%`;
        $('progressText').textContent = `${current} / ${total}`;
        $('resultStats').textContent = `✓ ${state.successCount} | ✗ ${state.failCount}`;
        
        if (state.isScraping) {
            $('startBtn').textContent = 'Scraping in progress...';
        } else {
            $('startBtn').textContent = 'Start Batch Scrape';
        }
    } else {
        progressContainer.classList.remove('active');
        $('startBtn').textContent = 'Start Batch Scrape';
    }
}

function startScrape() {
    $('startBtn').disabled = true;
    $('startBtn').textContent = 'Initializing...';
    
    chrome.runtime.sendMessage({ type: 'START_BATCH_SCRAPE' }, (response) => {
        if (!response || !response.started) {
            $('systemStatus').textContent = response?.reason || "Failed to start.";
            $('startBtn').disabled = false;
            $('startBtn').textContent = 'Start Batch Scrape';
        }
    });
}

// Run init when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
