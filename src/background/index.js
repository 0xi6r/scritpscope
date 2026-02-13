// Background service worker for ScriptScope

console.log('ScriptScope background service worker starting...');

// Handle extension icon clicks - open side panel per tab
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Opening side panel for tab:', tab.id);
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

// Configure side panel to be per-tab only
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ScriptScope installed/updated');
  try {
    // Disable automatic opening, require explicit user action
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false
    });
  } catch (error) {
    console.log('Panel behavior setting:', error.message);
  }
});

// Handle script fetching from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_SCRIPT') {
    console.log('Fetching script:', request.url);

    fetch(request.url, {
      credentials: 'omit',
      cache: 'no-cache'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(content => {
        sendResponse({ success: true, content: content });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message,
          corsError: true
        });
      });

    return true; // Keep message channel open for async response
  }
});

console.log('ScriptScope background service worker initialized');
