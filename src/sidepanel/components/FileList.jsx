import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const FileList = () => {
  const { scripts, selectedScript, setSelectedScript, findings, ignoredFindings, setScripts, setFindings } = useApp();

  // Group scripts by domain
  const groupedByDomain = useMemo(() => {
    const groups = {};

    scripts.forEach(script => {
      let domain;

      // Handle different script types
      if (script.url.startsWith('inline-script')) {
        domain = '📄 Inline Scripts';
      } else if (script.url.startsWith('imported-')) {
        domain = '📁 Imported Files';
      } else if (script.type === 'imported-url') {
        try {
          const url = new URL(script.url);
          domain = `🔗 ${url.hostname}`;
        } catch {
          domain = '🔗 Imported URLs';
        }
      } else {
        try {
          const url = new URL(script.url);
          domain = url.hostname;
        } catch {
          domain = 'Unknown';
        }
      }

      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(script);
    });

    return groups;
  }, [scripts]);

  const getRiskBadge = (script) => {
    // Filter out ignored findings
    const scriptFindings = findings.filter(f =>
      f.scriptUrl === script.url &&
      !ignoredFindings.has(f.index + '-' + f.line + '-' + f.scriptUrl)
    );

    if (scriptFindings.length === 0) {
      return { color: 'bg-green-500', text: 'Clean', count: 0 };
    }

    const hasHigh = scriptFindings.some(f => f.risk === 'HIGH');
    const hasMedium = scriptFindings.some(f => f.risk === 'MEDIUM');

    if (hasHigh) {
      return { color: 'bg-red-500', text: scriptFindings.length, count: scriptFindings.length };
    }
    if (hasMedium) {
      return { color: 'bg-orange-500', text: scriptFindings.length, count: scriptFindings.length };
    }
    return { color: 'bg-yellow-500', text: scriptFindings.length, count: scriptFindings.length };
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileName = (url) => {
    if (url.startsWith('inline-script')) {
      return `📄 ${url}`;
    }
    if (url.startsWith('imported-')) {
      // Extract filename from imported- prefix
      const fileName = url.replace('imported-', '');
      return fileName;
    }
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || 'script.js';
    } catch {
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  };

  const getScriptTypeInfo = (script) => {
    if (script.type === 'imported' && script.fileName) {
      return {
        badge: '📁 Imported',
        color: 'bg-purple-900 text-purple-200 border-purple-700'
      };
    }
    if (script.type === 'imported-url') {
      return {
        badge: '🔗 Imported URL',
        color: 'bg-indigo-900 text-indigo-200 border-indigo-700'
      };
    }
    if (script.type === 'inline') {
      return {
        badge: '📝 Inline',
        color: 'bg-blue-900 text-blue-200 border-blue-700'
      };
    }
    if (script.type === 'external') {
      return {
        badge: '🌐 External',
        color: 'bg-gray-800 text-gray-300 border-gray-600'
      };
    }
    if (script.type === 'dynamic') {
      return {
        badge: '⚡ Dynamic',
        color: 'bg-yellow-900 text-yellow-200 border-yellow-700'
      };
    }
    return null;
  };

  const handleRemoveScript = (scriptToRemove, e) => {
  e.stopPropagation(); // Prevent selecting the script

  // Remove script from list
  setScripts(prev => prev.filter(s => s.url !== scriptToRemove.url));

  // Remove associated findings
  setFindings(prev => prev.filter(f => f.scriptUrl !== scriptToRemove.url));

  // If this was the selected script, clear selection or select another
  if (selectedScript?.url === scriptToRemove.url) {
    const remainingScripts = scripts.filter(s => s.url !== scriptToRemove.url);
    if (remainingScripts.length > 0) {
      setSelectedScript(remainingScripts[0]);
    } else {
      setSelectedScript(null);
    }
  }
};

  const ScriptItem = ({ script }) => {
    const badge = getRiskBadge(script);
    const typeInfo = getScriptTypeInfo(script);
    const isSelected = selectedScript?.url === script.url;

    return (
      <div
        className={`group relative p-3 cursor-pointer border-l-4 transition-all ${
          isSelected
            ? 'bg-dark-700 border-white'
            : 'bg-dark-850 border-transparent hover:bg-dark-800 hover:border-dark-600'
        }`}
      >
        <div onClick={() => setSelectedScript(script)}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-sm font-medium text-white truncate" title={script.url}>
                {getFileName(script.url)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatSize(script.size)}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className={`px-2 py-1 rounded text-xs font-bold text-white ${badge.color}`}>
                {badge.text}
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleRemoveScript(script, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-900 rounded"
                title="Remove script"
              >
                <svg className="w-4 h-4 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Badges Section */}
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Import Type Badge */}
            {typeInfo && (
              <span className={`text-xs px-2 py-1 rounded border ${typeInfo.color}`}>
                {typeInfo.badge}
              </span>
            )}

            {/* Source Map Badge */}
            {script.hasSourceMap && (
              <span className="text-xs bg-dark-700 text-white px-2 py-1 rounded border border-dark-600">
                📍 Source Map
              </span>
            )}

            {/* File Name Badge (for imported files) */}
            {script.type === 'imported' && script.fileName && (
              <span className="text-xs bg-dark-800 text-gray-300 px-2 py-1 rounded border border-dark-600 font-mono">
                {script.fileName}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (scripts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center p-6">
          <div className="text-5xl mb-4">📜</div>
          <p className="font-medium text-white mb-2">No scripts found</p>
          <p className="text-xs mt-2 mb-4">Get started by:</p>
          <div className="space-y-2 text-xs text-left bg-dark-800 rounded p-4 border border-dark-700">
            <div className="flex items-center space-x-2">
              <span>🔄</span>
              <span>Click "Scan Scripts" to analyze current page</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>📥</span>
              <span>Click "Import" to upload files or paste URLs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groupedByDomain).sort((a, b) => {
        // Sort order: Imported Files, Inline Scripts, then alphabetical
        const order = {
          '📁 Imported Files': 0,
          '📄 Inline Scripts': 1
        };
        const aOrder = order[a[0]] ?? 2;
        const bOrder = order[b[0]] ?? 2;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return a[0].localeCompare(b[0]);
      }).map(([domain, domainScripts]) => (
        <div key={domain}>
          <div className="sticky top-0 bg-black px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-dark-700 flex items-center justify-between">
            <span>{domain}</span>
            <span className="text-gray-500">({domainScripts.length})</span>
          </div>
          {domainScripts.map(script => (
            <ScriptItem key={script.url} script={script} />
          ))}
        </div>
      ))}
    </div>
  );
};
