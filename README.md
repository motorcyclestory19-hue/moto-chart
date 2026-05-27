# MOTO CHART — Motorcycle Market Data Platform

오토바이 시장 등록대수 데이터를 시각화·분석하는 모바일 최적화 SPA(Single Page Application)입니다.

---

## 📁 파일 구조

```
index.html        메인 SPA 진입점 (5탭 구조)
css/style.css     전체 UI 스타일시트
js/app.js         메인 애플리케이션 로직 (상태관리·네비게이션·관리자기능)
js/charts.js      Chart.js 기반 차트 렌더링 함수
js/data.js        API fetch·집계 함수·fallback 샘플 데이터
backup/           전체 파일 스냅샷 (백업)
```

---

## ✅ 완료된 기능

### 📱 앱 공통
- 모바일 최적화 레이아웃 (max-width 480px)
- SPA 5탭 네비게이션: 홈 / 통계 / 분석 / 검색 / MY
- 헤더 년/월 분리 선택기 (`globalYear` + `globalMonth`)
- 스와이프 제스처로 이전 페이지 이동 (왼쪽 엣지에서 오른쪽으로)
- 데이터 업로드 완료 시 알림 생성 + 종 아이콘 미읽음 뱃지

### 🏠 홈 탭
- 이달 총 등록대수 메인 카드 (전월 대비 증감)
- KPI 3개: 브랜드 누적·수입사 수·모델 수
- 주요 통계 바로가기 (4개 숏컷)
- 홈 월별 추이 미니 차트

### 📊 통계 탭
- 수입사 TOP 10 / 모델 TOP 10 전환
- 서브탭: 월별 순위 / 누적 순위 / 증감 비교
- 모델 클릭 시 상세 모달 (미니 차트 포함)
- 결과 공유 기능 (카카오·X·페이스북·LINE·링크복사)

### 📈 분석 탭
- 배기량별 분포 도넛 차트 + 테이블
- 배기량별 추이 최근 6개월 라인 차트
- 월별 추이: 12개월·24개월·36개월 전환
- 연도별 비교 4년치 (2023~2026)
- 차트 범례 선 모양 (`pointStyle:'line'`)

### 🔍 검색 탭
- 모델명·수입사 실시간 검색
- 검색 필터: 수입사 멀티선택 + 등록대수 최솟값
- 활성 필터 태그 표시

### 👤 MY 탭 (관리자 포함)
- 아이디 기반 로그인 / 회원가입 / 비밀번호 찾기
- 이메일 인증 코드 시뮬레이션
- **핸드폰 번호 3개로 자동 관리자 권한 부여**
  - `010-4040-0167`, `010-4151-4560`, `010-3303-7020`

---

## 🛡️ 관리자 패널 (5탭)

| 탭 | 기능 |
|----|------|
| **업로드** | 엑셀 파일 업로드 4단계 (파일선택→기준월→미리보기→업로드) |
| **데이터 확인** | 연도/월/신고유형 필터로 API 조회·수입사별 집계 표시 |
| **데이터 수정** | 업로드된 데이터 행별 수정(PATCH)·삭제(DELETE)·전체 삭제 |
| **업로드 현황** | 연도별 12개월 캘린더 + 신고유형별 진행률 그리드 |
| **이력** | 전체/업로드/데이터 수정 행위 필터 — `action_type` 컬럼 뱃지 표시 |

### 데이터 수정 탭 상세
- 연도·월·신고유형 필터로 대상 데이터 조회
- 행 클릭 → 수정 모달 팝업 (수입사·모델명·배기량·신고유형·등록대수)
- **PATCH** `tables/registrations/{id}` — 개별 레코드 수정
- **DELETE** `tables/registrations/{id}` — 개별 삭제
- 전체 삭제 버튼 — 현재 필터 조건 전체 순차 DELETE

### 업로드 현황 탭 상세
- 좌우 화살표로 연도 이동
- 12개월 캘린더 그리드: ✅완료 / ❌미업로드 / ⏳예정 구분
- **교차 검증 로직**: `upload_history` 이력 존재 **AND** `registrations` 실제 데이터 존재 시에만 ✅완료로 표시
  - 데이터 수정/삭제 후 registrations가 비면 자동으로 ❌미업로드로 전환
- 요약 카드: 완료된 월 / 미완료 월 / 전체 업로드 건수
- 신고유형(전체) 월별 진행률 바 + 점 매트릭스

---

## 🗄️ 데이터 모델

### `tables/registrations`
| 필드 | 타입 | 설명 |
|------|------|------|
| id | text | 레코드 ID (UUID) |
| year | number | 연도 |
| month | number | 월 |
| report_type | text | 신고유형 (신규신고/변경신고/말소신고/전체) |
| importer | text | 수입사명 |
| model | text | 모델명 |
| displacement | number | 배기량 (cc) |
| count | number | 등록대수 |

### `tables/upload_history`
| 필드 | 타입 | 설명 |
|------|------|------|
| id | text | 이력 ID |
| file_name | text | 업로드 파일명 |
| upload_date | text | 업로드 일시 |
| data_period | text | 데이터 기간 (예: 2026년 5월) |
| report_type | text | 신고유형 |
| record_count | number | 업로드 건수 |
| uploader | text | 업로드 계정 |
| action_type | text | 행위 구분: **업로드** / **데이터 수정** |
| status | text | 성공/부분성공/삭제/전체삭제 |

### LocalStorage
| 키 | 구조 | 설명 |
|----|------|------|
| `motoUsers` | `[{userId,email,pw,phone,role}]` | 회원 목록 |
| `motoNotifs` | `[{id,msg,detail,time,read}]` | 알림 목록 (최대 50개) |
| `motoSignupTemp` | `{userId,email,pw,phone}` | 회원가입 임시 데이터 |

---

## 🔗 API 엔드포인트 (RESTful Table API)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `tables/registrations?limit=500` | 전체 등록 데이터 조회 |
| POST | `tables/registrations` | 신규 레코드 등록 |
| PATCH | `tables/registrations/{id}` | 개별 레코드 수정 |
| DELETE | `tables/registrations/{id}` | 개별 레코드 삭제 |
| GET | `tables/upload_history?limit=500` | 업로드 이력 조회 |
| POST | `tables/upload_history` | 업로드 이력 기록 |

---

## 🚧 미구현 / 향후 개선 사항

- 카카오톡 SDK 연동 (공유 기능)
- 비밀번호 찾기 실제 이메일 발송
- 이메일 인증 코드 실제 발송 (현재 시뮬레이션)
- 데이터 수정 탭 페이지네이션 (현재 최대 500건 일괄 조회)
- 업로드 현황 → 미완료 달 클릭 시 업로드 탭으로 이동 연결
- 데이터 전체 삭제 시 해당 기간 `upload_history` 레코드 자동 삭제 옵션

---

## 🏗️ 기술 스택

- **HTML5 / CSS3 / Vanilla JavaScript (ES2020)**
- **Chart.js** (차트 렌더링, CDN)
- **SheetJS (XLSX)** (엑셀 파일 읽기·쓰기, CDN)
- **Font Awesome 6** (아이콘, CDN)
- **Google Fonts — Noto Sans KR** (폰트, CDN)
- **Genspark RESTful Table API** (데이터 영속성)

---

_최종 업데이트: 2026-05-21 — 모든 하드코딩 샘플/fallback 데이터 완전 제거, 실제 API 데이터 기반으로 전환_
