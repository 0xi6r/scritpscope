import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [scripts, setScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [findings, setFindings] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ignoredFindings, setIgnoredFindings] = useState(new Set());

  const value = {
    scripts,
    setScripts,
    selectedScript,
    setSelectedScript,
    findings,
    setFindings,
    selectedFinding,
    setSelectedFinding,
    isScanning,
    setIsScanning,
    isLoading,
    setIsLoading,
    ignoredFindings,
    setIgnoredFindings
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
