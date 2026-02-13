import React, { useState, useRef } from 'react';

export const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file', 'url', 'list'
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const fileInputRef = useRef(null);
  const listFileInputRef = useRef(null);

  if (!isOpen) return null;

  // Check if URL is a JavaScript file
  const isJavaScriptFile = (url) => {
    const jsExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.es6', '.es'];
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    return jsExtensions.some(ext => cleanUrl.endsWith(ext));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsProcessing(true);
    setProcessingStatus({ total: files.length, processed: 0, scripts: [] });

    const scripts = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
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

        setProcessingStatus({
          total: files.length,
          processed: i + 1,
          scripts: [...scripts]
        });
      } catch (error) {
        console.error('Error reading file:', file.name, error);
      }
    }

    setIsProcessing(false);
    setProcessingStatus(null);
    onImport(scripts);
    onClose();
  };

  const handleUrlImport = async () => {
    const urls = urlInput.split('\n')
      .map(url => url.trim())
      .filter(url => url && isJavaScriptFile(url));

    if (urls.length === 0) {
      alert('No valid JavaScript URLs found. Please enter URLs ending in .js, .jsx, .ts, .tsx, etc.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus({
      total: urls.length,
      processed: 0,
      scripts: [],
      successful: 0,
      failed: 0
    });

    const scripts = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          const content = await response.text();
          scripts.push({
            url: url,
            type: 'imported-url',
            content: content,
            size: new Blob([content]).size,
            firstParty: false,
            hasSourceMap: /\/\/[@#]\s*sourceMappingURL=/.test(content)
          });

          setProcessingStatus(prev => ({
            ...prev,
            processed: i + 1,
            successful: prev.successful + 1,
            scripts: [...scripts]
          }));
        } else {
          scripts.push({
            url: url,
            type: 'imported-url',
            content: null,
            size: 0,
            firstParty: false,
            fetchError: `HTTP ${response.status}`
          });

          setProcessingStatus(prev => ({
            ...prev,
            processed: i + 1,
            failed: prev.failed + 1
          }));
        }
      } catch (error) {
        // Try fetching through background script
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

            setProcessingStatus(prev => ({
              ...prev,
              processed: i + 1,
              successful: prev.successful + 1,
              scripts: [...scripts]
            }));
          } else {
            scripts.push({
              url: url,
              type: 'imported-url',
              content: null,
              size: 0,
              firstParty: false,
              fetchError: 'FETCH_FAILED'
            });

            setProcessingStatus(prev => ({
              ...prev,
              processed: i + 1,
              failed: prev.failed + 1
            }));
          }
        } catch (bgError) {
          scripts.push({
            url: url,
            type: 'imported-url',
            content: null,
            size: 0,
            firstParty: false,
            fetchError: 'FETCH_FAILED'
          });

          setProcessingStatus(prev => ({
            ...prev,
            processed: i + 1,
            failed: prev.failed + 1
          }));
        }
      }
    }

    setIsProcessing(false);
    setProcessingStatus(null);
    onImport(scripts);
    setUrlInput('');
    onClose();
  };

  const handleListFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const content = await file.text();
      const allLines = content.split('\n').map(line => line.trim());

      // Filter only JavaScript URLs
      const jsUrls = allLines.filter(line => {
        if (!line || !line.startsWith('http')) return false;
        return isJavaScriptFile(line);
      });

      const ignoredLines = allLines.filter(line => {
        if (!line || line.startsWith('#') || line.startsWith('//')) return false;
        if (!line.startsWith('http')) return false;
        return !isJavaScriptFile(line);
      });

      if (jsUrls.length === 0) {
        setIsProcessing(false);
        alert('No JavaScript URLs found in the file. Please ensure URLs end with .js, .jsx, .ts, .tsx, etc.');
        return;
      }

      setProcessingStatus({
        total: jsUrls.length,
        processed: 0,
        scripts: [],
        successful: 0,
        failed: 0,
        ignored: ignoredLines.length
      });

      const scripts = [];

      for (let i = 0; i < jsUrls.length; i++) {
        const url = jsUrls[i];

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

            setProcessingStatus(prev => ({
              ...prev,
              processed: i + 1,
              successful: prev.successful + 1,
              scripts: [...scripts]
            }));
          } else {
            scripts.push({
              url: url,
              type: 'imported-url',
              content: null,
              size: 0,
              firstParty: false,
              fetchError: `HTTP ${response.status}`
            });

            setProcessingStatus(prev => ({
              ...prev,
              processed: i + 1,
              failed: prev.failed + 1
            }));
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

              setProcessingStatus(prev => ({
                ...prev,
                processed: i + 1,
                successful: prev.successful + 1,
                scripts: [...scripts]
              }));
            } else {
              scripts.push({
                url: url,
                type: 'imported-url',
                content: null,
                size: 0,
                firstParty: false,
                fetchError: 'FETCH_FAILED'
              });

              setProcessingStatus(prev => ({
                ...prev,
                processed: i + 1,
                failed: prev.failed + 1
              }));
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

            setProcessingStatus(prev => ({
              ...prev,
              processed: i + 1,
              failed: prev.failed + 1
            }));
          }
        }
      }

      setIsProcessing(false);

      // Show summary if there were ignored URLs
      if (ignoredLines.length > 0) {
        alert(`Import complete!\n\n✅ Imported: ${scripts.filter(s => s.content).length} JavaScript files\n❌ Failed: ${scripts.filter(s => !s.content).length}\n⚠️ Ignored: ${ignoredLines.length} non-JavaScript URLs`);
      }

      setProcessingStatus(null);
      onImport(scripts);
      onClose();
    } catch (error) {
      setIsProcessing(false);
      setProcessingStatus(null);
      alert('Error reading file: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-900 border border-dark-700 rounded-lg w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Import Scripts</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
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
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
              activeTab === 'file'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📁 Upload Files
          </button>
          <button
            onClick={() => setActiveTab('url')}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
              activeTab === 'url'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔗 Paste URLs
          </button>
          <button
            onClick={() => setActiveTab('list')}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
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
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-4">📂</div>
                <p className="text-white font-medium mb-2">Click to upload files</p>
                <p className="text-xs text-gray-400">Supports .js, .ts, .jsx, .tsx, .mjs, .cjs</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".js,.ts,.jsx,.tsx,.mjs,.cjs,.es6,.es"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </div>
              {processingStatus && (
                <div className="bg-dark-850 border border-dark-700 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">Processing files...</span>
                    <span className="text-sm text-gray-400">
                      {processingStatus.processed}/{processingStatus.total}
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${(processingStatus.processed / processingStatus.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="bg-dark-850 border border-dark-700 rounded p-3">
                <p className="text-sm text-gray-400 mb-2">
                  ℹ️ Only URLs ending in .js, .jsx, .ts, .tsx, .mjs, .cjs will be imported
                </p>
                <p className="text-xs text-gray-500">
                  Other URLs will be automatically ignored
                </p>
              </div>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isProcessing}
                placeholder="https://example.com/script.js&#10;https://cdn.example.com/bundle.min.js&#10;https://unpkg.com/react@18/umd/react.production.min.js"
                className="w-full h-64 px-4 py-3 bg-black border border-dark-700 rounded text-white text-sm font-mono focus:outline-none focus:border-white resize-none disabled:opacity-50"
              />
              <button
                onClick={handleUrlImport}
                disabled={isProcessing || !urlInput.trim()}
                className="w-full px-4 py-3 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded font-medium transition-colors"
              >
                {isProcessing ? 'Fetching Scripts...' : 'Import JavaScript URLs'}
              </button>
              {processingStatus && (
                <div className="bg-dark-850 border border-dark-700 rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">Fetching scripts...</span>
                    <span className="text-sm text-gray-400">
                      {processingStatus.processed}/{processingStatus.total}
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${(processingStatus.processed / processingStatus.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">✓ {processingStatus.successful} successful</span>
                    <span className="text-red-400">✗ {processingStatus.failed} failed</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="bg-dark-850 border border-dark-700 rounded p-3">
                <p className="text-sm text-gray-400 mb-2">
                  ℹ️ Only JavaScript file URLs will be processed
                </p>
                <p className="text-xs text-gray-500">
                  Lines not matching .js/.jsx/.ts/.tsx/.mjs/.cjs will be ignored
                </p>
              </div>
              <div
                className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center cursor-pointer hover:border-white transition-colors"
                onClick={() => !isProcessing && listFileInputRef.current?.click()}
              >
                <div className="text-4xl mb-4">📋</div>
                <p className="text-white font-medium mb-2">Click to upload list</p>
                <p className="text-xs text-gray-400">Text file with one URL per line</p>
                <input
                  ref={listFileInputRef}
                  type="file"
                  accept=".txt,.list,.csv"
                  onChange={handleListFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </div>
              <div className="bg-dark-850 border border-dark-700 rounded p-4">
                <p className="text-xs text-gray-400 mb-2">Example file format:</p>
                <pre className="text-xs text-gray-300 font-mono">
{`https://example.com/script.js
https://cdn.example.com/bundle.min.js
https://unpkg.com/react@18.2.0/umd/react.production.min.js
# Comments are ignored
https://example.com/styles.css  ← Will be ignored
https://example.com/app.jsx  ← Will be imported`}
                </pre>
              </div>
              {processingStatus && (
                <div className="bg-dark-850 border border-dark-700 rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">Fetching scripts...</span>
                    <span className="text-sm text-gray-400">
                      {processingStatus.processed}/{processingStatus.total}
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${(processingStatus.processed / processingStatus.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs flex-wrap gap-2">
                    <span className="text-green-400">✓ {processingStatus.successful} successful</span>
                    <span className="text-red-400">✗ {processingStatus.failed} failed</span>
                    {processingStatus.ignored > 0 && (
                      <span className="text-yellow-400">⚠ {processingStatus.ignored} ignored</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
