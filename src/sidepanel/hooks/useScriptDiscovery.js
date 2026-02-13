import { useState } from 'react';

export const useScriptDiscovery = () => {
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const discoverScripts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Inject content script to discover scripts
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const scripts = [];
          const scriptElements = document.querySelectorAll('script');

          scriptElements.forEach((script, index) => {
            if (script.src) {
              scripts.push({
                url: script.src,
                type: 'external',
                inline: false
              });
            } else if (script.textContent) {
              scripts.push({
                url: `inline-script-${index}`,
                type: 'inline',
                inline: true,
                content: script.textContent,
                size: new Blob([script.textContent]).size
              });
            }
          });

          // Also check performance API for dynamically loaded scripts
          const resources = performance.getEntriesByType('resource');
          resources.forEach(resource => {
            if (resource.initiatorType === 'script' && resource.name.match(/\.js(\?|$)/i)) {
              // Check if not already in list
              if (!scripts.some(s => s.url === resource.name)) {
                scripts.push({
                  url: resource.name,
                  type: 'dynamic',
                  inline: false
                });
              }
            }
          });

          return scripts;
        }
      });

      const discoveredScripts = results[0]?.result || [];

      // Fetch content for external scripts
      const scriptsWithContent = await Promise.all(
        discoveredScripts.map(async (script) => {
          if (script.inline) {
            // Inline script already has content
            return {
              ...script,
              firstParty: true,
              hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(script.content || '')
            };
          }

          // External script - fetch content
          try {
            const response = await chrome.runtime.sendMessage({
              type: 'FETCH_SCRIPT',
              url: script.url
            });

            if (response.success) {
              const currentUrl = new URL(tab.url);
              const scriptUrl = new URL(script.url);
              const isFirstParty = currentUrl.hostname === scriptUrl.hostname;

              return {
                ...script,
                content: response.content,
                size: new Blob([response.content]).size,
                firstParty: isFirstParty,
                hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(response.content)
              };
            } else {
              return {
                ...script,
                content: null,
                size: 0,
                firstParty: false,
                fetchError: response.corsError ? 'CORS_ERROR' : 'FETCH_FAILED'
              };
            }
          } catch (error) {
            return {
              ...script,
              content: null,
              size: 0,
              firstParty: false,
              fetchError: 'FETCH_FAILED'
            };
          }
        })
      );

      // Filter out scripts that failed to load (optional - you can remove this if you want to show errors)
      const successfulScripts = scriptsWithContent.filter(s => s.content !== null || s.inline);

      setScripts(successfulScripts);
      setIsLoading(false);
      return successfulScripts;
    } catch (err) {
      console.error('Script discovery error:', err);
      setError(err.message);
      setIsLoading(false);
      return [];
    }
  };

  return {
    scripts,
    isLoading,
    error,
    discoverScripts
  };
};
