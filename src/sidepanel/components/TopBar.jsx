import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImportModal } from './ImportModal';

export const TopBar = ({ onScan, onImport }) => {
  const { isScanning, isLoading, scripts, findings, ignoredFindings } = useApp();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExport = () => {
    const activeFindings = findings.filter(f =>
      !ignoredFindings.has(f.index + '-' + f.line + '-' + f.scriptUrl)
    );

    const scriptsWithIssues = scripts.filter(script =>
      activeFindings.some(f => f.scriptUrl === script.url)
    );

    const findingsByRisk = {
      high: activeFindings.filter(f => f.risk === 'HIGH').length,
      medium: activeFindings.filter(f => f.risk === 'MEDIUM').length,
      low: activeFindings.filter(f => f.risk === 'LOW').length
    };

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        extensionName: 'ScriptScope',
        version: '1.0.1'
      },
      summary: {
        totalScriptsScanned: scripts.length,
        scriptsWithIssues: scriptsWithIssues.length,
        totalFindings: activeFindings.length,
        ignoredFindings: ignoredFindings.size,
        findingsByRisk: findingsByRisk
      },
      scriptsWithIssues: scriptsWithIssues.map(script => {
        const scriptFindings = activeFindings.filter(f => f.scriptUrl === script.url);

        return {
          url: script.url,
          type: script.type,
          size: script.size,
          sizeFormatted: formatSize(script.size),
          firstParty: script.firstParty,
          hasSourceMap: script.hasSourceMap,
          domain: getDomain(script.url),
          findingsCount: scriptFindings.length,
          findingsByRisk: {
            high: scriptFindings.filter(f => f.risk === 'HIGH').length,
            medium: scriptFindings.filter(f => f.risk === 'MEDIUM').length,
            low: scriptFindings.filter(f => f.risk === 'LOW').length
          },
          findings: scriptFindings.map(f => ({
            type: f.type,
            risk: f.risk,
            line: f.line,
            column: f.column,
            description: f.description,
            matchText: f.matchText,
            lineText: f.lineText || ''
          }))
        };
      })
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `scriptscope-report-${timestamp}.json`;

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`Exported ${scriptsWithIssues.length} scripts with ${activeFindings.length} findings`);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDomain = (url) => {
    if (url.startsWith('inline-script') || url.startsWith('imported-')) return 'local';
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  };

  const hasActiveFindings = findings.some(f =>
    !ignoredFindings.has(f.index + '-' + f.line + '-' + f.scriptUrl)
  );

  const handleImportScripts = (importedScripts) => {
    onImport(importedScripts);
  };

  return (
    <>
      <div className="bg-black border-b border-dark-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-white flex items-center">
            <span className="text-white mr-2">🔍</span>
            ScriptScope
          </h1>
          <span className="text-xs text-gray-400">
            {scripts.length} script{scripts.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFindings && (
            <span className="text-xs text-red-400 flex items-center">
              <span className="mr-1">⚠️</span>
              {findings.filter(f => !ignoredFindings.has(f.index + '-' + f.line + '-' + f.scriptUrl)).length} issues
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onScan}
            disabled={isScanning || isLoading}
            className="px-4 py-2 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded font-medium text-sm transition-colors flex items-center space-x-2"
          >
            {isScanning || isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Scan Scripts</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded font-medium text-sm transition-colors flex items-center space-x-2"
          >
            <span>📥</span>
            <span>Import</span>
          </button>

          <button
            onClick={handleExport}
            disabled={!hasActiveFindings}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 disabled:bg-dark-900 disabled:cursor-not-allowed text-white disabled:text-gray-600 rounded font-medium text-sm transition-colors flex items-center space-x-2"
            title={hasActiveFindings ? 'Export scripts with issues' : 'No issues to export'}
          >
            <span>📤</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportScripts}
      />
    </>
  );
};
