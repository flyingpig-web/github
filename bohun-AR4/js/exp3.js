/* =========================================================================
   6_EXP③ — 축음기 크랭크 기록 게임 (PDF 53~59p)
   "축음기 손잡이를 돌려 이위종 특사의 연설을 기록하세요"

   ★핵심 구조(PDF 56p 명시): 유저는 연설에 맞춰 손잡이를 돌린다고 느끼지만,
     실제로는 **손잡이를 돌리는 동안에만 연설 음성이 재생**된다. 멈추면 일시정지.

   - 연설문 4문장 = exp3_message1~4(말풍선) ↔ audio/exp3_message1~4.wav ↔ exp3_wijong1~4(포즈).
   - 기록 진행률 = (완료 문장 수 + 현재 문장 재생위치) / 4  → 오디오 기준이라 음성과 어긋나지 않음.
   ========================================================================= */
document.title = "체험③ — 이위종 특사의 연설을 기록하라";

$(function () {
  const B = "img/6_EXP3/";

  const CONFIG = {
    sentences: 4,
    turnIdleMs: 200, // 마지막 회전 입력 후 이 시간이 지나면 "멈춤"으로 간주 → 오디오 일시정지
    minDeltaDeg: 1.2, // 회전으로 인정할 최소 각도 변화(손떨림 무시)
    pivot: { x: 0.7935, y: 0.806 }, // 축음기 크랭크 회전축(배경 실측, 정규화)
  };

  /* 효과음 — 수정요청안(사운드 시트) 기준.
     · arrive   : 기록 게이지가 모두 찼을 때 — 이 소리가 끝난 뒤 성공 팝업이 뜬다
     · complete : 성공 팝업 등장 */
  const SFX = {
    arrive: "audio/effects/item_success.wav",
    complete: "audio/effects/mission_complete.wav",
  };

  /* ------------------------------ 상태 ------------------------------ */
  const S = {
    phase: "main", // 'main' | 'play' | 'clear'
    paused: false,
    idx: 0, // 현재 문장(0~3)
    dragging: false,
    lastAngle: 0,
    lastTurnAt: 0,
    everTurned: false,
    rotation: 0, // 손잡이 표시 각도(deg)
  };

  /* ------------------------------ 오디오 ------------------------------ */
  // 연설(V.O)은 배경음/효과음 토글과 독립된 별도 채널로 다룬다.
  const voices = [];
  for (let i = 1; i <= CONFIG.sentences; i++) {
    const a = new Audio(`audio/exp3_message${i}.wav`);
    a.preload = "auto";
    voices.push(a);
  }
  const cur = () => voices[S.idx];

  voices.forEach((a, i) => {
    a.addEventListener("ended", () => {
      if (i !== S.idx) return;
      if (S.idx >= CONFIG.sentences - 1) {
        finish();
      } else {
        S.idx += 1;
        paintSentence();
        // 이어서 돌리고 있으면 다음 문장 즉시 재생
        if (isTurning()) playCur();
      }
    });
  });

  function playCur() {
    try {
      const p = cur().play();
      if (p && p.catch) p.catch(() => {});
      $message.addClass("on"); // 연설 시작과 함께 말풍선 등장
    } catch (e) {}
  }
  function pauseCur() {
    try {
      cur().pause();
    } catch (e) {}
  }
  function stopAll() {
    voices.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch (e) {}
    });
  }

  /* ------------------------------ 화면 ------------------------------ */
  const $wijong = $("#wijong");
  const $messageImg = $("#messageImg");
  const $message = $("#message");
  const $fill = $("#progressFill");
  const $crank = $("#crank");
  const $guide = $("#guide");

  // 말풍선은 연설이 실제로 재생될 때(=손잡이를 돌릴 때) 나타난다. 여기서는 소스만 교체.
  function paintSentence() {
    const n = S.idx + 1;
    $wijong.attr("src", `${B}exp3_wijong${n}.png`);
    $messageImg.attr("src", `${B}exp3_message${n}.png`);
  }

  function paintProgress() {
    const a = cur();
    const frac = a && a.duration ? Math.min(1, a.currentTime / a.duration) : 0;
    const p = (S.idx + frac) / CONFIG.sentences;
    $fill.css("width", Math.min(100, p * 100) + "%");
  }

  function paintCrank() {
    // 한 번도 돌리지 않은 동안은 CSS 유도 애니메이션(.hint)을 유지해야 하므로
    // 인라인 transform 을 쓰지 않는다(쓰면 애니메이션이 덮여 멈춘다).
    if (!S.everTurned) return;
    $crank.removeClass("hint");
    $crank.css("transform", `rotate(${S.rotation}deg)`);
  }

  /* --------------------------- 회전 입력 --------------------------- */
  function pivotPx() {
    const r = document.querySelector(".container").getBoundingClientRect();
    return { x: r.left + r.width * CONFIG.pivot.x, y: r.top + r.height * CONFIG.pivot.y };
  }
  function angleAt(ev) {
    const p = pivotPx();
    return (Math.atan2(ev.clientY - p.y, ev.clientX - p.x) * 180) / Math.PI;
  }
  function isTurning() {
    return S.dragging && performance.now() - S.lastTurnAt < CONFIG.turnIdleMs;
  }

  function onDown(ev) {
    if (S.phase !== "play" || S.paused) return;
    ev.preventDefault();
    S.dragging = true;
    S.lastAngle = angleAt(ev);
    S.lastTurnAt = performance.now();
    $crank.addClass("grabbing");
  }

  function onMove(ev) {
    if (!S.dragging || S.phase !== "play" || S.paused) return;
    const a = angleAt(ev);
    let d = a - S.lastAngle;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    if (Math.abs(d) < CONFIG.minDeltaDeg) return;
    S.lastAngle = a;
    S.lastTurnAt = performance.now();
    S.everTurned = true;
    // 손잡이는 포인터 방향을 따라감(스프라이트 기본 방향 = 아래쪽)
    S.rotation = a - 90;
    paintCrank();
    $guide.addClass("display-none");
  }

  function onUp() {
    S.dragging = false;
    $crank.removeClass("grabbing");
  }

  $("#crank, #crankZone").on("pointerdown", onDown);
  $(document).on("pointermove", onMove);
  $(document).on("pointerup pointercancel", onUp);

  /* ------------------------------ 루프 ------------------------------ */
  function tick() {
    requestAnimationFrame(tick);
    if (S.phase !== "play") return;

    const turning = !S.paused && isTurning();
    const a = cur();
    if (turning && a.paused) playCur();
    if (!turning && !a.paused) pauseCur();

    paintProgress();
  }

  /* --------------------------- 시작 / 종료 --------------------------- */
  function start() {
    S.phase = "play";
    S.idx = 0;
    S.everTurned = false;
    S.rotation = 0;
    paintSentence();
    paintCrank();
    $guide.removeClass("display-none");
  }

  function finish() {
    S.phase = "clear";
    S.dragging = false;
    stopAll();
    $fill.css("width", "100%");
    // 기록 완료 효과음이 다 울린 뒤에 성공 팝업 등장(수정요청안 p20).
    AR.Sound.sfxThen(SFX.arrive, () => {
      AR.Sound.sfx(SFX.complete);
      AR.openPopup("#finishDim");
    });
  }

  function resetToMain() {
    S.phase = "main";
    S.idx = 0;
    S.dragging = false;
    S.everTurned = false;
    S.rotation = 0;
    stopAll();
    $fill.css("width", "0%");
    $message.removeClass("on");
    $crank.addClass("hint").css("transform", "");
    $guide.removeClass("display-none");
    $wijong.attr("src", `${B}exp3_wijong1.png`);
    AR.openPopup("#startDim"); // 메인 = 체험 방법 안내 팝업
  }

  /* ---------------------------- 바인딩 ---------------------------- */
  // 메인 안내 팝업 — 화면 아무 곳이나 터치(또는 X)하면 PLAY 시작
  $("#startDim").on("click touchstart", function (ev) {
    ev.preventDefault();
    if (S.phase !== "main") return;
    AR.closePopup("#startDim");
    start();
  });

  // 메인(안내 팝업 노출) 상태에서 설정/튜토리얼을 열면 팝업이 겹치므로 잠시 숨겼다 되돌린다.
  function hideStart() {
    AR.closePopup("#startDim");
  }
  function restoreStart() {
    if (S.phase === "main") AR.openPopup("#startDim");
  }

  AR.bindSettings({
    popup: "#settingDim",
    openBtn: "#btnSetting",
    closeBtn: "#setClose",
    toggleBgm: "#toggleBgm",
    toggleSfx: "#toggleSfx",
    onPause: () => {
      S.paused = true;
      S.dragging = false;
      pauseCur();
      hideStart();
    },
    onResume: () => {
      S.paused = false;
      restoreStart();
    },
  });
  $("#btnInfo").on("click", () => {
    S.paused = true;
    S.dragging = false;
    pauseCur();
    hideStart();
    AR.openPopup("#tutorialDim");
  });
  $("#tutClose").on("click", () => {
    AR.closePopup("#tutorialDim");
    S.paused = false;
    restoreStart();
  });
  $("#btnHome").on("click", () => AR.go("index.html"));

  $("#btnNext").on("click", () => AR.go("end.html"));
  $("#btnRetry").on("click", () => {
    AR.closePopup("#finishDim");
    resetToMain();
  });

  /* ------------------------------ 진입 ------------------------------ */
  const assets = [
    B + "exp3_bg.png",
    B + "exp3_progress.png",
    B + "exp3_arrow.png",
    B + "exp3_lever.png",
    B + "exp3_info.png",
    B + "exp3_popup_finish.png",
    B + "exp_popup_btn_next.png",
    B + "exp_popup_btn_retry.png",
    "img/common/exp_setting.png",
    "img/common/btn_close.png",
  ];
  for (let i = 1; i <= CONFIG.sentences; i++) {
    assets.push(`${B}exp3_wijong${i}.png`, `${B}exp3_message${i}.png`);
  }

  AR.preload(assets).then(() => {
    AR.openPopup("#startDim"); // 메인 = 체험 방법 안내 팝업(배경 딤드)
    AR.Sound.armBgm("audio/BGM.mp3", { volume: 0.22 }); // 연설이 주인공이라 BGM 은 낮게
    requestAnimationFrame(tick);
  });
});
