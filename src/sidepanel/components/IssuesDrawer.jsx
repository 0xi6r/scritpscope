import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const IssuesDrawer = ({ isMinimized, onToggle }) => {
  const {
    findings,
    selectedFinding,
    setSelectedFinding,
    selectedScript,
    setFindings,
    ignoredFindings,
    setIgnoredFindings
  } = useApp();

  const scriptFindings = useMemo(() => {
    if (!selectedScript) return [];
    return findings.filter(f =>
      f.scriptUrl === selectedScript.url && !ignoredFindings.has(f.index + '-' + f.line + '-' + f.scriptUrl)
    );
  }, [findings, selectedScript, ignoredFindings]);

  const groupedFindings = useMemo(() => {
    const groups = { HIGH: [], MEDIUM: [], LOW: [] };
    scriptFindings.forEach(finding => {
      groups[finding.risk].push(finding);
    });
    return groups;
  }, [scriptFindings]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return 'text-red-400 bg-red-900/30 border-red-500';
      case 'MEDIUM': return 'text-orange-400 bg-orange-900/30 border-orange-500';
      case 'LOW': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟠';
      case 'LOW': return '🟡';
      default: return '⚪';
    }
  };

  const handleIgnoreFinding = (finding) => {
    const key = finding.index + '-' + finding.line + '-' + finding.scriptUrl;
    setIgnoredFindings(prev => new Set([...prev, key]));

    // Remove from active findings display
    setFindings(prev => prev.filter(f =>
      !(f.scriptUrl === finding.scriptUrl && f.line === finding.line && f.index === finding.index)
    ));
  };

  if (!selectedScript) {
    return (
      <div className="h-full bg-dark-900 border-t border-dark-700 flex items-center justify-center text-gray-400 text-xs">
        Select a script to view security findings
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div
        className="h-full bg-dark-900 border-t-2 border-dark-700 flex items-center justify-between px-4 cursor-pointer hover:bg-dark-850 transition-colors"
        onClick={() => onToggle(false)}
      >
        <div className="flex items-center space-x-3">
          <button className="text-white hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <h3 className="text-sm font-bold text-white">
            Security Findings ({scriptFindings.length})
          </h3>
          {scriptFindings.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              {groupedFindings.HIGH.length > 0 && (
                <span className="text-red-400 flex items-center">
                  {getRiskIcon('HIGH')} <span className="ml-1">{groupedFindings.HIGH.length}</span>
                </span>
              )}
              {groupedFindings.MEDIUM.length > 0 && (
                <span className="text-orange-400 flex items-center">
                  {getRiskIcon('MEDIUM')} <span className="ml-1">{groupedFindings.MEDIUM.length}</span>
                </span>
              )}
              {groupedFindings.LOW.length > 0 && (
                <span className="text-yellow-400 flex items-center">
                  {getRiskIcon('LOW')} <span className="ml-1">{groupedFindings.LOW.length}</span>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {scriptFindings.length === 0 && (
            <span className="text-xs text-green-400 flex items-center">
              <span className="mr-1">✅</span>
              Clean
            </span>
          )}
          <span className="text-xs text-gray-500">Click to expand</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-dark-900 border-t-2 border-dark-700 flex flex-col">
      <div className="px-4 py-2 bg-black border-b border-dark-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onToggle(true)}
            className="text-white hover:text-gray-300 transition-colors"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-bold text-white">
            Security Findings ({scriptFindings.length})
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-red-400 flex items-center">
            {getRiskIcon('HIGH')} <span className="ml-1">{groupedFindings.HIGH.length} High</span>
          </span>
          <span className="text-orange-400 flex items-center">
            {getRiskIcon('MEDIUM')} <span className="ml-1">{groupedFindings.MEDIUM.length} Medium</span>
          </span>
          <span className="text-yellow-400 flex items-center">
            {getRiskIcon('LOW')} <span className="ml-1">{groupedFindings.LOW.length} Low</span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-dark-900">
        {scriptFindings.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <div className="text-center p-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium text-green-400 text-lg">No security issues detected</p>
              <p className="text-xs mt-2">This script appears to be clean</p>
            </div>
          </div>
        ) : (
          ['HIGH', 'MEDIUM', 'LOW'].map(risk => (
            groupedFindings[risk].length > 0 && (
              <div key={risk} className="border-b border-dark-700">
                <div className="px-4 py-2 bg-dark-850 text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center sticky top-0">
                  <span className="mr-2">{getRiskIcon(risk)}</span>
                  {risk} Risk ({groupedFindings[risk].length})
                </div>
                {groupedFindings[risk].map((finding, idx) => (
                  <div
                    key={`${finding.line}-${finding.column}-${idx}`}
                    className={`px-4 py-3 border-l-4 transition-all ${
                      selectedFinding === finding
                        ? `${getRiskColor(risk)} bg-dark-800`
                        : 'border-transparent hover:bg-dark-850'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedFinding(finding)}
                      >
                        <span className="text-sm font-medium text-white">
                          {finding.type}
                        </span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">
                          Line {finding.line}:{finding.column}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIgnoreFinding(finding);
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
                        title="Ignore this finding"
                      >
                        Ignore
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">
                      {finding.description}
                    </p>
                    <div className="bg-black rounded p-2 overflow-x-auto border border-dark-700">
                      <code className="text-xs text-gray-200 font-mono">
                        {finding.matchText}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};
