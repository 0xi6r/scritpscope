import React, { useEffect } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { TopBar } from './components/TopBar';
import { FileList } from './components/FileList';
import { CodeViewer } from './components/CodeViewer';
import { IssuesDrawer } from './components/IssuesDrawer';
import { useScriptDiscovery } from './hooks/useScriptDiscovery';

const SidePanelContent = () => {
  const { setScripts, setIsLoading, setSelectedScript } = useApp();
  const { scripts, isLoading, error, discoverScripts } = useScriptDiscovery();

  useEffect(() => {
    setScripts(scripts);
    if (scripts.length > 0 && !error) {
      setSelectedScript(scripts[0]);
    }
  }, [scripts, error]);

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading]);

  const handleScan = async () => {
    await discoverScripts();
  };

  const handleExport = () => {
    // Export logic is in TopBar component
  };

  const handleScanComplete = (findings) => {
    console.log('Scan complete:', findings.length, 'findings');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <TopBar onScan={handleScan} onExport={handleExport} />

      {error && (
        <div className="bg-red-900 border-b border-red-700 px-4 py-2 text-sm text-red-200">
          ⚠️ Error: {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File List */}
        <div className="w-80 bg-gray-850 border-r border-gray-700 flex flex-col">
          <FileList />
        </div>

        {/* Main Area - Code Viewer & Issues */}
        <div className="flex-1 flex flex-col">
          <CodeViewer onScanComplete={handleScanComplete} />
          <IssuesDrawer />
        </div>
      </div>
    </div>
  );
};

export const SidePanel = () => {
  return (
    <AppProvider>
      <SidePanelContent />
    </AppProvider>
  );
};
