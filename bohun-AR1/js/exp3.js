/* =========================================================================
   EXP③ 탑다운 짚차 운전게임
   - 조이스틱으로 지프 운전. 경로 이탈(±) 시 흙먼지 + 속도 50% 감소.
   - 총사령부(태극기)에서 서신 수신 → 3개 지대 막사에 전달 → 완료.
   - 맵이 한 화면에 다 들어오므로 카메라 추적 불필요(정적 맵 위 오버레이 렌더).
   ⚠️ 경로 폴리라인/막사 좌표/이탈 임계/속도는 임시값(Open Item: EXP③ 맵 데이터).
      MAP 객체에서 정규화 좌표(0~1)로 조정한다.
   ========================================================================= */
document.title = "EXP③ — 서신 전달";

$(function () {
  /* ----- 맵 데이터(정규화 0~1) — 프로토타입(agent-exp3) 격자 기준 좌표 -----
     ⚠️ 미세 좌표는 실기기에서 보며 조정 가능. */
  const MAP = {
    start: { x: 0.23, y: 0.76 }, // 시작점: 조이스틱(좌하단) 우측
    startAngle: 0, // 스프라이트가 오른쪽을 향함 → 0 = 우측
    hq: { x: 0.75, y: 0.73 }, // 충칭 한국광복군 총사령부(태극기 옆) = 서신 수신
    depots: [
      { x: 0.21, y: 0.23, name: "라오허카우 1지대 1구대" }, // 좌상단
      { x: 0.38, y: 0.37, name: "푸양 3지대" }, // 중앙
      { x: 0.8, y: 0.3, name: "진화 1지대 2구대" }, // 우상단
    ],
    // 도로망(여러 폴리라인). 차량 위치와 모든 폴리라인 최소거리로 이탈 판정.
    roads: [
      [[0.17, 0.82], [0.18, 0.6], [0.19, 0.4], [0.21, 0.25]], // 좌측 세로 → 1지대1구대
      [[0.21, 0.25], [0.3, 0.3], [0.38, 0.37]], // 1지대1구대 → 3지대
      [[0.38, 0.37], [0.45, 0.5], [0.5, 0.63], [0.55, 0.71]], // 3지대 → 하단 합류
      [[0.17, 0.82], [0.32, 0.76], [0.45, 0.73], [0.55, 0.71], [0.66, 0.72], [0.76, 0.73]], // 하단 가로 → HQ
      [[0.55, 0.71], [0.63, 0.58], [0.71, 0.45], [0.78, 0.34], [0.8, 0.3]], // 우측 분기 → 1지대2구대
    ],
    reach: 0.07, // 체크포인트 도달 반경(정규화)
    devThreshold: 0.07, // 경로 이탈 임계(정규화 거리)
    speed: 0.22, // 기본 속도(정규화/초)
    offPenalty: 0.5, // 이탈 시 속도 배율
  };

  const canvas = document.getElementById("exp3Canvas");
  const ctx = canvas.getContext("2d");
  const $gage = $("#gageText");
  const $toast = $("#toast");

  const imgs = {};
  function loadImg(key, src) {
    const i = new Image();
    i.src = src;
    imgs[key] = i;
  }
  loadImg("jeep", "img/6_EXP3/exp3_jeep.png");
  loadImg("susin", "img/6_EXP3/exp3_susin.png");
  loadImg("spot", "img/6_EXP3/exp3_spot.png");
  loadImg("spotDone", "img/6_EXP3/exp3_spot_done.png");

  const assets = [
    "img/6_EXP3/exp3_bg.png",
    "img/6_EXP3/exp3_jeep.png",
    "img/6_EXP3/exp3_susin.png",
    "img/6_EXP3/exp3_spot.png",
    "img/6_EXP3/exp3_spot_done.png",
    "img/6_EXP3/exp_joystick.png",
    "img/6_EXP3/exp_joystick_bg.png",
    "img/6_EXP3/exp3_msg_start.png",
    "img/6_EXP3/exp3_info.png",
    "img/6_EXP3/exp3_popup_finish.png",
    "img/common/exp_gage_bg.png",
    "img/common/exp_setting.png",
    "img/common/exp_popup_btn_next.png",
    "img/common/exp_popup_btn_retry.png",
  ];

  let W = 0,
    H = 0,
    dpr = 1;
  let started = false,
    paused = false,
    raf = null,
    lastTs = 0;
  let jeep, input, hasLetters, delivered, particles;

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
    jeep = { x: MAP.start.x, y: MAP.start.y, angle: MAP.startAngle };
    input = { x: 0, y: 0 };
    hasLetters = false;
    delivered = 0;
    particles = [];
    MAP.depots.forEach((d) => (d.done = false));
    updateGage();
  }

  // 서신 전달 카운트: 0/3 → 3/3 (총사령부 수신은 카운트 제외). progress fill 동기화.
  function updateGage() {
    $gage.text(`서신 ${delivered}/3`);
    $("#gageFill").css("width", (delivered / 3) * 88 + "%");
  }

  function toast(msg) {
    $toast.text(msg).removeClass("show");
    void $toast[0].offsetWidth;
    $toast.addClass("show");
  }

  /* ----- 경로 이탈 거리(정규화) — 도로망(여러 폴리라인) 최소거리 ----- */
  function distToPath(px, py) {
    let min = Infinity;
    for (const road of MAP.roads) {
      for (let i = 0; i < road.length - 1; i++) {
        const [ax, ay] = road[i];
        const [bx, by] = road[i + 1];
        const dx = bx - ax,
          dy = by - ay;
        const len2 = dx * dx + dy * dy || 1e-6;
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t * dx,
          cy = ay + t * dy;
        const d = Math.hypot(px - cx, py - cy);
        if (d < min) min = d;
      }
    }
    return min;
  }

  function spawnDust() {
    if (particles.length > 60) return;
    const n = 2;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: jeep.x,
        y: jeep.y,
        vx: (Math.cos(jeep.angle + Math.PI) + (Math.random() - 0.5)) * 0.02,
        vy: (Math.sin(jeep.angle + Math.PI) + (Math.random() - 0.5)) * 0.02,
        life: 0,
        max: 0.5 + Math.random() * 0.3,
        size: 4 + Math.random() * 6,
      });
    }
  }

  function checkpoints() {
    // 총사령부에서 서신 수신
    if (!hasLetters && Math.hypot(jeep.x - MAP.hq.x, jeep.y - MAP.hq.y) < MAP.reach) {
      hasLetters = true;
      toast("총사령부에서 서신을 받았다! 각 지대에 전달하라");
      AR.Sound.sfx(SFX.pickup);
    }
    // 각 지대 전달
    if (hasLetters) {
      for (const d of MAP.depots) {
        if (!d.done && Math.hypot(jeep.x - d.x, jeep.y - d.y) < MAP.reach) {
          d.done = true;
          delivered++;
          updateGage();
          toast(`${d.name} 전달 완료! (${delivered}/3)`);
          AR.Sound.sfx(SFX.deliver);
          if (delivered >= 3) finish();
        }
      }
    }
  }

  const SFX = { pickup: "", deliver: "", dust: "" }; // ⚠️ 사운드 경로 미확정(Open Item)

  function update(dt) {
    // 이동
    const mag = Math.hypot(input.x, input.y);
    const off = distToPath(jeep.x, jeep.y) > MAP.devThreshold;
    if (mag > 0.05) {
      jeep.angle = Math.atan2(input.y, input.x);
      let sp = MAP.speed * (off ? MAP.offPenalty : 1) * Math.min(1, mag);
      jeep.x = Math.max(0.03, Math.min(0.97, jeep.x + Math.cos(jeep.angle) * sp * dt));
      jeep.y = Math.max(0.03, Math.min(0.97, jeep.y + Math.sin(jeep.angle) * sp * dt));
      if (off) spawnDust();
    }
    // 파티클
    for (const p of particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life < p.max);
    checkpoints();
  }

  function drawSpot(cp, done) {
    const img = done ? imgs.spotDone : imgs.spot;
    if (!img || !img.complete) return;
    const s = W * 0.055;
    // 느낌표 마커를 체크포인트 좌표 중앙에 배치
    ctx.drawImage(img, PX(cp.x) - s / 2, PY(cp.y) - s / 2, s, s);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 체크포인트 마커(총사령부 + 미전달 지대)
    drawSpot(MAP.hq, hasLetters);
    MAP.depots.forEach((d) => drawSpot(d, d.done));

    // 흙먼지
    for (const p of particles) {
      const a = 1 - p.life / p.max;
      ctx.fillStyle = `rgba(150,130,90,${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(PX(p.x), PY(p.y), p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 지프
    if (imgs.jeep && imgs.jeep.complete) {
      const jw = W * 0.075;
      const jh = jw * (106 / 178);
      ctx.save();
      ctx.translate(PX(jeep.x), PY(jeep.y));
      ctx.rotate(jeep.angle); // 스프라이트 기본 방향 = 오른쪽(+x)
      ctx.drawImage(imgs.jeep, -jw / 2, -jh / 2, jw, jh);
      ctx.restore();

      // 서신 적재 표시
      if (hasLetters && delivered < 3 && imgs.susin && imgs.susin.complete) {
        const sw = W * 0.035;
        const sh = sw * (70 / 92);
        ctx.drawImage(imgs.susin, PX(jeep.x) - sw / 2, PY(jeep.y) - jh - sh, sw, sh);
      }
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05; // 저사양 프레임 튐 보호
    if (!paused) {
      update(dt);
      render();
    }
    raf = requestAnimationFrame(loop);
  }

  function startGame() {
    if (started) return;
    started = true;
    $("#gameStart").addClass("display-none");
    sizeCanvas();
    resetState();
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    started = false;
    AR.openPopup("#finishDim");
  }

  function resetGame() {
    AR.closePopup("#finishDim");
    $("#gameStart").removeClass("display-none");
    ctx.clearRect(0, 0, W, H);
    started = false;
    paused = false;
    resetState();
  }

  /* ----- 조이스틱 ----- */
  (function bindJoystick() {
    const joy = document.getElementById("joystick");
    const $stick = $("#joyStick");
    let active = false;
    let cx = 0,
      cy = 0,
      radius = 1;

    function pos(e) {
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX, y: t.clientY };
    }
    function start(e) {
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      radius = r.width / 2;
      active = true;
      move(e);
    }
    function move(e) {
      if (!active) return;
      e.preventDefault();
      const p = pos(e);
      let dx = p.x - cx,
        dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      if (d > radius) {
        dx = (dx / d) * radius;
        dy = (dy / d) * radius;
      }
      input.x = dx / radius;
      input.y = dy / radius;
      $stick.css("transform", `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`);
    }
    function end() {
      active = false;
      input.x = 0;
      input.y = 0;
      $stick.css("transform", "translate(-50%, -50%)");
    }
    joy.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    joy.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  })();

  /* ----- 이벤트 ----- */
  $("#gameStart").on("click", startGame);
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
  $("#btnNext").on("click", () => AR.go("end.html"));
  $("#btnRetry").on("click", resetGame);

  window.addEventListener("resize", () => {
    if (started) sizeCanvas();
  });

  AR.preload(assets).then(() => sizeCanvas());
});
