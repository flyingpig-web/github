/* =========================================================================
   EXP① — 병력 이동 방어 게임 (장진호 → 흥남)
   - 미군 트럭이 퇴로(경로)를 따라 30초 동안 일정 속도로 자동 이동.
   - 중국군이 경로 주변(트럭 뒤/옆)에 3초 주기로 생성, 트럭을 향해 돌진(3~5초 소요).
   - 플레이어가 중국군 터치 → 0.5초 페이드아웃 후 제거.
   - 중국군이 트럭에 닿으면 트럭 체력 -1(+해당 적 제거). 5회 피격 → 실패.
   - 트럭이 도착(30초 생존) → 성공. 성공/실패 모두 [체험 종료] 팝업.
   ⚠️ 경로 좌표/속도/생성주기/판정은 임시값(Open Item). localStorage.db="1" → 디버그 오버레이.
   ========================================================================= */
document.title = "EXP① — 병력 이동 방어";

$(function () {
  /* ----- 게임 데이터(정규화 0~1) — 실기기에서 보며 조정 ----- */
  const CONFIG = {
    duration: 30, // 트럭 이동(=카운트다운) 총 시간(초)
    maxHp: 5, // 트럭 체력 칸
    truckW: 0.075, // 트럭 스프라이트 폭(정규화)
    enemyW: 0.055, // 중국군 스프라이트 폭(정규화)
    spawnInterval: 3, // 중국군 생성 주기(초)
    firstSpawnAt: 1.0, // 첫 생성 지연(초)
    enemyTravel: [3, 5], // 생성 위치 → 트럭 도달 소요(초) 범위
    spawnDist: [0.18, 0.34], // 트럭으로부터 생성 거리(화면비 보정 거리)
    contactR: 0.05, // 트럭-중국군 충돌 판정 거리(화면비 보정)
    tapR: 0.06, // 터치 판정 반경(화면비 보정)
    dieDur: 0.5, // 터치 시 페이드아웃 시간(초)
    popDur: 0.65, // 등장 스케일(0→100%) 시간(초) — 살짝 텐션
    spawnMinAlpha: 0.2, // 등장 시작 투명도(0에 가까울수록 더 흐릿하게 매복→등장)
    // 퇴로(정규화 폴리라인) — 장진호(★) → 흥남(⚓)
    path: [
      [0.182, 0.22],
      [0.235, 0.265],
      [0.275, 0.305],
      [0.365, 0.35],
      [0.39, 0.37],
      [0.392, 0.45],
      [0.388, 0.5],
      [0.45, 0.54],
      [0.48, 0.55],
      [0.5, 0.63],
      [0.52, 0.69],
      [0.56, 0.71],
      [0.625, 0.71],
      [0.68, 0.69],
      [0.72, 0.71],
      [0.73, 0.79],
      [0.78, 0.78],
      [0.785, 0.73],
    ],
  };
  const AR_RATIO = 953 / 537; // 컨테이너 가로:세로 — 거리 계산 화면비 보정
  // 화면비 보정 거리(정규화 좌표를 화면 비율에 맞춰 측정)
  const adist = (ax, ay, bx, by) => Math.hypot((ax - bx) * AR_RATIO, ay - by);

  // 화면 대각선(좌상단→우하단, 정규화 y=x) 기준 중국군 좌우반전.
  // 선의 좌하단쪽(y>x)에 있는 적은 반전, 우상단쪽(y<x)은 기본 방향.
  // ※ 스프라이트 기본 바라보는 방향에 따라 FLIP_SIGN(±1)로 부호를 맞춘다(db=1 로 확인).
  const FLIP_SIGN = 1;
  const sideFace = (nx, ny) => (ny > nx ? -FLIP_SIGN : FLIP_SIGN);

  // 경로 누적 길이(화면비 보정) 사전 계산
  const segLen = [];
  let totalLen = 0;
  for (let i = 0; i < CONFIG.path.length - 1; i++) {
    const a = CONFIG.path[i],
      b = CONFIG.path[i + 1];
    const l = adist(a[0], a[1], b[0], b[1]);
    segLen.push(l);
    totalLen += l;
  }
  // 누적 거리(dist 0~totalLen) → 경로 위 점 {x,y} + 진행 방향 dx,dy
  function pointAtDist(d) {
    d = Math.max(0, Math.min(totalLen, d));
    let acc = 0;
    for (let i = 0; i < segLen.length; i++) {
      if (acc + segLen[i] >= d || i === segLen.length - 1) {
        const a = CONFIG.path[i],
          b = CONFIG.path[i + 1];
        const t = segLen[i] ? (d - acc) / segLen[i] : 0;
        return {
          x: a[0] + (b[0] - a[0]) * t,
          y: a[1] + (b[1] - a[1]) * t,
          dx: b[0] - a[0],
          dy: b[1] - a[1],
        };
      }
      acc += segLen[i];
    }
    const last = CONFIG.path[CONFIG.path.length - 1];
    return { x: last[0], y: last[1], dx: 0, dy: 0 };
  }

  const canvas = document.getElementById("exp1Canvas");
  const ctx = canvas.getContext("2d");
  const $timer = $("#timerText");
  const $hpSegs = $("#hpSegs img");

  const SFX = { tap: "", hit: "" }; // ⚠️ 사운드 경로 미확정(Open Item)
  const E = "img/2_EXP1/";

  /* ----- 이미지 ----- */
  const imgs = {};
  function loadImg(key, src) {
    const i = new Image();
    i.src = src;
    imgs[key] = i;
  }
  loadImg("truck", E + "exp1_truck.png");
  loadImg("enemy1", E + "exp1_enemy1.png");
  loadImg("enemy2", E + "exp1_enemy2.png");

  const assets = [
    E + "exp1_bg.png",
    E + "exp1_truck.png",
    E + "exp1_enemy1.png",
    E + "exp1_enemy2.png",
    E + "exp1_hp_bg.png",
    E + "exp_hp.png",
    E + "exp_hp_off.png",
    E + "exp1_timer.png",
    E + "exp1_info.png",
    E + "exp1_popup_finish.png",
    E + "exp_setting.png",
    E + "exp_popup_btn_next.png",
    E + "exp_popup_btn_retry.png",
  ];

  let W = 0,
    H = 0,
    dpr = 1;
  let started = false,
    paused = false,
    over = false,
    startGate = false,
    raf = null,
    lastTs = 0,
    restartTimer = null; // 실패 시 붉은 점멸 후 자동 재시작 타이머
  let elapsed, hp, enemies, spawnTimer, animClock, truck;

  let showPath = (() => {
    try {
      return localStorage.getItem("db") === "1";
    } catch (e) {
      return false;
    }
  })();
  // 디버그 오버레이에서 경로 꼭지점 좌표(x,y) 라벨 표시 여부.
  // 고객 배포본은 false(선만 표시). path 좌표 수정 시 true 로 바꾸면 라벨이 다시 보임.
  const SHOW_VERTEX_LABELS = false;

  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = r.width;
    H = r.height;
  }
  const PX = (nx) => nx * W;
  const PY = (ny) => ny * H;

  function resetState() {
    elapsed = 0;
    hp = CONFIG.maxHp;
    enemies = [];
    spawnTimer = CONFIG.firstSpawnAt;
    animClock = 0;
    over = false;
    const p0 = pointAtDist(0);
    truck = { x: p0.x, y: p0.y, face: 1 };
    updateHp();
    updateTimer();
  }

  function updateHp() {
    $hpSegs.each(function (i) {
      this.src = E + (i < hp ? "exp_hp.png" : "exp_hp_off.png");
    });
  }
  function updateTimer() {
    const left = Math.max(0, Math.ceil(CONFIG.duration - elapsed));
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    $timer.text(`${mm}:${ss}`);
  }

  /* ----- 중국군 생성: 트럭 주변 사방(360°), spawnDist 거리 -----
     정면·측면·후면 어디서나 등장(뒤쪽만 나오는 느낌 제거). */
  function spawnEnemy() {
    const tp = pointAtDist((elapsed / CONFIG.duration) * totalLen);
    // 사방(전방위) 무작위 각
    const ang = Math.random() * Math.PI * 2;
    const d =
      CONFIG.spawnDist[0] +
      Math.random() * (CONFIG.spawnDist[1] - CONFIG.spawnDist[0]);
    // 화면비 보정 공간에서 좌표 → 정규화로 환원
    let ex = tp.x + (Math.cos(ang) * d) / AR_RATIO;
    let ey = tp.y + Math.sin(ang) * d;
    ex = Math.max(0.04, Math.min(0.96, ex));
    ey = Math.max(0.04, Math.min(0.92, ey));
    const travel =
      CONFIG.enemyTravel[0] +
      Math.random() * (CONFIG.enemyTravel[1] - CONFIG.enemyTravel[0]);
    const d0 = Math.max(0.001, adist(ex, ey, tp.x, tp.y));
    enemies.push({
      x: ex,
      y: ey,
      speed: d0 / travel, // 화면비 보정 거리/초
      face: sideFace(ex, ey), // 화면 대각선 기준 좌우반전
      age: 0, // 등장 경과(초) — 등장 스케일(0→100%)용
      dying: 0, // >0 이면 페이드아웃 진행(초)
    });
  }

  function update(dt) {
    if (over) return;
    animClock += dt;
    elapsed += dt;

    // 트럭 자동 이동(경로 따라 일정 속도)
    const tp = pointAtDist((elapsed / CONFIG.duration) * totalLen);
    truck.x = tp.x;
    truck.y = tp.y;
    if (Math.abs(tp.dx) > 0.0001) truck.face = tp.dx >= 0 ? 1 : -1;

    // 중국군 생성
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer += CONFIG.spawnInterval;
    }

    // 중국군 이동/판정
    for (const e of enemies) {
      e.age += dt; // 등장 스케일(0→100%) 진행
      if (e.dying > 0) {
        e.dying += dt; // 페이드아웃 진행
        continue;
      }
      const d = adist(e.x, e.y, truck.x, truck.y);
      if (d <= CONFIG.contactR) {
        // 트럭 피격 → 체력 감소 + 해당 적 제거
        hp = Math.max(0, hp - 1);
        updateHp();
        AR.Sound.sfx(SFX.hit);
        e.remove = true;
        if (hp <= 0) {
          finish(false);
          return;
        }
        continue;
      }
      // 트럭 쪽으로 이동(lerp by speed/거리)
      const f = Math.min(1, (e.speed * dt) / Math.max(d, 1e-4));
      e.x += (truck.x - e.x) * f;
      e.y += (truck.y - e.y) * f;
      // 좌우반전: 화면 대각선(y=x) 기준(현재 위치가 선의 어느 쪽인지)
      e.face = sideFace(e.x, e.y);
    }
    // 정리: 제거 대상 + 페이드아웃 끝난 적
    enemies = enemies.filter((e) => !e.remove && e.dying <= CONFIG.dieDur);

    updateTimer();

    // 트럭 도착(30초 생존) → 성공
    if (elapsed >= CONFIG.duration) finish(true);
  }

  // 이미지 비율 유지하며 중앙 기준으로 그림(폭=정규화)
  function drawSprite(img, nx, ny, nw, flip, alpha) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const w = nw * W;
    const h = w * (img.naturalHeight / img.naturalWidth);
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(PX(nx), PY(ny));
    if (flip < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function enemyFrame() {
    return Math.floor(animClock / 0.18) % 2 === 0 ? imgs.enemy1 : imgs.enemy2;
  }

  // 등장 중 흰색 틴트용 오프스크린(재사용) — 배경 오염 없이 스프라이트만 하얗게
  const tintCv = document.createElement("canvas");
  const tintCtx = tintCv.getContext("2d");

  // 중국군 그리기: 등장 중이면 흰색 틴트(white 0~1)를 스프라이트에만 입힘.
  // white=1 → 완전 하양, white=0 → 원래 붉은색. alpha 는 전체 투명도.
  function drawEnemy(img, nx, ny, nw, flip, alpha, white) {
    if (!img || !img.complete || !img.naturalWidth) return;
    if (white <= 0.001) {
      drawSprite(img, nx, ny, nw, flip, alpha); // 등장 완료 → 원본 그대로
      return;
    }
    const w = Math.max(1, Math.round(nw * W));
    const h = Math.max(1, Math.round(w * (img.naturalHeight / img.naturalWidth)));
    // 오프스크린: 스프라이트 그린 뒤 source-atop 으로 흰색을 스프라이트 픽셀에만 덧칠
    tintCv.width = w;
    tintCv.height = h;
    tintCtx.clearRect(0, 0, w, h);
    tintCtx.globalCompositeOperation = "source-over";
    tintCtx.globalAlpha = 1;
    tintCtx.drawImage(img, 0, 0, w, h);
    tintCtx.globalCompositeOperation = "source-atop";
    tintCtx.globalAlpha = Math.min(1, white);
    tintCtx.fillStyle = "#ffffff";
    tintCtx.fillRect(0, 0, w, h);
    tintCtx.globalCompositeOperation = "source-over";
    // 메인 캔버스에 배치(중앙 기준 + 좌우반전 + 전체 알파)
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(PX(nx), PY(ny));
    if (flip < 0) ctx.scale(-1, 1);
    ctx.drawImage(tintCv, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 디버그 오버레이(경로/생성/판정) — db=1 또는 P키
    if (showPath) {
      // 좌우반전 경계선: 화면 대각선(좌상단 → 우하단, 정규화 y=x).
      // 이 선의 좌하단쪽 중국군이 좌우반전됨.
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,60,60,0.9)";
      ctx.beginPath();
      ctx.moveTo(PX(0), PY(0));
      ctx.lineTo(PX(1), PY(1));
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(80,180,255,0.9)";
      ctx.beginPath();
      CONFIG.path.forEach(([x, y], i) =>
        i ? ctx.lineTo(PX(x), PY(y)) : ctx.moveTo(PX(x), PY(y)),
      );
      ctx.stroke();
      // 경로 꼭지점 마커 + 좌표 라벨(path 수정용) — 각 꼭지점에 점·인덱스·(x, y)
      // ※ 핵심 코드는 유지하되 SHOW_VERTEX_LABELS 로 실행만 토글(고객 배포본은 선만 표시).
      if (SHOW_VERTEX_LABELS) {
        const fs = Math.max(11, W * 0.011);
        ctx.font = `bold ${fs}px monospace`;
        ctx.textBaseline = "bottom";
        CONFIG.path.forEach(([x, y], i) => {
          const px = PX(x),
            py = PY(y);
          // 꼭지점 점
          ctx.fillStyle = "rgba(255,235,90,0.95)";
          ctx.beginPath();
          ctx.arc(px, py, Math.max(3, W * 0.004), 0, Math.PI * 2);
          ctx.fill();
          // 라벨 텍스트(외곽선 + 채움으로 배경 위 가독성 확보)
          const label = `${i}: ${x.toFixed(3)}, ${y.toFixed(3)}`;
          // 화면 밖으로 잘리지 않도록 오른쪽 끝 꼭지점은 왼쪽 정렬
          ctx.textAlign = x > 0.85 ? "right" : "left";
          const tx = x > 0.85 ? px - 8 : px + 8;
          const ty = py - 6;
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(0,0,0,0.85)";
          ctx.strokeText(label, tx, ty);
          ctx.fillStyle = "rgba(255,235,90,0.98)";
          ctx.fillText(label, tx, ty);
        });
      }
      // 트럭 충돌 반경(화면비 보정 → 가로 픽셀 기준 원 근사)
      ctx.strokeStyle = "rgba(255,140,0,0.9)";
      ctx.beginPath();
      ctx.arc(PX(truck.x), PY(truck.y), CONFIG.contactR * W, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 중국군: 등장 중(t<1)엔 하얀색·반투명(매복→등장), 완료 시 원래 붉은색.
    for (const e of enemies) {
      const t = Math.min(1, (e.age || 0) / CONFIG.popDur); // 등장 진행 0~1
      const dieA = e.dying > 0 ? Math.max(0, 1 - e.dying / CONFIG.dieDur) : 1;
      const white = 1 - t; // t=0 완전 하양 → t=1 원색
      const spawnA = CONFIG.spawnMinAlpha + (1 - CONFIG.spawnMinAlpha) * t; // 페이드인
      drawEnemy(
        enemyFrame(),
        e.x,
        e.y,
        CONFIG.enemyW * t, // 등장 스케일(0→100%)
        e.face,
        dieA * spawnA,
        white,
      );
    }

    // 트럭(진행 방향으로 플립)
    drawSprite(imgs.truck, truck.x, truck.y, CONFIG.truckW, truck.face);
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    if (started && !paused && !over) update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }

  function startGame() {
    if (started) return;
    started = true;
    over = false;
    $("#gameStart").addClass("display-none");
    lastTs = 0;
  }

  // 붉은 화면 점멸(피격/실패 연출) — #hitFlash 오버레이 애니메이션 재시작
  function flashHit() {
    const $f = $("#hitFlash");
    if (!$f.length) return;
    $f.removeClass("show");
    void $f[0].offsetWidth; // 리플로우 강제 → 애니메이션 재시작
    $f.addClass("show");
  }

  function finish(success) {
    over = true;
    started = false;
    if (success) {
      // 성공(30초 생존) → 체험 종료 팝업
      AR.openPopup("#finishDim");
    } else {
      // 실패(체력 0) → 종료 팝업 대신 붉은 화면 점멸 후 자동 재시작(청산리 EXP① 방식)
      flashHit();
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(resetGame, 700);
    }
  }

  function resetGame() {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
    AR.closePopup("#finishDim");
    started = false;
    paused = false;
    resetState();
    render();
    // 재시작: 안내 없이 곧바로 시작
    startGame();
  }

  /* ----- 시작 흐름 -----
     진입 → 체험 방법 안내 팝업(게이트). 닫으면 시작 오버레이 노출 → 화면 터치 → PLAY. */
  function openStartGate() {
    startGate = true;
    AR.openPopup("#tutorialDim");
  }

  /* ----- 입력: 중국군 터치 ----- */
  function tapAt(clientX, clientY) {
    if (!started || over || paused) return;
    const r = canvas.getBoundingClientRect();
    const nx = (clientX - r.left) / r.width;
    const ny = (clientY - r.top) / r.height;
    let target = null,
      best = CONFIG.tapR;
    for (const e of enemies) {
      if (e.dying > 0) continue;
      const d = adist(nx, ny, e.x, e.y);
      if (d < best) {
        best = d;
        target = e;
      }
    }
    if (target) {
      target.dying = 0.0001; // 페이드아웃 시작
      AR.Sound.sfx(SFX.tap);
    }
  }
  canvas.addEventListener("mousedown", (e) => tapAt(e.clientX, e.clientY));
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (t) tapAt(t.clientX, t.clientY);
    },
    { passive: true },
  );

  /* ----- 이벤트 ----- */
  // 시작 오버레이(화면 아무 곳이나) 터치 → PLAY
  $("#gameStart").on("click touchstart", function (e) {
    e.preventDefault();
    startGame();
  });
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
    if (startGate) {
      // 시작 게이트: 안내 닫으면 터치 없이 곧바로 게임 시작(자동 진행)
      startGate = false;
      startGame();
    } else {
      paused = false; // 게임 중 튜토리얼 열람 후 닫기 → 재개
    }
  });
  $("#btnNext").on("click", () => AR.go("bridge.html"));
  $("#btnRetry").on("click", resetGame);

  // 디버그: 게임 중 P키로 경로/판정 오버레이 토글
  window.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") showPath = !showPath;
  });
  window.addEventListener("resize", () => {
    sizeCanvas();
    render();
  });

  /* ----- 시작 ----- */
  AR.preload(assets).then(() => {
    sizeCanvas();
    resetState();
    raf = requestAnimationFrame(loop);
    openStartGate(); // 진입 시 체험 방법 안내 팝업
  });
});
