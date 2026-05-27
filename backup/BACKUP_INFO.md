# MOTO CHART — 백업 정보

## 📅 최신 백업 일시
**2026년 5월 21일** (세션 4차 백업)

---

## 📁 백업 파일 목록

| 파일 경로 | 설명 |
|-----------|------|
| `backup/index.html` | 메인 HTML (51,662 bytes) |
| `backup/css/style.css` | 전체 스타일시트 (2,052줄) |
| `backup/js/app.js` | 메인 앱 로직 (2,661줄) |
| `backup/js/charts.js` | Chart.js 렌더링 함수 |
| `backup/js/data.js` | API fetch·집계 함수 |
| `backup/README.md` | 프로젝트 문서 |

---

## 🔄 이번 백업의 주요 변경 내역 (세션 4)

### 1. 이용약관 [보기] 버튼 — Native 시트 모달 구현
- `index.html`: `<a href="#">보기</a>` → `<button type="button" class="terms-view-btn" onclick="openTermsSheet('terms')">보기</button>` 교체
- `index.html`: `<a href="#">보기</a>` → `<button type="button" class="terms-view-btn" onclick="openTermsSheet('privacy')">보기</button>` 교체
- `index.html`: `#termsSheetOverlay` 약관 시트 모달 HTML 전체 추가 (헤더 고정 + 스크롤 본문 + X 닫기 버튼)
- `css/style.css`: `.terms-view-btn` (빨간 pill 버튼), `.terms-sheet`, `.terms-sheet-header`, `.terms-sheet-body`, `.terms-section*`, `.terms-effective-date`, `.terms-company` 스타일 추가 (~130줄)
- `js/app.js`: `TERMS_CONTENT` 객체 (이용약관 8조 + 개인정보처리방침 8조 전문 텍스트 내장)
- `js/app.js`: `openTermsSheet(type)` 함수 신규 추가 (동적 HTML 렌더링 후 overlay 오픈)
- `js/app.js`: `closeTermsSheet()` 함수 신규 추가 (overlay에서 open 클래스 제거)

### 2. 이용약관 전문 (8조)
- 제1조 목적, 제2조 이용허락 범위 (Apple Standard EULA 준거), 제3조 서비스 제공 및 변경
- 제4조 이용자 의무, 제5조 이용 제한, 제6조 면책 조항, 제7조 분쟁 해결, 제8조 약관 효력 및 변경
- 시행일: 2026년 5월 21일

### 3. 개인정보처리방침 전문 (8조)
- 제1조 처리 목적, 제2조 수집 항목, 제3조 보유 기간, 제4조 제3자 제공
- 제5조 처리 위탁 (Genspark AI), 제6조 이용자 권리, 제7조 보호책임자 ((주)엠스토리 / motorcyclestory19@gmail.com)
- 제8조 안전성 확보 조치 (비밀번호 암호화, 접근 권한 관리, 보안 프로그램)
- 공고 및 시행일: 2026년 5월 21일

---

## 📋 이전 세션 변경 내역 (세션 1~3)

### 세션 3 — 이미지 생성
- 로고 클릭 랜딩 바텀시트 목업 이미지 (fal-ai/flux-2-pro)
- 회원가입 Step 1 정보입력 폼 목업 이미지 (nano-banana-pro, 9:16, 2K)
- 회원가입 Step 2 이메일 인증코드 입력 목업 이미지 (nano-banana-pro, 9:16, 2K)

### 세션 2 — 로고 클릭 전용 랜딩 바텀시트
- `index.html` `#logoSheetOverlay` 바텀시트 HTML (비로그인/로그인 분기)
- `css/style.css` `.logo-landing-sheet`, `.lls-*` 스타일 (~110줄)
- `js/app.js` `openLogoSheet()`, `closeLogoSheet()` 신규

### 세션 1 — 로고 클릭 → 회원가입 + 홈 이동
- `index.html` 로고에 `onclick="onLogoClick()"` 추가
- `js/app.js` `onLogoClick()`, `verifyEmailCode()` 가입 완료 후 홈 이동
- `css/style.css` `.logo-wrap` 클릭 커서 스타일

---

## ⚙️ 기술 스택

- HTML5 / CSS3 / Vanilla JS (ES6+)
- Chart.js (차트 렌더링)
- XLSX.js (엑셀 파일 파싱)
- Font Awesome 6.4.0 (아이콘)
- Noto Sans KR (폰트)
- Genspark RESTful Table API (`tables/registrations`, `tables/upload_history`)

---

## 🚦 빌드 상태

- **PlaywrightConsoleCapture 검증**: ✅ 콘솔 오류 0건 (로드 10.46초)
- **JS 오류**: 없음
- **외부 URL 호출 (약관)**: ❌ 없음 — 모든 약관 텍스트는 JS 객체로 내장, Native UI 렌더링
