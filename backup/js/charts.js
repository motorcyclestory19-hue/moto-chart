// ===== MOTO CHART - Chart Rendering =====
// 전역 Chart.js 기본값: 축 글자/격자 모두 진하게
Chart.defaults.color = '#333';
Chart.defaults.borderColor = '#ddd';
Chart.defaults.font.family = "'Noto Sans KR', sans-serif";

let chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ===== HOME TREND CHART =====
function renderHomeTrendChart(data) {
  destroyChart('homeTrendChart');
  const ctx = document.getElementById('homeTrendChart');
  if (!ctx) return;

  const labels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  // API 데이터에서 연도별 월별 합산 계산
  function calcMonthly(yr) {
    return labels.map((_, i) => {
      const mo = i + 1;
      const sum = data
        .filter(r => parseInt(r.year) === yr && parseInt(r.month) === mo)
        .reduce((s, r) => s + (parseInt(r.count) || 0), 0);
      return sum > 0 ? sum : null;
    });
  }

  // upload_history에 실제 업로드 이력이 있는 연도만 표시 (테스트 레코드 제외)
  // hasUploadedData(year, 0): 해당 연도에 1개월이라도 공식 업로드 이력 있으면 true
  const yearsInData = [...new Set(data.map(r => parseInt(r.year)).filter(Boolean))].sort((a,b) => b-a);
  const validYears  = yearsInData.filter(yr =>
    typeof hasUploadedData === 'function' ? hasUploadedData(yr, 0) : true
  );

  // 최근 2개 연도만 표시 (공식 업로드 이력 있는 연도 기준)
  const targetYears = validYears.slice(0, 2);

  const YEAR_COLORS = [
    { borderColor: '#e02020', backgroundColor: 'rgba(224,32,32,0.08)', fill: true,  borderWidth: 2.5, pointRadius: 4, borderDash: undefined },
    { borderColor: '#444',    backgroundColor: 'transparent',           fill: false, borderWidth: 2,   pointRadius: 3, borderDash: [5, 4]   },
  ];

  const datasets = targetYears.map((yr, idx) => {
    const monthlyData = calcMonthly(yr);
    const style = YEAR_COLORS[idx] || YEAR_COLORS[1];
    return {
      label: `${yr}년`,
      data: monthlyData,
      borderColor: style.borderColor,
      backgroundColor: style.backgroundColor,
      fill: style.fill,
      tension: 0.4,
      borderWidth: style.borderWidth,
      borderDash: style.borderDash,
      pointRadius: style.pointRadius,
      pointBackgroundColor: style.borderColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      spanGaps: false,
    };
  });

  // 데이터가 하나도 없으면 빈 안내 표시
  if (datasets.length === 0) {
    ctx.parentElement.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#bbb;font-size:12px"><i class="fas fa-chart-line" style="margin-right:6px"></i>업로드된 데이터가 없습니다</div>`;
    return;
  }

  chartInstances['homeTrendChart'] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: { font: { size: 11, weight: '600' }, color: '#333', boxWidth: 14, padding: 12,
            generateLabels: (chart) => {
              return chart.data.datasets.map((ds, i) => ({
                text: ds.label,
                fillStyle: ds.borderColor,
                strokeStyle: ds.borderColor,
                lineWidth: 2,
                lineDash: ds.borderDash || [],
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i,
              }));
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: ctx => {
              // null 값(데이터 없는 달)은 툴팁에서 숨김
              if (ctx.parsed.y === null || ctx.parsed.y === undefined) return null;
              return ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}대`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '500' }, color: '#333' }
        },
        y: {
          grid: { color: '#e8e8e8', lineWidth: 1 },
          border: { dash: [3,3] },
          ticks: {
            font: { size: 11, weight: '500' }, color: '#333',
            callback: v => fmt(v)
          },
          beginAtZero: false,
        }
      }
    }
  });
}

// ===== DISPLACEMENT DONUT =====
function renderDisplacementDonut(data, year, month) {
  destroyChart('displacementDonut');
  const ctx = document.getElementById('displacementDonut');
  if (!ctx) return;

  const periodData = filterByPeriod(data, year, month);
  const grouped = aggregateByDisplacement(periodData);
  const total = grouped.reduce((s, g) => s + g.count, 0);

  chartInstances['displacementDonut'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: grouped.map(g => g.label),
      datasets: [{
        data: grouped.map(g => g.count),
        backgroundColor: grouped.map(g => g.color),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed;
              const pct = total > 0 ? (val/total*100).toFixed(1) : 0;
              return ` ${fmt(val)}대 (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw(chart) {
        const {width, height, ctx} = chart;
        ctx.save();
        ctx.font = `bold 18px 'Noto Sans KR'`;
        ctx.fillStyle = '#1a1a2e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fmt(total), width/2, height/2 - 8);
        ctx.font = `11px 'Noto Sans KR'`;
        ctx.fillStyle = '#888';
        ctx.fillText('총 등록대수', width/2, height/2 + 12);
        ctx.restore();
      }
    }]
  });

  // Legend
  const legendEl = document.getElementById('displacementLegend');
  if (legendEl) {
    legendEl.innerHTML = grouped.map(g => {
      const pct = total > 0 ? (g.count/total*100).toFixed(1) : 0;
      return `<div class="legend-item">
        <span class="legend-color" style="background:${g.color}"></span>
        <span>${g.label} <b>${pct}%</b></span>
      </div>`;
    }).join('');
  }
}

// ===== DISPLACEMENT TREND CHART =====
function renderDisplacementTrendChart(data) {
  destroyChart('displacementTrendChart');
  const ctx = document.getElementById('displacementTrendChart');
  if (!ctx) return;

  // ── upload_history 기반으로 실제 업로드된 월만 추출 (최근 6개) ──
  const uploadedYM = (typeof getUploadedYearMonths === 'function')
    ? getUploadedYearMonths()   // Set { "2026-1", "2026-2", ... }
    : new Set();

  // 업로드 이력을 오름차순 정렬 후 최근 6개 슬라이스
  const sortedUploaded = [...uploadedYM]
    .map(key => {
      const [y, m] = key.split('-').map(Number);
      return { y, m };
    })
    .sort((a, b) => a.y !== b.y ? a.y - b.y : a.m - b.m)
    .slice(-6);

  // 업로드된 달이 하나도 없으면 빈 상태 표시
  if (sortedUploaded.length === 0) {
    ctx.parentElement.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#aaa;padding:20px 0"><i class="fas fa-chart-line" style="font-size:28px;margin-bottom:10px"></i><p style="font-size:13px;font-weight:600">데이터가 없습니다</p><p style="font-size:11px;margin-top:4px">업로드된 데이터가 없습니다</p></div>`;
    return;
  }

  // 라벨: 연도가 섞이면 'YY.MM', 같은 해면 'M월'
  const labelYears = [...new Set(sortedUploaded.map(r => r.y))];
  const multiYear  = labelYears.length > 1;
  const labels = sortedUploaded.map(r =>
    multiYear
      ? `'${String(r.y).slice(2)}.${String(r.m).padStart(2,'0')}`
      : `${r.m}월`
  );

  // 각 월·배기량 구간별 집계 (parseInt로 타입 통일)
  // 실제 데이터 없는 달은 null → 선 끊김·툴팁 미표시
  const datasets = DISPLACEMENT_RANGES.map(range => {
    const counts = sortedUploaded.map(({ y, m }) => {
      const val = data
        .filter(r =>
          parseInt(r.year)  === y &&
          parseInt(r.month) === m &&
          getDisplacementRange(parseInt(r.displacement) || 0) === range.label
        )
        .reduce((s, r) => s + (parseInt(r.count) || 0), 0);
      return val > 0 ? val : null;
    });
    return {
      label: range.label, data: counts,
      borderColor: range.color, backgroundColor: range.color + '22',
      fill: false, tension: 0.4, borderWidth: 2,
      pointRadius: 4, pointBackgroundColor: range.color,
      pointBorderColor: '#fff', pointBorderWidth: 1.5,
      spanGaps: false,
    };
  });

  // 모든 값이 null이면 (업로드 이력은 있으나 실제 registrations 데이터 없음) 빈 상태
  const hasAnyData = datasets.some(ds => ds.data.some(v => v !== null));
  if (!hasAnyData) {
    ctx.parentElement.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#aaa;padding:20px 0"><i class="fas fa-chart-line" style="font-size:28px;margin-bottom:10px"></i><p style="font-size:13px;font-weight:600">데이터가 없습니다</p><p style="font-size:11px;margin-top:4px">등록된 배기량 데이터가 없습니다</p></div>`;
    return;
  }

  chartInstances['displacementTrendChart'] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: {
            font: { size: 10, weight: '600' },
            color: '#333',
            padding: 10,
            usePointStyle: true,
            pointStyle: 'line',
            boxWidth: 20,
            boxHeight: 3,
          }
        },
        tooltip: {
          mode: 'index', intersect: false,
          callbacks: {
            label: c => {
              if (c.parsed.y === null || c.parsed.y === undefined) return null;
              return ` ${c.dataset.label}: ${fmt(c.parsed.y)}대`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' }, color: '#333' } },
        y: {
          grid: { color: '#e8e8e8' },
          beginAtZero: true,
          ticks: { font: { size: 11, weight: '500' }, color: '#333', callback: v => fmt(v) }
        }
      }
    }
  });
}

// ===== MONTHLY TREND CHART =====
function renderMonthlyTrendChart(periodMonths) {
  // periodMonths: 12 / 24 / 36 / 0(전체)
  // allRegistrations(API 실제 데이터) 기반으로 월별 합산
  const period = (periodMonths !== undefined) ? periodMonths : 12;
  destroyChart('monthlyTrendChart');
  const ctx = document.getElementById('monthlyTrendChart');
  if (!ctx) return;

  // API 데이터에서 월별 합산 (buildMonthlyAll은 app.js에 정의)
  const source = (typeof buildMonthlyAll === 'function') ? buildMonthlyAll() : [];

  if (source.length === 0) {
    ctx.parentElement.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#aaa;padding:40px 0"><i class="fas fa-chart-line" style="font-size:32px;margin-bottom:12px"></i><p style="font-size:13px;font-weight:600">\ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</p><p style="font-size:11px;margin-top:4px">\uc5c5\ub85c\ub4dc\ub41c \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</p></div>`;
    return;
  }

  const slice  = period > 0 ? source.slice(-period) : [...source];

  // 연도가 여러 개면 "YY.MM" 라벨, 단일 연도면 "M월"
  const years = [...new Set(slice.map(r => r.y))];
  const multiYear = years.length > 1;
  const labels = slice.map(r => multiYear
    ? `'${String(r.y).slice(2)}.${String(r.m).padStart(2,'0')}`
    : `${r.m}월`
  );

  // 연도별로 데이터셋 분리 (연도 순서에 따라 색상 자동 할당)
  const YEAR_PALETTE = [
    { border: '#b0bec5', bg: 'rgba(176,190,197,0.08)', dash: [4,3] },
    { border: '#78909c', bg: 'rgba(120,144,156,0.08)', dash: [4,3] },
    { border: '#1565c0', bg: 'rgba(21,101,192,0.08)',  dash: [5,4] },
    { border: '#e02020', bg: 'rgba(224,32,32,0.10)',   dash: [] },
  ];
  const maxYear = Math.max(...years);

  // 슬라이스 내 연도별 값 배열 만들기 (없는 달은 null)
  const datasets = years.map((y, idx) => {
    const paletteIdx = Math.max(0, YEAR_PALETTE.length - years.length + idx);
    const palette = YEAR_PALETTE[paletteIdx] || { border: '#aaa', bg: 'rgba(0,0,0,0.05)', dash: [] };
    const isCurrent = y === maxYear;
    const data = slice.map(r => r.y === y ? r.val : null);
    return {
      label: `${y}년`,
      data,
      borderColor:      palette.border,
      backgroundColor:  palette.bg,
      borderDash:       palette.dash,
      fill:             isCurrent,
      tension:          0.4,
      borderWidth:      isCurrent ? 2.5 : 2,
      pointRadius:      isCurrent ? 4 : (multiYear ? 2 : 3),
      pointBackgroundColor: palette.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      spanGaps:         false,
    };
  });

  chartInstances['monthlyTrendChart'] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top', align: 'end',
          labels: {
            font: { size: 11, weight: '600' },
            color: '#333',
            padding: 14,
            usePointStyle: true,   // 선+원 모양으로 표시
            pointStyle: 'line',    // 선 형태 아이콘
            boxWidth: 24,
            boxHeight: 3,
          }
        },
        tooltip: {
          mode: 'index', intersect: false,
          callbacks: { label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y)}대` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: multiYear ? 9 : 11, weight: '500' },
            color: '#333',
            maxRotation: multiYear ? 45 : 0,
            autoSkip: true,
            maxTicksLimit: multiYear ? (period === 36 ? 18 : 12) : 12,
          }
        },
        y: {
          grid: { color: '#e8e8e8', lineWidth: 1 },
          border: { dash: [3, 3] },
          ticks: { font: { size: 11, weight: '500' }, color: '#333', callback: v => fmt(v) }
        }
      }
    }
  });
}

// ===== YEARLY COMPARE CHART =====
let yearlyChartType = 'bar';
function renderYearlyCompareChart(type) {
  yearlyChartType = type || yearlyChartType;
  destroyChart('yearlyCompareChart');
  const ctx = document.getElementById('yearlyCompareChart');
  if (!ctx) return;

  // allRegistrations(API 실제 데이터) 기반으로 연도별 합산
  const yearlyMap = {};
  allRegistrations.forEach(r => {
    const y = parseInt(r.year);
    const v = parseInt(r.count) || 0;
    if (!y) return;
    yearlyMap[y] = (yearlyMap[y] || 0) + v;
  });

  const sortedYears = Object.keys(yearlyMap).map(Number).sort((a, b) => a - b);

  if (sortedYears.length === 0) {
    ctx.parentElement.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#aaa;padding:40px 0"><i class="fas fa-chart-bar" style="font-size:32px;margin-bottom:12px"></i><p style="font-size:13px;font-weight:600">\ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</p><p style="font-size:11px;margin-top:4px">\uc5c5\ub85c\ub4dc\ub41c \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</p></div>`;
    const tbody = document.getElementById('yearlyTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#aaa;padding:20px">\ub370\uc774\ud130 \uc5c6\uc74c</td></tr>`;
    return;
  }

  // 현재 연도 = 데이터 내 최신 연도
  const maxYear = sortedYears[sortedYears.length - 1];

  // 최신 연도의 최대 월 (부분 집계 여부 확인)
  const maxYearMonths = [...new Set(
    allRegistrations.filter(r => parseInt(r.year) === maxYear).map(r => parseInt(r.month))
  )].filter(Boolean).sort((a, b) => a - b);
  const latestMonth = maxYearMonths.length > 0 ? Math.max(...maxYearMonths) : null;
  const isPartial = latestMonth !== null && latestMonth < 12;

  const yearRows = sortedYears.map((y, i) => {
    const prevY   = i > 0 ? sortedYears[i-1] : null;
    const isCurr  = y === maxYear;
    let label = `${y}년`;
    if (isCurr && isPartial) label = `${y}년\n(~${latestMonth}월)`;
    return {
      year:      label,
      val:       yearlyMap[y],
      prev:      prevY ? yearlyMap[prevY] : null,
      isCurrent: isCurr,
    };
  });

  // 연도별 컬러: 과거→현재 순으로 점점 진하게 (연도 수에 맞게 슬라이스)
  const ALL_COLORS = ['#b0bec5', '#78909c', '#1565c0', '#e02020'];
  const colorStart = Math.max(0, ALL_COLORS.length - yearRows.length);
  const colors = ALL_COLORS.slice(colorStart);

  chartInstances['yearlyCompareChart'] = new Chart(ctx, {
    type: yearlyChartType,
    data: {
      labels: yearRows.map(r => r.year),
      datasets: [{
        label: '연간 등록대수',
        data: yearRows.map(r => r.val),
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: yearlyChartType === 'bar' ? 8 : 0,
        fill: yearlyChartType === 'line',
        tension: 0.4,
        pointBackgroundColor: colors,
        pointRadius: yearlyChartType === 'line' ? 6 : 0,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${fmt(ctx.parsed.y)}대`,
            afterLabel: ctx => {
              const row = yearRows[ctx.dataIndex];
              if (row.prev) {
                const chgPct = ((row.val - row.prev) / row.prev * 100).toFixed(1);
                return `전년 대비 ${chgPct > 0 ? '▲' : '▼'} ${Math.abs(chgPct)}%`;
              }
              return row.isCurrent ? '(연간 집계 진행 중)' : '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '600' }, color: '#333' }
        },
        y: {
          grid: { color: '#e8e8e8', lineWidth: 1 },
          border: { dash: [3, 3] },
          ticks: {
            font: { size: 11, weight: '500' }, color: '#333',
            callback: v => (v / 10000).toFixed(0) + '만'
          },
          beginAtZero: true
        }
      }
    }
  });

  // 연도별 요약 테이블 (4년치)
  const tbody = document.getElementById('yearlyTableBody');
  if (tbody) {
    tbody.innerHTML = yearRows.map(r => {
      const chg = r.prev ? calcYoYChange(r.val, r.prev) : null;
      const yearLabel = r.isCurrent
        ? `<b style="color:#e02020">${r.year.replace('\n', ' ')}</b>`
        : r.year.replace('\n', ' ');
      return `<tr>
        <td>${yearLabel}</td>
        <td><b>${fmt(r.val)}</b>대${(r.isCurrent && isPartial) ? ` <span style="font-size:9px;color:#888">(~${latestMonth}월)</span>` : ''}</td>
        <td>${chg !== null ? fmtChange(chg) : '<span class="change-same">-</span>'}</td>
      </tr>`;
    }).join('');
  }
}

// ===== MODEL MODAL CHART =====
let modalChartInst = null;
function renderModalChart(modelData) {
  if (modalChartInst) { modalChartInst.destroy(); modalChartInst = null; }
  const ctx = document.getElementById('modalChart');
  if (!ctx) return;

  // allRegistrations에서 해당 모델의 월별 데이터 집계
  const modelName = modelData.model;
  const modelRows = allRegistrations.filter(r => r.model === modelName);

  if (modelRows.length === 0) {
    ctx.parentElement.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#aaa"><i class="fas fa-chart-line" style="font-size:24px;margin-bottom:8px"></i><p style="font-size:12px">\uc6d4\ubcc4 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</p></div>`;
    return;
  }

  // 연월 순 정렬
  const monthMap = {};
  modelRows.forEach(r => {
    const y = parseInt(r.year), m = parseInt(r.month), v = parseInt(r.count) || 0;
    if (!y || !m) return;
    const key = `${y}-${String(m).padStart(2,'0')}`;
    monthMap[key] = (monthMap[key] || 0) + v;
  });
  const sorted = Object.keys(monthMap).sort();
  // 최근 12개월만 표시
  const recent = sorted.slice(-12);
  const labels = recent.map(k => {
    const [y, m] = k.split('-');
    return `'${String(y).slice(2)}.${m}`;
  });
  const values = recent.map(k => monthMap[k]);

  modalChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#e02020',
        backgroundColor: 'rgba(224,32,32,0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#e02020',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)}대` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10, weight: '500' }, color: '#333', maxRotation: 45 } },
        y: {
          grid: { color: '#e8e8e8' },
          ticks: { font: { size: 10, weight: '500' }, color: '#333', callback: v => fmt(v) }
        }
      }
    }
  });
}
