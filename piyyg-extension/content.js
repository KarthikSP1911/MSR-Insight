// content.js - Injected into localhost:3000

// We want to extract the proctor's session from localStorage
function sendSessionToBackground() {
    const sessionId = localStorage.getItem('proctorSessionId');
    const proctorId = localStorage.getItem('proctorId');
    
    if (sessionId && proctorId) {
        chrome.runtime.sendMessage({
            type: 'PROCTOR_SESSION_UPDATE',
            data: { sessionId, proctorId }
        });
    } else {
        // Optionally clear session if logged out
        chrome.runtime.sendMessage({
            type: 'PROCTOR_SESSION_CLEARED'
        });
    }
}

// Initial check
sendSessionToBackground();

// Listen for storage changes in case the user logs in/out in another tab
window.addEventListener('storage', (event) => {
    if (event.key === 'proctorSessionId' || event.key === 'proctorId') {
        sendSessionToBackground();
    }
});

// Since single-page apps might update localStorage without triggering 'storage' event in the same tab,
// we can periodically poll or override setItem, but polling is safer for extensions.
setInterval(sendSessionToBackground, 2000);
