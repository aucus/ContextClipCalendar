# ContextClipCalendar 📅

[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-v3-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)](manifest.json)

> AI 기반 스마트 일정 등록 Chrome 확장 프로그램  
> AI-powered smart calendar registration Chrome extension

## 🌟 주요 기능 / Key Features

### 🇰🇷 한국어
- **클립보드 텍스트 자동 분석**: 복사한 텍스트를 AI가 분석하여 일정 정보 추출
- **Google Calendar 연동**: 추출된 정보를 자동으로 Google Calendar에 등록
- **자연어 처리**: "내일 오후 3시 회의" 같은 자연스러운 표현 인식
- **중복 일정 방지**: 기존 일정과 중복되는 경우 자동 감지
- **참석자 자동 추가**: 이메일 주소가 포함된 경우 참석자로 자동 등록
- **컨텍스트 메뉴**: 웹페이지에서 텍스트 선택 후 우클릭으로 일정 등록

### 🇺🇸 English
- **Clipboard Text Analysis**: AI analyzes copied text to extract schedule information
- **Google Calendar Integration**: Automatically registers extracted information to Google Calendar
- **Natural Language Processing**: Recognizes natural expressions like "meeting tomorrow at 3 PM"
- **Duplicate Prevention**: Automatically detects and prevents duplicate events
- **Auto Attendee Addition**: Automatically adds email addresses as attendees
- **Context Menu**: Right-click on selected text to register schedule

## 🚀 설치 방법 / Installation

### 개발자 모드로 설치 / Install in Developer Mode

1. **저장소 클론** / **Clone repository**
   ```bash
   git clone https://github.com/aucus/ContextClipCalendar.git
   cd ContextClipCalendar
   ```

2. **Chrome에서 확장 프로그램 로드** / **Load extension in Chrome**
   - Chrome에서 `chrome://extensions/` 접속
   - "개발자 모드" 활성화
   - "압축해제된 확장 프로그램을 로드합니다" 클릭
   - 프로젝트 폴더 선택

3. **API 키 설정** / **Configure API keys**
   - 확장 프로그램 아이콘 클릭 → 설정
   - Gemini API 키 입력
   - Google Calendar 인증 완료

### API 키 발급 / API Key Setup

#### Gemini API (Google AI)
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성
3. 확장 프로그램 설정에서 입력

#### Google Calendar API
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. Google Calendar API 활성화
4. OAuth 2.0 클라이언트 ID 생성
5. `manifest.json`의 `oauth2.client_id` 업데이트

## 📖 사용법 / Usage

### 기본 사용법 / Basic Usage

1. **텍스트 복사** / **Copy text**
   ```
   내일 오후 3시에 팀 미팅이 있습니다. 
   참석자: john@company.com, jane@company.com
   장소: 회의실 A
   ```

2. **확장 프로그램 클릭** / **Click extension icon**
   - 복사한 텍스트가 자동으로 분석됨
   - 일정 정보가 추출되어 표시됨

3. **일정 등록** / **Register schedule**
   - "📅 일정 등록" 버튼 클릭
   - Google Calendar에 자동 등록됨

### 고급 기능 / Advanced Features

#### 컨텍스트 메뉴 사용 / Using Context Menu
- 웹페이지에서 텍스트 선택
- 우클릭 → "일정으로 등록" 선택

#### 설정 관리 / Settings Management
- 확장 프로그램 아이콘 → 설정
- API 키 관리
- Google Calendar 인증 상태 확인

## 🏗️ 아키텍처 / Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Background      │    │  Content Script │
│   (popup.js)    │◄──►│  (background.js) │◄──►│  (content-*.js) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Clipboard      │    │   Gemini API     │    │  Web Page       │
│  Integration    │    │   (AI Analysis)  │    │  Interaction    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Google Calendar │
                       │      API        │
                       └─────────────────┘
```

### 핵심 컴포넌트 / Core Components

- **`background.js`**: 메인 서비스 워커, AI 및 캘린더 API 통합
- **`popup.js`**: 사용자 인터페이스 및 클립보드 통합
- **`llm-utils.js`**: Gemini API 유틸리티
- **`calendar-utils.js`**: Google Calendar API 유틸리티
- **`content-script.js`**: 웹페이지 상호작용

## 🔧 개발 환경 설정 / Development Setup

### 필수 요구사항 / Requirements
- Chrome 브라우저 (최신 버전)
- Google Cloud Console 계정
- Google AI Studio 계정

### 개발 명령어 / Development Commands

```bash
# 확장 프로그램 리로드
# Chrome에서 chrome://extensions/ → 리로드 버튼 클릭

# 로그 확인
# - 백그라운드 스크립트: chrome://extensions/ → "서비스 워커" 링크
# - 팝업: 우클릭 → "검사"
# - 콘텐츠 스크립트: F12 → Console
```

## 📁 파일 구조 / File Structure

```
ContextClipCalendar/
├── manifest.json          # 확장 프로그램 설정
├── background.js          # 메인 서비스 워커
├── popup.html            # 팝업 UI
├── popup.js              # 팝업 로직
├── options.html          # 설정 페이지
├── options.js            # 설정 로직
├── content-script.js     # 콘텐츠 스크립트
├── llm-utils.js          # AI API 유틸리티
├── calendar-utils.js     # 캘린더 API 유틸리티
├── icons/                # 아이콘 파일들
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # 이 파일
```

## 🛠️ 기술 스택 / Tech Stack

- **Chrome Extension Manifest v3**
- **Google Gemini API** (AI 분석)
- **Google Calendar API** (일정 관리)
- **Chrome Identity API** (OAuth 인증)
- **Chrome Storage API** (설정 저장)
- **Chrome Context Menus API** (우클릭 메뉴)

## 🔒 보안 / Security

- **최소 권한 원칙**: 필요한 권한만 요청
- **OAuth 2.0**: 안전한 Google API 인증
- **로컬 저장소**: 민감한 정보는 로컬에만 저장
- **CSP**: 콘텐츠 보안 정책 적용

## 🤝 기여하기 / Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### 개발 가이드라인 / Development Guidelines

- 코드 스타일: ESLint 규칙 준수
- 커밋 메시지: 한국어 또는 영어로 명확하게 작성
- 테스트: 새로운 기능 추가 시 테스트 코드 포함

## 📝 라이선스 / License

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 감사의 말 / Acknowledgments

- **Google AI Studio**: Gemini API 제공
- **Google Calendar API**: 일정 관리 기능
- **Chrome Extensions**: 확장 프로그램 개발 플랫폼

## 📞 지원 / Support

- **이슈 리포트**: [GitHub Issues](https://github.com/aucus/ContextClipCalendar/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/aucus/ContextClipCalendar/discussions)
- **문서**: [Wiki](https://github.com/aucus/ContextClipCalendar/wiki)
- **개인정보처리방침**: [Privacy Policy](https://github.com/aucus/ContextClipCalendar/blob/main/PRIVACY_POLICY.md)

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**  
**⭐ If this project helped you, please give it a star!** 