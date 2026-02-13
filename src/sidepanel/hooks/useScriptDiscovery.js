import { useState, useCallback } from 'react';

export const useScriptDiscovery = () => {
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const discoverScripts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error('No active tab found');
      }

      // Inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/index.js']
        });
      } catch (e) {
        // Content script might already be injected
        console.log('Content script injection:', e.message);
      }

      // Request script discovery
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'DISCOVER_SCRIPTS'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to discover scripts');
      }

      let discoveredScripts = response.scripts || [];

      // Fetch content for scripts that couldn't be fetched in content script
      for (const script of discoveredScripts) {
        if (script.fetchError === 'CORS_ERROR' && script.type !== 'inline') {
          try {
            const fetchResponse = await chrome.runtime.sendMessage({
              type: 'FETCH_SCRIPT',
              url: script.url
            });

            if (fetchResponse.success) {
              script.content = fetchResponse.content;
              script.size = new Blob([fetchResponse.content]).size;
              script.hasSourceMap = detectSourceMap(fetchResponse.content);
              delete script.fetchError;
            } else {
              script.fetchError = 'FETCH_FAILED';
            }
          } catch (e) {
            script.fetchError = 'FETCH_FAILED';
          }
        }
      }

      setScripts(discoveredScripts);
      return discoveredScripts;

    } catch (err) {
      setError(err.message);
      console.error('Script discovery error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectSourceMap = (content) => {
    if (!content) return false;
    return /\/\/[@#]\s*sourceMappingURL=/.test(content);
  };

  return {
    scripts,
    isLoading,
    error,
    discoverScripts
  };
};
