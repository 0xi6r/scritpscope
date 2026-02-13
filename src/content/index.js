/**
 * Content Script for ScriptScope
 * Discovers and extracts JavaScript files from the current page
 */

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DISCOVER_SCRIPTS') {
    discoverScripts()
      .then(scripts => {
        sendResponse({ success: true, scripts });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

/**
 * Discover all JavaScript resources on the page
 */
async function discoverScripts() {
  const scripts = new Map();
  const pageUrl = new URL(window.location.href);

  // Helper to determine if URL is first-party
  const isFirstParty = (url) => {
    try {
      const scriptUrl = new URL(url, window.location.href);
      return scriptUrl.hostname === pageUrl.hostname;
    } catch {
      return false;
    }
  };

  // Helper to normalize URLs
  const normalizeUrl = (url) => {
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return url;
    }
  };

  // 1. Discover inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  inlineScripts.forEach((script, index) => {
    if (script.textContent.trim()) {
      const url = `inline-script-${index}`;
      scripts.set(url, {
        url,
        type: 'inline',
        content: script.textContent,
        size: new Blob([script.textContent]).size,
        firstParty: true,
        hasSourceMap: detectSourceMap(script.textContent)
      });
    }
  });

  // 2. Discover external scripts from DOM
  const externalScripts = document.querySelectorAll('script[src]');
  externalScripts.forEach(script => {
    const url = normalizeUrl(script.src);
    if (!scripts.has(url)) {
      scripts.set(url, {
        url,
        type: 'external',
        content: null, // Will be fetched later
        size: 0,
        firstParty: isFirstParty(url),
        hasSourceMap: false
      });
    }
  });

  // 3. Discover scripts from Performance API (catches dynamic imports)
  try {
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      if (resource.initiatorType === 'script' ||
          resource.name.endsWith('.js') ||
          resource.name.includes('.js?')) {
        const url = resource.name;
        if (!scripts.has(url) && !url.includes('extension://')) {
          scripts.set(url, {
            url,
            type: 'dynamic',
            content: null,
            size: resource.transferSize || 0,
            firstParty: isFirstParty(url),
            hasSourceMap: false
          });
        }
      }
    });
  } catch (error) {
    console.warn('Could not access Performance API:', error);
  }

  // 4. Try to fetch content for external scripts
  const scriptArray = Array.from(scripts.values());

  for (const script of scriptArray) {
    if (script.type !== 'inline' && script.content === null) {
      try {
        // Try to fetch directly from content script
        const response = await fetch(script.url, {
          credentials: 'omit',
          cache: 'force-cache'
        });

        if (response.ok) {
          const content = await response.text();
          script.content = content;
          script.size = new Blob([content]).size;
          script.hasSourceMap = detectSourceMap(content);
        } else {
          script.fetchError = `HTTP ${response.status}`;
        }
      } catch (error) {
        // CORS error or network issue
        script.fetchError = 'CORS_ERROR';
        // Will try to fetch from background script later
      }
    }
  }

  return scriptArray;
}

/**
 * Detect if script has a source map
 */
function detectSourceMap(content) {
  if (!content) return false;
  return /\/\/[@#]\s*sourceMappingURL=/.test(content);
}

// Signal that content script is ready
console.log('ScriptScope content script loaded');
