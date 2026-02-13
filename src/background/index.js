// Background service worker for ScriptScope - FINAL FIX

console.log('ScriptScope background service worker starting...');

// Track tabs where side panel was explicitly opened
const openTabs = new Set();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Icon clicked for tab:', tab.id);

    // Set panel options for this specific tab
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html',
      enabled: true
    });

    // Track this tab
    openTabs.add(tab.id);

    console.log('Side panel configured for tab:', tab.id);
  } catch (error) {
    console.error('Failed to configure side panel:', error);
  }
});

// Set panel behavior on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ScriptScope installed/updated');

  try {
    // Enable side panel to open on action click
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });

    console.log('Side panel behavior configured');
  } catch (error) {
    console.log('Setup:', error.message);
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  openTabs.delete(tabId);
  console.log('Tab closed:', tabId);
});

// Disable side panel for tabs that haven't opened it
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    if (!openTabs.has(activeInfo.tabId)) {
      await chrome.sidePanel.setOptions({
        tabId: activeInfo.tabId,
        enabled: false
      });
    }
  } catch (error) {
    // Ignore errors
  }
});

// Disable for new tabs
chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      enabled: false
    });
  } catch (error) {
    // Ignore
  }
});

// Handle script fetching
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_SCRIPT') {
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

    return true;
  }
});

console.log('ScriptScope background service worker initialized');
