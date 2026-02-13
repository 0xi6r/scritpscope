/**
 * Web Worker for Security Scanning
 * Runs security analysis off the main thread
 */

// Import scanner logic
self.importScripts = self.importScripts || (() => {});

// Security patterns (duplicated for worker context)
const SECURITY_PATTERNS = {
  HIGH: [
    {
      name: 'AWS Access Key',
      pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
      description: 'AWS Access Key ID detected'
    },
    {
      name: 'AWS Secret Key',
      pattern: /aws[_-]?secret[_-]?access[_-]?key['"\s]*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi,
      description: 'AWS Secret Access Key detected'
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/g,
      description: 'Private cryptographic key detected'
    },
    {
      name: 'Google API Key',
      pattern: /AIza[0-9A-Za-z\-_]{35}/g,
      description: 'Google API Key detected'
    },
    {
      name: 'Stripe API Key',
      pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
      description: 'Stripe Secret Key detected'
    },
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[0-9a-zA-Z\-]{10,72}/g,
      description: 'Slack Token detected'
    },
    {
      name: 'GitHub Token',
      pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
      description: 'GitHub Token detected'
    },
    {
      name: 'Generic API Key',
      pattern: /api[_-]?key['"\s]*[:=]\s*['"]([a-zA-Z0-9\-_]{20,})['"]/gi,
      description: 'Potential API key detected'
    },
    {
      name: 'Generic Secret',
      pattern: /secret['"\s]*[:=]\s*['"]([a-zA-Z0-9\-_!@#$%^&*()+=]{16,})['"]/gi,
      description: 'Potential secret value detected'
    },
    {
      name: 'Password in Code',
      pattern: /password['"\s]*[:=]\s*['"]([^'"]{8,})['"]/gi,
      description: 'Hardcoded password detected'
    }
  ],
  MEDIUM: [
    {
      name: 'innerHTML Assignment',
      pattern: /\.innerHTML\s*=/g,
      description: 'Direct innerHTML assignment (XSS risk)'
    },
    {
      name: 'outerHTML Assignment',
      pattern: /\.outerHTML\s*=/g,
      description: 'Direct outerHTML assignment (XSS risk)'
    },
    {
      name: 'document.write',
      pattern: /document\.write\s*\(/g,
      description: 'Use of document.write (XSS risk)'
    },
    {
      name: 'dangerouslySetInnerHTML',
      pattern: /dangerouslySetInnerHTML\s*=/g,
      description: 'React dangerouslySetInnerHTML (XSS risk)'
    },
    {
      name: 'eval() usage',
      pattern: /\beval\s*\(/g,
      description: 'Use of eval() (Code injection risk)'
    },
    {
      name: 'setTimeout with string',
      pattern: /setTimeout\s*\(\s*['"`]/g,
      description: 'setTimeout with string argument (Code injection risk)'
    },
    {
      name: 'setInterval with string',
      pattern: /setInterval\s*\(\s*['"`]/g,
      description: 'setInterval with string argument (Code injection risk)'
    },
    {
      name: 'Function constructor',
      pattern: /new\s+Function\s*\(/g,
      description: 'Function constructor usage (Code injection risk)'
    },
    {
      name: 'insertAdjacentHTML',
      pattern: /\.insertAdjacentHTML\s*\(/g,
      description: 'insertAdjacentHTML usage (XSS risk)'
    }
  ],
  LOW: [
    {
      name: 'IPv4 Address',
      pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      description: 'IP address found in code'
    },
    {
      name: 'Email Address',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      description: 'Email address found in code'
    },
    {
      name: 'TODO Comment',
      pattern: /\/\/\s*TODO[\s:]/gi,
      description: 'TODO comment (may indicate incomplete code)'
    },
    {
      name: 'FIXME Comment',
      pattern: /\/\/\s*FIXME[\s:]/gi,
      description: 'FIXME comment (may indicate bugs)'
    },
    {
      name: 'Debug Statement',
      pattern: /console\.(log|debug|info)\s*\(/g,
      description: 'Debug console statement'
    },
    {
      name: 'Internal Path',
      pattern: /[C-Z]:\\[^\s'"]{10,}/g,
      description: 'Windows file path found'
    },
    {
      name: 'Internal URL',
      pattern: /https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)/gi,
      description: 'Internal/localhost URL found'
    }
  ]
};

/**
 * Scan code for security issues
 */
function scanCode(code) {
  const findings = [];
  const lines = code.split('\n');

  const getLineAndColumn = (index) => {
    let currentIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1;
      if (currentIndex + lineLength > index) {
        return {
          line: i + 1,
          column: index - currentIndex + 1,
          lineText: lines[i]
        };
      }
      currentIndex += lineLength;
    }
    return { line: lines.length, column: 1, lineText: lines[lines.length - 1] || '' };
  };

  ['HIGH', 'MEDIUM', 'LOW'].forEach(risk => {
    SECURITY_PATTERNS[risk].forEach(pattern => {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;

      while ((match = regex.exec(code)) !== null) {
        const { line, column, lineText } = getLineAndColumn(match.index);

        findings.push({
          type: pattern.name,
          risk,
          line,
          column,
          matchText: match[0].length > 100
            ? match[0].substring(0, 100) + '...'
            : match[0],
          description: pattern.description,
          index: match.index,
          lineText: lineText.trim()
        });
      }
    });
  });

  findings.sort((a, b) => a.line - b.line);

  return findings;
}

// Message handler
self.addEventListener('message', (event) => {
  const { type, code, id } = event.data;

  if (type === 'SCAN') {
    try {
      const findings = scanCode(code);

      self.postMessage({
        type: 'SCAN_COMPLETE',
        id,
        findings,
        success: true
      });
    } catch (error) {
      self.postMessage({
        type: 'SCAN_ERROR',
        id,
        error: error.message,
        success: false
      });
    }
  }
});

// Signal worker is ready
self.postMessage({ type: 'WORKER_READY' });
