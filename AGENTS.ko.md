# 저장소 가이드라인

## 프로젝트 구조 및 모듈 구성
- 루트 기반 Chrome 확장(Manifest v3).
- 핵심 파일: `manifest.json`, `background.js`, `popup.html/js`, `options.html/js`, `content-script.js`.
- 유틸리티: `calendar-utils.js`(캘린더), `llm-utils.js`(Gemini).
- 에셋: `icons/` 및 스토어용 스크린샷. 별도의 `src/` 폴더 없음.

## 빌드, 테스트, 개발 명령
- 로드 방법: `chrome://extensions` → 개발자 모드 → "압축해제된 확장 프로그램 로드" → 저장소 루트 선택.
- 리로드/로그: 확장 페이지의 "리로드" 사용. 백그라운드 로그는 "서비스 워커" 링크, 팝업/옵션은 DevTools에서 확인.
- Node 스크립트: 별도 빌드 없음, 테스트 미구성. 합의 없이 빌드 체인 추가 금지.

## 코딩 스타일 및 네이밍 규칙
- 언어: 모던 JavaScript(ES2020+), MV3 API 사용.
- 들여쓰기 4칸, 세미콜론 필수, 작은따옴표 `'` 선호.
- 파일명: 케밥 케이스(`popup.js`, `calendar-utils.js`).
- 네이밍: 변수/함수 `camelCase`, 클래스 `PascalCase`, 상수 `UPPER_SNAKE_CASE`.
- 기존 파일 내 모듈화 유지, 작고 순수한 함수 선호.

## 테스트 가이드라인
- 현재: Chrome 수동 테스트. 클립보드 흐름, 컨텍스트 메뉴, OAuth, 이벤트 생성, 오류 상태를 검증.
- 자동 테스트 추가 시: `tests/`에 `*.spec.js`. 최소 도구(예: `vitest`)는 논의 후 채택.
- PR에는 재현 절차와 UI 변경 스크린샷/GIF 포함.

## 커밋 및 PR 가이드
- 커밋 스타일: Conventional Commits(`feat:`, `fix:`, `chore:`). 한/영 허용.
- PR 필수 항목: 변경 요약, 범위, 연결된 이슈, 스크린샷(UI), 테스트 절차, `manifest.json` 변경사항 명시.
- 변경 범위는 좁게 유지, 불필요한 포맷 변경 지양.

## 보안 및 설정 팁
- 비밀값 커밋 금지. API 키는 확장 UI로 입력. OAuth `client_id`는 `manifest.json`에 위치 — 변경 전 사전 조율.
- Chrome 권한은 최소로 요청, 변경 시 README에 기록.

## 에이전트 전용 지침
- 번들러/새 의존성 무단 도입 금지. 현 구조 준수.
- `manifest.json` 수정 시 MV3 규격 검증, 배포 시 `version` 갱신.
- UX, 권한, 설정 흐름이 바뀌면 README 업데이트.
