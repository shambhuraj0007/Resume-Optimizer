// Setup Context Menu and Action Click behavior
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-jd",
    title: "Analyze with ShortlistAI",
    contexts: ["selection"]
  });

  // Enable opening the side panel when the extension icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

// Handle Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyze-jd") {
    // 1. Save text to storage
    chrome.storage.local.set({ selectedJD: info.selectionText }, () => {
      // 2. Open the side panel
      // Note: This requires Chrome 114+
      chrome.sidePanel.open({ windowId: tab.windowId });
    });
  }
});
