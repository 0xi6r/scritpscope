import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const FileList = () => {
  const { scripts, selectedScript, setSelectedScript, findings } = useApp();

  // Group scripts by domain
  const groupedByDomain = useMemo(() => {
    const groups = {};

    scripts.forEach(script => {
      let domain;
      if (script.url.startsWith('inline-script')) {
        domain = '📄 Inline Scripts';
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
    const scriptFindings = findings.filter(f => f.scriptUrl === script.url);

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
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || 'script.js';
    } catch {
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  };

  const ScriptItem = ({ script }) => {
    const badge = getRiskBadge(script);
    const isSelected = selectedScript?.url === script.url;

    return (
      <div
        onClick={() => setSelectedScript(script)}
        className={`p-3 cursor-pointer border-l-4 transition-all ${
          isSelected
            ? 'bg-dark-700 border-white'
            : 'bg-dark-850 border-transparent hover:bg-dark-800 hover:border-dark-600'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {getFileName(script.url)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatSize(script.size)}
            </div>
          </div>

          <div className={`ml-2 px-2 py-1 rounded text-xs font-bold text-white ${badge.color} flex-shrink-0`}>
            {badge.text}
          </div>
        </div>

        {script.hasSourceMap && (
          <div className="mt-2">
            <span className="text-xs bg-dark-700 text-white px-2 py-1 rounded border border-dark-600">
              📍 Source Map
            </span>
          </div>
        )}

        {script.fetchError && (
          <div className="mt-2">
            <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
              ⚠️ {script.fetchError === 'CORS_ERROR' ? 'CORS Blocked' : 'Unreadable'}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (scripts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center">
          <div className="text-4xl mb-4">📜</div>
          <p>No scripts found</p>
          <p className="text-xs mt-2">Click "Scan Scripts" to analyze the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groupedByDomain).map(([domain, domainScripts]) => (
        <div key={domain}>
          <div className="sticky top-0 bg-black px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-dark-700">
            {domain} ({domainScripts.length})
          </div>
          {domainScripts.map(script => (
            <ScriptItem key={script.url} script={script} />
          ))}
        </div>
      ))}
    </div>
  );
};
