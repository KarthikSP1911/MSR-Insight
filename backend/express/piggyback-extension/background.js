/**
 * MSR Piggyback Signal — Background Service Worker
 * 
 * Monitors tabs navigating to parents.msrit.edu dashboard pages.
 * When a successful login is detected (URL contains "dashboard"),
 * reads all cookies for the domain and sends them to the backend.
 */

const BACKEND_URL = 'http://127.0.0.1:5001/api/piggyback/signal';
const TARGET_DOMAIN = 'parents.msrit.edu';
const DEBOUNCE_MS = 5000; // 5-second cooldown between signals

let lastSignalTime = 0;

/**
 * Check if a URL indicates a successful login.
 */
function isAuthenticatedUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes(TARGET_DOMAIN) && (
        lower.includes('dashboard') ||
        lower.includes('com_studentdashboard') ||
        lower.includes('task=dashboard')
    );
}

/**
 * Read all cookies for the target domain.
 */
async function getCookiesForDomain() {
    try {
        const cookies = await chrome.cookies.getAll({ domain: `.msrit.edu` });
        return cookies.map(c => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            secure: c.secure,
            httpOnly: c.httpOnly,
            sameSite: c.sameSite,
        }));
    } catch (err) {
        console.error('[Piggyback Ext] Failed to read cookies:', err);
        return [];
    }
}

/**
 * Send session signal to the backend.
 */
async function sendSignal(cookies, url) {
    const now = Date.now();
    if (now - lastSignalTime < DEBOUNCE_MS) {
        console.log('[Piggyback Ext] Debounced — skipping signal.');
        return;
    }
    lastSignalTime = now;

    const payload = {
        cookies,
        url,
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[Piggyback Ext] Signal sent successfully:', data);
            // Store last signal info for popup
            chrome.storage.local.set({
                lastSignal: {
                    timestamp: payload.timestamp,
                    url: url,
                    cookieCount: cookies.length,
                    status: 'success',
                },
            });
        } else {
            console.error('[Piggyback Ext] Signal failed:', response.status);
            chrome.storage.local.set({
                lastSignal: {
                    timestamp: payload.timestamp,
                    url: url,
                    status: `error (${response.status})`,
                },
            });
        }
    } catch (err) {
        console.error('[Piggyback Ext] Failed to send signal:', err.message);
        chrome.storage.local.set({
            lastSignal: {
                timestamp: new Date().toISOString(),
                url: url,
                status: `offline (${err.message})`,
            },
        });
    }
}

/**
 * Listen for tab URL changes — detect when user reaches the dashboard.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only act when the page finishes loading
    if (changeInfo.status !== 'complete') return;
    if (!tab.url || !isAuthenticatedUrl(tab.url)) return;

    console.log(`[Piggyback Ext] Authenticated page detected: ${tab.url}`);

    const cookies = await getCookiesForDomain();
    if (cookies.length === 0) {
        console.warn('[Piggyback Ext] No cookies found for domain.');
        return;
    }

    await sendSignal(cookies, tab.url);
});

console.log('[Piggyback Ext] Service worker loaded and monitoring.');
