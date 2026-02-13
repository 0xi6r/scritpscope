import React, { useState, useRef } from 'react';

export const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file', 'url', 'list'
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const listFileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsProcessing(true);

    const scripts = [];

    for (const file of files) {
      const content = await file.text();
      scripts.push({
        url: `imported-${file.name}`,
        type: 'imported',
        content: content,
        size: file.size,
        firstParty: true,
        hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(content),
        fileName: file.name
      });
    }

    setIsProcessing(false);
    onImport(scripts);
    onClose();
  };

  const handleUrlImport = async () => {
    const urls = urlInput.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      alert('Please enter at least one URL');
      return;
    }

    setIsProcessing(true);
    const scripts = [];

    for (const url of urls) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      try {
        const response = await fetch(trimmedUrl, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          const content = await response.text();
          scripts.push({
            url: trimmedUrl,
            type: 'imported-url',
            content: content,
            size: new Blob([content]).size,
            firstParty: false,
            hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(content)
          });
        } else {
          scripts.push({
            url: trimmedUrl,
            type: 'imported-url',
            content: null,
            size: 0,
            firstParty: false,
            fetchError: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        // Try fetching through background script
        try {
          const bgResponse = await chrome.runtime.sendMessage({
            type: 'FETCH_SCRIPT',
            url: trimmedUrl
          });

          if (bgResponse.success) {
            scripts.push({
              url: trimmedUrl,
              type: 'imported-url',
              content: bgResponse.content,
              size: new Blob([bgResponse.content]).size,
              firstParty: false,
              hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(bgResponse.content)
            });
          } else {
            scripts.push({
              url: trimmedUrl,
              type: 'imported-url',
              content: null,
              size: 0,
              firstParty: false,
              fetchError: 'FETCH_FAILED'
            });
          }
        } catch (bgError) {
          scripts.push({
            url: trimmedUrl,
            type: 'imported-url',
            content: null,
            size: 0,
            firstParty: false,
            fetchError: 'FETCH_FAILED'
          });
        }
      }
    }

    setIsProcessing(false);
    onImport(scripts);
    setUrlInput('');
    onClose();
  };

  const handleListFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    const content = await file.text();
    const urls = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'));
    });

    const scripts = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          const scriptContent = await response.text();
          scripts.push({
            url: url,
            type: 'imported-url',
            content: scriptContent,
            size: new Blob([scriptContent]).size,
            firstParty: false,
            hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(scriptContent)
          });
        } else {
          scripts.push({
            url: url,
            type: 'imported-url',
            content: null,
            size: 0,
            firstParty: false,
            fetchError: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        // Try background fetch
        try {
          const bgResponse = await chrome.runtime.sendMessage({
            type: 'FETCH_SCRIPT',
            url: url
          });

          if (bgResponse.success) {
            scripts.push({
              url: url,
              type: 'imported-url',
              content: bgResponse.content,
              size: new Blob([bgResponse.content]).size,
              firstParty: false,
              hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(bgResponse.content)
            });
          } else {
            scripts.push({
              url: url,
              type: 'imported-url',
              content: null,
              size: 0,
              firstParty: false,
              fetchError: 'FETCH_FAILED'
            });
          }
        } catch {
          scripts.push({
            url: url,
            type: 'imported-url',
            content: null,
            size: 0,
            firstParty: false,
            fetchError: 'FETCH_FAILED'
          });
        }
      }
    }

    setIsProcessing(false);
    onImport(scripts);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-900 border border-dark-700 rounded-lg w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Import Scripts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-700">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📁 Upload Files
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'url'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔗 Paste URLs
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📄 URL List File
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'file' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Upload JavaScript or TypeScript files from your computer
              </p>
              <div
                className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center cursor-pointer hover:border-white transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-4">📂</div>
                <p className="text-white font-medium mb-2">Click to upload files</p>
                <p className="text-xs text-gray-400">Supports .js, .ts, .jsx, .tsx</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".js,.ts,.jsx,.tsx,.mjs,.cjs"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {isProcessing && (
                <div className="text-center text-sm text-gray-400">
                  Processing files...
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Paste one or more URLs (one per line)
              </p>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/script.js&#10;https://cdn.example.com/bundle.js"
                className="w-full h-64 px-4 py-3 bg-black border border-dark-700 rounded text-white text-sm font-mono focus:outline-none focus:border-white resize-none"
              />
              <button
                onClick={handleUrlImport}
                disabled={isProcessing || !urlInput.trim()}
                className="w-full px-4 py-3 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded font-medium transition-colors"
              >
                {isProcessing ? 'Fetching Scripts...' : 'Import URLs'}
              </button>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Upload a text file containing URLs (one per line)
              </p>
              <div
                className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center cursor-pointer hover:border-white transition-colors"
                onClick={() => listFileInputRef.current?.click()}
              >
                <div className="text-4xl mb-4">📋</div>
                <p className="text-white font-medium mb-2">Click to upload list</p>
                <p className="text-xs text-gray-400">Text file with one URL per line</p>
                <input
                  ref={listFileInputRef}
                  type="file"
                  accept=".txt,.list,.csv"
                  onChange={handleListFileUpload}
                  className="hidden"
                />
              </div>
              <div className="bg-dark-850 border border-dark-700 rounded p-4">
                <p className="text-xs text-gray-400 mb-2">Example file format:</p>
                <pre className="text-xs text-gray-300 font-mono">
{`https://example.com/script1.js
https://cdn.example.com/bundle.js
https://external.com/library.min.js`}
                </pre>
              </div>
              {isProcessing && (
                <div className="text-center text-sm text-gray-400">
                  Fetching scripts from list...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
