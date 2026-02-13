import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const FileList = () => {
  const { scripts, selectedScript, setSelectedScript, findings } = useApp();

  // Group scripts by first-party vs third-party
  const { firstParty, thirdParty } = useMemo(() => {
    const first = scripts.filter(s => s.firstParty);
    const third = scripts.filter(s => !s.firstParty);
    return { firstParty: first, thirdParty: third };
  }, [scripts]);

  const getRiskBadge = (script) => {
    const scriptFindings = findings.filter(f => f.scriptUrl === script.url);

    if (scriptFindings.length === 0) {
      return { color: 'bg-green-500', text: 'Clean' };
    }

    const hasHigh = scriptFindings.some(f => f.risk === 'HIGH');
    const hasMedium = scriptFindings.some(f => f.risk === 'MEDIUM');

    if (hasHigh) {
      return { color: 'bg-red-500', text: `${scriptFindings.length} issues`, count: scriptFindings.length };
    }
    if (hasMedium) {
      return { color: 'bg-orange-500', text: `${scriptFindings.length} issues`, count: scriptFindings.length };
    }
    return { color: 'bg-yellow-500', text: `${scriptFindings.length} issues`, count: scriptFindings.length };
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
            ? 'bg-gray-700 border-blue-500'
            : 'bg-gray-800 border-transparent hover:bg-gray-750 hover:border-gray-600'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {getFileName(script.url)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatSize(script.size)}
            </div>
          </div>

          <div className={`ml-2 px-2 py-1 rounded text-xs font-bold text-white ${badge.color} flex-shrink-0`}>
            {badge.text}
          </div>
        </div>

        {script.hasSourceMap && (
          <div className="mt-2">
            <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
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
      {firstParty.length > 0 && (
        <div>
          <div className="sticky top-0 bg-gray-900 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
            First Party ({firstParty.length})
          </div>
          {firstParty.map(script => (
            <ScriptItem key={script.url} script={script} />
          ))}
        </div>
      )}

      {thirdParty.length > 0 && (
        <div>
          <div className="sticky top-0 bg-gray-900 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
            Third Party ({thirdParty.length})
          </div>
          {thirdParty.map(script => (
            <ScriptItem key={script.url} script={script} />
          ))}
        </div>
      )}
    </div>
  );
};
