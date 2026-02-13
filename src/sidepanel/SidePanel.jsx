import React, { useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { TopBar } from './components/TopBar';
import { FileList } from './components/FileList';
import { CodeViewer } from './components/CodeViewer';
import { IssuesDrawer } from './components/IssuesDrawer';
import { useScriptDiscovery } from './hooks/useScriptDiscovery';

const SidePanelContent = () => {
  const { setScripts, setIsLoading, setSelectedScript, scripts } = useApp();
  const { isLoading, error, discoverScripts } = useScriptDiscovery();

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [drawerHeight, setDrawerHeight] = useState(48);
  const [isDrawerMinimized, setIsDrawerMinimized] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);

  const containerRef = useRef(null);

  const handleScan = async () => {
    const discoveredScripts = await discoverScripts();
    if (discoveredScripts.length > 0) {
      setSelectedScript(discoveredScripts[0]);
    }
  };

  const handleImport = async (importedScripts) => {
    console.log('Importing scripts:', importedScripts);

    // Merge imported scripts with existing ones
    setScripts(prev => [...prev, ...importedScripts]);

    // Select first imported script
    if (importedScripts.length > 0) {
      setSelectedScript(importedScripts[0]);
    }

    // Auto-scan imported scripts
    // The CodeViewer will automatically scan when a script is selected
    console.log(`Imported ${importedScripts.length} scripts. Auto-scanning...`);
  };

  const handleScanComplete = (findings) => {
    console.log('Scan complete:', findings.length, 'findings');
  };

  const handleDrawerToggle = (minimized) => {
    setIsDrawerMinimized(minimized);
    if (minimized) {
      setDrawerHeight(48);
    } else {
      setDrawerHeight(320);
    }
  };

  const handleSidebarMouseDown = (e) => {
    if (isSidebarCollapsed) return;
    e.preventDefault();
    setIsDraggingSidebar(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSidebar) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isDraggingDrawer && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newHeight = Math.max(48, Math.min(600, containerRect.bottom - e.clientY));
        setDrawerHeight(newHeight);
        if (newHeight > 48) {
          setIsDrawerMinimized(false);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingDrawer(false);
    };

    if (isDraggingSidebar || isDraggingDrawer) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDraggingSidebar ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSidebar, isDraggingDrawer]);

  const handleDrawerMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingDrawer(true);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <TopBar onScan={handleScan} onImport={handleImport} />

      {error && (
        <div className="bg-red-900 border-b border-red-700 px-4 py-2 text-sm text-red-200 flex-shrink-0">
          ⚠️ Error: {error}
        </div>
      )}

      <div ref={containerRef} className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {!isSidebarCollapsed && (
          <>
            <div
              style={{ width: `${sidebarWidth}px` }}
              className="bg-dark-850 border-r border-dark-700 flex flex-col overflow-hidden flex-shrink-0"
            >
              <div className="px-3 py-2 bg-black border-b border-dark-700 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">Scripts</span>
                <button
                  onClick={toggleSidebar}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Hide sidebar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <FileList />
            </div>

            <div
              className={`resize-handle resize-handle-vertical ${isDraggingSidebar ? 'dragging' : ''}`}
              onMouseDown={handleSidebarMouseDown}
            />
          </>
        )}

        {isSidebarCollapsed && (
          <div className="w-10 bg-dark-850 border-r border-dark-700 flex flex-col items-center pt-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors mb-2"
              title="Show sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <div className="text-xs text-gray-500 writing-mode-vertical transform rotate-180 mt-4">
              SCRIPTS
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          <div
            className="flex-1 overflow-hidden"
            style={{ minHeight: 0, height: `calc(100% - ${drawerHeight}px)` }}
          >
            <CodeViewer onScanComplete={handleScanComplete} />
          </div>

          {!isDrawerMinimized && (
            <div
              className={`resize-handle resize-handle-horizontal ${isDraggingDrawer ? 'dragging' : ''}`}
              onMouseDown={handleDrawerMouseDown}
            />
          )}

          <div style={{ height: `${drawerHeight}px` }} className="flex-shrink-0 overflow-hidden">
            <IssuesDrawer
              isMinimized={isDrawerMinimized}
              onToggle={handleDrawerToggle}
            />
          </div>
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
