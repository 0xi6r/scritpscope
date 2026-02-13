import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanel } from './SidePanel';
import '../styles/index.css';

// Create a port connection to track side panel state
const port = chrome.runtime.connect({ name: 'sidepanel' });

// Notify background that side panel is open
chrome.runtime.sendMessage({ type: 'SIDEPANEL_OPENED' }).catch(() => {});

// Clean up on unload
window.addEventListener('beforeunload', () => {
  chrome.runtime.sendMessage({ type: 'SIDEPANEL_CLOSED' }).catch(() => {});
  port.disconnect();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);
