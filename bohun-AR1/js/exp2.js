/* =========================================================================
   EXP② 모스부호 리듬게임
   - 신호가 우→좌로 흘러 좌측 판정선에 닿는 순간 전신기 터치.
   - 점/선 구분 없이 "탭 타이밍"만 판정(확정). 20개 중 10개↑ 성공 → 교신 완료.
   ⚠️ 정확한 판정 폭/속도/출제 시퀀스는 세부 기획 확정 시 상단 CONFIG 에서 조정
      (Open Item: EXP② 출제 시퀀스 / ±5% 판정의 px·ms 수치).
   ========================================================================= */
document.title = "EXP② — 모스부호 교신";

$(function () {
  /* ----- 튜닝 상수(가변) ----- */
  const CONFIG = {
    total: 20, // 총 신호 수
    needSuccess: 10, // 교신 완료 기준
    firstAt: 1800, // 첫 신호가 판정선에 닿는 시각(ms)
    interval: 850, // 신호 간격(ms)
    travel: 2000, // 우측 진입 → 판정선 도달까지 이동 시간(ms)
    goodWindow: 150, // ±판정 허용(ms) ≈ 프로토타입 "±5%"
    hitFrac: 0.06, // 트랙 폭 대비 판정선 x 위치(좌측)
  };

  // EAGLE / SEND — 플레이버용 글자 라벨(신호 그룹 표시에 사용)
  const LETTERS = ["E", "A", "G", "L", "E", "S", "E", "N", "D"];
  const letterImg = (c) => `img/4_EXP2/exp2_text_${c}.png`;

  const assets = [
    "img/4_EXP2/exp2_bg.png",
    "img/4_EXP2/exp2_game_bg.png",
    "img/4_EXP2/exp2_hit_line.png",
    "img/4_EXP2/exp2_morse_on.png",
    "img/4_EXP2/exp2_morse_off.png",
    "img/4_EXP2/exp2_msg_start.png",
    "img/4_EXP2/exp2_info.png",
    "img/4_EXP2/exp2_popup_finish.png",
    "img/common/exp_gage_bg.png",
    "img/common/exp_setting.png",
    "img/common/exp_popup_btn_next.png",
    "img/common/exp_popup_btn_retry.png",
  ].concat(LETTERS.map((c) => letterImg(c)));

  const canvas = document.getElementById("morseCanvas");
  const ctx = canvas.getContext("2d");
  const $key = $("#morseKey");
  const $keyImg = $("#morseKeyImg");
  const $hitLine = $("#hitLine");
  const $judge = $("#morseJudge");
  const $gage = $("#gageText");

  let beats = []; // { t, judged, ok }
  let started = false;
  let paused = false;
  let raf = null;
  let clock = 0; // 누적 게임 시각(ms)
  let lastTs = 0;
  let success = 0;
  let done = 0;

  function sizeCanvas() {
    const track = document.getElementById("morseTrack");
    const r = track.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._w = r.width;
    canvas._h = r.height;
  }

  function buildBeats() {
    beats = [];
    for (let i = 0; i < CONFIG.total; i++) {
      beats.push({ t: CONFIG.firstAt + i * CONFIG.interval, judged: false, ok: false });
    }
  }

  function hitX() {
    return (canvas._w || 0) * CONFIG.hitFrac;
  }

  function draw() {
    const w = canvas._w || 0;
    const h = canvas._h || 0;
    ctx.clearRect(0, 0, w, h);
    const hx = hitX();
    const cy = h / 2;
    const r = Math.max(6, h * 0.16);

    for (const b of beats) {
      if (b.judged && clock - b.t > 200) continue;
      const dt = b.t - clock; // +면 아직 도달 전
      if (dt > CONFIG.travel) continue; // 아직 진입 전
      // x: 판정선(hx) ~ 우측 끝(w). dt=0 → hx, dt=travel → w
      const x = hx + (dt / CONFIG.travel) * (w - hx);
      if (x < -r) continue;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      if (b.judged) ctx.fillStyle = b.ok ? "#5ad16b" : "#e05656";
      else ctx.fillStyle = Math.abs(dt) <= CONFIG.goodWindow ? "#ffe98a" : "#f4e9c9";
      ctx.fill();
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const delta = ts - lastTs;
    lastTs = ts;
    if (!paused) {
      clock += delta;
      // 미스 자동 판정(판정선 통과 후 허용 초과)
      for (const b of beats) {
        if (!b.judged && clock - b.t > CONFIG.goodWindow) {
          b.judged = true;
          b.ok = false;
          done++;
          updateGage();
        }
      }
      draw();
      if (done >= beats.length) return finish();
    }
    raf = requestAnimationFrame(loop);
  }

  function updateGage() {
    $gage.text(`${success} / ${CONFIG.total}`);
  }

  function tap() {
    if (!started || paused || done >= beats.length) return;
    // 전신기 눌림 연출
    $keyImg.attr("src", "img/4_EXP2/exp2_morse_on.png");
    setTimeout(() => $keyImg.attr("src", "img/4_EXP2/exp2_morse_off.png"), 110);

    // 아직 판정 안된 가장 가까운 신호
    let target = null;
    let best = Infinity;
    for (const b of beats) {
      if (b.judged) continue;
      const d = Math.abs(b.t - clock);
      if (d < best) {
        best = d;
        target = b;
      }
    }
    if (!target) return;
    // 너무 멀면(아직 한참 전) 무시 — 헛탭으로 신호 소비 방지
    if (target.t - clock > CONFIG.travel * 0.6) return;

    target.judged = true;
    done++;
    if (best <= CONFIG.goodWindow) {
      target.ok = true;
      success++;
      showJudge(true);
      $hitLine.removeClass("hit");
      void $hitLine[0].offsetWidth;
      $hitLine.addClass("hit");
      AR.Sound.sfx(SFX.good);
    } else {
      target.ok = false;
      showJudge(false);
      AR.Sound.sfx(SFX.bad);
    }
    updateGage();
    if (done >= beats.length) finish();
  }

  const SFX = {
    // ⚠️ 사운드 경로 미확정(Open Item). 파일 배치 시 채우면 자동 재생.
    good: "",
    bad: "",
    morse: "",
  };

  function showJudge(ok) {
    $judge
      .text(ok ? "Good!" : "Bad!")
      .removeClass("good bad show")
      .addClass(ok ? "good" : "bad");
    void $judge[0].offsetWidth;
    $judge.addClass("show");
  }

  function startGame() {
    if (started) return;
    started = true;
    $("#gameStart").addClass("display-none");
    sizeCanvas();
    buildBeats();
    clock = 0;
    lastTs = 0;
    success = 0;
    done = 0;
    updateGage();
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    started = false;
    // 성공 여부와 무관하게 결과 팝업(성공 기준 미달 시 [다시 하기] 유도)
    AR.openPopup("#finishDim");
  }

  function resetGame() {
    AR.closePopup("#finishDim");
    $("#gameStart").removeClass("display-none");
    ctx.clearRect(0, 0, canvas._w || 0, canvas._h || 0);
    started = false;
    paused = false;
    updateGage();
  }

  /* ----- 이벤트 ----- */
  $("#gameStart").on("click", startGame);
  $key.on("mousedown touchstart", function (e) {
    e.preventDefault();
    tap();
  });

  // 상단 버튼
  $("#btnHome").on("click", () => AR.go("index.html"));
  AR.bindSettings({
    popup: "#settingDim",
    openBtn: "#btnSetting",
    closeBtn: "#setClose",
    toggleBgm: "#toggleBgm",
    toggleSfx: "#toggleSfx",
    onPause: () => (paused = true),
    onResume: () => (paused = false),
  });
  $("#btnInfo").on("click", () => {
    paused = true;
    AR.openPopup("#tutorialDim");
  });
  $("#tutClose").on("click", () => {
    AR.closePopup("#tutorialDim");
    paused = false;
  });

  // 완료 팝업
  $("#btnNext").on("click", () => AR.go("bridge2.html"));
  $("#btnRetry").on("click", resetGame);

  window.addEventListener("resize", () => {
    if (started) sizeCanvas();
  });

  /* ----- 시작 ----- */
  AR.preload(assets).then(() => {
    sizeCanvas();
  });
});
