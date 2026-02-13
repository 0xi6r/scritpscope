// Background service worker for ScriptScope

console.log('ScriptScope background service worker starting...');

// Track tabs where side panel is open
const openTabs = new Set();

// Handle extension icon clicks - open side panel per tab
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Icon clicked for tab:', tab.id);

    // Set the side panel path for this specific tab only
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html',
      enabled: true
    });

    // Open the side panel
    await chrome.sidePanel.open({ tabId: tab.id });

    // Track this tab
    openTabs.add(tab.id);

    console.log('Side panel opened for tab:', tab.id);
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

// When tab is closed, clean up
chrome.tabs.onRemoved.addListener((tabId) => {
  openTabs.delete(tabId);
  console.log('Tab closed:', tabId);
});

// When switching tabs, ensure side panel doesn't show unless explicitly opened
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;

  try {
    if (!openTabs.has(tabId)) {
      // This tab hasn't explicitly opened the side panel
      // Disable it for this tab
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: false
      });
      console.log('Side panel disabled for tab:', tabId);
    } else {
      // This tab previously opened the side panel, ensure it's enabled
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        path: 'sidepanel.html',
        enabled: true
      });
      console.log('Side panel enabled for tab:', tabId);
    }
  } catch (error) {
    console.debug('Tab activation handling:', error.message);
  }
});

// When a new tab is created
chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    // Explicitly disable side panel for new tabs
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      enabled: false
    });
    console.log('New tab created, side panel disabled:', tab.id);
  } catch (error) {
    console.debug('New tab handling:', error.message);
  }
});

// When page navigates within a tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    try {
      // If this tab didn't explicitly open side panel, keep it disabled
      if (!openTabs.has(tabId)) {
        await chrome.sidePanel.setOptions({
          tabId: tabId,
          enabled: false
        });
      }
    } catch (error) {
      console.debug('Tab update handling:', error.message);
    }
  }
});

// Configure on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ScriptScope installed/updated');

  try {
    // Get all tabs and disable side panel for all of them initially
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: false
      });
    }
    console.log('Side panel disabled for all existing tabs');
  } catch (error) {
    console.log('Installation setup:', error.message);
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

  // Handle side panel closing
  if (request.type === 'SIDEPANEL_CLOSED') {
    if (sender.tab) {
      openTabs.delete(sender.tab.id);
      console.log('Side panel closed for tab:', sender.tab.id);
    }
    sendResponse({ success: true });
  }
});

console.log('ScriptScope background service worker initialized');
