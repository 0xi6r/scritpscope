#!/bin/bash

# ScriptScope - Git Commit Script
# This script commits the entire ScriptScope Chrome Extension project

set -e  # Exit on any error

echo "🚀 Starting Git commits for ScriptScope Chrome Extension..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to commit with message
commit_with_message() {
    local message="$1"
    shift
    local files=("$@")

    echo -e "${BLUE}Committing:${NC} $message"
    git add "${files[@]}"
    git commit -m "$message"
    echo -e "${GREEN}✓ Committed${NC}"
    echo ""
}

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    echo ""
fi

# 1. Project Configuration Files
commit_with_message "feat: Initialize project with package.json and build configuration" \
    package.json \
    vite.config.ts \
    tailwind.config.js \
    postcss.config.js \
    .gitignore

# 2. Manifest and Extension Setup
commit_with_message "feat: Add Chrome Extension Manifest V3 configuration" \
    manifest.json

# 3. HTML Entry Points
commit_with_message "feat: Add sidepanel HTML entry point" \
    sidepanel.html

# 4. Global Styles
commit_with_message "style: Add global styles with TailwindCSS configuration" \
    src/styles/index.css

# 5. Background Service Worker
commit_with_message "feat: Implement background service worker for tab management and CORS handling" \
    src/background/index.js

# 6. Content Script
commit_with_message "feat: Implement content script for JavaScript discovery and extraction" \
    src/content/index.js

# 7. Security Scanner Utilities
commit_with_message "feat: Add security scanner with regex patterns for vulnerability detection" \
    src/utils/scanner.js

commit_with_message "feat: Implement Web Worker for non-blocking security analysis" \
    src/utils/scanner.worker.js

# 8. React Context
commit_with_message "feat: Add global state management with React Context API" \
    src/context/AppContext.jsx

# 9. Custom Hooks
commit_with_message "feat: Implement useScriptDiscovery hook for script detection" \
    src/sidepanel/hooks/useScriptDiscovery.js

# 10. UI Components - TopBar
commit_with_message "feat: Add TopBar component with scan and export functionality" \
    src/sidepanel/components/TopBar.jsx

# 11. UI Components - FileList
commit_with_message "feat: Add FileList component with first-party/third-party grouping" \
    src/sidepanel/components/FileList.jsx

# 12. UI Components - CodeViewer
commit_with_message "feat: Implement CodeMirror-based code viewer with prettify support" \
    src/sidepanel/components/CodeViewer.jsx

# 13. UI Components - IssuesDrawer
commit_with_message "feat: Add IssuesDrawer component for security findings display" \
    src/sidepanel/components/IssuesDrawer.jsx

# 14. Main SidePanel Component
commit_with_message "feat: Implement main SidePanel component with layout orchestration" \
    src/sidepanel/SidePanel.jsx

# 15. React Entry Point
commit_with_message "feat: Add React application entry point" \
    src/sidepanel/main.jsx

# 16. Documentation
commit_with_message "docs: Add comprehensive README with installation and usage instructions" \
    README.md

# 17. Icons (if they exist)
if [ -d "public/icons" ]; then
    commit_with_message "assets: Add extension icons" \
        public/icons/
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All commits completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

# Ask if user wants to push
read -p "Do you want to push to GitHub now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📡 Checking for remote repository..."

    # Check if remote exists
    if git remote | grep -q 'origin'; then
        echo "Remote 'origin' found. Pushing to GitHub..."
        git push -u origin main || git push -u origin master
        echo ""
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"
    else
        echo ""
        echo "⚠️  No remote repository found."
        echo "Please add a remote repository first:"
        echo ""
        echo "  git remote add origin https://github.com/yourusername/scriptscope.git"
        echo ""
        echo "Then run:"
        echo "  git push -u origin main"
    fi
else
    echo ""
    echo "Skipping push. You can push later with:"
    echo "  git push -u origin main"
fi

echo ""
echo "🎉 ScriptScope project successfully committed!"
echo ""
