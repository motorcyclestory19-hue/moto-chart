// ===== MOTO CHART - Main Application =====

// ===== STATE =====
let currentPage = 'home';
let currentYear = 2026;
let currentMonth = 5;
let isAdminLoggedIn = false;
let uploadedFileData = null;
let currentUploadStep = 1;
let verifyPage = 1;
let verifyPageSize = 20;
let historyFilter = 'all';
let searchMode = 'all';

// 페이지 히스토리 스택 (뒤로가기/스와이프용)
const PAGE_HISTORY = [];
// 페이지 순서 (순환 기준)
const PAGE_ORDER = ['home', 'stats', 'analysis', 'search', 'admin'];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // registrations + upload_history 병렬 로드
  await Promise.all([
    fetchAllRegistrations(true),
    fetchUploadHistory(true),
  ]);
  renderHomePage();
  setupDragDrop();
  setupSwipeGesture();
  updateNotifBadge(); // 알림 뱃지 초기화

  // 5분 자동 갱신 시작
  startAutoRefresh();
});

// ===== 자동 갱신 토스트 =====
// data.js의 startAutoRefresh 콜백에서 호출 — 갱신 완료 시 화면 하단에 잠깐 표시
function showAutoRefreshToast() {
  const existing = document.getElementById('autoRefreshToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'autoRefreshToast';
  toast.innerHTML = `<i class="fas fa-sync-alt" style="margin-right:6px;animation:spin 0.8s linear 1"></i>데이터가 자동으로 갱신되었습니다`;
  toast.style.cssText = `
    position: fixed; bottom: 72px; left: 50%; transform: translateX(-50%);
    background: rgba(30,30,30,0.88); color: #fff;
    padding: 9px 18px; border-radius: 20px; font-size: 12px;
    font-family: 'Noto Sans KR', sans-serif; font-weight: 500;
    display: flex; align-items: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    z-index: 9999; white-space: nowrap;
    opacity: 0; transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}

// ===== 로고 랜딩 시트 =====
function onLogoClick() {
  openLogoSheet();
}

function openLogoSheet() {
  const overlay   = document.getElementById('logoSheetOverlay');
  const guestEl   = document.getElementById('llsGuestActions');
  const memberEl  = document.getElementById('llsMemberActions');
  const welcomeEl = document.getElementById('llsWelcomeMsg');

  if (currentUser) {
    // 로그인 중: 빠른 이동 메뉴 표시
    guestEl.style.display  = 'none';
    memberEl.style.display = 'block';
    const greeting = currentUser.role === 'admin'
      ? `👋 ${currentUser.userId}님 (관리자)\n어디로 이동할까요?`
      : `👋 ${currentUser.userId}님, 환영합니다!\n어디로 이동할까요?`;
    if (welcomeEl) welcomeEl.textContent = greeting;
  } else {
    // 비로그인: 가입/로그인 유도
    guestEl.style.display  = 'block';
    memberEl.style.display = 'none';
  }

  overlay.classList.add('open');
}

function closeLogoSheet() {
  document.getElementById('logoSheetOverlay').classList.remove('open');
}

// ===== 약관 시트 모달 =====
const TERMS_CONTENT = {
  terms: {
    title: '이용약관',
    sections: [
      {
        title: '제1조 (목적)',
        body: '이 약관은 (주)엠스토리(이하 "회사")가 제공하는 MOTO CHART 서비스(이하 "서비스")의 이용과 관련하여, 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.'
      },
      {
        title: '제2조 (이용허락의 범위)',
        body: '회사는 이용자에게 서비스의 비독점적, 양도 불가능한 이용권을 부여합니다. 이 허락은 Apple Inc. 또는 Google LLC가 공표하는 표준 앱 이용 허락(Standard EULA)에 준하며, 이용자는 다음 행위를 할 수 없습니다.\n\n• 서비스의 소스코드를 역분석, 역컴파일, 역어셈블하는 행위\n• 서비스 또는 그 일부를 복사, 수정, 배포, 판매, 양도하는 행위\n• 서비스를 이용하여 타인의 지식재산권을 침해하는 행위\n• 회사의 사전 서면 동의 없이 서비스를 상업적으로 이용하는 행위'
      },
      {
        title: '제3조 (서비스 제공 및 변경)',
        body: '회사는 이용자에게 다음과 같은 서비스를 제공합니다.\n\n• 오토바이(이륜차) 시장 등록 통계 데이터 조회\n• 수입사·모델별 등록 현황 분석\n• 배기량 구간별 시장 분석\n• 데이터 업로드 및 관리(회원 한정)\n\n회사는 서비스의 내용을 변경하거나 종료할 수 있으며, 변경 또는 종료 시 앱 내 공지사항을 통해 사전 안내합니다.'
      },
      {
        title: '제4조 (이용자의 의무)',
        body: '이용자는 다음 행위를 하여서는 안 됩니다.\n\n• 허위 정보를 제공하거나 타인의 정보를 도용하는 행위\n• 회사 또는 제3자의 지식재산권을 침해하는 행위\n• 서비스의 정상적인 운영을 방해하는 행위\n• 관련 법령을 위반하는 일체의 행위'
      },
      {
        title: '제5조 (서비스 이용 제한)',
        body: '회사는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고·일시 정지·이용 영구 제한 등의 조치를 취할 수 있습니다.'
      },
      {
        title: '제6조 (면책 조항)',
        body: '회사는 천재지변, 전쟁, 기간통신사업자의 서비스 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다. 서비스에서 제공하는 데이터는 참고용이며, 이를 기반으로 한 투자 또는 사업적 결정에 대한 결과는 이용자 본인의 책임입니다.'
      },
      {
        title: '제7조 (분쟁 해결)',
        body: '서비스 이용에 관한 분쟁은 대한민국 법률에 따라 해결되며, 분쟁이 발생할 경우 회사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.'
      },
      {
        title: '제8조 (약관의 효력 및 변경)',
        body: '이 약관은 서비스 화면 내 게시함으로써 효력을 발생합니다. 회사는 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지 후 7일이 경과하면 효력이 발생합니다.'
      }
    ],
    effectiveDate: '시행일: 2026년 5월 21일',
    company: '(주)엠스토리 | motorcyclestory19@gmail.com'
  },
  privacy: {
    title: '개인정보처리방침',
    sections: [
      {
        title: '제1조 (개인정보의 처리 목적)',
        body: 'MOTO CHART(이하 "서비스")는 사용자의 개인정보를 수집하지 않는 것을 원칙으로 합니다. 모든 사용자 데이터는 서비스 제공 목적 외에 사용되지 않으며, 회원가입 시 입력하신 최소한의 정보는 서비스 운영 및 본인 확인에만 활용됩니다.'
      },
      {
        title: '제2조 (처리하는 개인정보의 항목)',
        body: '서비스는 직접적인 개인 식별 정보 수집을 최소화합니다.\n\n• 수집 항목: 아이디, 이메일 주소, 비밀번호(암호화 저장), 핸드폰 번호(선택)\n• 자동 생성 항목: Apple/Google 분석 도구를 통한 비식별 통계 데이터(앱 버전, 기기 OS 버전, 접속 빈도 등)\n• 비수집 항목: 성명, 주소, 금융 정보 등 민감한 개인정보는 수집하지 않습니다.'
      },
      {
        title: '제3조 (개인정보의 처리 및 보유 기간)',
        body: '수집된 개인정보는 서비스 이용 기간 동안 보유하며, 회원 탈퇴 요청 즉시 지체 없이 파기합니다.\n\n• 회원 정보: 탈퇴 요청 후 30일 이내 완전 파기\n• 앱 삭제 시 기기 내 저장된 로컬 데이터는 즉시 파기됩니다.\n• 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.'
      },
      {
        title: '제4조 (개인정보의 제3자 제공)',
        body: '(주)엠스토리는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 어떠한 정보도 제3자에게 제공하거나 공유하지 않으며, 아래의 경우는 예외로 합니다.\n\n• 이용자가 사전에 동의한 경우\n• 법령의 규정에 의거하거나 수사 목적으로 법령에서 정한 절차와 방법에 따라 수사기관의 요구가 있는 경우'
      },
      {
        title: '제5조 (개인정보 처리의 위탁)',
        body: '회사는 서비스 운영을 위해 아래와 같이 개인정보 처리 업무를 위탁할 수 있습니다.\n\n• 수탁사: Genspark AI (서버 인프라 및 데이터 저장)\n• 위탁 업무: 데이터 저장 및 백업\n\n위탁 계약 시 개인정보 보호 관련 법규 준수 여부를 확인하고 있습니다.'
      },
      {
        title: '제6조 (이용자의 권리 및 행사 방법)',
        body: '이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요청\n• 개인정보 정정·삭제 요청\n• 개인정보 처리 정지 요청\n• 회원 탈퇴 및 개인정보 파기 요청\n\n위 권리 행사는 앱 내 MY 페이지 또는 아래 개인정보 보호책임자 이메일로 요청하실 수 있습니다.'
      },
      {
        title: '제7조 (개인정보 보호책임자)',
        body: '서비스의 개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n• 회사명: (주)엠스토리\n• 이메일: motorcyclestory19@gmail.com\n• 개인정보 침해 신고: 개인정보보호위원회 (privacy.go.kr / 국번 없이 182)'
      },
      {
        title: '제8조 (개인정보의 안전성 확보 조치)',
        body: '회사는 개인정보 보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적, 관리적, 물리적 조치를 취하고 있습니다.\n\n• 비밀번호 암호화: 이용자의 비밀번호는 단방향 암호화(해시)하여 저장합니다.\n• 접근 권한 관리: 개인정보 처리 시스템에 대한 접근 권한을 최소 인원으로 제한합니다.\n• 보안 프로그램 설치: 악성 코드 및 해킹 등으로 인한 개인정보 유출 방지를 위한 보안 프로그램을 운용합니다.'
      }
    ],
    effectiveDate: '공고일 및 시행일자: 2026년 5월 21일',
    company: '(주)엠스토리 | motorcyclestory19@gmail.com'
  }
};

function openTermsSheet(type) {
  const content = TERMS_CONTENT[type];
  if (!content) return;

  // 제목 설정
  document.getElementById('termsSheetTitle').textContent = content.title;

  // 본문 동적 렌더링
  const body = document.getElementById('termsSheetBody');
  body.scrollTop = 0;

  let html = '';
  content.sections.forEach(sec => {
    html += `
      <div class="terms-section">
        <div class="terms-section-title">${sec.title}</div>
        <div class="terms-section-body">${sec.body.replace(/\n/g, '<br>')}</div>
      </div>`;
  });

  html += `
    <div class="terms-effective-date">${content.effectiveDate}</div>
    <div class="terms-company">${content.company}</div>`;

  body.innerHTML = html;

  // 시트 열기
  document.getElementById('termsSheetOverlay').classList.add('open');
}

function closeTermsSheet() {
  document.getElementById('termsSheetOverlay').classList.remove('open');
}

// ===== NAVIGATION =====
function navigateTo(page, subTab, addHistory = true) {
  // 히스토리 스택 관리 (같은 페이지 중복 제외)
  if (addHistory && currentPage !== page) {
    PAGE_HISTORY.push({ page: currentPage, subTab: currentSubTab });
    if (PAGE_HISTORY.length > 20) PAGE_HISTORY.shift();
  }

  const prevPage = currentPage;
  currentPage = page;
  currentSubTab = subTab || '';

  // 현재 활성 페이지에 슬라이드 아웃 효과
  if (prevPage !== page) {
    const oldEl = document.getElementById(`page-${prevPage}`);
    if (oldEl) {
      oldEl.classList.add('slide-out-left');
      setTimeout(() => {
        oldEl.classList.remove('active', 'slide-out-left');
      }, 260);
    }
  }

  // 모든 nav 비활성화
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // 새 페이지 슬라이드 인
  setTimeout(() => {
    document.querySelectorAll('.page').forEach(p => {
      if (!p.id.endsWith(prevPage) || prevPage === page) p.classList.remove('active');
    });
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      if (prevPage !== page) pageEl.classList.add('slide-in-right');
      pageEl.classList.add('active');
      setTimeout(() => pageEl.classList.remove('slide-in-right'), 300);
    }

    // nav 활성화
    const navBtn = document.querySelector(`[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    // 페이지별 초기화
    // 데이터 탭(home/stats/analysis/search): admin에서 넘어올 때는 강제 fetch,
    // 같은 데이터탭 간 이동은 캐시 TTL(30초) 적용으로 불필요한 요청 최소화
    if (['home', 'stats', 'analysis', 'search'].includes(page)) {
      const forceRefresh = (prevPage === 'admin'); // admin → 데이터 탭이면 강제 재조회
      Promise.all([
        fetchAllRegistrations(forceRefresh),
        fetchUploadHistory(forceRefresh),
      ]).then(() => {
        switch(page) {
          case 'home':     renderHomePage(); break;
          case 'stats':    renderStatsPage(subTab || 'importer'); break;
          case 'analysis': renderAnalysisPage(subTab || 'displacement'); break;
          case 'search':   renderSearchPage(); break;
        }
      });
    } else {
      renderAdminPage();
    }

    // 스크롤 최상단
    document.getElementById('main-content').scrollTop = 0;
  }, prevPage !== page ? 50 : 0);
}

// 뒤로가기 (히스토리 팝)
function goBack() {
  if (PAGE_HISTORY.length === 0) return;
  const prev = PAGE_HISTORY.pop();
  navigateTo(prev.page, prev.subTab, false);
}

// 현재 서브탭 추적
let currentSubTab = '';

// ===== SWIPE GESTURE =====
function setupSwipeGesture() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  let startX = 0, startY = 0, startTime = 0;
  let isSwiping = false;
  const SWIPE_THRESHOLD = 80;   // 최소 이동 거리(px)
  const SWIPE_TIME_LIMIT = 400; // 최대 소요 시간(ms)
  const SWIPE_EDGE = 40;        // 왼쪽 엣지 영역(px) - 여기서 시작해야 인식
  const SWIPE_ANGLE = 30;       // 수평 허용 각도

  mainContent.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    isSwiping = startX <= SWIPE_EDGE; // 왼쪽 엣지에서 시작한 경우에만
  }, { passive: true });

  mainContent.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = Math.abs(touch.clientY - startY);

    // 수평 이동이 수직보다 크고, 오른쪽으로 드래그 중일 때 힌트 표시
    if (dx > 20 && dx > dy) {
      const hint = document.getElementById('swipeHint');
      if (hint && PAGE_HISTORY.length > 0) hint.classList.add('show');
    }
  }, { passive: true });

  mainContent.addEventListener('touchend', (e) => {
    const hint = document.getElementById('swipeHint');
    if (hint) hint.classList.remove('show');
    if (!isSwiping) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = Math.abs(touch.clientY - startY);
    const dt = Date.now() - startTime;
    const angle = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);

    // 오른쪽으로 충분히 빠르게 스와이프했고, 수평에 가까울 때
    if (dx > SWIPE_THRESHOLD && dt < SWIPE_TIME_LIMIT && angle < SWIPE_ANGLE) {
      if (PAGE_HISTORY.length > 0) {
        goBack();
      }
    }
    isSwiping = false;
  }, { passive: true });

  // 마우스 드래그 지원 (데스크탑 테스트용)
  let mouseStartX = 0, isMouseDown = false;
  mainContent.addEventListener('mousedown', (e) => {
    if (e.clientX <= SWIPE_EDGE) {
      mouseStartX = e.clientX;
      isMouseDown = true;
    }
  });
  mainContent.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - mouseStartX;
    if (dx > SWIPE_THRESHOLD && PAGE_HISTORY.length > 0) goBack();
    isMouseDown = false;
    const hint = document.getElementById('swipeHint');
    if (hint) hint.classList.remove('show');
  });
  mainContent.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - mouseStartX;
    if (dx > 20) {
      const hint = document.getElementById('swipeHint');
      if (hint && PAGE_HISTORY.length > 0) hint.classList.add('show');
    }
  });
  mainContent.addEventListener('mouseleave', () => {
    isMouseDown = false;
    const hint = document.getElementById('swipeHint');
    if (hint) hint.classList.remove('show');
  });
}

// 현재 선택된 기간 텍스트 반환 (홈 카드 라벨용)
function periodLabel() {
  const y = currentYear  === 0 ? '전체' : `${currentYear}년`;
  const m = currentMonth === 0 ? '전체' : `${currentMonth}월`;
  if (currentYear === 0 && currentMonth === 0) return '전체 기간';
  if (currentMonth === 0) return `${y} 전체`;
  return `${y} ${m}`;
}

// ===== HOME PAGE =====
function renderHomePage() {
  const periodData = filterByPeriod(allRegistrations, currentYear, currentMonth);

  // 전월 데이터 (전체 모드에서는 전월 비교 생략)
  let prevData = [];
  if (currentYear > 0 && currentMonth > 0) {
    prevData = filterByPeriod(allRegistrations,
      currentMonth === 1 ? currentYear - 1 : currentYear,
      currentMonth === 1 ? 12 : currentMonth - 1
    );
  }

  const total     = periodData.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
  const prevTotal = prevData.reduce((s, r)   => s + (parseInt(r.count) || 0), 0);

  const displayTotal = total;
  const displayPrev  = prevTotal;

  const el = document.getElementById('homeTotal');
  if (el) el.innerHTML = `${fmt(displayTotal)}<span class="unit">대</span>`;

  // 요약 라벨 업데이트
  const lbl = document.querySelector('.summary-label');
  if (lbl) lbl.textContent = `${periodLabel()} 총 등록대수`;

  const chgEl = document.getElementById('homeChange');
  if (chgEl) {
    if (currentYear > 0 && currentMonth > 0 && displayPrev > 0) {
      const chg = calcYoYChange(displayTotal, displayPrev);
      if (chg !== null) {
        const arrow = chg >= 0 ? '▲' : '▼';
        const cls   = chg >= 0 ? 'positive' : '';
        chgEl.innerHTML = `<span class="${cls}">${arrow} ${Math.abs(chg)}%</span> <span class="change-sub">전월 대비 (전월 ${fmt(displayPrev)}대)</span>`;
      } else {
        chgEl.innerHTML = `<span class="change-sub">전월 ${fmt(displayPrev)}대</span>`;
      }
    } else {
      chgEl.innerHTML = `<span class="change-sub">누적 합산 데이터</span>`;
    }
  }

  // ── KPI 집계 ──
  // 브랜드 누적 등록대수: 선택 연도 전체(월 무관) 합산. 연도=전체면 allRegistrations 전체
  const cumulBase = currentYear === 0
    ? allRegistrations
    : allRegistrations.filter(r => parseInt(r.year) === currentYear);
  const cumul = cumulBase.reduce((s, r) => s + (parseInt(r.count) || 0), 0);

  // 수입사 수 / 모델 수: 선택 연도 기준 고유값 집계
  const importerSet = new Set(cumulBase.map(r => r.importer).filter(Boolean));
  const modelSet    = new Set(cumulBase.map(r => r.model).filter(Boolean));

  const kpiCumul     = document.getElementById('kpiCumulative');
  const kpiImporters = document.getElementById('kpiImporters');
  const kpiModels    = document.getElementById('kpiModels');
  if (kpiCumul)     kpiCumul.innerHTML     = `${fmt(cumul)}<span class="unit-sm">대</span>`;
  if (kpiImporters) kpiImporters.innerHTML = `${importerSet.size}<span class="unit-sm">개</span>`;
  if (kpiModels)    kpiModels.innerHTML    = `${modelSet.size}<span class="unit-sm">개</span>`;

  // KPI 카드 하단 라벨 동적 업데이트
  const yearLabel = currentYear === 0 ? '전체 기간' : `${currentYear}년`;
  const cumulChg = document.getElementById('kpiCumulChange');
  const impChg   = document.getElementById('kpiImporterChange');
  const modChg   = document.getElementById('kpiModelChange');
  if (cumulChg) cumulChg.textContent = `${yearLabel} 합산`;
  if (impChg)   impChg.textContent   = `${yearLabel} 기준`;
  if (modChg)   modChg.textContent   = `${yearLabel} 기준`;

  renderHomeTrendChart(allRegistrations);
}

function onGlobalPeriodChange() {
  currentYear  = parseInt(document.getElementById('globalYear').value)  || 0;
  currentMonth = parseInt(document.getElementById('globalMonth').value) || 0;
  navigateTo(currentPage, currentSubTab || '');
}

// ===== 데이터 변경 후 전체 화면 즉시 갱신 =====
// 업로드·수정·삭제 완료 시 반드시 호출
async function refreshAllViews() {
  // force=true: 캐시 TTL 무시하고 반드시 최신 데이터 fetch
  // (업로드·수정·삭제 직후 호출이므로 서버 최신값 필수)
  await fetchAllRegistrations(true);
  // 현재 활성 탭이 데이터 탭이면 즉시 리렌더
  switch (currentPage) {
    case 'home':     renderHomePage(); break;
    case 'stats':    renderStatsPage(currentStatsTab || 'importer'); break;
    case 'analysis': renderAnalysisPage(currentSubTab || 'displacement'); break;
    case 'search':   renderSearchPage(); break;
    default: break; // admin 탭: 캐시만 갱신, 다음 탭 이동 시 자동 반영
  }
}

// ===== STATS PAGE =====
let currentStatsTab = 'importer';

function renderStatsPage(tab) {
  switchStatsTab(tab);
}

function switchStatsTab(tab) {
  currentStatsTab = tab;
  document.querySelectorAll('#page-stats .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('#page-stats .tab-pane').forEach(p => p.classList.remove('active'));

  if (tab === 'importer') {
    document.getElementById('statsImporterPane').classList.add('active');
    renderImporterTable('monthly');
  } else {
    document.getElementById('statsModelPane').classList.add('active');
    renderModelTable('monthly');
  }
}

// API 데이터에서 실제 존재하는 연도 중 최신/이전 연도를 구함
function getDataYears() {
  const years = [...new Set(allRegistrations.map(r => parseInt(r.year)).filter(Boolean))].sort((a,b)=>a-b);
  return years; // 오름차순
}

// mode별 currentData/prevData 결정 헬퍼
function resolveStatsPeriod(mode) {
  // 선택된 연도/월
  const selYear  = currentYear;   // 0 = 전체
  const selMonth = currentMonth;  // 0 = 전체

  // 실제 데이터에 존재하는 연도 목록
  const dataYears = getDataYears();
  if (dataYears.length === 0) return { currentData: [], prevData: [] };

  // 기준 연도 결정: 선택 연도가 0(전체)이면 데이터 내 최신 연도 사용
  const baseYear  = selYear  > 0 ? selYear  : dataYears[dataYears.length - 1];
  const baseMonth = selMonth; // 0 = 전체

  // ── prevData를 구하기 전 upload_history 기반 유효성 검증 ──
  // 전년도+동일월에 실제 업로드 이력이 없으면 prevData를 빈 배열로 처리
  function safePrevData(prevYear, prevMonth) {
    if (!hasUploadedData(prevYear, prevMonth)) return [];
    return filterByPeriod(allRegistrations, prevYear, prevMonth);
  }

  if (mode === 'cumul') {
    // 누적: baseYear 1월 ~ baseMonth(0이면 전체 12월)
    const maxM = baseMonth > 0 ? baseMonth : 12;
    const currentData = allRegistrations.filter(r => {
      const y = parseInt(r.year), m = parseInt(r.month);
      return y === baseYear && m >= 1 && m <= maxM;
    });
    const prevYear = baseYear - 1;
    // 전년도에 누적 범위(1~maxM) 중 하나라도 업로드 이력 있어야 prevData 사용
    const prevHasData = Array.from({length: maxM}, (_, i) => i + 1)
      .some(m => hasUploadedData(prevYear, m));
    const prevData = prevHasData
      ? allRegistrations.filter(r => {
          const y = parseInt(r.year), m = parseInt(r.month);
          return y === prevYear && m >= 1 && m <= maxM;
        })
      : [];
    return { currentData, prevData };
  }

  if (mode === 'compare') {
    // 증감: baseYear + baseMonth 기준, 전년 동기와 비교
    const currentData = filterByPeriod(allRegistrations, baseYear, baseMonth);
    const prevData    = safePrevData(baseYear - 1, baseMonth);
    return { currentData, prevData };
  }

  // monthly (기본): 선택 연도/월 그대로 (0=전체 허용)
  const currentData = filterByPeriod(allRegistrations, selYear, selMonth);
  const prevData    = selYear > 0
    ? safePrevData(selYear - 1, selMonth)
    : [];
  return { currentData, prevData };
}

function renderImporterTable(mode) {
  const tbody = document.getElementById('importerTableBody');
  if (!tbody) return;

  const { currentData, prevData } = resolveStatsPeriod(mode);

  const current = aggregateByImporter(currentData);
  const prevMap = {};
  aggregateByImporter(prevData).forEach(r => { prevMap[r.importer] = r.count; });

  // ── compare 모드: 전년 대비 증감률 내림차순 정렬, 전년 데이터 있는 항목만 ──
  let rows;
  if (mode === 'compare') {
    rows = current
      .filter(r => prevMap[r.importer] && prevMap[r.importer] > 0)
      .map(r => ({ ...r, chg: calcYoYChange(r.count, prevMap[r.importer]) }))
      .filter(r => r.chg !== null)
      .sort((a, b) => b.chg - a.chg)
      .slice(0, 10);
  } else {
    rows = current.slice(0, 10);
  }

  if (rows.length === 0) {
    const msg = mode === 'compare'
      ? '전년도 비교 데이터가 없습니다'
      : mode === 'cumul'
      ? '누적 데이터가 없습니다'
      : '등록 데이터가 없습니다';
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fas fa-chart-bar"></i><p>데이터가 없습니다</p><p style="font-size:11px;color:#aaa;margin-top:4px">${msg}</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, i) => {
    const chg = r.chg !== undefined ? r.chg : calcYoYChange(r.count, prevMap[r.importer]);
    const numCls = i === 0 ? 'gold' : (i === 1 ? 'silver' : (i === 2 ? 'bronze' : ''));
    return `<tr>
      <td><span class="rank-num ${numCls}">${i+1}</span></td>
      <td><b>${r.importer}</b></td>
      <td><b>${fmt(r.count)}</b>대</td>
      <td>${fmtChange(chg)}</td>
    </tr>`;
  }).join('');
}



function renderModelTable(mode) {
  const tbody = document.getElementById('modelTableBody');
  if (!tbody) return;

  const { currentData, prevData } = resolveStatsPeriod(mode);

  const current = aggregateByModel(currentData);
  const prevMap = {};
  aggregateByModel(prevData).forEach(r => { prevMap[r.model] = r.count; });

  // ── compare 모드: 전년 대비 증감률 내림차순 정렬, 전년 데이터 있는 항목만 ──
  let rows;
  if (mode === 'compare') {
    rows = current
      .filter(r => prevMap[r.model] && prevMap[r.model] > 0)
      .map(r => ({ ...r, chg: calcYoYChange(r.count, prevMap[r.model]) }))
      .filter(r => r.chg !== null)
      .sort((a, b) => b.chg - a.chg)
      .slice(0, 10);
  } else {
    rows = current.slice(0, 10);
  }

  if (rows.length === 0) {
    const msg = mode === 'compare'
      ? '전년도 비교 데이터가 없습니다'
      : mode === 'cumul'
      ? '누적 데이터가 없습니다'
      : '등록 데이터가 없습니다';
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fas fa-motorcycle"></i><p>데이터가 없습니다</p><p style="font-size:11px;color:#aaa;margin-top:4px">${msg}</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, i) => {
    const chg = r.chg !== undefined ? r.chg : calcYoYChange(r.count, prevMap[r.model]);
    const numCls = i === 0 ? 'gold' : (i === 1 ? 'silver' : (i === 2 ? 'bronze' : ''));
    return `<tr class="model-row" onclick="openModelModal(${JSON.stringify(r).replace(/"/g,'&quot;')})">
      <td><span class="rank-num ${numCls}">${i+1}</span></td>
      <td>
        <div class="model-name-cell">
          <span class="model-name-main">${r.model}</span>
          <span class="model-name-sub">${r.importer} · ${r.displacement}cc</span>
        </div>
      </td>
      <td><b>${fmt(r.count)}</b>대</td>
      <td>${fmtChange(chg)}</td>
    </tr>`;
  }).join('');
}



function switchSubTab(type, mode, el) {
  const bar = el.closest('.subtab-bar');
  bar.querySelectorAll('.subtab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (type === 'importer') renderImporterTable(mode);
  else renderModelTable(mode);
}

// ===== ANALYSIS PAGE =====
let currentAnalysisTab = 'displacement';

function renderAnalysisPage(tab) {
  switchAnalysisTab(tab);
}

function switchAnalysisTab(tab) {
  currentAnalysisTab = tab;
  document.querySelectorAll('#page-analysis .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('#page-analysis .tab-pane').forEach(p => p.classList.remove('active'));

  if (tab === 'displacement') {
    document.getElementById('analysisDisplacementPane').classList.add('active');
    setTimeout(() => {
      renderDisplacementDonut(allRegistrations, currentYear, currentMonth);
      renderDisplacementTrendChart(allRegistrations);
    }, 50);
  } else if (tab === 'trend') {
    document.getElementById('analysisTrendPane').classList.add('active');
    renderMonthlyTrendChart(currentTrendMonths);
    renderMonthlyDataTable(currentTrendMonths);
  } else {
    document.getElementById('analysisYearlyPane').classList.add('active');
    setTimeout(() => renderYearlyCompareChart('bar'), 50);
  }
}

// API 데이터(allRegistrations)에서 월별 합계 배열 생성
// 반환 형식: [{y, m, val}, ...] — 실제 데이터가 있는 연월만 포함, 오름차순
function buildMonthlyAll() {
  const map = {};
  allRegistrations.forEach(r => {
    const y = parseInt(r.year);
    const m = parseInt(r.month);
    const v = parseInt(r.count) || 0;
    if (!y || !m) return;
    const key = `${y}-${m}`;
    if (!map[key]) map[key] = { y, m, val: 0 };
    map[key].val += v;
  });
  return Object.values(map).sort((a, b) => a.y !== b.y ? a.y - b.y : a.m - b.m);
}

function renderMonthlyDataTable(periodMonths) {
  const body = document.getElementById('monthlyDataBody');
  if (!body) return;

  const allMonths = buildMonthlyAll();

  if (allMonths.length === 0) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-calendar-alt"></i><p>데이터가 없습니다</p><p style="font-size:11px;color:#aaa;margin-top:4px">업로드된 데이터가 없습니다</p></div></td></tr>`;
    return;
  }

  // 최신 기준으로 periodMonths개 슬라이스 (0=전체)
  const slice = periodMonths > 0 ? allMonths.slice(-periodMonths) : [...allMonths];

  // 테이블 헤더 동적 변경 (연도가 걸쳐있으면 '연월' 표기)
  const multiYear = new Set(slice.map(r => r.y)).size > 1;

  body.innerHTML = slice.map((r, i) => {
    const prevRow = i > 0 ? slice[i-1] : null;
    // 전년 동월 실제 API 데이터에서 찾기
    const yoyRow = allMonths.find(d => d.y === r.y - 1 && d.m === r.m);
    const mom = prevRow ? calcYoYChange(r.val, prevRow.val) : null;
    const yoy = yoyRow  ? calcYoYChange(r.val, yoyRow.val)  : null;
    const label = multiYear ? `${r.y}.${String(r.m).padStart(2,'0')}` : `${r.m}월`;
    return `<tr>
      <td><b>${label}</b></td>
      <td>${fmt(r.val)}대</td>
      <td>${yoyRow ? fmt(yoyRow.val)+'대' : '-'}</td>
      <td>${mom !== null ? fmtChange(mom) : '-'}</td>
      <td>${yoy !== null ? fmtChange(yoy) : '-'}</td>
    </tr>`;
  }).join('');
}

let currentTrendMonths = 12;

function switchTrendPeriod(months, el) {
  currentTrendMonths = months;
  document.querySelectorAll('#analysisTrendPane .subtab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderMonthlyTrendChart(months);
  renderMonthlyDataTable(months);
}

function switchYearlyType(type, el) {
  document.querySelectorAll('#analysisYearlyPane .subtab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderYearlyCompareChart(type);
}

// ===== SEARCH PAGE =====
let searchResults = [];

// ── 필터 상태 ──
const searchFilter = {
  displacement: 'all', // 배기량 구간 ('all' 또는 DISPLACEMENT_RANGES label)
  minCount:     0,     // 최소 등록대수 (0 = 전체)
};



function renderSearchPage() {
  renderSearchResults('');
  updateFilterBtnBadge();
  renderActiveFilterBar();
}

function onSearchInput() {
  const q = document.getElementById('searchInput').value;
  renderSearchResults(q);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  renderSearchResults('');
}

function switchSearchTab(tab, el) {
  searchMode = tab;
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  onSearchInput();
}

// ===== 필터 바텀시트 =====
function openFilterSheet() {
  // 배기량 칩 현재 선택 상태 복원
  document.querySelectorAll('#displacementChips .filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.disp === searchFilter.displacement);
  });

  // 등록대수 칩 현재 선택 상태 복원
  document.querySelectorAll('#countChips .filter-chip').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.count) === searchFilter.minCount);
  });

  document.getElementById('filterOverlay').classList.add('open');
}

function closeFilterSheet(e) {
  if (e.target === document.getElementById('filterOverlay')) {
    document.getElementById('filterOverlay').classList.remove('open');
  }
}

function selectDisplacementFilter(btn) {
  document.querySelectorAll('#displacementChips .filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  searchFilter.displacement = btn.dataset.disp;
}

function selectCountFilter(btn) {
  document.querySelectorAll('#countChips .filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  searchFilter.minCount = parseInt(btn.dataset.count);
}

function resetFilter() {
  searchFilter.displacement = 'all';
  searchFilter.minCount     = 0;
  // 배기량 칩 초기화
  document.querySelectorAll('#displacementChips .filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.disp === 'all');
  });
  // 등록대수 칩 초기화
  document.querySelectorAll('#countChips .filter-chip').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.count) === 0);
  });
}

function applyFilter() {
  document.getElementById('filterOverlay').classList.remove('open');
  // 필터 버튼 활성 표시 업데이트
  updateFilterBtnBadge();
  renderActiveFilterBar();
  onSearchInput();
}

function updateFilterBtnBadge() {
  const btn = document.getElementById('filterBtn');
  if (!btn) return;
  const hasFilter = searchFilter.displacement !== 'all' || searchFilter.minCount > 0;
  btn.classList.toggle('has-filter', hasFilter);
  // 점 표시 (동적 생성)
  let dot = btn.querySelector('.filter-dot');
  if (!dot) { dot = document.createElement('span'); dot.className = 'filter-dot'; btn.appendChild(dot); }
}

function renderActiveFilterBar() {
  // 검색바 아래 활성 필터 태그 렌더링
  const bar = document.getElementById('activeFilterBar');
  if (!bar) return;
  const tags = [];
  if (searchFilter.displacement !== 'all') {
    tags.push(`<span class="active-filter-tag">
      <i class="fas fa-tachometer-alt" style="font-size:10px"></i> ${searchFilter.displacement}
      <button onclick="removeDisplacementFilter()"><i class="fas fa-times"></i></button>
    </span>`);
  }
  if (searchFilter.minCount > 0) {
    tags.push(`<span class="active-filter-tag">
      <i class="fas fa-motorcycle" style="font-size:10px"></i> ${fmt(searchFilter.minCount)}대 이상
      <button onclick="removeCountFilter()"><i class="fas fa-times"></i></button>
    </span>`);
  }
  bar.innerHTML = tags.length > 0
    ? `<div class="active-filter-bar">${tags.join('')}</div>`
    : '';
}

function removeDisplacementFilter() {
  searchFilter.displacement = 'all';
  updateFilterBtnBadge();
  renderActiveFilterBar();
  onSearchInput();
}

function removeCountFilter() {
  searchFilter.minCount = 0;
  updateFilterBtnBadge();
  renderActiveFilterBar();
  onSearchInput();
}

function renderSearchResults(query) {
  // API 데이터만 사용
  let pool = aggregateByModel(filterByPeriod(allRegistrations, currentYear, currentMonth));

  let filtered = [...pool];

  // 텍스트 검색 (공백 trim 처리)
  const q = (query || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(r =>
      (r.model    || '').toLowerCase().includes(q) ||
      (r.importer || '').toLowerCase().includes(q)
    );
  }

  // 배기량 구간 필터
  if (searchFilter.displacement !== 'all') {
    filtered = filtered.filter(r =>
      getDisplacementRange(parseInt(r.displacement) || 0) === searchFilter.displacement
    );
  }

  // 등록대수 필터
  if (searchFilter.minCount > 0) {
    filtered = filtered.filter(r => (parseInt(r.count) || 0) >= searchFilter.minCount);
  }

  // 탭 모드
  if (searchMode === 'popular') filtered = filtered.slice(0, 5);
  // 신규 모델: 등록대수 낮은 순 (신규 진입 모델)
  if (searchMode === 'new') filtered = [...filtered].sort((a, b) => (a.count || 0) - (b.count || 0)).slice(0, 20);

  const body = document.getElementById('searchResultBody');
  if (!body) return;

  if (filtered.length === 0) {
    const msg = pool.length === 0
      ? '등록된 데이터가 없습니다'
      : (q ? `"${q}" 에 맞는 결과가 없습니다` : '필터 조건을 변경해 보세요');
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fas fa-search"></i><p>검색 결과가 없습니다</p><p style="font-size:11px;color:#aaa;margin-top:4px">${msg}</p></div></td></tr>`;
    return;
  }

  body.innerHTML = filtered.map((r, i) => {
    const numCls = i === 0 ? 'gold' : (i === 1 ? 'silver' : (i === 2 ? 'bronze' : ''));
    const chgVal = r.chg !== undefined ? r.chg : null;
    const safeModel = JSON.stringify(r).replace(/"/g, '&quot;');
    return `<tr class="model-row" onclick="openModelModal(${safeModel})">
      <td><span class="rank-num ${numCls}">${i+1}</span></td>
      <td>
        <div class="model-name-cell">
          <span class="model-name-main">${r.model || '-'}</span>
          <span class="model-name-sub">${r.importer || '-'} · ${r.displacement || 0}cc</span>
        </div>
      </td>
      <td><b>${fmt(r.count)}</b>대</td>
      <td>${fmtChange(chgVal)}</td>
    </tr>`;
  }).join('');
}

// ===== MODEL MODAL =====
function openModelModal(model) {
  if (typeof model === 'string') model = JSON.parse(model);
  document.getElementById('modalModelName').textContent = model.model;
  document.getElementById('modalImporter').textContent = model.importer;
  document.getElementById('modalDate').textContent = `${currentYear}년 ${currentMonth}월 기준`;
  document.getElementById('modalCount').textContent = `${fmt(model.count)}대`;
  const chgVal = model.chg !== undefined ? model.chg : null;
  document.getElementById('modalChange').innerHTML = `전년 대비 ${fmtChange(chgVal)}`;
  // 해당 모델 전체 누적 합산 (allRegistrations 기반)
  const cumulCount = allRegistrations
    .filter(r => r.model === model.model)
    .reduce((s, r) => s + (parseInt(r.count) || 0), 0);
  document.getElementById('modalCumul').textContent = `${fmt(cumulCount > 0 ? cumulCount : model.count)}대`;
  document.getElementById('modelModal').classList.add('open');
  setTimeout(() => renderModalChart(model), 100);
}

function closeModal(e) {
  if (e.target === document.getElementById('modelModal')) closeModelModal();
}

function closeModelModal() {
  document.getElementById('modelModal').classList.remove('open');
}

// ===== MY / ADMIN PAGE =====

// 현재 로그인 사용자 정보
let currentUser = null; // { userId, email, role: 'admin'|'member' }
let verifyCode = '';    // 발송된 인증코드 (시뮬레이션)
let verifyTimer = null;
let verifySeconds = 180;

function renderAdminPage() {
  const guestView   = document.getElementById('myGuestView');
  const memberView  = document.getElementById('myMemberView');
  const adminView   = document.getElementById('adminPanelView');

  if (!currentUser) {
    guestView.style.display  = 'block';
    memberView.style.display = 'none';
    adminView.style.display  = 'none';
    switchAuthTab('login');
  } else if (currentUser.role === 'admin' && isAdminLoggedIn) {
    guestView.style.display  = 'none';
    memberView.style.display = 'block';
    adminView.style.display  = 'none';
    document.getElementById('myDisplayName').textContent  = currentUser.userId;
    document.getElementById('myDisplayUserId').textContent = '관리자 계정';
    document.getElementById('myBadge').textContent = '관리자';
    document.getElementById('myBadge').className   = 'my-badge admin';
    document.getElementById('adminMenuBtn').style.display = 'flex';
  } else {
    guestView.style.display  = 'none';
    memberView.style.display = 'block';
    adminView.style.display  = 'none';
    document.getElementById('myDisplayName').textContent  = currentUser.userId;
    document.getElementById('myDisplayUserId').textContent = currentUser.email || '';
    document.getElementById('myBadge').textContent = '일반회원';
    document.getElementById('myBadge').className   = 'my-badge';
    document.getElementById('adminMenuBtn').style.display = 'none';
  }
}

// 로그인/회원가입 탭 전환
function switchAuthTab(tab) {
  const loginWrap  = document.getElementById('loginFormWrap');
  const signupWrap = document.getElementById('signupFormWrap');
  const findpwWrap = document.getElementById('findPwFormWrap');
  const tabLogin   = document.getElementById('tabLogin');
  const tabSignup  = document.getElementById('tabSignup');

  loginWrap.style.display  = 'none';
  signupWrap.style.display = 'none';
  findpwWrap.style.display = 'none';

  if (tab === 'login') {
    loginWrap.style.display = 'block';
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else if (tab === 'signup') {
    signupWrap.style.display = 'block';
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
    document.getElementById('signupStep1').style.display = 'block';
    document.getElementById('signupStep2').style.display = 'none';
  } else if (tab === 'findpw') {
    findpwWrap.style.display = 'block';
    tabLogin.classList.remove('active');
    tabSignup.classList.remove('active');
  }
}

// ── 관리자 지정 핸드폰 번호 목록 ──
const ADMIN_PHONES = ['010-4040-0167', '010-4151-4560', '010-3303-7020'];

// 핸드폰 번호가 관리자 목록에 있는지 확인 (하이픈 유무 무관)
function isAdminPhone(phone) {
  const normalize = p => p.replace(/-/g, '');
  return ADMIN_PHONES.some(ap => normalize(ap) === normalize(phone));
}

// 로그인 처리
function adminLogin(e) {
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;

  if (!id || !pw) { showToast('❌ 아이디와 비밀번호를 입력하세요'); return; }

  // 저장된 회원 확인 (아이디 기반)
  const saved = localStorage.getItem('motoUsers');
  const users = saved ? JSON.parse(saved) : [];
  const found = users.find(u => u.userId === id && u.pw === pw);

  if (found) {
    // 가입 시 등록된 핸드폰 번호로 관리자 여부 자동 판별
    const role = isAdminPhone(found.phone || '') ? 'admin' : 'member';
    currentUser = { userId: found.userId, email: found.email, phone: found.phone, role };
    if (role === 'admin') {
      isAdminLoggedIn = true;
      showToast(`✅ ${found.userId}님, 관리자로 로그인 되었습니다`);
      loadHistoryData();
    } else {
      showToast(`✅ ${found.userId}님, 환영합니다!`);
    }
    renderAdminPage();
  } else {
    showToast('❌ 아이디 또는 비밀번호가 올바르지 않습니다');
  }
}

// 로그아웃 (일반 회원)
function memberLogout() {
  currentUser = null;
  isAdminLoggedIn = false;
  renderAdminPage();
  showToast('로그아웃 되었습니다');
}

// 관리자 로그아웃
function adminLogout() {
  currentUser = null;
  isAdminLoggedIn = false;
  renderAdminPage();
  showToast('로그아웃 되었습니다');
}

// 관리자 패널로 이동
function switchToAdminPanel() {
  document.getElementById('myMemberView').style.display = 'none';
  document.getElementById('adminPanelView').style.display = 'block';
  loadVerifyData();
  loadHistoryData();
}

// MY 뷰로 돌아가기
function backToMyView() {
  document.getElementById('adminPanelView').style.display = 'none';
  document.getElementById('myMemberView').style.display = 'block';
}

// ── 회원가입 ──
function sendVerifyCode(e) {
  e.preventDefault();
  const userId = document.getElementById('signupName').value.trim();
  const email  = document.getElementById('signupEmail').value.trim();
  const pw     = document.getElementById('signupPw').value;
  const pwc    = document.getElementById('signupPwConfirm').value;
  const terms  = document.getElementById('agreeTerms').checked;
  const priv   = document.getElementById('agreePrivacy').checked;

  // 아이디 유효성 검사
  if (!userId)        { showToast('❌ 아이디를 입력하세요'); return; }
  if (userId.length < 4) { showToast('❌ 아이디는 4자 이상이어야 합니다'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(userId)) { showToast('❌ 아이디는 영문·숫자·밑줄(_)만 사용 가능합니다'); return; }
  if (!email)         { showToast('❌ 이메일을 입력하세요'); return; }
  if (pw.length < 8)  { showToast('❌ 비밀번호는 8자 이상이어야 합니다'); return; }
  if (pw !== pwc)     { showToast('❌ 비밀번호가 일치하지 않습니다'); return; }
  if (!terms || !priv){ showToast('❌ 필수 약관에 동의해 주세요'); return; }

  // 중복 아이디 확인
  const saved = localStorage.getItem('motoUsers');
  const users = saved ? JSON.parse(saved) : [];
  if (users.find(u => u.userId === userId)) { showToast('❌ 이미 사용 중인 아이디입니다'); return; }
  if (users.find(u => u.email  === email))  { showToast('❌ 이미 가입된 이메일입니다'); return; }

  // 6자리 코드 생성 (시뮬레이션)
  verifyCode = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem('motoSignupTemp', JSON.stringify({
    userId, email, pw,
    phone: document.getElementById('signupPhone')?.value.trim() || '',
    code: verifyCode
  }));

  // 인증 단계로 이동
  document.getElementById('signupStep1').style.display = 'none';
  document.getElementById('signupStep2').style.display = 'block';
  document.getElementById('verifyDescText').innerHTML =
    `<b>${email}</b>로 발송된 6자리 코드를 입력하세요<br><small style="color:#e02020">[테스트] 코드: ${verifyCode}</small>`;

  startCodeTimer();
  showToast(`📧 인증 코드를 ${email}로 발송했습니다`);
  document.getElementById('code0').focus();
}

function startCodeTimer() {
  clearInterval(verifyTimer);
  verifySeconds = 180;
  updateTimerDisplay();
  verifyTimer = setInterval(() => {
    verifySeconds--;
    updateTimerDisplay();
    if (verifySeconds <= 0) {
      clearInterval(verifyTimer);
      showToast('⏰ 인증 시간이 만료되었습니다. 재발송해 주세요.');
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timerDisplay');
  if (!el) return;
  const m = Math.floor(verifySeconds / 60);
  const s = verifySeconds % 60;
  el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  el.style.color = verifySeconds <= 30 ? '#e02020' : '#e02020';
}

function resendCode() {
  const temp = JSON.parse(localStorage.getItem('motoSignupTemp') || '{}');
  verifyCode = String(Math.floor(100000 + Math.random() * 900000));
  temp.code = verifyCode;
  localStorage.setItem('motoSignupTemp', JSON.stringify(temp));
  document.getElementById('verifyDescText').innerHTML =
    `<b>${temp.email}</b>로 발송된 6자리 코드를 입력하세요<br><small style="color:#e02020">[테스트] 코드: ${verifyCode}</small>`;
  for(let i=0;i<6;i++) {
    const box = document.getElementById(`code${i}`);
    if(box) { box.value=''; box.classList.remove('filled'); }
  }
  startCodeTimer();
  showToast('📧 코드를 재발송했습니다');
  document.getElementById('code0').focus();
}

function codeInput(el, idx) {
  const val = el.value.replace(/\D/g, '');
  el.value = val;
  if (val) {
    el.classList.add('filled');
    const next = document.getElementById(`code${idx+1}`);
    if (next) next.focus();
    // 6자리 모두 입력 시 자동 인증
    const code = Array.from({length:6}, (_,i) => document.getElementById(`code${i}`)?.value || '').join('');
    if (code.length === 6) verifyEmailCode();
  } else {
    el.classList.remove('filled');
  }
}

function codeKeydown(e, idx) {
  if (e.key === 'Backspace' && !e.target.value) {
    const prev = document.getElementById(`code${idx-1}`);
    if (prev) { prev.value = ''; prev.classList.remove('filled'); prev.focus(); }
  }
}

function verifyEmailCode() {
  const entered = Array.from({length:6}, (_,i) => document.getElementById(`code${i}`)?.value || '').join('');
  const temp = JSON.parse(localStorage.getItem('motoSignupTemp') || '{}');

  if (entered.length < 6) { showToast('❌ 6자리 코드를 모두 입력하세요'); return; }
  if (entered !== temp.code) { showToast('❌ 인증 코드가 일치하지 않습니다'); return; }
  if (verifySeconds <= 0)   { showToast('⏰ 인증 시간이 만료되었습니다. 재발송해 주세요.'); return; }

  clearInterval(verifyTimer);

  // 가입 시 핸드폰 번호로 관리자 여부 자동 결정
  const role = isAdminPhone(temp.phone || '') ? 'admin' : 'member';

  // 회원 저장
  const saved = localStorage.getItem('motoUsers');
  const users = saved ? JSON.parse(saved) : [];
  users.push({ userId: temp.userId, email: temp.email, pw: temp.pw, phone: temp.phone || '', role });
  localStorage.setItem('motoUsers', JSON.stringify(users));
  localStorage.removeItem('motoSignupTemp');

  // 자동 로그인
  currentUser = { userId: temp.userId, email: temp.email, phone: temp.phone || '', role };
  if (role === 'admin') {
    isAdminLoggedIn = true;
    showToast(`🎉 가입 완료! ${temp.userId}님, 관리자로 등록되었습니다!`);
    loadHistoryData();
  } else {
    showToast(`🎉 가입 완료! ${temp.userId}님, 환영합니다!`);
  }

  // 가입 완료 → 랜딩 시트 닫고 홈 화면으로 이동
  closeLogoSheet();
  navigateTo('home', '');
}

// 전체 동의 토글
function toggleAllAgree(el) {
  document.querySelectorAll('.agree-item').forEach(cb => { cb.checked = el.checked; });
}

// 비밀번호 찾기 (아이디 기반)
function sendTempPw(e) {
  e.preventDefault();
  const userId = document.getElementById('findPwId').value.trim();
  if (!userId) { showToast('❌ 아이디를 입력하세요'); return; }
  if (userId === 'admin') { showToast('❌ 관리자 계정은 비밀번호 찾기를 사용할 수 없습니다'); return; }
  const saved = localStorage.getItem('motoUsers');
  const users = saved ? JSON.parse(saved) : [];
  const found = users.find(u => u.userId === userId);
  if (!found) { showToast('❌ 가입된 아이디가 아닙니다'); return; }
  showToast(`📧 임시 비밀번호를 ${found.email}로 발송했습니다`);
  setTimeout(() => switchAuthTab('login'), 1500);
}

// 비밀번호 보기/숨기기
function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

function switchAdminTab(tab, el) {
  document.querySelectorAll('.atab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`admin${capitalize(tab)}Tab`).classList.add('active');
  if (tab === 'verify')  loadVerifyData();
  if (tab === 'history') loadHistoryData();
  if (tab === 'edit')    loadEditData();
  if (tab === 'status')  loadStatusData();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ===== 데이터 수정 탭 =====
let editAllData    = [];   // 현재 조회된 전체 데이터
let editFiltered   = [];   // 검색 필터 후 데이터
let editCurrentRec = null; // 현재 수정 중인 레코드

async function loadEditData() {
  const year  = parseInt(document.getElementById('editYear')?.value) || 2026;
  const month = parseInt(document.getElementById('editMonth')?.value) || 0; // 0 = 전체
  // 신고유형 전체 고정
  const type  = '전체';

  const body = document.getElementById('editBody');
  if (body) body.innerHTML = `<tr><td colspan="6"><div class="loader"></div></td></tr>`;

  // 조회 시 검색창 초기화 (필터 꼬임 방지)
  const searchInput = document.getElementById('editSearchInput');
  if (searchInput) searchInput.value = '';

  try {
    // 전체 페이지 수집 후 필터
    const all = await fetchAllPages('registrations');

    // 연도 필터 (항상 적용)
    let data = all.filter(r => parseInt(r.year) === year);

    // 월 필터 (0 = 전체이면 생략)
    if (month !== 0) {
      data = data.filter(r => parseInt(r.month) === month);
    }

    // 신고유형 필터
    if (type !== '전체') {
      data = data.filter(r => (r.report_type || '신규신고') === type);
    }

    editAllData  = data;
    editFiltered = [...data]; // 검색 필터 없이 전체로 초기화

    // ── 요약 통계 카드 ──
    const totalCount  = data.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    const importerSet = new Set(data.map(r => r.importer).filter(Boolean));
    const periodSub   = month === 0 ? `${year}년 전체` : `${year}년 ${month}월`;
    const cards = document.getElementById('editStatCards');
    if (cards) cards.innerHTML = `
      <div class="vstat-card">
        <div class="vsc-label">총 등록대수</div>
        <div class="vsc-value">${fmt(totalCount)}<span class="vsc-unit">대</span></div>
        <div class="vsc-sub">${periodSub}</div>
      </div>
      <div class="vstat-card">
        <div class="vsc-label">수입사 수</div>
        <div class="vsc-value">${importerSet.size}<span class="vsc-unit">개</span></div>
      </div>
      <div class="vstat-card">
        <div class="vsc-label">모델 수</div>
        <div class="vsc-value">${new Set(data.map(r => r.model).filter(Boolean)).size}<span class="vsc-unit">개</span></div>
      </div>
    `;

    renderEditTable(editFiltered);

  } catch(e) {
    console.warn('편집 데이터 로드 실패', e);
    if (body) body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>데이터를 불러오지 못했습니다</p></div></td></tr>`;
    showToast('⚠️ 데이터를 불러오지 못했습니다');
  }
}

function filterEditTable() {
  const q = (document.getElementById('editSearchInput')?.value || '').toLowerCase();
  editFiltered = editAllData.filter(r =>
    (r.model    || '').toLowerCase().includes(q) ||
    (r.importer || '').toLowerCase().includes(q)
  );
  renderEditTable(editFiltered);
}

function renderEditTable(data) {
  const body = document.getElementById('editBody');
  if (!body) return;

  const bar = document.getElementById('editCountBar');
  if (bar) bar.textContent = `총 ${fmt(data.length)}건 표시 중 · 행을 탭하면 수정할 수 있습니다`;

  if (data.length === 0) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i><p>데이터가 없습니다</p><p style="font-size:11px;color:#aaa;margin-top:4px">조회 조건을 변경해 보세요</p></div></td></tr>`;
    return;
  }

  const sorted = [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
  body.innerHTML = sorted.map((r, i) => {
    const t = r.report_type || '신규신고';
    return `<tr onclick="openEditModal(${JSON.stringify(r).replace(/"/g,'&quot;')})">
      <td><span class="rank-num">${i+1}</span></td>
      <td style="font-size:11px">${r.importer || '-'}</td>
      <td style="font-size:11px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.model || ''}">${r.model || '-'}</td>
      <td>${r.displacement ? r.displacement + 'cc' : '-'}</td>
      <td><span class="type-badge ${t}" style="font-size:9px">${t.replace('신고','')}</span></td>
      <td><b>${fmt(r.count)}</b>대</td>
    </tr>`;
  }).join('');
}

function openEditModal(record) {
  if (typeof record === 'string') record = JSON.parse(record);
  editCurrentRec = record;

  document.getElementById('editRecordId').value    = record.id || '';
  document.getElementById('editImporter').value    = record.importer || '';
  document.getElementById('editModelName').value   = record.model || '';
  document.getElementById('editDisplacement').value= record.displacement || '';
  document.getElementById('editReportType').value  = record.report_type || '신규신고';
  document.getElementById('editCount').value       = record.count || '';

  document.getElementById('editModal').classList.add('open');
}

function closeEditModal(e) {
  if (e && e.target !== document.getElementById('editModal')) return;
  document.getElementById('editModal').classList.remove('open');
  editCurrentRec = null;
}

function closeEditModalBtn() {
  document.getElementById('editModal').classList.remove('open');
  editCurrentRec = null;
}

async function submitEditData(e) {
  e.preventDefault();
  const id           = document.getElementById('editRecordId').value;
  const importer     = document.getElementById('editImporter').value.trim();
  const model        = document.getElementById('editModelName').value.trim();
  const displacement = parseInt(document.getElementById('editDisplacement').value) || 0;
  const report_type  = document.getElementById('editReportType').value;
  const count        = parseInt(document.getElementById('editCount').value) || 0;

  if (!importer || !model) { showToast('❌ 수입사와 모델명을 입력하세요'); return; }
  if (!id) { showToast('❌ 레코드 ID가 없습니다'); return; }

  const saveBtn = document.querySelector('.edit-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '저장 중...'; }

  try {
    const res = await fetch(`tables/registrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importer, model, displacement, report_type, count })
    });

    if (res.ok) {
      showToast('✅ 수정 완료');
      closeEditModalBtn();
      // 데이터 수정 이력 기록
      const _yr = editCurrentRec?.year || '';
      const _mo = editCurrentRec?.month || '';
      const _rt = editCurrentRec?.report_type || report_type || '';
      await fetch('tables/upload_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type:  '데이터 수정',
          file_name:    `${importer} · ${model}`,
          upload_date:  new Date().toLocaleString('ko-KR'),
          data_period:  _yr && _mo ? `${_yr}년 ${_mo}월` : '',
          report_type:  _rt,
          record_count: 1,
          uploader:     'admin',
          status:       '성공',
        })
      });
      // 전역 캐시 갱신 → 홈·통계·분석·검색 모든 탭 즉시 반영
      await refreshAllViews();
      await loadEditData();
    } else {
      showToast('❌ 수정에 실패했습니다');
    }
  } catch(err) {
    showToast('❌ 네트워크 오류');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '저장'; }
  }
}

async function deleteEditRecord() {
  const id = document.getElementById('editRecordId').value;
  const rec = editCurrentRec;
  if (!id) { showToast('❌ 레코드 ID가 없습니다'); return; }

  const label = rec ? `${rec.importer} · ${rec.model}` : '이 항목';
  if (!confirm(`"${label}" 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

  try {
    const res = await fetch(`tables/registrations/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      showToast('🗑️ 삭제 완료');
      closeEditModalBtn();
      // 데이터 수정(삭제) 이력 기록
      const _yr = rec?.year || '';
      const _mo = rec?.month || '';
      const _rt = rec?.report_type || '';
      await fetch('tables/upload_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type:  '데이터 수정',
          file_name:    rec ? `${rec.importer} · ${rec.model}` : id,
          upload_date:  new Date().toLocaleString('ko-KR'),
          data_period:  _yr && _mo ? `${_yr}년 ${_mo}월` : '',
          report_type:  _rt,
          record_count: 1,
          uploader:     'admin',
          status:       '삭제',
        })
      });
      // 전역 캐시 갱신 → 홈·통계·분석·검색 모든 탭 즉시 반영
      await refreshAllViews();
      await loadEditData();
    } else {
      showToast('❌ 삭제에 실패했습니다');
    }
  } catch(err) {
    showToast('❌ 네트워크 오류');
  }
}

async function deleteAllEditData() {
  const year  = parseInt(document.getElementById('editYear')?.value) || 2026;
  const month = parseInt(document.getElementById('editMonth')?.value) || 0;
  // 신고유형 전체 고정
  const type  = '전체';

  const periodLabel = month === 0 ? `${year}년 전체` : `${year}년 ${month}월`;

  // ★ 삭제 직전 API 재조회 → 캐시 상태와 무관하게 최신 id 목록 확보
  showToast('⏳ 삭제 대상 조회 중...');
  let targets = [];
  try {
    const all = await fetchAllPages('registrations');
    let data = all.filter(r => parseInt(r.year) === year);
    if (month !== 0) data = data.filter(r => parseInt(r.month) === month);
    // id가 실제로 존재하는 레코드만 (빈 문자열 포함 falsy 제외)
    targets = data.filter(r => r.id && String(r.id).trim() !== '');
  } catch(e) {
    showToast('❌ 삭제 대상 조회에 실패했습니다');
    return;
  }

  const count = targets.length;
  if (count === 0) { showToast('삭제할 데이터가 없습니다'); return; }

  if (!confirm(`[${periodLabel} / ${type}]\n총 ${fmt(count)}건을 전체 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

  let deleted = 0, failed = 0;
  for (const rec of targets) {
    try {
      const res = await fetch(`tables/registrations/${rec.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) deleted++;
      else failed++;
    } catch { failed++; }
    // 10건마다 진행 상황 토스트
    if ((deleted + failed) % 10 === 0) {
      showToast(`🗑️ ${deleted + failed}/${fmt(count)}건 삭제 중...`);
    }
  }

  showToast(`✅ ${fmt(deleted)}건 삭제 완료${failed > 0 ? ` (실패: ${failed}건)` : ''}`);
  // 전체 삭제 이력 기록
  await fetch('tables/upload_history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action_type:  '데이터 수정',
      file_name:    `전체 삭제 (${periodLabel})`,
      upload_date:  new Date().toLocaleString('ko-KR'),
      data_period:  periodLabel,
      report_type:  type,
      record_count: deleted,
      uploader:     'admin',
      status:       failed > 0 ? `삭제(부분실패 ${failed}건)` : '전체삭제',
    })
  });
  await refreshAllViews();
  await loadEditData();
}

// ===== 업로드 현황 탭 =====
let statusYear = new Date().getFullYear();

function changeStatusYear(delta) {
  const newYear = statusYear + delta;
  if (newYear < 2020 || newYear > 2030) return;
  statusYear = newYear;
  const label = document.getElementById('statusYearLabel');
  if (label) label.textContent = `${statusYear}년`;
  loadStatusData();
}

async function loadStatusData() {
  // 연도 레이블 동기화
  const label = document.getElementById('statusYearLabel');
  if (label) label.textContent = `${statusYear}년`;

  // 로딩 표시
  const calEl = document.getElementById('statusCalendar');
  if (calEl) calEl.innerHTML = `<div class="loader"></div>`;

  try {
    // upload_history + registrations 동시 조회 (교차 검증)
    const [allHist, allRegs] = await Promise.all([
      fetchAllPages('upload_history'),
      fetchAllPages('registrations')
    ]);

    const yearHist = allHist.filter(h => {
      const match = (h.data_period || '').match(/(\d+)년/);
      return match && parseInt(match[1]) === statusYear;
    });

    // 해당 연도의 registrations 실제 데이터 (연도 필드 기준)
    const yearRegs = allRegs.filter(r => parseInt(r.year) === statusYear);

    renderStatusSummaryCards(yearHist, allHist, yearRegs);
    renderStatusCalendar(yearHist, yearRegs);
    renderStatusTypeGrid(yearHist, yearRegs);

  } catch(e) {
    console.warn('업로드 현황 로드 실패', e);
    // fallback: 이력 없음으로 렌더
    renderStatusSummaryCards([], [], []);
    renderStatusCalendar([], []);
    renderStatusTypeGrid([], []);
    showToast('⚠️ 업로드 현황을 불러오지 못했습니다');
  }
}

function renderStatusSummaryCards(yearHist, allHist, yearRegs) {
  const cards = document.getElementById('statusSummaryCards');
  if (!cards) return;

  // 실제 registrations 데이터가 존재하는 월 Set (교차 검증 기준)
  const regsMonthSet = new Set();
  (yearRegs || []).forEach(r => {
    const mo = parseInt(r.month);
    if (mo >= 1 && mo <= 12) regsMonthSet.add(mo);
  });

  // upload_history 이력이 있고 & registrations 실제 데이터도 있어야 완료
  const histMonthSet = new Set();
  yearHist.forEach(h => {
    const m = (h.data_period || '').match(/(\d+)월/);
    if (m) histMonthSet.add(parseInt(m[1]));
  });

  // 완료 = 이력 존재 AND 실제 데이터 존재
  const doneMonths = new Set();
  histMonthSet.forEach(mo => {
    if (regsMonthSet.has(mo)) doneMonths.add(mo);
  });

  // 현재 월 계산 (statusYear가 현재 연도면 현재 월까지, 과거면 12월까지)
  const now = new Date();
  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const maxMonth = statusYear < nowYear ? 12 : (statusYear === nowYear ? nowMonth : 0);
  const missingCount = maxMonth - doneMonths.size < 0 ? 0 : maxMonth - doneMonths.size;

  // 총 업로드 기록수 (실제 데이터 기준)
  const totalUploads = allHist.length;

  cards.innerHTML = `
    <div class="vstat-card">
      <div class="vsc-label">완료된 월</div>
      <div class="vsc-value">${doneMonths.size}<span class="vsc-unit">개월</span></div>
      <div class="vsc-sub">${statusYear}년</div>
    </div>
    <div class="vstat-card">
      <div class="vsc-label">미완료 월</div>
      <div class="vsc-value" style="color:${missingCount > 0 ? '#e02020' : '#4caf50'}">${missingCount}<span class="vsc-unit">개월</span></div>
      <div class="vsc-sub" style="color:${missingCount > 0 ? '#e02020' : '#4caf50'}">${missingCount > 0 ? '업로드 필요' : '모두 완료'}</div>
    </div>
    <div class="vstat-card">
      <div class="vsc-label">전체 업로드</div>
      <div class="vsc-value">${totalUploads}<span class="vsc-unit">건</span></div>
      <div class="vsc-sub">누적 이력</div>
    </div>
  `;
}

function renderStatusCalendar(yearHist, yearRegs) {
  const calEl = document.getElementById('statusCalendar');
  if (!calEl) return;

  // upload_history 기반 월별 신고유형 Map
  const monthTypeMap = {};
  for (let m = 1; m <= 12; m++) monthTypeMap[m] = new Set();

  yearHist.forEach(h => {
    const mMatch = (h.data_period || '').match(/(\d+)월/);
    if (mMatch) {
      const mo = parseInt(mMatch[1]);
      const rt = h.report_type || '신규신고';
      if (monthTypeMap[mo]) monthTypeMap[mo].add(rt);
    }
  });

  // registrations 실제 데이터가 있는 월 Set (교차 검증)
  const regsMonthSet = new Set();
  (yearRegs || []).forEach(r => {
    const mo = parseInt(r.month);
    if (mo >= 1 && mo <= 12) regsMonthSet.add(mo);
  });

  const now      = new Date();
  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const cells = MONTH_NAMES.map((mName, idx) => {
    const mo   = idx + 1;
    const types = monthTypeMap[mo];
    const isFuture   = statusYear > nowYear || (statusYear === nowYear && mo > nowMonth);
    const isCurrent  = statusYear === nowYear && mo === nowMonth;
    // ★ 완료 조건: upload_history 이력 있음 AND registrations 실제 데이터 존재
    const hasHist    = types.size > 0;
    const hasRegs    = regsMonthSet.has(mo);
    const isDone     = hasHist && hasRegs;
    const isMissing  = !isFuture && !isDone;

    let cls   = 'status-cal-cell';
    let icon  = '';
    let countTxt = '';

    if (isFuture) {
      cls += ' future';
      icon = '<i class="fas fa-clock" style="color:#ccc;font-size:16px"></i>';
    } else if (isDone) {
      cls += ' done';
      icon = '<i class="fas fa-check-circle" style="color:#4caf50;font-size:16px"></i>';
      // 업로드된 유형들 표시
      const typeLabels = [...types].map(t => {
        const shortMap = { '신규신고':'신규','변경신고':'변경','말소신고':'말소','전체':'전체' };
        return shortMap[t] || t;
      }).join('·');
      countTxt = `<div class="cal-count">${typeLabels}</div>`;
    } else {
      cls += ' missing';
      icon = '<i class="fas fa-exclamation-circle" style="color:#e02020;font-size:16px"></i>';
      countTxt = `<div class="cal-count" style="color:#e02020">미업로드</div>`;
    }

    if (isCurrent) cls += ' current-month';

    return `
      <div class="${cls}" title="${statusYear}년 ${mo}월${isDone ? ' · 업로드 완료' : (isFuture ? ' · 예정' : ' · 미업로드')}">
        <div class="cal-month">${mName}</div>
        <div class="cal-status-icon">${icon}</div>
        ${countTxt}
      </div>
    `;
  }).join('');

  // 범례
  const legend = `
    <div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap">
      <span style="font-size:10px;color:#2e7d32;display:flex;align-items:center;gap:4px"><i class="fas fa-check-circle"></i> 업로드 완료</span>
      <span style="font-size:10px;color:#e02020;display:flex;align-items:center;gap:4px"><i class="fas fa-exclamation-circle"></i> 미업로드</span>
      <span style="font-size:10px;color:#bbb;display:flex;align-items:center;gap:4px"><i class="fas fa-clock"></i> 예정</span>
    </div>
  `;

  calEl.innerHTML = `
    <div class="status-cal-title"><i class="fas fa-calendar-check"></i> ${statusYear}년 월별 업로드 현황</div>
    ${legend}
    <div class="status-cal-grid">${cells}</div>
  `;
}

function renderStatusTypeGrid(yearHist, yearRegs) {
  const gridEl = document.getElementById('statusTypeGrid');
  if (!gridEl) return;

  const TYPES = [
    { key: '전체', icon: 'fas fa-layer-group', color: '#9c27b0' },
  ];

  const now      = new Date();
  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const maxMonth = statusYear < nowYear ? 12 : (statusYear === nowYear ? nowMonth : 0);

  const MONTH_NAMES = ['1','2','3','4','5','6','7','8','9','10','11','12'];

  // registrations 실제 데이터가 있는 월 Set (교차 검증)
  const regsMonthSet = new Set();
  (yearRegs || []).forEach(r => {
    const mo = parseInt(r.month);
    if (mo >= 1 && mo <= 12) regsMonthSet.add(mo);
  });

  const rows = TYPES.map(typeInfo => {
    // 해당 신고유형이 upload_history에 업로드된 월 Set
    const histMos = new Set();
    yearHist.forEach(h => {
      const mMatch = (h.data_period || '').match(/(\d+)월/);
      const rt = h.report_type || '신규신고';
      if (mMatch && rt === typeInfo.key) histMos.add(parseInt(mMatch[1]));
    });

    // ★ 완료 = upload_history 이력 AND registrations 실제 데이터 모두 존재
    const doneMos = new Set();
    histMos.forEach(mo => {
      if (regsMonthSet.has(mo)) doneMos.add(mo);
    });

    const doneCount   = doneMos.size;
    const pct = maxMonth > 0 ? Math.round(doneCount / maxMonth * 100) : 0;

    const dots = MONTH_NAMES.map((mLabel, idx) => {
      const mo = idx + 1;
      const isFuture  = statusYear > nowYear || (statusYear === nowYear && mo > nowMonth);
      const isDone    = doneMos.has(mo);
      let cls = 'status-type-month-dot ';
      if (isFuture)   cls += 'future-dot';
      else if (isDone) cls += 'done-dot';
      else             cls += 'miss-dot';
      return `<div class="${cls}" title="${mo}월${isDone ? ' ✓' : (isFuture ? '' : ' ✗')}">${mLabel}</div>`;
    }).join('');

    return `
      <div class="status-type-row">
        <div class="status-type-header">
          <span class="status-type-name">
            <i class="${typeInfo.icon}" style="color:${typeInfo.color}"></i>
            <span class="type-badge ${typeInfo.key}">${typeInfo.key}</span>
          </span>
          <span style="font-size:11px;font-weight:700;color:#555">${doneCount}/${maxMonth > 0 ? maxMonth : '?'}개월 · ${pct}%</span>
        </div>
        <div class="status-type-progress-wrap" style="margin-bottom:8px">
          <div class="status-type-progress-bar-bg">
            <div class="status-type-progress-bar ${typeInfo.key}-bar" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="status-type-months">${dots}</div>
      </div>
    `;
  }).join('');

  gridEl.innerHTML = rows ||
    `<div class="status-empty"><i class="fas fa-cloud-upload-alt"></i>업로드 이력이 없습니다</div>`;
}

// ===== UPLOAD =====
function setupDragDrop() {
  const zone = document.getElementById('uploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#e02020'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = '#e0e0e0'; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '#e0e0e0';
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });
}

function onFileSelected(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      uploadedFileData = { fileName: file.name, rows: jsonData };
      showToast(`📂 파일 로드 완료: ${file.name} (${jsonData.length}건)`);
      goUploadStep(2);
    } catch(err) {
      showToast('❌ 파일을 읽을 수 없습니다');
    }
  };
  reader.readAsBinaryString(file);
}

// Step2 배지 실시간 업데이트
function updateUploadBadge() {
  const year  = document.getElementById('uploadYear')?.value || '2026';
  const month = document.getElementById('uploadMonth')?.value || '5';
  const type  = document.querySelector('input[name="uploadType"]:checked')?.value || '신규신고';
  const badge = document.getElementById('uploadPeriodBadge');
  const text  = document.getElementById('uploadPeriodText');
  if (text) text.textContent = `${year}년 ${month}월 · ${type} 데이터로 업로드됩니다`;
}

function goUploadStep(step) {
  currentUploadStep = step;

  // Step2 이벤트 바인딩 (처음 진입 시)
  if (step === 2) {
    setTimeout(() => {
      document.querySelectorAll('input[name="uploadType"]').forEach(r =>
        r.addEventListener('change', updateUploadBadge));
      document.getElementById('uploadYear')?.addEventListener('change', updateUploadBadge);
      document.getElementById('uploadMonth')?.addEventListener('change', updateUploadBadge);
      updateUploadBadge();
    }, 50);
  }

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`uploadStep${i}`);
    if (el) el.style.display = i === step ? 'flex' : 'none';

    const stepEl = document.getElementById(`step${i}`);
    if (stepEl) {
      stepEl.classList.remove('active', 'done');
      if (i < step) stepEl.classList.add('done');
      if (i === step) stepEl.classList.add('active');
    }
  }

  if (step === 3) renderPreview();
  if (step === 4) executeUpload();
}

function renderPreview() {
  if (!uploadedFileData) return;

  const year  = document.getElementById('uploadYear')?.value || '2026';
  const month = document.getElementById('uploadMonth')?.value || '5';
  const type  = document.querySelector('input[name="uploadType"]:checked')?.value || '신규신고';

  // 기간·유형 배지
  const bar = document.getElementById('previewPeriodBar');
  if (bar) bar.innerHTML =
    `<i class="fas fa-calendar-check"></i> <b>${year}년 ${month}월</b> &nbsp;|&nbsp; 신고유형: <b>${type}</b> &nbsp;|&nbsp; 파일: <b>${uploadedFileData.fileName}</b>`;

  // 건수 정보
  const rows = uploadedFileData.rows;
  const info = document.getElementById('previewInfo');
  if (info) info.textContent = `✅ 총 ${fmt(rows.length)}건 데이터 미리보기 (상위 10건 표시)`;

  // 데이터 검증
  let warnCount = 0, errCount = 0, errMsgs = [];
  rows.forEach((r, idx) => {
    const imp   = r['제작사'] || r['수입사'] || r['importer'] || '';
    const model = r['차종명'] || r['모델명'] || r['model'] || '';
    const disp  = parseInt(r['배기량'] || r['displacement'] || 0);
    const cnt   = parseInt(r['등록 대수'] || r['등록대수'] || r['count'] || 0);
    if (!imp || !model) errCount++;
    if (!disp || disp <= 0) warnCount++;
    if (!cnt || cnt <= 0) warnCount++;
  });

  const vEl = document.getElementById('previewValidate');
  if (vEl) {
    if (errCount > 0) {
      vEl.className = 'preview-validate err';
      vEl.innerHTML = `⚠️ ${errCount}건에서 필수 항목(제작사·차종명)이 누락되었습니다. 엑셀 파일을 확인해 주세요.`;
    } else if (warnCount > 0) {
      vEl.className = 'preview-validate warn';
      vEl.innerHTML = `⚡ ${warnCount}건에서 배기량 또는 등록대수 값이 0이거나 비어있습니다. 확인 후 업로드하세요.`;
    } else {
      vEl.className = 'preview-validate ok';
      vEl.innerHTML = `✅ 모든 데이터 검증을 통과했습니다. 업로드를 진행해 주세요.`;
    }
  }

  // 미리보기 테이블
  const preview10 = rows.slice(0, 10);
  if (preview10.length > 0) {
    const header = document.getElementById('previewHeader');
    const body   = document.getElementById('previewBody');
    // 컬럼: 제작사, 차종명, 배기량, 등록대수
    const cols = ['제작사','차종명','배기량','등록 대수'];
    if (header) header.innerHTML = `<th>#</th>` + cols.map(k => `<th>${k}</th>`).join('');
    if (body) body.innerHTML = preview10.map((r, i) => {
      const imp   = r['제작사'] || r['수입사'] || r['importer'] || '<span style="color:#e02020">없음</span>';
      const model = r['차종명'] || r['모델명'] || r['model'] || '<span style="color:#e02020">없음</span>';
      const disp  = r['배기량'] || r['displacement'] || '-';
      const cnt   = r['등록 대수'] || r['등록대수'] || r['count'] || '-';
      return `<tr>
        <td><span class="rank-num">${i+1}</span></td>
        <td>${imp}</td><td>${model}</td>
        <td>${disp}cc</td><td><b>${fmt(cnt)}</b>대</td>
      </tr>`;
    }).join('');
  }
}

async function executeUpload() {
  const year  = parseInt(document.getElementById('uploadYear').value);
  const month = parseInt(document.getElementById('uploadMonth').value);
  const type  = document.querySelector('input[name="uploadType"]:checked')?.value || '신규신고';
  const result = document.getElementById('uploadResult');

  if (!uploadedFileData) {
    if (result) result.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:40px;color:#e02020"></i><p style="margin-top:12px;color:#e02020">업로드할 파일이 없습니다.</p>`;
    return;
  }

  if (result) result.innerHTML = `<div class="loader"></div><p style="color:#888;font-size:13px;margin-top:8px">${year}년 ${month}월 ${type} 데이터 업로드 중...</p>`;

  const rows = uploadedFileData.rows;
  let success = 0, fail = 0;

  for (const row of rows) {
    try {
      const record = {
        // id 는 API 가 자동 생성 — 직접 지정하지 않음
        year, month,
        report_type: type,
        importer: row['제작사'] || row['수입사'] || row['importer'] || '',
        model:    row['차종명'] || row['모델명'] || row['model'] || '',
        displacement: parseInt(row['배기량'] || row['displacement'] || 0),
        count:    parseInt(row['등록 대수'] || row['등록대수'] || row['count'] || 0),
      };
      const res = await fetch('tables/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.ok || res.status === 201) success++;
      else fail++;
    } catch { fail++; }
  }

  // 업로드 이력 기록 (id는 API 자동 생성)
  await fetch('tables/upload_history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action_type:  '업로드',
      file_name:    uploadedFileData.fileName,
      upload_date:  new Date().toLocaleString('ko-KR'),
      data_period:  `${year}년 ${month}월`,
      report_type:  type,
      record_count: success,
      uploader:     'admin',
      status:       fail === 0 ? '성공' : '부분성공',
    })
  });

  // 전역 캐시 갱신 → 홈·통계·분석·검색 모두 즉시 반영
  await refreshAllViews();

  if (result) {
    result.innerHTML = `
      <i class="fas fa-check-circle" style="font-size:48px;color:#4caf50;margin-bottom:12px"></i>
      <div style="font-size:18px;font-weight:800;color:#1a1a2e;margin-bottom:6px">업로드 완료!</div>
      <div class="upload-result-info">
        <div class="uri-row"><span>사용신고 기간</span><b>${year}년 ${month}월</b></div>
        <div class="uri-row"><span>신고 유형</span><b><span class="type-badge ${type}">${type}</span></b></div>
        <div class="uri-row"><span>등록 건수</span><b>${fmt(success)}건</b></div>
        ${fail > 0 ? `<div class="uri-row err"><span>실패</span><b>${fail}건</b></div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="primary-btn" style="flex:1" onclick="jumpToVerify(${year},${month})">
          <i class="fas fa-search"></i> 데이터 확인
        </button>
        <button class="back-step-btn" style="flex:1" onclick="resetUpload()">
          <i class="fas fa-redo"></i> 새 업로드
        </button>
      </div>
    `;
  }

  showToast(`✅ ${year}년 ${month}월 ${type} ${fmt(success)}건 업로드 완료`);

  // 🔔 알림 생성 (데이터 업데이트 시)
  addNotif(
    `📊 ${year}년 ${month}월 ${type} 데이터가 업데이트되었습니다`,
    `${fmt(success)}건 등록${fail > 0 ? ` · 실패 ${fail}건` : ''}`
  );
}

function resetUpload() {
  uploadedFileData = null;
  document.getElementById('fileInput').value = '';
  goUploadStep(1);
}

// ===== VERIFY =====
let verifyAllData = [];   // 현재 조회된 전체 데이터
let verifyFiltered = [];  // 검색 필터 후 데이터

async function loadVerifyData() {
  const year  = parseInt(document.getElementById('verifyYear')?.value  || 2026);
  const month = parseInt(document.getElementById('verifyMonth')?.value || 0); // 0 = 전체
  // 신고유형은 항상 전체 고정
  const type = '전체';

  // 기간 배지 업데이트
  const pb = document.getElementById('verifyPeriodBadge');
  const monthLabel = month === 0 ? '전체 월' : `${month}월`;
  if (pb) pb.innerHTML = `<i class="fas fa-calendar-alt"></i> 조회 기간: <b>${year}년 ${monthLabel}</b> &nbsp;|&nbsp; 신고유형: <b>전체</b>`;

  // 로딩 표시
  const verifyBadge = document.getElementById('verifyCountBadge');
  if (verifyBadge) verifyBadge.textContent = '조회 중...';

  try {
    // 전체 페이지 수집 후 필터
    const all = await fetchAllPages('registrations');
    // 연도 필터 (항상 적용)
    let data = all.filter(r => parseInt(r.year) === year);
    // 월 필터 (0 = 전체이면 생략)
    if (month !== 0) {
      data = data.filter(r => parseInt(r.month) === month);
    }
    // 신고유형 전체 고정 — 추가 필터 없음

    verifyAllData  = data;
    verifyFiltered = data;

    // ── 요약 통계 카드 ──
    const totalCount  = data.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    const importerSet = new Set(data.map(r => r.importer).filter(Boolean));
    const modelSet    = new Set(data.map(r => r.model).filter(Boolean)); // 고유 모델 수 (홈과 동일 기준)
    const periodSub   = month === 0 ? `${year}년 전체` : `${year}년 ${month}월`;
    const cards = document.getElementById('verifyStatCards');
    if (cards) cards.innerHTML = `
      <div class="vstat-card">
        <div class="vsc-label">총 등록대수</div>
        <div class="vsc-value">${fmt(totalCount)}<span class="vsc-unit">대</span></div>
        <div class="vsc-sub">${periodSub}</div>
      </div>
      <div class="vstat-card">
        <div class="vsc-label">수입사 수</div>
        <div class="vsc-value">${importerSet.size}<span class="vsc-unit">개</span></div>
      </div>
      <div class="vstat-card">
        <div class="vsc-label">모델 수</div>
        <div class="vsc-value">${modelSet.size}<span class="vsc-unit">개</span></div>
      </div>
    `;

    // ── 수입사별 집계 ──
    const impMap = {};
    data.forEach(r => {
      if (!impMap[r.importer]) impMap[r.importer] = { count: 0, models: new Set() };
      impMap[r.importer].count += (r.count || 0);
      impMap[r.importer].models.add(r.model);
    });
    const impArr = Object.entries(impMap)
      .map(([k, v]) => ({ importer: k, count: v.count, modelCount: v.models.size }))
      .sort((a, b) => b.count - a.count);
    const impBody = document.getElementById('verifyImporterBody');
    if (impBody) {
      if (impArr.length === 0) {
        impBody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-inbox"></i><p>데이터가 없습니다</p></div></td></tr>`;
      } else {
        impBody.innerHTML = impArr.map((r, i) => {
          const pct = totalCount > 0 ? (r.count / totalCount * 100).toFixed(1) : 0;
          const numCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          return `<tr>
            <td><span class="rank-num ${numCls}">${i+1}</span></td>
            <td><b>${r.importer}</b></td>
            <td>${r.modelCount}개</td>
            <td><b>${fmt(r.count)}</b>대</td>
            <td>
              <div class="pct-bar-wrap">
                <div class="pct-bar" style="width:${pct}%"></div>
                <span>${pct}%</span>
              </div>
            </td>
          </tr>`;
        }).join('');
      }
    }

    // ── 모델별 상세 렌더 ──
    renderVerifyDetailTable(data);

  } catch(e) {
    console.warn('데이터 로드 실패', e);
    showToast('⚠️ 데이터를 불러오지 못했습니다');
  }
}

// 검색 필터
function filterVerifyTable() {
  const q = (document.getElementById('verifySearchInput')?.value || '').toLowerCase();
  verifyFiltered = verifyAllData.filter(r =>
    (r.model || '').toLowerCase().includes(q) ||
    (r.importer || '').toLowerCase().includes(q)
  );
  renderVerifyDetailTable(verifyFiltered);
}

function renderVerifyDetailTable(data) {
  const badge = document.getElementById('verifyCountBadge');
  if (badge) badge.textContent = `${fmt(data.length)}건`;

  const body = document.getElementById('verifyBody');
  if (!body) return;

  if (data.length === 0) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i><p>데이터가 없습니다</p></div></td></tr>`;
    return;
  }

  const sorted = [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
  body.innerHTML = sorted.map((r, i) => {
    const t = r.report_type || '신규신고';
    const numCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `<tr>
      <td><span class="rank-num ${numCls}">${i+1}</span></td>
      <td>${r.importer || '-'}</td>
      <td>${r.model || '-'}</td>
      <td>${r.displacement ? r.displacement + 'cc' : '-'}</td>
      <td><span class="type-badge ${t}">${t}</span></td>
      <td><b>${fmt(r.count)}</b>대</td>
    </tr>`;
  }).join('');
}

// 업로드 완료 후 → 데이터 확인 탭으로 바로 이동
function jumpToVerify(year, month) {
  // ID로 안전하게 "데이터 확인" 탭 버튼 선택
  const verifyTabBtn = document.getElementById('atab-verify') || document.querySelector('.atab:nth-child(2)');
  switchAdminTab('verify', verifyTabBtn);
  setTimeout(() => {
    const yEl = document.getElementById('verifyYear');
    const mEl = document.getElementById('verifyMonth');
    if (yEl) yEl.value = year;
    if (mEl) mEl.value = month;
    // 신고유형은 전체 고정이므로 별도 설정 불필요
    loadVerifyData();
  }, 100);
}

// ===== HISTORY =====
let allHistory = [];

async function loadHistoryData() {
  try {
    const rows = await fetchAllPages('upload_history');
    // created_at 내림차순 (최신순)
    allHistory = rows.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    renderHistoryTable();
  } catch(e) {
    allHistory = [];
    renderHistoryTable();
  }
}

function filterHistory(filter, el) {
  historyFilter = filter;
  document.querySelectorAll('.htab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderHistoryTable();
}

function renderHistoryTable() {
  let data = allHistory;
  // action_type 기준 필터 (하위 호환: action_type 없는 레거시 레코드는 '업로드'로 간주)
  if (historyFilter === 'upload') {
    data = data.filter(r => !r.action_type || r.action_type === '업로드');
  } else if (historyFilter === 'edit') {
    data = data.filter(r => r.action_type === '데이터 수정');
  }

  const body = document.getElementById('historyBody');
  if (!body) return;

  if (data.length === 0) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-history"></i><p>이력이 없습니다</p></div></td></tr>`;
    return;
  }

  body.innerHTML = data.map(r => {
    // action_type 맹지: 업로드 / 데이터 수정 (레거시는 업로드로 표시)
    const actionType = r.action_type || '업로드';
    const actionCls  = actionType === '업로드' ? 'action-upload' : 'action-edit';
    const actionIcon = actionType === '업로드' ? 'fa-upload' : 'fa-edit';

    // 상태 맹지 스타일
    const statusCls = (r.status === '성공' || r.status === '전체삭제' || r.status === '삭제') ? 'success' : 'fail';
    const type = r.report_type || '신규신고';

    // data_period → "2026년 5월" 파싱 (확인 버튼용 - 업로드 이력에만 의미 있음)
    const match = (r.data_period || '').match(/(\d+)년\s*(\d+)월/);
    const yr = match ? match[1] : '';
    const mo = match ? match[2] : '';
    const canVerify = actionType === '업로드' && yr && mo;

    return `<tr>
      <td><b>${r.data_period || '-'}</b></td>
      <td><span class="action-badge ${actionCls}"><i class="fas ${actionIcon}"></i> ${actionType}</span></td>
      <td><span class="type-badge ${type}">${type}</span></td>
      <td style="font-size:10px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.file_name || ''}">${r.file_name || '-'}</td>
      <td style="font-size:10px">${r.upload_date || '-'}</td>
      <td><b>${fmt(r.record_count)}</b>건</td>
      <td><span class="status-badge ${statusCls}">${r.status || '-'}</span></td>
      <td>
        ${canVerify
          ? `<button class="hist-check-btn" onclick="jumpToVerify(${yr},${mo},'${type}')">
               <i class="fas fa-search"></i> 확인
             </button>`
          : `<span style="color:#ccc;font-size:11px">—</span>`
        }
      </td>
    </tr>`;
  }).join('');
}

// ===== 공유 기능 =====

let currentShareKey = '';

/**
 * 현재 실제 데이터를 기반으로 공유 텍스트를 동적으로 생성
 */
function buildShareText(key) {
  const periodLabel = currentYear > 0 && currentMonth > 0
    ? `${currentYear}년 ${currentMonth}월`
    : currentYear > 0 ? `${currentYear}년 전체` : '전체 기간';

  // 현재 기간 데이터
  const periodData = (currentYear > 0 && currentMonth > 0)
    ? allRegistrations.filter(r => parseInt(r.year) === currentYear && parseInt(r.month) === currentMonth)
    : allRegistrations;

  if (key === 'stats-importer') {
    // 수입사별 합산
    const importerMap = {};
    periodData.forEach(r => {
      const imp = r.importer || '기타';
      importerMap[imp] = (importerMap[imp] || 0) + (parseInt(r.count) || 0);
    });
    const sorted = Object.entries(importerMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const lines  = sorted.map((e, i) => `${i + 1}위 ${e[0]}  ${fmt(e[1])}대`).join('\n');
    const total  = periodData.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    return `🏆 수입사 TOP 10\n\n📅 ${periodLabel} 기준\n총 ${fmt(total)}대 신규 등록\n\n${lines || '(데이터 없음)'}\n\n🏍️ MOTO CHART - 오토바이 시장 데이터`;
  }

  if (key === 'stats-model') {
    // 모델별 합산
    const modelMap = {};
    periodData.forEach(r => {
      const mdl = r.model || '기타';
      modelMap[mdl] = (modelMap[mdl] || 0) + (parseInt(r.count) || 0);
    });
    const sorted = Object.entries(modelMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const lines  = sorted.map((e, i) => `${i + 1}위 ${e[0]}  ${fmt(e[1])}대`).join('\n');
    const total  = periodData.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    return `🏆 모델 TOP 10\n\n📅 ${periodLabel} 기준\n총 ${fmt(total)}대 신규 등록\n\n${lines || '(데이터 없음)'}\n\n🏍️ MOTO CHART - 오토바이 시장 데이터`;
  }

  if (key === 'analysis-displacement') {
    // 배기량 구간별 합산
    const rangeMap = {};
    DISPLACEMENT_RANGES.forEach(r => { rangeMap[r.label] = 0; });
    const total = periodData.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    periodData.forEach(r => {
      const lbl = getDisplacementRange(parseInt(r.displacement) || 0);
      if (rangeMap[lbl] !== undefined) rangeMap[lbl] += (parseInt(r.count) || 0);
    });
    const lines = DISPLACEMENT_RANGES.map(r => {
      const pct = total > 0 ? ((rangeMap[r.label] / total) * 100).toFixed(1) : '0.0';
      return `${r.label}: ${pct}%`;
    }).join('\n');
    return `📊 배기량별 통계\n\n📅 ${periodLabel} 기준\n총 ${fmt(total)}대 신규 등록\n\n${lines}\n\n🏍️ MOTO CHART - 오토바이 시장 데이터`;
  }

  if (key === 'analysis-trend') {
    // 현재 연도 월별 누적
    const yearData = currentYear > 0
      ? allRegistrations.filter(r => parseInt(r.year) === currentYear)
      : allRegistrations;
    const cumul = yearData.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    const monthTotal = periodData.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    return `📈 월별 등록대수 추이\n\n📅 ${periodLabel} 기준\n이번 달: ${fmt(monthTotal)}대\n${currentYear > 0 ? `${currentYear}년 누적: ${fmt(cumul)}대` : ''}\n\n🏍️ MOTO CHART - 오토바이 시장 데이터`;
  }

  return `🏍️ MOTO CHART\n${periodLabel} 오토바이 시장 데이터\n\n${window.location.href}`;
}

function shareCurrentPage() {
  // 현재 페이지/탭에 따른 공유 키 결정
  if (currentPage === 'stats') {
    currentShareKey = currentStatsTab === 'model' ? 'stats-model' : 'stats-importer';
  } else if (currentPage === 'analysis') {
    const tab = currentAnalysisTab || 'displacement';
    currentShareKey = `analysis-${tab}`;
    const validKeys = ['stats-importer','stats-model','analysis-displacement','analysis-trend'];
    if (!validKeys.includes(currentShareKey)) currentShareKey = 'analysis-displacement';
  } else {
    return; // 다른 탭은 공유 없음
  }

  const titles = {
    'stats-importer':        '🏆 수입사 TOP 10 공유하기',
    'stats-model':           '🏆 모델 TOP 10 공유하기',
    'analysis-displacement': '📊 배기량별 통계 공유하기',
    'analysis-trend':        '📈 월별 추이 공유하기',
  };
  const periodLabel = currentYear > 0 && currentMonth > 0
    ? `${currentYear}년 ${currentMonth}월 기준 데이터`
    : currentYear > 0 ? `${currentYear}년 기준 데이터` : '';

  document.getElementById('shareSheetTitle').textContent = titles[currentShareKey] || '공유하기';
  document.getElementById('shareSheetDesc').textContent  = periodLabel;
  document.getElementById('sharePreviewBox').textContent = buildShareText(currentShareKey);

  document.getElementById('shareOverlay').classList.add('open');
}

function closeShareSheet(e) {
  if (e.target === document.getElementById('shareOverlay')) closeShareSheetBtn();
}
function closeShareSheetBtn() {
  document.getElementById('shareOverlay').classList.remove('open');
}

function doShare(channel) {
  const shareText = buildShareText(currentShareKey);
  const shareUrl  = window.location.href;
  const title     = document.getElementById('shareSheetTitle')?.textContent || 'MOTO CHART';

  switch (channel) {
    case 'kakao': {
      // 카카오톡 공유: 모바일은 앱 딥링크, 데스크탑은 Web Sharer로 fallback
      const kakaoText  = encodeURIComponent(shareText);
      const kakaoUrl   = encodeURIComponent(shareUrl);
      const kakaoSendUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=NONE&text=${kakaoText}&url=${kakaoUrl}`;

      // Web Share API 우선 시도 (모바일 앱 연동)
      if (navigator.share) {
        navigator.share({ title, text: shareText, url: shareUrl })
          .then(() => closeShareSheetBtn())
          .catch(err => {
            // 사용자가 취소한 경우 무시
            if (err.name !== 'AbortError') {
              // fallback: 텍스트 복사
              _copyToClipboard(shareText + '\n' + shareUrl, '📋 카카오톡을 직접 열어 붙여넣기 하세요');
            }
          });
      } else {
        // 데스크탑: 텍스트 복사 후 안내
        _copyToClipboard(shareText + '\n' + shareUrl, '📋 내용이 복사되었습니다. 카카오톡에 붙여넣기 하세요');
      }
      closeShareSheetBtn();
      break;
    }

    case 'copy': {
      _copyToClipboard(shareText + '\n\n' + shareUrl, '🔗 링크와 내용이 복사되었습니다');
      closeShareSheetBtn();
      break;
    }
  }
}

/** 클립보드 복사 헬퍼 */
function _copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg))
      .catch(() => _copyFallback(text, successMsg));
  } else {
    _copyFallback(text, successMsg);
  }
}
function _copyFallback(text, successMsg) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(successMsg);
  } catch {
    showToast('❌ 복사에 실패했습니다. 직접 선택해서 복사해주세요');
  }
}

// ===== 핸드폰 번호 포맷 =====
function formatPhone(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length <= 3) {
    input.value = v;
  } else if (v.length <= 7) {
    input.value = v.slice(0,3) + '-' + v.slice(3);
  } else {
    input.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7,11);
  }
}

// ===== 엑셀 양식 다운로드 =====
function downloadTemplate() {
  const sampleData = [
    { '제작사': 'HONDA',         '차종명': 'HONDA PCX',           '배기량': 125,  '등록 대수': 1628 },
    { '제작사': 'YAMAHA',        '차종명': 'YAMAHA NMAX',          '배기량': 155,  '등록 대수': 1322 },
    { '제작사': 'HONDA',         '차종명': 'HONDA ADV 160',        '배기량': 160,  '등록 대수': 931  },
    { '제작사': 'HONDA',         '차종명': 'HONDA SUPER CUB',      '배기량': 110,  '등록 대수': 812  },
    { '제작사': 'YAMAHA',        '차종명': 'YAMAHA XMAX 300',      '배기량': 300,  '등록 대수': 735  },
    { '제작사': 'BMW MOTORRAD',  '차종명': 'BMW R 1250 GS',        '배기량': 1254, '등록 대수': 614  },
    { '제작사': 'KAWASAKI',      '차종명': 'Kawasaki Ninja 400',   '배기량': 399,  '등록 대수': 563  },
    { '제작사': 'YAMAHA',        '차종명': 'YAMAHA MT-07',         '배기량': 689,  '등록 대수': 512  },
    { '제작사': 'BMW MOTORRAD',  '차종명': 'BMW R 1300 GS',        '배기량': 1300, '등록 대수': 488  },
    { '제작사': 'KAWASAKI',      '차종명': 'Kawasaki Z900',        '배기량': 900,  '등록 대수': 465  },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // 컬럼 너비 설정
  ws['!cols'] = [
    { wch: 18 }, // 제작사
    { wch: 28 }, // 차종명
    { wch: 12 }, // 배기량
    { wch: 12 }, // 등록 대수
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '등록대수_양식');

  // 안내 시트 추가
  const guideData = [
    { '항목': '제작사',   '설명': '수입사 또는 제작사명 (예: HONDA, YAMAHA)',  '필수여부': '필수' },
    { '항목': '차종명',   '설명': '모델명 (예: HONDA PCX, YAMAHA NMAX)',       '필수여부': '필수' },
    { '항목': '배기량',   '설명': '배기량 (cc 단위 숫자만 입력, 예: 125)',      '필수여부': '필수' },
    { '항목': '등록 대수','설명': '월별 등록대수 (숫자만 입력, 예: 1628)',      '필수여부': '필수' },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 14 }, { wch: 44 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, '작성안내');

  XLSX.writeFile(wb, 'MOTOCHART_업로드양식.xlsx');
  showToast('📥 엑셀 양식이 다운로드되었습니다');
}

// ===== UTILS =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== 알림 시스템 =====
// LocalStorage 키: 'motoNotifs'
// 구조: [{ id, msg, detail, time, read }]

function getNotifs() {
  return JSON.parse(localStorage.getItem('motoNotifs') || '[]');
}

function saveNotifs(list) {
  localStorage.setItem('motoNotifs', JSON.stringify(list));
}

// 알림 추가 (업로드 완료 시 호출)
function addNotif(msg, detail) {
  const list = getNotifs();
  list.unshift({
    id:     `n_${Date.now()}`,
    msg,
    detail: detail || '',
    time:   new Date().toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }),
    read:   false,
  });
  // 최대 50개 유지
  if (list.length > 50) list.splice(50);
  saveNotifs(list);
  updateNotifBadge();
}

// 뱃지 업데이트
function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const unread = getNotifs().filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// 패널 열기/닫기 토글
function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  const dim   = document.getElementById('notifDim');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  if (isOpen) {
    closeNotifPanel();
  } else {
    renderNotifList();
    panel.style.display = 'block';
    dim.style.display   = 'block';
  }
}

function closeNotifPanel() {
  const panel = document.getElementById('notifPanel');
  const dim   = document.getElementById('notifDim');
  if (panel) panel.style.display = 'none';
  if (dim)   dim.style.display   = 'none';
}

// 알림 목록 렌더링
function renderNotifList() {
  const list = getNotifs();
  const ul   = document.getElementById('notifList');
  if (!ul) return;

  if (list.length === 0) {
    ul.innerHTML = `
      <div class="notif-empty">
        <i class="fas fa-bell-slash"></i>
        데이터 업데이트 알림이 없습니다
      </div>`;
    return;
  }

  ul.innerHTML = list.map(n => `
    <li class="notif-item ${n.read ? '' : 'unread'}" onclick="readNotif('${n.id}')">
      <div class="notif-icon"><i class="fas fa-database"></i></div>
      <div class="notif-body">
        <div class="notif-msg">${n.msg}</div>
        ${n.detail ? `<div class="notif-time">${n.detail} &nbsp;·&nbsp; ${n.time}</div>` : `<div class="notif-time">${n.time}</div>`}
      </div>
      ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
    </li>
  `).join('');
}

// 개별 읽음 처리
function readNotif(id) {
  const list = getNotifs();
  const item = list.find(n => n.id === id);
  if (item) { item.read = true; saveNotifs(list); }
  renderNotifList();
  updateNotifBadge();
}

// 모두 읽음 처리
function markAllRead() {
  const list = getNotifs().map(n => ({ ...n, read: true }));
  saveNotifs(list);
  renderNotifList();
  updateNotifBadge();
}

// (뱃지 초기화는 위 DOMContentLoaded에서 처리)
