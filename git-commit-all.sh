#!/bin/bash

# ScriptScope - Proper Git Commit Script (Fixed)

set -e

echo "🔄 Resetting and recommitting with proper messages..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Ask how many commits to undo
echo "Current commits:"
git log --oneline -20
echo ""

read -p "How many commits to reset? (e.g., 17): " NUM_COMMITS

if [ -z "$NUM_COMMITS" ]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  This will reset the last $NUM_COMMITS commits but keep all files.${NC}"
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Soft reset to keep changes
git reset --soft HEAD~$NUM_COMMITS

echo -e "${GREEN}✓ Reset complete. All files are staged.${NC}"
echo ""

# Now commit properly with correct messages
commit_files() {
    local message="$1"
    shift
    local files="$@"

    echo -e "${BLUE}Committing:${NC} $message"
    git reset HEAD .  # Unstage everything first
    git add $files 2>/dev/null || true
    git commit -m "$message" --quiet
    echo -e "${GREEN}✓ Done${NC}"
}

echo "Creating new commits with proper messages..."
echo ""

# Commit in logical order
commit_files "feat: Initialize project with package.json and build configuration" \
    "package.json" "vite.config.ts" "tailwind.config.js" "postcss.config.js" ".gitignore"

commit_files "feat: Add Chrome Extension Manifest V3 configuration" \
    "manifest.json"

commit_files "feat: Add sidepanel HTML entry point" \
    "sidepanel.html"

commit_files "style: Add global styles with TailwindCSS configuration" \
    "src/styles/index.css"

commit_files "feat: Implement background service worker for tab management and CORS handling" \
    "src/background/index.js"

commit_files "feat: Implement content script for JavaScript discovery and extraction" \
    "src/content/index.js"

commit_files "feat: Add security scanner with regex patterns for vulnerability detection" \
    "src/utils/scanner.js"

commit_files "feat: Implement Web Worker for non-blocking security analysis" \
    "src/utils/scanner.worker.js"

commit_files "feat: Add global state management with React Context API" \
    "src/context/AppContext.jsx"

commit_files "feat: Implement useScriptDiscovery hook for script detection" \
    "src/sidepanel/hooks/useScriptDiscovery.js"

commit_files "feat: Add TopBar component with scan and export functionality" \
    "src/sidepanel/components/TopBar.jsx"

commit_files "feat: Add FileList component with first-party/third-party grouping" \
    "src/sidepanel/components/FileList.jsx"

commit_files "feat: Implement CodeMirror-based code viewer with prettify support" \
    "src/sidepanel/components/CodeViewer.jsx"

commit_files "feat: Add IssuesDrawer component for security findings display" \
    "src/sidepanel/components/IssuesDrawer.jsx"

commit_files "feat: Implement main SidePanel component with layout orchestration" \
    "src/sidepanel/SidePanel.jsx"

commit_files "feat: Add React application entry point" \
    "src/sidepanel/main.jsx"

commit_files "docs: Add comprehensive README with installation and usage instructions" \
    "README.md"

# Stage any remaining files
REMAINING=$(git status --porcelain | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo ""
    echo "Remaining files to commit:"
    git status --short
    echo ""
    read -p "Commit all remaining files? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "chore: Add remaining project files"
        echo -e "${GREEN}✓ Done${NC}"
    fi
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All commits recreated with proper messages!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

echo "New commit history:"
git log --oneline -20
echo ""

# Ask about force push
read -p "Force push to GitHub? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📤 Force pushing to GitHub..."

    if git push -u origin $CURRENT_BRANCH --force; then
        echo ""
        echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
    else
        echo ""
        echo -e "${YELLOW}Push failed. You can manually push later with:${NC}"
        echo "  git push -u origin $CURRENT_BRANCH --force"
    fi
fi

echo ""
echo "🎉 Done!"
