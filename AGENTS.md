# Project Guidelines for Agents

This document provides instructions and context for AI agents working on this repository.

## Directory Structure
```
.
├── AGENTS.md           # This file
├── data.js             # Source of truth for navigation data
├── deploy.sh           # Deployment script (build + git push)
├── index.html          # Main entry point (template for build)
├── script.js           # Frontend logic (admin mode, rendering)
├── styles.css          # Global styles
└── scripts/
    └── build.js        # Static site generator script
```

## Project Overview
This is a static navigation website.
- **Core Logic**: Vanilla JavaScript (`script.js`).
- **Data Source**: `data.js` (contains the navigation links and categories).
- **Styling**: `styles.css`.
- **Build System**: A custom Node.js script (`scripts/build.js`) injects data into `index.html`.

## Application Architecture

### Frontend (`script.js`)
The application is a single-page navigation site with a sidebar and main content area.
- **State Management**:
  - `appData`: Holds the navigation data (categories and items).
  - `adminMode`: Boolean flag to toggle edit features.
  - `localData`: Data is persisted in `localStorage` ('myNavData') to allow runtime edits.
- **Admin Mode**:
  - Toggled via a hidden or specific UI element (`#toggle-admin`).
  - Allows adding, editing, and deleting categories and items directly in the browser.
  - Changes are saved to `localStorage`.
  - **Export**: Users can export the modified data to JSON, which can then be manually pasted back into `data.js` to make changes permanent.

### Data Flow
1.  **Initial Load**: Tries to load from `localStorage`. If empty, loads from the static `navData` object defined in `data.js`.
2.  **Runtime**: User interactions (filtering, clicking) are handled by DOM event listeners.
3.  **Persistance**: Edits in Admin Mode are saved to `localStorage`.

## Build, Test, and Deploy

### Build
To generate the static HTML content (injecting `data.js` into `index.html`):
```bash
node scripts/build.js
```
This script reads `data.js`, generates HTML for the sidebar and main content, and replaces the placeholders in `index.html`.

### Test
There are currently no automated unit tests.
- **Manual Testing**: Open `index.html` in a browser to verify changes.
- **Build Verification**: Run `node scripts/build.js` to ensure the build process doesn't throw errors.

### Deploy
To build, commit, and push changes:
```bash
./deploy.sh "optional commit message"
```
If no message is provided, a default timestamped message is used.

## Code Style & Conventions

### JavaScript (`script.js`, `scripts/build.js`)
- **Version**: ES6+.
- **Indentation**: 4 spaces.
- **Semicolons**: Always use semicolons.
- **Quotes**: Prefer single quotes (`'`) for strings, unless using template literals (backticks).
- **Variables**: Use `const` and `let`. Avoid `var`.
- **Naming**:
  - Variables/Functions: `camelCase` (e.g., `navData`, `renderSidebar`).
  - Constants (global config): `UPPER_SNAKE_CASE` (if any).
- **Error Handling**: Use `try...catch` blocks for operations that might fail (file I/O, JSON parsing).

### Data (`data.js`)
- This file exports a `navData` array.
- Structure:
  ```javascript
  const navData = [
      {
          category: "Category Name",
          icon: "icon-class",
          items: [ ... ]
      }
  ];
  ```
- **Note**: The build script strictly expects `const navData = ...` to parse it. Do not change this declaration style.

### HTML (`index.html`)
- Contains comment placeholders for the build script:
  - `<!-- SIDEBAR_START -->` ... `<!-- SIDEBAR_END -->`
  - `<!-- CONTENT_START -->` ... `<!-- CONTENT_END -->`
- Do not remove or alter these comments unless modifying the build logic.

### CSS (`styles.css`)
- Standard CSS.
- Use kebab-case for class names (e.g., `.nav-item`, `.card-grid`).

## Development Workflow
1.  **Modify Data**: Edit `data.js` to add/remove links or categories.
2.  **Modify Logic**: Edit `script.js` for frontend interactivity.
3.  **Modify Build**: Edit `scripts/build.js` if changing how HTML is generated.
4.  **Preview**: Run `node scripts/build.js` and open `index.html`.
5.  **Commit**: Use `./deploy.sh` or standard git commands.

## Important Notes for Agents
- **Language**: All communication, explanations, and commit messages provided by the agent must be in **Simplified Chinese (简体中文)**.
- **File System**: Always use absolute paths when using tools.
- **Safety**: When modifying `scripts/build.js`, ensure you don't break the regex replacement logic for `index.html`.
- **Dependencies**: The project depends on Node.js for the build script but uses standard libraries (`fs`, `path`). No `npm install` is typically required as there is no `package.json` with external dependencies.
