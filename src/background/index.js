// Background service worker for ScriptScope

// Track which tabs have the side panel open
const sidePanelTabs = new Set();

chrome.action.onClicked.addListener(async (tab) => {
  // Toggle side panel for this specific tab
  await chrome.sidePanel.open({ tabId: tab.id });
  sidePanelTabs.add(tab.id);
});

// Close side panel when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  sidePanelTabs.delete(tabId);
});

// Close side panel when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Only keep side panel open for tabs that explicitly opened it
  if (!sidePanelTabs.has(activeInfo.tabId)) {
    try {
      // Side panel will only show for tabs where user clicked the icon
      await chrome.sidePanel.setOptions({
        tabId: activeInfo.tabId,
        enabled: sidePanelTabs.has(activeInfo.tabId)
      });
    } catch (e) {
      // Ignore errors if side panel isn't available
    }
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Notify side panel that page has loaded (only if open for this tab)
    if (sidePanelTabs.has(tabId)) {
      chrome.runtime.sendMessage({
        type: 'TAB_UPDATED',
        tabId: tabId,
        url: tab.url
      }).catch(() => {
        // Side panel might not be open
      });
    }
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
