#!/bin/bash

# Fix Git Commit Messages for ScriptScope

set -e

echo "🔧 Fixing Git Commit Messages..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# First, let's see what we have
echo -e "${YELLOW}Current commit history:${NC}"
git log --oneline -20
echo ""

read -p "How many commits do you want to fix? (e.g., 17): " NUM_COMMITS

if [ -z "$NUM_COMMITS" ]; then
    echo "No number provided. Exiting."
    exit 1
fi

echo ""
echo -e "${YELLOW}This will rewrite the last $NUM_COMMITS commits.${NC}"
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create a temporary file with the proper commit messages
cat > /tmp/scriptscope_commits.txt << 'EOF'
feat: Add React application entry point
feat: Implement main SidePanel component with layout orchestration
feat: Add IssuesDrawer component for security findings display
feat: Implement CodeMirror-based code viewer with prettify support
feat: Add FileList component with first-party/third-party grouping
feat: Add TopBar component with scan and export functionality
feat: Implement useScriptDiscovery hook for script detection
feat: Add global state management with React Context API
feat: Implement Web Worker for non-blocking security analysis
feat: Add security scanner with regex patterns for vulnerability detection
feat: Implement content script for JavaScript discovery and extraction
feat: Implement background service worker for tab management and CORS handling
style: Add global styles with TailwindCSS configuration
feat: Add sidepanel HTML entry point
feat: Add Chrome Extension Manifest V3 configuration
feat: Initialize project with package.json and build configuration
docs: Add comprehensive README with installation and usage instructions
EOF

# Interactive rebase to edit commit messages
echo ""
echo -e "${BLUE}Starting interactive rebase...${NC}"
echo "In the editor that opens:"
echo "  1. The word 'pick' will appear before each commit"
echo "  2. Change 'pick' to 'reword' (or just 'r') for each commit"
echo "  3. Save and close"
echo "  4. Then you'll be able to edit each commit message"
echo ""
read -p "Press Enter to continue..."

GIT_SEQUENCE_EDITOR="sed -i 's/^pick/reword/g'" git rebase -i HEAD~$NUM_COMMITS

echo ""
echo -e "${GREEN}✓ Commit messages fixed!${NC}"
echo ""
echo "New commit history:"
git log --oneline -20
