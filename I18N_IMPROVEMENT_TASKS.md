# Internationalization (i18n) Improvement Tasks

**Goal**: Make ContextClipCalendar fully usable for English-speaking users  
**Default Language**: English  
**Status**: In Progress

---

## High Priority Tasks

### 1. Manifest & Core Configuration
- [x] Update `manifest.json` description to English
- [x] Add `default_locale` field to manifest.json
- [x] Create `_locales/en/messages.json` for English translations
- [x] Create `_locales/ko/messages.json` for Korean translations (backward compatibility)

### 2. Context Menu
- [x] Update context menu title from "📅 일정 등록" to "📅 Add to Calendar" (English)
- [x] Implement dynamic context menu based on browser language
- [x] Add i18n support for context menu items

### 3. Popup UI (popup.html/js)
- [x] Translate header subtitle: "AI 기반 스마트 일정 등록" → "AI-powered Smart Calendar Registration"
- [x] Translate "선택된 텍스트" → "Selected Text"
- [x] Translate "클립보드에서 일정 텍스트 가져오기" → "Get Schedule Text from Clipboard"
- [x] Translate "일정으로 등록할 텍스트를 복사한 후..." → "Copy the text you want to register as a schedule..."
- [x] Translate "📋 클립보드에서 가져오기" → "📋 Get from Clipboard"
- [x] Translate "📅 일정 등록" → "📅 Add to Calendar"
- [x] Translate "일정을 처리하고 있습니다..." → "Processing schedule..."
- [x] Translate "성공!" → "Success!"
- [x] Translate "캘린더에서 보기" → "View in Calendar"
- [x] Translate "새 일정 등록" → "Add New Schedule"
- [x] Translate "⚙️ 설정" → "⚙️ Settings"
- [x] Translate permission-related messages
- [x] Translate error messages in popup.js

### 4. Options Page (options.html/js)
- [x] Translate page title: "ContextClipCalendar 설정" → "ContextClipCalendar Settings"
- [x] Translate "AI 기반 스마트 일정 등록을 위한 설정을 관리하세요" → "Manage settings for AI-powered smart calendar registration"
- [x] Translate "🤖 AI 모델 선택" → "🤖 AI Model Selection"
- [x] Translate "기본 AI 모델" → "Default AI Model"
- [x] Translate "일정 정보 추출에 사용할 AI 모델을 선택하세요" → "Select the AI model to use for schedule information extraction"
- [x] Translate model descriptions (Gemini, Claude, ChatGPT)
- [x] Translate "🔑 API 키 설정" → "🔑 API Key Settings"
- [x] Translate API key input labels and help text
- [x] Translate "테스트" → "Test"
- [x] Translate "API 키 저장" → "Save API Keys"
- [x] Translate "💡 API 키 발급 방법" → "💡 How to Get API Keys"
- [x] Translate API key guide steps
- [x] Translate "🗓️ Google Calendar 연동" → "🗓️ Google Calendar Integration"
- [x] Translate OAuth status messages
- [x] Translate "Google 계정 인증" → "Authenticate Google Account"
- [x] Translate "인증 해제" → "Revoke Authentication"
- [x] Translate "📖 사용 가이드" → "📖 User Guide"
- [x] Translate usage guide content
- [x] Translate all status messages (success, error, warning)

### 5. Side Panel (sidepanel.html/js)
- [x] Translate page title: "일정 편집" → "Edit Schedule"
- [x] Translate "일정 정보를 분석하고 있습니다..." → "Analyzing schedule information..."
- [x] Translate "취소" → "Cancel"
- [x] Translate "저장" → "Save"
- [x] Translate "저장 중..." → "Saving..."
- [x] Translate "📝 기본 정보" → "📝 Basic Information"
- [x] Translate "일정 제목 *" → "Event Title *"
- [x] Translate "일정 제목을 입력하세요" → "Enter event title"
- [x] Translate "설명" → "Description"
- [x] Translate "일정에 대한 설명을 입력하세요" → "Enter description for the event"
- [x] Translate "🕐 날짜 및 시간" → "🕐 Date & Time"
- [x] Translate "종일" → "All Day"
- [x] Translate "시작" → "Start"
- [x] Translate "종료" → "End"
- [x] Translate "반복" → "Recurrence"
- [x] Translate recurrence options (반복 없음, 매일, 매주, etc.)
- [x] Translate "📍 장소 및 참석자" → "📍 Location & Attendees"
- [x] Translate "장소" → "Location"
- [x] Translate location placeholder text
- [x] Translate "참석자" → "Attendees"
- [x] Translate attendee input placeholder
- [x] Translate "🔔 알림 설정" → "🔔 Notification Settings"
- [x] Translate "알림" → "Reminder"
- [x] Translate reminder options
- [x] Translate "닫기" → "Close"
- [x] Translate "📅 캘린더 이동" → "📅 Go to Calendar"
- [x] Translate all error messages
- [x] Translate "일정이 성공적으로 등록되었습니다!" → "Schedule successfully registered!"

### 6. Error Messages & Notifications
- [x] Translate "일정 처리 중 오류가 발생했습니다" → "An error occurred while processing the schedule"
- [x] Translate "일정 정보를 추출할 수 없습니다" → "Unable to extract schedule information"
- [x] Translate "제공된 텍스트에서 일정 정보를 추출할 수 없습니다" → "Unable to extract schedule information from the provided text"
- [x] Translate "사이드 패널에 데이터를 전달하는 중 오류가 발생했습니다" → "An error occurred while sending data to the side panel"
- [x] Translate "사이드 패널을 여는 중 오류가 발생했습니다" → "An error occurred while opening the side panel"
- [x] Translate "추출 실패" → "Extraction Failed"
- [x] Translate "다시 시도" → "Retry"
- [x] Translate "클립보드 접근 권한 필요" → "Clipboard Access Permission Required"
- [x] Translate "권한 거부됨" → "Permission Denied"
- [x] Translate "권한 허용" → "Allow Permission"
- [x] Translate content-script.js notification messages
- [x] Translate "일정이 성공적으로 등록되었습니다!" → "Schedule successfully registered!"
- [x] Translate "일정 등록 중 오류가 발생했습니다" → "An error occurred while registering the schedule"
- [x] Translate "텍스트를 먼저 선택해주세요" → "Please select text first"

---

## Medium Priority Tasks

### 7. AI Prompts (llm-utils.js, background.js)
- [x] Create English version of calendar extraction prompt
- [x] Detect input language and use appropriate prompt
- [x] Update prompt to support both Korean and English natural language
- [x] Translate prompt error messages
- [x] Update JSON schema examples in prompts to English
- [x] Ensure AI responses are language-agnostic

### 8. Date/Time Parsing (calendar-utils.js)
- [x] Add English time expressions: "today", "tomorrow", "next week", "Monday", etc.
- [x] Support both "AM/PM" and 24-hour format
- [x] Support English day names (Monday, Tuesday, etc.)
- [x] Support relative dates in English ("in 2 days", "next Monday", etc.)
- [x] Keep Korean support for backward compatibility
- [x] Detect language of time expression and parse accordingly

### 9. Locale & Timezone Handling
- [x] Detect browser locale instead of hardcoding 'ko-KR'
- [x] Use `navigator.language` for date/time formatting
- [x] Detect user timezone instead of hardcoding 'Asia/Seoul'
- [x] Use `Intl.DateTimeFormat` with detected locale
- [x] Update `formatDisplayDate()` to use detected locale
- [x] Update `formatDisplayTime()` to use detected locale
- [x] Update calendar event timezone based on user location

### 10. Content Script Messages
- [x] Translate "일정이 성공적으로 등록되었습니다!" → "Schedule successfully registered!"
- [x] Translate "일정 등록 중 오류가 발생했습니다" → "An error occurred while registering the schedule"
- [x] Translate "텍스트를 먼저 선택해주세요" → "Please select text first"

---

## Low Priority Tasks

### 11. Documentation & Help Text
- [x] Translate usage guide in options.html
- [x] Translate API key guide steps
- [x] Translate help tooltips (already translated via data-i18n)
- [x] Update README.md with English-first approach
- [ ] Add language selection option in settings (future enhancement)

### 12. Code Comments
- [x] Review and translate critical code comments to English
- [x] Keep Korean comments for Korean-specific logic (time parsing examples)
- [x] Add JSDoc comments in English (added for main classes and functions)

---

## Implementation Strategy

### Phase 1: Chrome i18n API Setup ✅
1. ✅ Create `_locales/en/messages.json` with all English strings
2. ✅ Create `_locales/ko/messages.json` with all Korean strings
3. ✅ Update manifest.json to use `chrome.i18n.getMessage()`
4. ✅ Set default locale to English

### Phase 2: UI Translation ✅
1. ✅ Replace all hardcoded Korean strings in HTML files
2. ✅ Replace all hardcoded Korean strings in JS files
3. ✅ Use `chrome.i18n.getMessage()` for dynamic strings
4. [ ] Test all UI elements in both languages (pending manual testing)

### Phase 3: Logic Updates ✅
1. ✅ Update AI prompts to support English
2. ✅ Update date/time parsing for English
3. ✅ Update locale/timezone detection
4. [ ] Test with English input text (pending manual testing)

### Phase 4: Testing & Refinement
1. Test with English browser language
2. Test with Korean browser language
3. Test mixed language scenarios
4. Fix any remaining issues

---

## Notes

- **Default Language**: English (as requested)
- **Backward Compatibility**: Korean support will be maintained
- **Browser Language Detection**: Will use `navigator.language` for automatic language selection
- **Manual Override**: Future enhancement - add language selector in settings

---

## Progress Tracking

**Total Tasks**: ~100+  
**Completed**: ~98+ (Phase 1 + Phase 2 + Phase 3 + Documentation + Code Comments + Console Messages + README + JSDoc)  
**In Progress**: Manual testing  
**Remaining**: ~2+ (language selection option - future enhancement, manual testing)

**Last Updated**: 2025-01-27

## Completed Sections
- ✅ Phase 1: Chrome i18n API Setup
- ✅ Context Menu
- ✅ Popup UI (popup.html/js)
- ✅ Options Page (options.html/js) - Major UI elements
- ✅ Side Panel (sidepanel.html/js)
- ✅ Content Script Messages
- ✅ Error Messages & Notifications
- ✅ Locale & Timezone Handling
- ✅ AI Prompts (llm-utils.js, background.js) - All LLM classes
- ✅ Date/Time Parsing - English expressions support
- ✅ API Key Guide Steps - All providers (Gemini, Claude, ChatGPT)
- ✅ Usage Guide Content - Complete translation
- ✅ Code Comments - Critical comments translated to English
- ✅ README.md - Updated with English-first approach
- ✅ JSDoc Comments - Added for main classes and functions

