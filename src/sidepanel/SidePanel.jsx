import React, { useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { TopBar } from './components/TopBar';
import { FileList } from './components/FileList';
import { CodeViewer } from './components/CodeViewer';
import { IssuesDrawer } from './components/IssuesDrawer';
import { useScriptDiscovery } from './hooks/useScriptDiscovery';

const SidePanelContent = () => {
  const { setScripts, setIsLoading, setSelectedScript } = useApp();
  const { scripts, isLoading, error, discoverScripts } = useScriptDiscovery();

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [drawerHeight, setDrawerHeight] = useState(320);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);

  const containerRef = useRef(null);

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

  const handleScanComplete = (findings) => {
    console.log('Scan complete:', findings.length, 'findings');
  };

  // Sidebar resize handlers
  const handleSidebarMouseDown = (e) => {
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
        const newHeight = Math.max(100, Math.min(600, containerRect.bottom - e.clientY));
        setDrawerHeight(newHeight);
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

  // Drawer resize handler
  const handleDrawerMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingDrawer(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <TopBar onScan={handleScan} />

      {error && (
        <div className="bg-red-900 border-b border-red-700 px-4 py-2 text-sm text-red-200 flex-shrink-0">
          ⚠️ Error: {error}
        </div>
      )}

      <div ref={containerRef} className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Sidebar - File List */}
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="bg-gray-850 border-r border-gray-700 flex flex-col overflow-hidden flex-shrink-0"
        >
          <FileList />
        </div>

        {/* Vertical Resize Handle */}
        <div
          className={`resize-handle resize-handle-vertical ${isDraggingSidebar ? 'dragging' : ''}`}
          onMouseDown={handleSidebarMouseDown}
        />

        {/* Main Area - Code Viewer & Issues */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          <div
            className="flex-1 overflow-hidden"
            style={{ minHeight: 0, height: `calc(100% - ${drawerHeight}px)` }}
          >
            <CodeViewer onScanComplete={handleScanComplete} />
          </div>

          {/* Horizontal Resize Handle */}
          <div
            className={`resize-handle resize-handle-horizontal ${isDraggingDrawer ? 'dragging' : ''}`}
            onMouseDown={handleDrawerMouseDown}
          />

          <div style={{ height: `${drawerHeight}px` }} className="flex-shrink-0 overflow-hidden">
            <IssuesDrawer />
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
