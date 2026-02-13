// Background service worker for ScriptScope

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Listen for tab updates to refresh side panel if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Notify side panel that page has loaded
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId: tabId,
      url: tab.url
    }).catch(() => {
      // Side panel might not be open, ignore error
    });
  }
});

// Handle messages from content scripts and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_SCRIPT') {
    // Fetch script content with proper CORS handling
    fetch(request.url, {
      credentials: 'omit',
      cache: 'no-cache'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(content => {
        sendResponse({ success: true, content });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message,
          corsError: true
        });
      });
    return true; // Keep channel open for async response
  }
});

console.log('ScriptScope background service worker initialized');
