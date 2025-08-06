# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Chrome Extension Development
```bash
# Load extension in developer mode
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select this directory

# Reload extension after changes
# Click reload button in chrome://extensions/ or use Ctrl+R in extension popup

# View extension logs
# Check Chrome DevTools Console in:
# - Background script: chrome://extensions/ > "service worker" link
# - Popup: Right-click popup > "Inspect"
# - Content script: F12 on any webpage > Console
```

### Setup Requirements
```bash
# Before testing, configure OAuth:
# 1. Go to Google Cloud Console (https://console.cloud.google.com/)
# 2. Create new project and enable Google Calendar API
# 3. Create OAuth 2.0 client ID for Chrome extension
# 4. Add client_id to manifest.json oauth2 section
# 5. Reload extension in chrome://extensions/

# Test extension functionality:
# 1. Set Gemini API key in options page (chrome-extension://[id]/options.html)
# 2. Authenticate Google Calendar in options (after OAuth setup)
# 3. Copy text with schedule info to clipboard
# 4. Click extension icon to test popup
# 5. Right-click selected text to test context menu
```

## Architecture Overview

### Core Components
- **Service Worker (`background.js`)**: Central hub containing all API integrations (Gemini AI + Google Calendar), message routing, and OAuth management
- **Content Scripts**: Injected into all web pages for context menu functionality and page interaction
- **Popup Interface**: Primary user interaction point for clipboard-based schedule registration
- **Options Page**: Settings management for API keys and authentication

### Data Flow Architecture
```
Clipboard Text → Popup → Background Service Worker → AI Analysis → Calendar Creation
     ↓
Selected Text → Content Script → Background Service Worker → AI Analysis → Calendar Creation
```

### Key Integrations

#### Authentication Flow
- **Chrome Identity API**: Handles Google OAuth without client_secret requirements
- **Token Management**: Automatic refresh using `chrome.identity.getAuthToken()`
- **Storage**: Secure token storage in `chrome.storage.local`

#### AI Processing Pipeline
1. **Text Input**: Clipboard or selected text
2. **Gemini API**: Natural language processing for schedule extraction
3. **JSON Parsing**: Robust extraction from AI responses with multiple fallback strategies
4. **Data Validation**: Email validation, date parsing, attendee filtering

#### Calendar Integration
- **Google Calendar API**: Event CRUD operations
- **Timezone Handling**: Asia/Seoul timezone for Korean users
- **Duplicate Detection**: Prevents duplicate events based on title and time range
- **Event Formatting**: Description improvement and attendee email validation

### Message Communication
Background script handles all API calls and communicates with UI components via:
```javascript
chrome.runtime.sendMessage({
    action: 'createCalendarEvent',
    text: selectedText,
    source: 'clipboard|selection'
})
```

### Error Handling Strategy
- **Graceful Degradation**: Fallback to basic event creation if AI parsing fails
- **User Feedback**: Clear error messages with retry options
- **Robust JSON Parsing**: Multiple extraction strategies for AI responses
- **Token Recovery**: Automatic token refresh with user notification on auth failure

### Extension-Specific Considerations
- **Manifest v3**: Uses service workers instead of background pages
- **Content Security Policy**: Inline styles allowed, external scripts blocked
- **Permission Model**: Minimal permissions with clear justification
- **Chrome APIs**: Heavy use of identity, storage, contextMenus APIs

### Korean Language Support
- **UI Text**: Bilingual Korean/English interface
- **Time Parsing**: Korean natural language time expressions ("내일 오후 3시")
- **Calendar Formatting**: Korean date/time formatting for Asia/Seoul timezone

## File Structure Notes

### Critical Files
- `background.js`: Contains all integrated functionality - modify this for API changes
- `manifest.json`: Extension configuration - update permissions/OAuth here
- `popup.js`: Primary UI logic - clipboard integration and user interaction
- `options.js`: Settings management - API key testing and authentication

### Utility Modules
- `llm-utils.js`: Gemini API classes for content script use (currently unused but available)
- `calendar-utils.js`: Google Calendar utilities for content scripts (currently unused but available)
- `content-script.js`: Web page interaction and context menu handling

The extension uses a centralized architecture where `background.js` contains all major functionality, with other files serving as interfaces and utilities. This design ensures consistent behavior and simplified debugging.