// Background service worker for ScriptScope

// Track which tabs have the side panel explicitly opened
const activeTabs = new Set();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Toggle side panel for this specific tab
    if (activeTabs.has(tab.id)) {
      // Close side panel
      activeTabs.delete(tab.id);
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: false
      });
    } else {
      // Open side panel
      activeTabs.add(tab.id);
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true
      });
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (error) {
    console.error('Side panel toggle error:', error);
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

// When switching tabs, ensure side panel state is correct
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Only enable side panel for tabs that explicitly opened it
    const shouldBeEnabled = activeTabs.has(activeInfo.tabId);

    await chrome.sidePanel.setOptions({
      tabId: activeInfo.tabId,
      enabled: shouldBeEnabled
    });

    // If not in active tabs, explicitly close it
    if (!shouldBeEnabled) {
      await chrome.sidePanel.setOptions({
        tabId: activeInfo.tabId,
        enabled: false
      });
    }
  } catch (error) {
    // Side panel might not be available, ignore
    console.debug('Side panel state update:', error.message);
  }
});

// When a tab is updated (navigation), preserve the state
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    try {
      // Maintain the side panel state for this tab
      const shouldBeEnabled = activeTabs.has(tabId);

      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: shouldBeEnabled
      });

      // Notify side panel that page has loaded (only if open)
      if (shouldBeEnabled) {
        chrome.runtime.sendMessage({
          type: 'TAB_UPDATED',
          tabId: tabId,
          url: tab.url
        }).catch(() => {
          // Side panel might not be listening
        });
      }
    } catch (error) {
      console.debug('Tab update handling:', error.message);
    }
  }
});

// Listen for side panel being closed manually by user
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    port.onDisconnect.addListener(() => {
      // User closed the side panel, remove from active tabs
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          activeTabs.delete(tabs[0].id);
        }
      });
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

  if (request.type === 'SIDEPANEL_OPENED') {
    // Side panel reports it has opened
    if (sender.tab) {
      activeTabs.add(sender.tab.id);
    }
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'SIDEPANEL_CLOSED') {
    // Side panel reports it's closing
    if (sender.tab) {
      activeTabs.delete(sender.tab.id);
    }
    sendResponse({ success: true });
    return true;
  }
});

console.log('ScriptScope background service worker initialized');
