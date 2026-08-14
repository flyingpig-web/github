/* =========================================================================
   2_EXP① — 횡스크롤 잠입 게임 (PDF 15~25p)
   "일본 순사의 시야를 피해 중명전 → 서울역 → 부산역 → 부산항까지 이동하라"

   - 3개 스테이지(각 5711×1081 스트립)를 순차로 팬(pan). 특사는 화면에 고정.
   - 진행도 30% / 60% / 90% 에서 순사가 화면 밖 우측 → 좌측으로 통과(3초).
   - [숨기] 홀드 = 은신 자세로 교체 + 감지 무효 + 배경 정지.
   - 순사 감지범위 접촉(비은신) → 발각 연출 → 메인 화면 복귀.
   - 부산항 도착 → 체험 종료 팝업.

   튜닝은 CONFIG 상수만 수정하면 된다(좌표는 1920×1080 가상 좌표계 기준).
   ========================================================================= */
document.title = "체험① — 일본 순사를 피해 부산항으로";

$(function () {
  /* ----------------------------- 상수 ----------------------------- */
  const V = { W: 1920, H: 1080 }; // 가상 좌표계(디자인 기준)

  const CONFIG = {
    stageSec: [20, 20, 20], // 구간별 이동 시간(초) — PDF "각 구간 20초 내외, 총 1분"
    /* 스테이지별 지면선(정규화 y).
       [2]는 수정요청안 p25("3번째 구간 BG 위치가 안맞음") 반영 —
       배경 스트립 실측상 부두 바닥이 끝나고 석축이 시작되는 행이 0.827 이라
       0.885 로는 특사가 석축(=진행도 바 뒤)에 파묻혀 있었다. */
    groundY: [0.858, 0.86, 0.827],
    playerX: 0.18, // 특사 고정 x(정규화) — 목업 실측(0.13~0.19)
    playerFps: 10, // PDF 17p "캐릭터 프레임마다 0.1s씩 반복"
    enemyFps: 10, // 〃
    enemyAt: [0.3, 0.6, 0.9], // 순사 등장 진행도(PDF 9번)
    enemyCrossMs: 3000, // 화면 밖 → 반대편 밖까지 소요(PDF 10번)
    enemyMargin: 260, // 화면 밖 생성/소멸 여유
    coneScale: 1.0, // 감지범위 배율
    coneCenterRatio: 0.62, // 감지범위 세로 중심(순사 키 대비, 지면 기준 위쪽) — 목업 실측
    hitPad: 44, // 특사 판정 여유(좌우 안쪽)
    caughtBeatMs: 600, // 발각 연출(순사 변화 + 느낌표)을 보여준 뒤 실패 팝업까지의 간격
    failHoldMs: 1500, // 실패 팝업 → 메인 복귀 대기. PDF 는 0.5초이나 실패 문구 가독을 위해 상향
    stageFadeMs: 450, // 구간 전환 페이드
    countdownMs: 900, // 카운트다운 숫자 1개당
    devSpeed: 5, // 개발자 모드 배속
  };

  /* 개발자 모드 — 프로젝트 공통 플래그 `localStorage.db === "1"`.
     common.js 의 `Ctrl + ;` 로 토글(설정/해제 후 자동 새로고침).
     켜져 있으면 게임 진행 전체(스크롤·순사·카운트다운·연출)가 devSpeed 배로 빨라진다.
     (AR1 exp2.js 의 "테스트 모드 3배속"과 동일 컨벤션) */
  function isDev() {
    try {
      return localStorage.getItem("db") === "1";
    } catch (e) {
      return false;
    }
  }
  const SPEED = isDev() ? CONFIG.devSpeed : 1;
  const ms = (v) => v / SPEED; // 타이머 계열은 배속만큼 짧게

  /* 효과음 — 수정요청안(사운드 시트) 기준.
     · detected : 적(순사)에게 발각되었을 때
     · hiding   : [숨기] 버튼을 눌렀을 때
     · transition : 스테이지가 전환될 때
     · arrive   : 최종 지점 도달 — 이 소리가 끝난 뒤 성공 팝업이 뜬다
     · complete : 성공 팝업 등장 */
  const SFX = {
    detected: "audio/effects/detected.wav",
    hiding: "audio/effects/hiding.wav",
    transition: "audio/effects/transition.mp3",
    arrive: "audio/effects/item_success.wav",
    complete: "audio/effects/mission_complete.wav",
  };

  const B = "img/2_EXP1/";

  /* --------------------------- 이미지 로딩 --------------------------- */
  const SRC = {
    stages: [B + "exp1_stage1.png", B + "exp1_stage2.png", B + "exp1_stage3.png"],
    player: [B + "exp1_player1.png", B + "exp1_player2.png", B + "exp1_player3.png", B + "exp1_player4.png"],
    hide: [B + "exp1_player_hide1.png", B + "exp1_player_hide2.png", B + "exp1_player_hide3.png"],
    enemy: [B + "exp1_enemy1.png", B + "exp1_enemy2.png", B + "exp1_enemy3.png", B + "exp1_enemy4.png"],
    enemyFind: B + "exp1_enemy_find.png",
    detect: B + "exp1_detect.png",
    findEffect: B + "exp1_find_effect.png",
  };

  const IMG = {};

  function loadImage(src) {
    return new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null); // 누락돼도 진행(그리기 시 스킵)
      im.src = src;
    });
  }

  async function loadAll() {
    const [stages, player, hide, enemy, enemyFind, detect, findEffect] = await Promise.all([
      Promise.all(SRC.stages.map(loadImage)),
      Promise.all(SRC.player.map(loadImage)),
      Promise.all(SRC.hide.map(loadImage)),
      Promise.all(SRC.enemy.map(loadImage)),
      loadImage(SRC.enemyFind),
      loadImage(SRC.detect),
      loadImage(SRC.findEffect),
    ]);
    Object.assign(IMG, { stages, player, hide, enemy, enemyFind, detect, findEffect });
  }

  /* ----------------------------- 캔버스 ----------------------------- */
  const canvas = document.getElementById("exp1Canvas");
  const ctx = canvas.getContext("2d");
  let scale = 1; // 가상좌표 → 실제 픽셀

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    scale = canvas.width / V.W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  $(window).on("resize orientationchange", resize);

  /* ------------------------------ 상태 ------------------------------ */
  // phase: 'main'(시작 오버레이) | 'count'(카운트다운) | 'play' | 'fail' | 'clear'
  const S = {
    phase: "main",
    paused: false,
    stage: 0,
    offset: 0, // 현재 스트립 내 스크롤 위치
    traveled: 0, // 전체 누적 이동거리
    hiding: false,
    enemies: [],
    spawned: [false, false, false],
    animT: 0,
    fadeAlpha: 0,
    caughtBy: null, // 발각시킨 순사(연출 고정용)
    last: 0,
  };

  // 스트립을 화면 높이에 맞췄을 때의 표시 폭 / 구간별 이동거리
  function stripW(i) {
    const im = IMG.stages[i];
    if (!im) return V.W;
    return im.width * (V.H / im.height);
  }
  function stageTravel(i) {
    return Math.max(1, stripW(i) - V.W);
  }
  function totalTravel() {
    return stageTravel(0) + stageTravel(1) + stageTravel(2);
  }
  function progress() {
    return Math.min(1, S.traveled / totalTravel());
  }
  function ground() {
    return CONFIG.groundY[S.stage] * V.H;
  }

  /* ------------------------------ 진행도 UI ------------------------------ */
  const $fill = $("#progressFill");
  const $dot = $("#progressDot");
  // 진행도 이미지의 지점 마커(중명전 9.5% ~ 부산항 90.5%)에 맞춘 매핑
  const P_FROM = 5.5;
  const P_TO = 94.5;
  function paintProgress() {
    const p = progress();
    const x = P_FROM + (P_TO - P_FROM) * p;
    $fill.css("width", x + "%");
    $dot.css("left", x + "%");
  }

  /* ------------------------------ 순사 ------------------------------ */
  function enemySpeed() {
    return (V.W + CONFIG.enemyMargin * 2) / (CONFIG.enemyCrossMs / 1000);
  }
  function spawnEnemy() {
    S.enemies.push({ x: V.W + CONFIG.enemyMargin, found: false });
  }
  function enemyConeRect(e) {
    const eh = IMG.enemy[0] ? IMG.enemy[0].height : 434;
    const d = IMG.detect;
    const dw = (d ? d.width : 354) * CONFIG.coneScale;
    const dh = (d ? d.height : 338) * CONFIG.coneScale;
    const cy = ground() - eh * CONFIG.coneCenterRatio; // 감지범위 세로 중심
    // 순사는 좌측을 향하므로 apex(우측)가 순사 위치, 좌측으로 펼쳐진다.
    return { x: e.x - dw, y: cy - dh / 2, w: dw, h: dh };
  }
  function playerRect() {
    const pi = IMG.player[0];
    const pw = pi ? pi.width : 218;
    const ph = pi ? pi.height : 389;
    const cx = CONFIG.playerX * V.W;
    return {
      x: cx - pw / 2 + CONFIG.hitPad,
      y: ground() - ph,
      w: pw - CONFIG.hitPad * 2,
      h: ph,
    };
  }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* ------------------------------ 루프 ------------------------------ */
  function update(dt) {
    S.animT += dt;

    // 배경 스크롤(은신 중에는 정지)
    if (!S.hiding) {
      const speed = stageTravel(S.stage) / CONFIG.stageSec[S.stage];
      const move = speed * dt;
      S.offset += move;
      S.traveled += move;

      if (S.offset >= stageTravel(S.stage)) {
        if (S.stage < 2) nextStage();
        else clearGame();
        return; // 전환/종료 프레임에서는 이후 로직(순사 스폰·판정)을 건너뛴다
      }
    }

    // 순사 등장(진행도 기준)
    const p = progress();
    CONFIG.enemyAt.forEach((t, i) => {
      if (!S.spawned[i] && p >= t) {
        S.spawned[i] = true;
        spawnEnemy();
      }
    });

    // 순사 이동 + 감지 판정
    const es = enemySpeed();
    const pr = playerRect();
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      e.x -= es * dt;
      if (!S.hiding && overlap(pr, enemyConeRect(e))) {
        e.found = true;
        caught(e);
        return;
      }
      if (e.x < -CONFIG.enemyMargin * 2) S.enemies.splice(i, 1);
    }

    paintProgress();
  }

  function draw() {
    ctx.clearRect(0, 0, V.W, V.H);

    // 배경 스트립
    const bg = IMG.stages[S.stage];
    if (bg) {
      const w = stripW(S.stage);
      ctx.drawImage(bg, -S.offset, 0, w, V.H);
    }

    const g = ground();

    // 순사 + 감지범위
    S.enemies.forEach((e) => {
      const cone = enemyConeRect(e);
      if (IMG.detect) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.drawImage(IMG.detect, cone.x, cone.y, cone.w, cone.h);
        ctx.restore();
      }
      const frames = IMG.enemy.filter(Boolean);
      let im = frames.length ? frames[Math.floor(S.animT * CONFIG.enemyFps) % frames.length] : null;
      if (e.found && IMG.enemyFind) im = IMG.enemyFind;
      if (im) ctx.drawImage(im, e.x - im.width / 2, g - im.height, im.width, im.height);

      // 발각 시 순사 머리 위 느낌표
      if (e.found && IMG.findEffect) {
        const fe = IMG.findEffect;
        ctx.drawImage(fe, e.x - fe.width / 2, g - (im ? im.height : 434) - fe.height * 0.55, fe.width, fe.height);
      }
    });

    // 특사
    const cx = CONFIG.playerX * V.W;
    if (S.hiding) {
      const hi = IMG.hide[S.stage];
      if (hi) ctx.drawImage(hi, cx - hi.width / 2, g - hi.height, hi.width, hi.height);
    } else {
      const frames = IMG.player.filter(Boolean);
      const moving = S.phase === "play";
      const idx = moving ? Math.floor(S.animT * CONFIG.playerFps) % frames.length : 0;
      const im = frames[idx];
      // 특사 스프라이트는 원본이 우향(진행 방향)이라 반전하지 않는다.
      // (순사 exp1_enemy* / exp1_enemy_find 는 좌향 = 우→좌 이동 방향과 일치, 감지범위도 좌측으로 펼쳐짐)
      if (im) ctx.drawImage(im, cx - im.width / 2, g - im.height, im.width, im.height);
    }

    // 구간 전환 페이드
    if (S.fadeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, S.fadeAlpha);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, V.W, V.H);
      ctx.restore();
    }
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 0;
    S.last = ts;
    if (S.phase === "play" && !S.paused) {
      // 배속이 걸리면 한 프레임 이동량이 커져 순사 감지범위를 통과해 버릴 수 있다(터널링).
      // 20ms 단위로 잘라 여러 번 업데이트해 판정 정확도를 유지한다.
      const scaled = dt * SPEED;
      const steps = Math.max(1, Math.ceil(scaled / 0.02));
      const sub = scaled / steps;
      for (let i = 0; i < steps && S.phase === "play" && !S.paused; i++) update(sub);
    }
    draw();
  }

  /* --------------------------- 구간 전환 --------------------------- */
  function nextStage() {
    const from = S.stage;
    S.paused = true;
    AR.Sound.sfx(SFX.transition); // 구간 전환음
    fadeTo(1, ms(CONFIG.stageFadeMs) / 2, () => {
      S.stage = from + 1;
      S.offset = 0;
      S.enemies = [];
      fadeTo(0, ms(CONFIG.stageFadeMs) / 2, () => {
        S.paused = false;
      });
    });
  }

  function fadeTo(target, ms, done) {
    const start = S.fadeAlpha;
    const t0 = performance.now();
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / ms);
      S.fadeAlpha = start + (target - start) * k;
      if (k < 1) requestAnimationFrame(step);
      else if (done) done();
    })();
  }

  /* --------------------------- 발각 / 완료 --------------------------- */
  function caught(e) {
    S.phase = "fail";
    S.caughtBy = e;
    S.hiding = false;
    setHideBtn(false);
    AR.Sound.sfx(SFX.detected);
    draw();
    // PDF 23p 순서: ① BG·특사 정지 ② 순사 발각 모습 ③ 느낌표 ④ "실패!" ⑤ 메인 복귀.
    // 실패 팝업이 느낌표를 가리므로 한 박자 뒤에 띄운다.
    setTimeout(() => {
      AR.openPopup("#failDim");
      setTimeout(() => {
        AR.closePopup("#failDim");
        resetToMain();
      }, ms(CONFIG.failHoldMs));
    }, ms(CONFIG.caughtBeatMs));
  }

  function clearGame() {
    S.phase = "clear";
    S.traveled = totalTravel();
    paintProgress();
    // 도착 효과음이 다 울린 뒤에 성공 팝업 등장(수정요청안 p20).
    AR.Sound.sfxThen(SFX.arrive, () => {
      AR.Sound.sfx(SFX.complete);
      AR.openPopup("#finishDim");
    });
  }

  function resetToMain() {
    S.phase = "main";
    S.stage = 0;
    S.offset = 0;
    S.traveled = 0;
    S.enemies = [];
    S.spawned = [false, false, false];
    S.hiding = false;
    S.fadeAlpha = 0;
    S.caughtBy = null;
    setHideBtn(false);
    paintProgress();
    AR.openPopup("#startDim"); // 메인 = 체험 방법 안내 팝업
  }

  /* --------------------------- 카운트다운 --------------------------- */
  function startCountdown() {
    S.phase = "count";
    const $c = $("#countdown");
    const $t = $("#countText");
    let n = 3;
    $c.addClass("flex");
    $t.text(n);
    const tick = () => {
      n -= 1;
      if (n <= 0) {
        $c.removeClass("flex");
        S.phase = "play";
        S.last = 0;
        return;
      }
      // 애니메이션 재시작(요소 교체)
      $t.text(n).css("animation", "none");
      void $t[0].offsetWidth;
      $t.css("animation", "");
      setTimeout(tick, ms(CONFIG.countdownMs));
    };
    setTimeout(tick, ms(CONFIG.countdownMs));
  }

  /* ---------------------------- 입력 바인딩 ---------------------------- */
  const $hide = $("#btnHide");
  function setHideBtn(on) {
    const was = S.hiding;
    S.hiding = on && S.phase === "play";
    // 숨기 시작하는 순간에만 1회(키 리피트로 연타되지 않도록 상태 전이로 판정)
    if (S.hiding && !was) AR.Sound.sfx(SFX.hiding);
    $hide.toggleClass("active", !!S.hiding);
  }

  $hide.on("pointerdown", (ev) => {
    ev.preventDefault();
    setHideBtn(true);
  });
  $(document).on("pointerup pointercancel", () => setHideBtn(false));
  // PC 보조 입력: Space / ↓
  $(document).on("keydown", (ev) => {
    if (ev.code === "Space" || ev.code === "ArrowDown") {
      ev.preventDefault();
      setHideBtn(true);
    }
  });
  $(document).on("keyup", (ev) => {
    if (ev.code === "Space" || ev.code === "ArrowDown") setHideBtn(false);
  });

  // 메인 안내 팝업 — 화면 아무 곳이나 터치(또는 X)하면 PLAY 시작
  // (touchstart 후 click 이 중복 발화하지 않도록 phase 로 가드)
  $("#startDim").on("click touchstart", function (ev) {
    ev.preventDefault();
    if (S.phase !== "main") return;
    AR.closePopup("#startDim");
    startCountdown();
  });

  // 설정 / 튜토리얼 / 홈
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
      hideStart();
    },
    onResume: () => {
      S.paused = false;
      restoreStart();
    },
  });
  $("#btnInfo").on("click", () => {
    S.paused = true;
    hideStart();
    AR.openPopup("#tutorialDim");
  });
  $("#tutClose").on("click", () => {
    AR.closePopup("#tutorialDim");
    S.paused = false;
    restoreStart();
  });
  $("#btnHome").on("click", () => AR.go("index.html"));

  // 완료 팝업
  $("#btnNext").on("click", () => AR.go("bridge1.html"));
  $("#btnRetry").on("click", () => {
    AR.closePopup("#finishDim");
    resetToMain();
  });

  /* ------------------------------ 시작 ------------------------------ */
  loadAll().then(() => {
    resize();
    paintProgress();
    if (SPEED !== 1) {
      // 배속 중임을 화면에 표시(개발용). Ctrl + ; 로 끄면 사라진다.
      $(".container").append(
        `<div class="dev-badge">DEV ×${SPEED} <span>(Ctrl+; 로 해제)</span></div>`
      );
      console.info(`[EXP①] 개발자 모드 — 진행 ${SPEED}배속 (localStorage.db="1")`);
    }
    AR.openPopup("#startDim"); // 메인 = 체험 방법 안내 팝업(배경 딤드)
    AR.Sound.armBgm("audio/BGM.mp3", { volume: 0.3 });
    requestAnimationFrame(frame);
  });
});
