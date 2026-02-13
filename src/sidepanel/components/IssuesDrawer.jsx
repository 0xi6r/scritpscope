import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const IssuesDrawer = () => {
  const { findings, selectedFinding, setSelectedFinding, selectedScript } = useApp();

  const scriptFindings = useMemo(() => {
    if (!selectedScript) return [];
    return findings.filter(f => f.scriptUrl === selectedScript.url);
  }, [findings, selectedScript]);

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

  if (!selectedScript) {
    return (
      <div className="h-64 bg-gray-800 border-t border-gray-700 flex items-center justify-center text-gray-400 text-sm">
        Select a script to view security findings
      </div>
    );
  }

  if (scriptFindings.length === 0) {
    return (
      <div className="h-64 bg-gray-800 border-t border-gray-700 flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-medium text-green-400">No security issues detected</p>
          <p className="text-xs mt-1">This script appears to be clean</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 bg-gray-800 border-t border-gray-700 flex flex-col">
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          Security Findings ({scriptFindings.length})
        </h3>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-red-400">
            {getRiskIcon('HIGH')} {groupedFindings.HIGH.length} High
          </span>
          <span className="text-orange-400">
            {getRiskIcon('MEDIUM')} {groupedFindings.MEDIUM.length} Medium
          </span>
          <span className="text-yellow-400">
            {getRiskIcon('LOW')} {groupedFindings.LOW.length} Low
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {['HIGH', 'MEDIUM', 'LOW'].map(risk => (
          groupedFindings[risk].length > 0 && (
            <div key={risk} className="border-b border-gray-700">
              <div className="px-4 py-2 bg-gray-850 text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                <span className="mr-2">{getRiskIcon(risk)}</span>
                {risk} Risk ({groupedFindings[risk].length})
              </div>
              {groupedFindings[risk].map((finding, idx) => (
                <div
                  key={`${finding.line}-${finding.column}-${idx}`}
                  onClick={() => setSelectedFinding(finding)}
                  className={`px-4 py-3 cursor-pointer border-l-4 transition-all ${
                    selectedFinding === finding
                      ? `${getRiskColor(risk)} bg-gray-700`
                      : 'border-transparent hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {finding.type}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Line {finding.line}:{finding.column}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">
                    {finding.description}
                  </p>
                  <div className="bg-gray-900 rounded p-2 overflow-x-auto">
                    <code className="text-xs text-gray-200 font-mono">
                      {finding.matchText}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
};
