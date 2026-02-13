import React from 'react';
import { useApp } from '../../context/AppContext';

export const TopBar = ({ onScan, onExport }) => {
  const { isScanning, isLoading, scripts, findings } = useApp();

  const handleExport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      scriptsAnalyzed: scripts.length,
      totalFindings: findings.length,
      findingsByRisk: {
        high: findings.filter(f => f.risk === 'HIGH').length,
        medium: findings.filter(f => f.risk === 'MEDIUM').length,
        low: findings.filter(f => f.risk === 'LOW').length
      },
      scripts: scripts.map(script => ({
        url: script.url,
        type: script.type,
        size: script.size,
        firstParty: script.firstParty,
        findings: findings.filter(f => f.scriptUrl === script.url)
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scriptscope-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-bold text-white flex items-center">
          <span className="text-blue-500 mr-2">🔍</span>
          ScriptScope
        </h1>
        <span className="text-xs text-gray-400">
          {scripts.length} script{scripts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onScan}
          disabled={isScanning || isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
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
          onClick={handleExport}
          disabled={scripts.length === 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
        >
          <span>📥</span>
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
