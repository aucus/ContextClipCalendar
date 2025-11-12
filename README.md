# ContextClipCalendar 📅

[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-v3-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.1.0-orange.svg)](manifest.json)

> AI-powered smart calendar registration Chrome extension  
> AI 기반 스마트 일정 등록 Chrome 확장 프로그램

## 🌟 Key Features

- **Clipboard Text Analysis**: AI analyzes copied text to extract schedule information
- **Google Calendar Integration**: Automatically registers extracted information to Google Calendar
- **Natural Language Processing**: Recognizes natural expressions like "meeting tomorrow at 3 PM" or "내일 오후 3시 회의"
- **Multi-language Support**: Supports both English and Korean input text
- **Duplicate Prevention**: Automatically detects and prevents duplicate events
- **Auto Attendee Addition**: Automatically adds email addresses as attendees
- **Context Menu**: Right-click on selected text to register schedule
- **Multiple AI Models**: Supports Gemini, Claude, and ChatGPT for schedule extraction

## 🚀 Installation

### Install in Developer Mode

1. **Clone repository**
   ```bash
   git clone https://github.com/aucus/ContextClipCalendar.git
   cd ContextClipCalendar
   ```

2. **Load extension in Chrome**
   - Open `chrome://extensions/` in Chrome
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

3. **Configure API keys**
   - Click the extension icon → Settings
   - Enter API key (Gemini, Claude, or ChatGPT)
   - Complete Google Calendar authentication

### API Key Setup

#### Gemini API (Google AI)
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key" button
4. Create a new API key or select an existing one
5. Paste the generated API key into the extension settings

#### Claude API (Anthropic)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and sign in
3. Navigate to the "API Keys" section
4. Click "Create Key" to generate a new API key
5. Paste the generated API key into the extension settings

#### ChatGPT API (OpenAI)
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and sign in
3. Navigate to the "API Keys" section
4. Click "Create new secret key" button
5. Paste the generated API key into the extension settings

#### Google Calendar API
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 Client ID
5. Update `oauth2.client_id` in `manifest.json`

## 📖 Usage

### Basic Usage

1. **Copy text**
   ```
   Meeting tomorrow at 3 PM
   Attendees: john@company.com, jane@company.com
   Location: Conference Room A
   ```

2. **Click extension icon**
   - Copied text is automatically analyzed
   - Schedule information is extracted and displayed

3. **Register schedule**
   - Click "📅 Add to Calendar" button
   - Automatically registered to Google Calendar

### Advanced Features

#### Using Context Menu
- Select text on a webpage
- Right-click → "Add to Calendar"

#### Settings Management
- Extension icon → Settings
- Manage API keys
- Check Google Calendar authentication status

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Background      │    │  Content Script │
│   (popup.js)    │◄──►│  (background.js) │◄──►│  (content-*.js) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Clipboard      │    │   AI APIs        │    │  Web Page       │
│  Integration    │    │   (Analysis)     │    │  Interaction    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Google Calendar │
                       │      API        │
                       └─────────────────┘
```

### Core Components

- **`background.js`**: Main service worker, AI and Calendar API integration
- **`popup.js`**: User interface and clipboard integration
- **`llm-utils.js`**: AI API utilities (Gemini, Claude, ChatGPT)
- **`calendar-utils.js`**: Google Calendar API utilities
- **`content-script.js`**: Web page interaction
- **`sidepanel.js`**: Side panel for editing schedule details

## 🔧 Development Setup

### Requirements
- Chrome browser (latest version)
- Google Cloud Console account
- AI API account (Gemini, Claude, or ChatGPT)

### Development Commands

```bash
# Reload extension
# In Chrome: chrome://extensions/ → Click reload button

# View logs
# - Background script: chrome://extensions/ → "service worker" link
# - Popup: Right-click → "Inspect"
# - Content script: F12 → Console
```

## 📁 File Structure

```
ContextClipCalendar/
├── manifest.json          # Extension configuration
├── background.js          # Main service worker
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── options.html          # Settings page
├── options.js            # Settings logic
├── sidepanel.html        # Side panel UI
├── sidepanel.js          # Side panel logic
├── content-script.js     # Content script
├── llm-utils.js          # AI API utilities
├── calendar-utils.js     # Calendar API utilities
├── _locales/             # Internationalization
│   ├── en/
│   │   └── messages.json # English translations
│   └── ko/
│       └── messages.json # Korean translations
├── icons/                # Icon files
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🛠️ Tech Stack

- **Chrome Extension Manifest v3**
- **AI APIs**: Gemini (Google), Claude (Anthropic), ChatGPT (OpenAI)
- **Google Calendar API** (Calendar management)
- **Chrome Identity API** (OAuth authentication)
- **Chrome Storage API** (Settings storage)
- **Chrome Context Menus API** (Right-click menu)
- **Chrome i18n API** (Internationalization)

## 🌍 Internationalization

The extension supports multiple languages:
- **Default Language**: English
- **Supported Languages**: English, Korean
- **Auto-detection**: Automatically detects browser language
- **Input Language**: Supports both English and Korean text input

## 🔒 Security

- **Principle of Least Privilege**: Only requests necessary permissions
- **OAuth 2.0**: Secure Google API authentication
- **Local Storage**: Sensitive information stored locally only
- **CSP**: Content Security Policy applied

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Code style: Follow ESLint rules
- Commit messages: Write clearly in English or Korean
- Testing: Include test code when adding new features
- Internationalization: Use `chrome.i18n.getMessage()` for all user-facing strings

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 Acknowledgments

- **Google AI Studio**: Gemini API
- **Anthropic**: Claude API
- **OpenAI**: ChatGPT API
- **Google Calendar API**: Calendar management functionality
- **Chrome Extensions**: Extension development platform

## 📞 Support

- **Issue Reports**: [GitHub Issues](https://github.com/aucus/ContextClipCalendar/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/aucus/ContextClipCalendar/discussions)
- **Documentation**: [Wiki](https://github.com/aucus/ContextClipCalendar/wiki)
- **Privacy Policy**: [Privacy Policy](https://github.com/aucus/ContextClipCalendar/blob/main/PRIVACY_POLICY.md)

---

**⭐ If this project helped you, please give it a star!**  
**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**
