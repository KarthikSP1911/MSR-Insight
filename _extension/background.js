// background.js - Orchestrates the batch scraping process

const BACKEND_URL = 'http://127.0.0.1:5001/api';

let activeSession = {
    sessionId: null,
    proctorId: null
};

let scrapeState = {
    isScraping: false,
    students: [],
    currentIndex: 0,
    successCount: 0,
    failCount: 0,
    currentStudent: null,
    statusMessage: "Idle"
};

let hasAutoScrapedForCurrentSession = false;

// Listen for session updates from content.js or messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROCTOR_SESSION_UPDATE') {
        const isNewSession = activeSession.sessionId !== message.data.sessionId || activeSession.proctorId !== message.data.proctorId;
        
        activeSession.sessionId = message.data.sessionId;
        activeSession.proctorId = message.data.proctorId;
        console.log("Session updated:", activeSession.proctorId);
        
        if (isNewSession) {
            hasAutoScrapedForCurrentSession = false;
        }

        // Automatically start scraping if we haven't done so for this session
        if (!hasAutoScrapedForCurrentSession && activeSession.sessionId && activeSession.proctorId && !scrapeState.isScraping) {
            console.log("Auto-starting batch scrape for new session...");
            hasAutoScrapedForCurrentSession = true;
            startBatchScraping();
        }

        sendResponse({ received: true });
    }
    
    if (message.type === 'PROCTOR_SESSION_CLEARED') {
        activeSession.sessionId = null;
        activeSession.proctorId = null;
        hasAutoScrapedForCurrentSession = false;
        sendResponse({ received: true });
    }

    if (message.type === 'GET_STATE') {
        sendResponse({
            session: activeSession,
            state: scrapeState
        });
    }

    if (message.type === 'START_BATCH_SCRAPE') {
        if (!scrapeState.isScraping && activeSession.sessionId && activeSession.proctorId) {
            startBatchScraping();
            sendResponse({ started: true });
        } else {
            sendResponse({ started: false, reason: "Already scraping or missing session." });
        }
    }
    
    // Required to keep the message channel open for async sendResponse if we needed it
    return true; 
});

async function startBatchScraping() {
    scrapeState.isScraping = true;
    scrapeState.currentIndex = 0;
    scrapeState.successCount = 0;
    scrapeState.failCount = 0;
    scrapeState.statusMessage = "Fetching assigned students...";
    notifyPopup();

    try {
        // Fetch the list of assigned students for this proctor
        const listResponse = await fetch(`${BACKEND_URL}/proctor/${activeSession.proctorId}/scrape-list`, {
            method: 'GET',
            headers: {
                'x-session-id': activeSession.sessionId,
                'Content-Type': 'application/json'
            }
        });

        const listData = await listResponse.json();

        if (!listData.success || !listData.data || listData.data.length === 0) {
            scrapeState.statusMessage = "No students assigned or failed to fetch list.";
            scrapeState.isScraping = false;
            notifyPopup();
            return;
        }

        scrapeState.students = listData.data;
        scrapeState.statusMessage = `Found ${scrapeState.students.length} students. Starting scrape...`;
        notifyPopup();

        // Process sequentially
        for (let i = 0; i < scrapeState.students.length; i++) {
            if (!scrapeState.isScraping) break; // Allow cancellation if we add it

            const student = scrapeState.students[i];
            scrapeState.currentIndex = i;
            scrapeState.currentStudent = student.usn;
            scrapeState.statusMessage = `Scraping ${student.usn}... (${i + 1}/${scrapeState.students.length})`;
            notifyPopup();

            try {
                // Trigger the backend scraper for this student
                const scrapeRes = await fetch(`${BACKEND_URL}/report/update`, {
                    method: 'POST',
                    headers: {
                        'x-session-id': activeSession.sessionId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ usn: student.usn })
                });

                const scrapeData = await scrapeRes.json();
                
                if (scrapeRes.ok && scrapeData.success) {
                    scrapeState.successCount++;
                } else if (scrapeRes.status === 429) {
                    // Cooldown hit
                    scrapeState.successCount++; // Treat as success since data exists and is fresh
                } else {
                    console.warn(`Failed to scrape ${student.usn}:`, scrapeData.message);
                    scrapeState.failCount++;
                }
            } catch (err) {
                console.error(`Error scraping ${student.usn}:`, err);
                scrapeState.failCount++;
            }

            // Small delay between requests to not overwhelm the backend/Contineo
            await new Promise(r => setTimeout(r, 2000));
        }

        scrapeState.statusMessage = `Completed! Success: ${scrapeState.successCount}, Failed: ${scrapeState.failCount}`;
        scrapeState.isScraping = false;
        scrapeState.currentStudent = null;
        notifyPopup();

    } catch (err) {
        console.error("Batch scrape error:", err);
        scrapeState.statusMessage = "Error during batch scrape: " + err.message;
        scrapeState.isScraping = false;
        notifyPopup();
    }
}

function notifyPopup() {
    chrome.runtime.sendMessage({
        type: 'STATE_UPDATE',
        state: scrapeState
    }).catch(() => {
        // Ignore error if popup is closed
    });
}
