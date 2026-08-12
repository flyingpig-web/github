/* =========================================================================
   4_EXP②-AR — AR 체험 (PDF 37~51p)

   웹 담당: (1) 로딩 화면(게이지 0→100%) → (2) AR 방식 선택.
   실제 AR 체험(빈넨호프 → 융 호텔 → 프린세스그라트, NPC 9종 대화)은
   **유니티 빌드 담당**. 아래 UNITY.enabled 를 true 로 바꾸고 빌드를
   `exp2_ar/` 에 넣으면 선택 즉시 유니티로 진입한다.

   유니티 미납품 상태에서는 선택 후 [요청 성공] 팝업(셸)으로
   5_Bridge② 로 이어지도록 둔다. (AR1~AR3 와 동일한 연결 방식)
   ========================================================================= */
document.title = "체험② — AR 체험 (한국의 호소)";

$(function () {
  /* 유니티 연계 설정 — 빌드 납품 시 enabled 만 true 로 */
  const UNITY = {
    enabled: false,
    path: "exp2_ar/index.html",
    // mode=ar : 바닥 인식 사용(모바일) / mode=pc : 인식 없이 체험
    url(mode) {
      return `${this.path}?mode=${mode}&return=${encodeURIComponent("../bridge2.html")}`;
    },
  };

  const LOADING_MS = 2200;

  const assets = [
    "img/4_EXP2-AR/ar_loading_bg.png",
    "img/4_EXP2-AR/ar_loading_bar.png",
    "img/4_EXP2-AR/ar_select_bg.png",
    "img/4_EXP2-AR/ar_mode_ground_btn.png",
    "img/4_EXP2-AR/ar_mode_no_tracking_btn.png",
    "img/4_EXP2-AR/exp2_popup_finish.png",
    "img/common/exp_popup_btn_next.png",
    "img/common/exp_popup_btn_retry.png",
  ];

  const $fill = $("#barFill");
  const $pct = $("#barPercent");

  function showScreen(id) {
    $(".ar-screen").removeClass("on");
    $(id).addClass("on");
  }

  function runLoading(done) {
    const t0 = performance.now();
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / LOADING_MS);
      $fill.css("width", k * 100 + "%");
      $pct.text(Math.round(k * 100) + "%");
      if (k < 1) requestAnimationFrame(step);
      else done();
    })();
  }

  function enterAr(mode) {
    if (UNITY.enabled) {
      AR.go(UNITY.url(mode));
      return;
    }
    // 유니티 빌드 미납품 → 완료 팝업 셸로 다음 단계 연결
    console.info(`[EXP②-AR] 유니티 빌드 미연결(mode=${mode}) — 셸로 진행합니다.`);
    AR.openPopup("#finishDim");
  }

  AR.preload(assets).then(() => {
    AR.Sound.armBgm("audio/BGM.mp3", { volume: 0.35 });
    runLoading(() => showScreen("#scrSelect"));
  });

  $("#btnModeAr").on("click", () => enterAr("ar"));
  $("#btnModePc").on("click", () => enterAr("pc"));

  $("#btnNext").on("click", () => AR.go("bridge2.html"));
  $("#btnRetry").on("click", () => location.reload());
});
