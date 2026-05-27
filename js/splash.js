/* ============================================================
   MOTO CHART — Splash Screen Logic
   app.js / style.css 와 완전히 독립.
   ============================================================ */

(function () {
  var SHOW_DURATION = 1500;   // 스플래시 표시 시간 (ms)
  var FADE_DURATION =  450;   // CSS transition 과 맞춤 (ms)

  function hideSplash() {
    var el = document.getElementById('splashScreen');
    if (!el) return;

    // 1) 페이드아웃 시작
    el.classList.add('splash-hidden');

    // 2) 트랜지션 끝나면 DOM에서 완전 제거
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, FADE_DURATION);
  }

  // window.load 기준: 폰트·이미지까지 모두 로드된 뒤 타이머 시작
  window.addEventListener('load', function () {
    setTimeout(hideSplash, SHOW_DURATION);
  });
})();
