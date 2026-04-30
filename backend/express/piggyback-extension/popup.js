/**
 * MSR Piggyback Signal — Popup Script
 * Displays status info and provides manual trigger functionality.
 */

const BACKEND_BASE = 'http://127.0.0.1:5001/api/piggyback';

const $ = (id) => document.getElementById(id);

/**
 * Check if the backend / Chrome CDP is reachable.
 */
async function checkStatus() {
    const statusDot = $('statusDot');
    const cdpStatus = $('cdpStatus');

    try {
        const resp = await fetch(`${BACKEND_BASE}/status`, { method: 'GET' });
        const data = await resp.json();

        if (data.reachable) {
            statusDot.classList.add('connected');
            cdpStatus.textContent = `Connected — ${data.version?.Browser || 'Chrome'}`;
            cdpStatus.className = 'value success';
        } else {
            statusDot.classList.remove('connected');
            cdpStatus.textContent = `Unreachable: ${data.error || 'Chrome not running with CDP'}`;
            cdpStatus.className = 'value error';
        }
    } catch (err) {
        statusDot.classList.remove('connected');
        cdpStatus.textContent = `Backend offline: ${err.message}`;
        cdpStatus.className = 'value error';
    }
}

/**
 * Load last signal from chrome.storage.local.
 */
async function loadLastSignal() {
    try {
        const result = await chrome.storage.local.get('lastSignal');
        const signal = result.lastSignal;

        if (!signal) return;

        $('lastSignalTime').textContent = signal.timestamp
            ? new Date(signal.timestamp).toLocaleString()
            : 'Unknown';

        const statusEl = $('signalStatus');
        statusEl.textContent = signal.status || '—';
        statusEl.className = `value ${signal.status === 'success' ? 'success' : 'error'}`;

        if (signal.url) {
            $('targetUrl').textContent = signal.url;
        }
    } catch {
        // Storage API may not be available
    }
}

/**
 * Manual trigger: tell backend to scrape.
 */
async function triggerScrape() {
    const btn = $('triggerBtn');
    btn.disabled = true;
    btn.textContent = 'Scraping...';

    try {
        const resp = await fetch(`${BACKEND_BASE}/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}), // Backend will use the attached tab
        });

        const data = await resp.json();
        btn.textContent = data.success ? '✓ Scrape Complete' : '✗ Scrape Failed';

        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Trigger Manual Scrape';
        }, 3000);
    } catch (err) {
        btn.textContent = `✗ ${err.message}`;
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Trigger Manual Scrape';
        }, 3000);
    }
}

// ---- Init ----
$('triggerBtn').addEventListener('click', triggerScrape);

checkStatus();
loadLastSignal();
