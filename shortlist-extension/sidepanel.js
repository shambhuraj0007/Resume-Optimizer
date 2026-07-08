const iframe = document.getElementById("app-frame");
const analyzeBtn = document.getElementById("analyze-btn");

// --- 1. HANDLE "ANALYZE PAGE" BUTTON CLICK ---
analyzeBtn.addEventListener("click", async () => {
    // UI: Start Loading
    analyzeBtn.classList.add("loading");
    document.querySelector(".btn-text").innerText = "Reading...";

    try {
        // A. Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // B. Inject script to grab all text from the page body
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText // Grabs all visible text
        });

        // C. Send the text to your website iframe
        if (result && result[0] && result[0].result) {
            sendToApp(result[0].result);
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        document.querySelector(".btn-text").innerText = "Error";
    } finally {
        // UI: Reset Button after 1 second
        setTimeout(() => {
            analyzeBtn.classList.remove("loading");
            document.querySelector(".btn-text").innerText = "Analyze Page";
        }, 1000);
    }
});

// --- 2. HANDLE RIGHT-CLICK SELECTION (Legacy Support) ---
iframe.onload = () => {
    chrome.storage.local.get(["selectedJD"], (result) => {
        if (result.selectedJD) {
            sendToApp(result.selectedJD);
            chrome.storage.local.remove(["selectedJD"]);
        }
    });
};

// --- HELPER: Send Data to Iframe ---
function sendToApp(text) {
    console.log("Sending text to ShortlistAI...");
    const targetOrigin = "https://shortlistai.cv"; 

    // Send immediately
    iframe.contentWindow.postMessage({ type: "SET_JD", text: text }, targetOrigin);

    // Retry loop (in case React is still loading)
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        iframe.contentWindow.postMessage({ type: "SET_JD", text: text }, targetOrigin);
        if (attempts > 10) clearInterval(interval);
    }, 500);
}
