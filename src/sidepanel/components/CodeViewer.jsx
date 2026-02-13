import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState, Compartment } from '@codemirror/state';
import { useApp } from '../../context/AppContext';
import * as prettier from 'prettier/standalone';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEstree from 'prettier/plugins/estree';

export const CodeViewer = ({ onScanComplete }) => {
  const { selectedScript, setFindings, selectedFinding, setSelectedFinding } = useApp();
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [isPrettifying, setIsPrettifying] = useState(false);
  const [code, setCode] = useState('');
  const [worker, setWorker] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Initialize Web Worker
  useEffect(() => {
    const scanWorker = new Worker(
      new URL('../../utils/scanner.worker.js', import.meta.url),
      { type: 'module' }
    );

    scanWorker.onmessage = (event) => {
      const { type, findings, id } = event.data;

      if (type === 'SCAN_COMPLETE') {
        const findingsWithScript = findings.map(f => ({
          ...f,
          scriptUrl: selectedScript?.url
        }));
        setFindings(findingsWithScript);
        setIsScanning(false);
        onScanComplete?.(findingsWithScript);
      } else if (type === 'SCAN_ERROR') {
        console.error('Scan error:', event.data.error);
        setIsScanning(false);
      }
    };

    setWorker(scanWorker);

    return () => {
      scanWorker.terminate();
    };
  }, [selectedScript]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        EditorView.editable.of(false),
        EditorView.lineWrapping
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update code when script changes
  useEffect(() => {
    if (!selectedScript) {
      setCode('// Select a script to view its content');
      return;
    }

    if (selectedScript.fetchError) {
      setCode(`// Unable to fetch script content\n// Error: ${selectedScript.fetchError}\n// URL: ${selectedScript.url}`);
      return;
    }

    if (!selectedScript.content) {
      setCode('// No content available');
      return;
    }

    setCode(selectedScript.content);

    // Auto-scan when new script is loaded
    if (worker && selectedScript.content) {
      setIsScanning(true);
      worker.postMessage({
        type: 'SCAN',
        code: selectedScript.content,
        id: selectedScript.url
      });
    }
  }, [selectedScript, worker]);

  // Update editor content
  useEffect(() => {
    if (viewRef.current) {
      const view = viewRef.current;
      const currentDoc = view.state.doc.toString();

      if (currentDoc !== code) {
        view.dispatch({
          changes: {
            from: 0,
            to: currentDoc.length,
            insert: code
          }
        });
      }
    }
  }, [code]);

  // Scroll to selected finding
  useEffect(() => {
    if (selectedFinding && viewRef.current) {
      const view = viewRef.current;
      const line = view.state.doc.line(selectedFinding.line);

      view.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: 'center' })
      });
    }
  }, [selectedFinding]);

  const handlePrettify = async () => {
    if (!selectedScript?.content || selectedScript.content.length > 1024 * 1024) {
      alert('File is too large to prettify (>1MB). This may cause browser slowdown.');
      return;
    }

    setIsPrettifying(true);

    try {
      const formatted = await prettier.format(selectedScript.content, {
        parser: 'babel',
        plugins: [prettierBabel, prettierEstree],
        semi: true,
        singleQuote: true,
        tabWidth: 2
      });

      setCode(formatted);

      // Re-scan the prettified code
      if (worker) {
        setIsScanning(true);
        worker.postMessage({
          type: 'SCAN',
          code: formatted,
          id: selectedScript.url
        });
      }
    } catch (error) {
      console.error('Prettify error:', error);
      alert('Failed to prettify code: ' + error.message);
    } finally {
      setIsPrettifying(false);
    }
  };

  const fileSizeMB = selectedScript ? (selectedScript.size / (1024 * 1024)).toFixed(2) : 0;
  const showWarning = fileSizeMB > 1;

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            {selectedScript ? (
              <>
                <span className="font-mono">{selectedScript.url.split('/').pop() || 'inline'}</span>
                {showWarning && (
                  <span className="ml-2 text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded">
                    ⚠️ Large file ({fileSizeMB} MB)
                  </span>
                )}
              </>
            ) : (
              'No script selected'
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isScanning && (
            <span className="text-xs text-blue-400 flex items-center">
              <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Scanning...
            </span>
          )}

          <button
            onClick={handlePrettify}
            disabled={!selectedScript?.content || isPrettifying || selectedScript?.fetchError}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {isPrettifying ? '⏳ Prettifying...' : '✨ Prettify'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  );
};
