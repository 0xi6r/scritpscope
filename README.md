# ScriptScope

A powerful Chrome Extension for security professionals that captures, prettifies, and statically analyzes JavaScript files for vulnerabilities and secrets.

## Features

- 🔍 **Comprehensive Script Discovery**: Finds all JS files (inline, external, dynamic)
- ✨ **Code Prettification**: De-obfuscate minified code with Prettier
- 🔐 **Security Scanning**: Detects secrets, dangerous patterns, and info disclosure
- 📊 **Risk Classification**: HIGH/MEDIUM/LOW risk categorization
- 🎨 **Syntax Highlighting**: Full JavaScript syntax support via CodeMirror 6
- 📍 **Source Map Detection**: Identifies scripts with source maps
- 📥 **Export Reports**: Generate JSON reports of all findings
- ⚡ **Performance Optimized**: Web Workers for non-blocking analysis

## Security Patterns Detected

### High Risk
- AWS Access Keys & Secret Keys
- Private Cryptographic Keys
- Google API Keys
- Stripe API Keys
- Slack Tokens
- GitHub Tokens
- Hardcoded passwords

### Medium Risk
- innerHTML/outerHTML assignments (XSS)
- document.write usage
- eval() usage
- setTimeout/setInterval with strings
- dangerouslySetInnerHTML

### Low Risk
- IP addresses
- Email addresses
- TODO/FIXME comments
- Console debug statements
- Internal file paths

## Installation

### Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/scriptscope.git
cd scriptscope
