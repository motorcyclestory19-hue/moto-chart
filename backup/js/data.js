// ===== MOTO CHART DATA LAYER =====

// 로컬 캐시 (API 응답 저장)
const DataCache = {};
let allRegistrations = [];

// 색상 팔레트
const BRAND_COLORS = {
  'HONDA': '#e02020',
  'YAMAHA': '#1565c0',
  'BMW MOTORRAD': '#1a237e',
  'KAWASAKI': '#2e7d32',
  'SUZUKI': '#f57f17',
  'HARLEY-DAVIDSON': '#4a148c',
  'TRIUMPH': '#00695c',
  'DUCATI': '#c62828',
  'KTM': '#e65100',
  'APRILIA': '#4527a0',
};
const DEFAULT_COLORS = ['#e02020','#1565c0','#2e7d32','#f57f17','#4a148c','#00695c','#c62828','#e65100','#4527a0','#00838f'];

const DISPLACEMENT_RANGES = [
  { label: '125cc 이하',    max: 125,  color: '#e02020' },
  { label: '126~400cc',    min: 126,  max: 400,  color: '#ff7043' },
  { label: '401~900cc',    min: 401,  max: 900,  color: '#ffa726' },
  { label: '901~1000cc',   min: 901,  max: 1000, color: '#42a5f5' },
  { label: '1000cc 초과',  min: 1001, color: '#ab47bc' },
];

// ===== API Functions =====

// 페이지네이션으로 테이블 전체 데이터를 모두 수집
async function fetchAllPages(tableName) {
  const PAGE_SIZE = 500;
  let page = 1;
  let collected = [];

  while (true) {
    const res  = await fetch(`tables/${tableName}?limit=${PAGE_SIZE}&page=${page}`);
    const json = await res.json();
    const rows = json.data || [];
    collected = collected.concat(rows);

    // 마지막 페이지 판별: 받은 수가 PAGE_SIZE 미만이면 끝
    if (rows.length < PAGE_SIZE) break;
    page++;
    // 안전 상한 (무한 루프 방지)
    if (page > 100) break;
  }
  return collected;
}

// ===== upload_history 캐시 =====
let _uploadHistory = [];       // upload_history 전체 캐시
let _uploadHistoryFetched = false;

async function fetchUploadHistory(force = false) {
  if (!force && _uploadHistoryFetched) return _uploadHistory;
  try {
    _uploadHistory = await fetchAllPages('upload_history');
    _uploadHistoryFetched = true;
  } catch(e) {
    console.warn('upload_history 조회 오류');
  }
  return _uploadHistory;
}

/**
 * upload_history에 실제 업로드 이력이 존재하는 연도+월 Set 반환
 * 형식: Set { "2026-1", "2026-2", ... }
 * year=0 이면 전체, month=0 이면 해당 연도 전체 월 포함 여부만 확인
 */
function getUploadedYearMonths() {
  const s = new Set();
  _uploadHistory.forEach(h => {
    // data_period 파싱: "2026년 1월", "2026년 5월" 형태
    const m1 = (h.data_period || '').match(/(\d{4})[^\d]+(\d{1,2})/);
    if (m1) {
      s.add(`${parseInt(m1[1])}-${parseInt(m1[2])}`);
      return;
    }
    // year/month 필드가 있는 경우 대비
    if (h.year && h.month) s.add(`${parseInt(h.year)}-${parseInt(h.month)}`);
  });
  return s;
}

/**
 * 특정 연도+월에 실제 업로드 이력이 있는지 확인
 * month=0 이면 해당 연도에 1개월이라도 있으면 true
 */
function hasUploadedData(year, month) {
  if (!year || year === 0) return true; // 전체 모드는 항상 허용
  const uploaded = getUploadedYearMonths();
  if (month && month > 0) {
    return uploaded.has(`${year}-${month}`);
  }
  // month=0: 해당 연도에 어떤 월이든 있으면 true
  for (const key of uploaded) {
    if (key.startsWith(`${year}-`)) return true;
  }
  return false;
}

// ===== 자동 갱신 타이머 =====
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5분(ms)
let _autoRefreshTimer = null;

/**
 * 5분마다 registrations + upload_history 를 재조회하고
 * 현재 열려 있는 탭(home/stats/analysis/search)을 즉시 리렌더한다.
 * admin 탭에서는 렌더를 건너뛴다 (업로드 작업 방해 방지).
 */
function startAutoRefresh() {
  stopAutoRefresh(); // 중복 방지
  _autoRefreshTimer = setInterval(async () => {
    // admin 탭이면 데이터만 조용히 갱신하고 렌더는 하지 않음
    if (typeof currentPage !== 'undefined' && currentPage === 'admin') return;

    try {
      await Promise.all([
        fetchAllRegistrations(true),
        fetchUploadHistory(true),
      ]);
    } catch(e) {
      console.warn('[AutoRefresh] 데이터 갱신 오류:', e);
      return;
    }

    // 현재 탭 리렌더
    if (typeof currentPage === 'undefined') return;
    switch (currentPage) {
      case 'home':
        if (typeof renderHomePage === 'function') renderHomePage();
        break;
      case 'stats':
        if (typeof renderStatsPage === 'function')
          renderStatsPage(typeof currentStatsTab !== 'undefined' ? currentStatsTab : 'importer');
        break;
      case 'analysis':
        if (typeof renderAnalysisPage === 'function')
          renderAnalysisPage(typeof currentAnalysisTab !== 'undefined' ? currentAnalysisTab : 'displacement');
        break;
      case 'search':
        if (typeof renderSearchPage === 'function') renderSearchPage();
        break;
    }

    // 갱신 완료 토스트 (app.js에 정의)
    if (typeof showAutoRefreshToast === 'function') showAutoRefreshToast();
    console.info('[AutoRefresh] 데이터 자동 갱신 완료 —', new Date().toLocaleTimeString('ko-KR'));
  }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (_autoRefreshTimer !== null) {
    clearInterval(_autoRefreshTimer);
    _autoRefreshTimer = null;
  }
}

// 마지막 fetch 완료 시각 (스마트 캐시용)
let _lastFetchTime = 0;
const _CACHE_TTL = 30 * 1000; // 30초

async function fetchAllRegistrations(force = false) {
  const now = Date.now();
  // force 아닌데 30초 이내 캐시가 있으면 재사용 (탭 이동 연속 클릭 시 중복 요청 방지)
  if (!force && allRegistrations.length > 0 && (now - _lastFetchTime) < _CACHE_TTL) {
    return allRegistrations;
  }
  try {
    const fresh = await fetchAllPages('registrations');
    allRegistrations = fresh;  // 성공했을 때만 교체
    _lastFetchTime = Date.now();
    return allRegistrations;
  } catch(e) {
    console.warn('API 오류, 기존 캐시 유지');
    // 실패해도 기존 allRegistrations 유지 (샘플 데이터로 덮어쓰지 않음)
    return allRegistrations;
  }
}

// 기간별 필터 (0 = 전체, 문자열/숫자 타입 혼용 대응)
function filterByPeriod(data, year, month) {
  const y = parseInt(year)  || 0;
  const m = parseInt(month) || 0;
  return data.filter(r => {
    const ry = parseInt(r.year)  || 0;
    const rm = parseInt(r.month) || 0;
    const yearOk  = (y === 0) || (ry === y);
    const monthOk = (m === 0) || (rm === m);
    return yearOk && monthOk;
  });
}

// 수입사별 집계 (count 숫자 변환 보장)
function aggregateByImporter(data) {
  const map = {};
  data.forEach(r => {
    if (!map[r.importer]) map[r.importer] = 0;
    map[r.importer] += parseInt(r.count) || 0;
  });
  return Object.entries(map)
    .map(([k, v]) => ({ importer: k, count: v }))
    .sort((a, b) => b.count - a.count);
}

// 모델별 집계 (count 숫자 변환 보장)
function aggregateByModel(data) {
  const map = {};
  data.forEach(r => {
    const key = r.model;
    if (!map[key]) map[key] = {
      model: r.model,
      importer: r.importer,
      displacement: parseInt(r.displacement) || 0,
      count: 0
    };
    map[key].count += parseInt(r.count) || 0;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// 배기량 구간 분류
function getDisplacementRange(cc) {
  if (cc <= 125)  return '125cc 이하';
  if (cc <= 400)  return '126~400cc';
  if (cc <= 900)  return '401~900cc';
  if (cc <= 1000) return '901~1000cc';
  return '1000cc 초과';
}

function aggregateByDisplacement(data) {
  const map = {};
  DISPLACEMENT_RANGES.forEach(r => { map[r.label] = 0; });
  data.forEach(r => {
    const label = getDisplacementRange(parseInt(r.displacement) || 0);
    if (map[label] !== undefined) map[label] += parseInt(r.count) || 0;
  });
  return DISPLACEMENT_RANGES.map(r => ({ label: r.label, count: map[r.label], color: r.color }));
}

// 전년 대비 계산
function calcYoYChange(current, prev) {
  if (!prev || prev === 0) return null;
  const pct = ((current - prev) / prev * 100).toFixed(1);
  return parseFloat(pct);
}

// 숫자 포맷
function fmt(n) {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString('ko-KR');
}

function fmtChange(pct) {
  if (pct === null || pct === undefined) return '<span class="change-same">-</span>';
  const cls = pct > 0 ? 'change-up' : (pct < 0 ? 'change-down' : 'change-same');
  const arrow = pct > 0 ? '▲' : (pct < 0 ? '▼' : '-');
  return `<span class="${cls}">${arrow} ${Math.abs(pct)}%</span>`;
}



// ===== 월별 등록대수 추이 데이터 생성 =====
function getMonthlyTotalByYear(data, year) {
  const monthly = {};
  for (let m = 1; m <= 12; m++) monthly[m] = 0;
  data.filter(r => r.year == year).forEach(r => {
    if (monthly[r.month] !== undefined) monthly[r.month] += r.count;
  });
  return monthly;
}

// 연도별 합계
function getYearlyTotal(data) {
  const map = {};
  data.forEach(r => {
    if (!map[r.year]) map[r.year] = 0;
    map[r.year] += r.count;
  });
  return map;
}
