/* =========================================================================
   EXP① 미로/물자 수집 게임
   - 조이스틱(모바일)/방향키(PC)로 대원을 4방향 이동. 입력 떼면 즉시 정지(HOLD).
   - 일본군은 정해진 구간을 좌우 왕복 순찰. 대원과 겹치면 실패 → 시작점 복귀(실패 +1).
   - 물자 3개(식량자루/돈자루/보따리) 획득 시마다 메시지 + 이동속도 단계 하락(100→90→80→70%).
   - 물자 3/3 후 야영지(목표지점) 도달 → 성공 종료. 5회 이상 실패 → 종료 팝업.
   ⚠️ 맵 좌표/순찰 구간/속도/판정은 임시값(Open Item: EXP① 게임 데이터).
      CONFIG 의 정규화 좌표(0~1)로 조정한다. localStorage.db="1" → 디버그 오버레이.
   ========================================================================= */
document.title = "EXP① — 물자 보급";

$(function () {
  /* ----- 게임 데이터(정규화 0~1) — 실기기에서 보며 조정 ----- */
  const CONFIG = {
    start: { x: 0.2, y: 0.89 }, // 시작점(좌하단)
    goal: { x: 0.935, y: 0.355, r: 0.06 }, // 야영지(목표 복귀 지점)
    items: [
      { x: 0.69, y: 0.75, sprite: "rice", msg: "exp1_msg_text1.png" },
      { x: 0.47, y: 0.55, sprite: "fur", msg: "exp1_msg_text2.png" },
      { x: 0.25, y: 0.35, sprite: "money", msg: "exp1_msg_text3.png" },
    ],
    enemies: [
      { y: 0.73, x0: 0.34, x1: 0.6, speed: 0.12, dir: 1 }, // 1층 일본군
      { y: 0.53, x0: 0.1, x1: 0.4, speed: 0.12, dir: 1 }, // 2층 일본군
      { y: 0.33, x0: 0.3, x1: 0.8, speed: 0.12, dir: -1 }, // 3층 일본군
    ],
    playerSpeed: 0.2, // 기본 이동 속도(정규화/초) @100%
    speedStage: [1, 0.9, 0.8, 0.7], // 물자 획득 수에 따른 속도 배율
    pickR: 0.06, // 물자 획득 판정 반경
    hitOverlap: 0.1, // 충돌 판정: 대원·일본군 이미지(AABB)가 작은 쪽 면적의 10% 이상 겹치면 실패
    hitScale: 0.6, // 히트박스 = 스프라이트의 이 비율(중심 기준 축소). 작을수록 충돌이 관대해짐. db 로 박스 확인
    enemyHitScaleY: 0.8, // 일본군 히트박스 세로 추가 배율(가로는 hitScale, 세로 = hitScale × 이 값)
    maxFails: 5, // 이 횟수 이상 실패 시 종료 팝업
    playerW: 0.085, // 스프라이트 폭(정규화)
    enemyW: 0.055,
    itemW: 0.055,
    boxW: 0.025, // 물자 상자 크기(캐릭터 1시 방향에 쌓임)
    pathWidth: 0.025, // (디버그 표시용) 통로 튜브 반경
    railGrab: 0.05, // 통로(레일) 흡착 허용 거리 — 이 안에 주축 통로가 있을 때만 그 위로 스냅(사다리 진입 여유)
    // 이동 가능 경로(정규화 폴리라인). 대원은 이 통로 위에서만 이동 가능.
    // 디버그 모드(localStorage.db="1" 또는 게임 중 P키)로 통로를 표시하며 튜닝.
    paths: [
      // ── 가로 통로(층) : 위에서부터 y 가 작음. 4개 층 ──
      // 1층(맨 아래, 시작점이 있는 층)
      [
        [0.1, 0.89],
        [0.9, 0.89],
      ],
      // 2층 (일본군#1 순찰 / rice 식량 근처)
      [
        [0.34, 0.73],
        [0.95, 0.73],
      ],
      // 3층 (일본군#2 순찰 / fur 보따리 근처)
      [
        [0.08, 0.53],
        [0.95, 0.53],
      ],
      // 4층(맨 위, 야영지 층 / 일본군#3 순찰 / money 돈 근처)
      [
        [0.08, 0.33],
        [0.95, 0.33],
      ],
      // ── 세로 연결(사다리) : 층과 층을 잇는 통로 ──
      // 중앙 우측 사다리 (1층↔2층)
      [
        [0.61, 0.89],
        [0.61, 0.73],
      ],
      // 우측 사다리 (2층↔3층)
      [
        [0.845, 0.73],
        [0.87, 0.53],
      ],
      // 우측 사다리 (3층↔4층)
      [
        [0.8, 0.53],
        [0.82, 0.33],
      ],
      // 중앙 사다리 (3층↔4층)
      [
        [0.62, 0.53],
        [0.62, 0.33],
      ],
      // 좌측 사다리 (3층↔4층)
      [
        [0.213, 0.53],
        [0.213, 0.33],
      ],
    ],
  };
  const clamp = (v) => Math.max(0.03, Math.min(0.97, v));
  // 획득 물자 상자: 캐릭터의 1시 방향(우상향)에 쌓임
  const BOX_DIR = { x: 0.5, y: -0.896 }; // 1시 방향 단위벡터(화면 y는 아래가 +)
  const BOX_ANCHOR = 0.04; // 캐릭터 중심에서 1시 방향으로 띄운 거리(정규화)

  const canvas = document.getElementById("exp1Canvas");
  const ctx = canvas.getContext("2d");
  const $count = $("#count");

  const SFX = { pickup: "", hit: "" }; // ⚠️ 사운드 경로 미확정(Open Item)

  /* ----- 이미지 ----- */
  const imgs = {};
  function loadImg(key, src) {
    const i = new Image();
    i.src = src;
    imgs[key] = i;
  }
  const E = "img/2_Exp1/";
  loadImg("p_stand", E + "exp1_player_stand.png");
  loadImg("p_walk1", E + "exp1_player_walk1.png");
  loadImg("p_walk2", E + "exp1_player_walk2.png");
  loadImg("e_stand", E + "exp1_police_stand.png");
  loadImg("e_walk1", E + "exp1_police_walk1.png");
  loadImg("e_walk2", E + "exp1_police_walk2.png");
  loadImg("rice", E + "exp1_rice.png");
  loadImg("money", E + "exp1_money.png");
  loadImg("fur", E + "exp1_fur.png");
  loadImg("box", E + "exp1_box.png");
  // 맨손(물자 0개) 걷기 세트 — 없으면 현재 세트로 폴백
  loadImg("pe_walk1", E + "exp1_player_walk1_nomal.png");
  loadImg("pe_walk2", E + "exp1_player_walk2_nomal.png");

  const assets = [
    E + "exp1_bg.png",
    E + "exp1_player_stand.png",
    E + "exp1_player_walk1.png",
    E + "exp1_player_walk2.png",
    E + "exp1_police_stand.png",
    E + "exp1_police_walk1.png",
    E + "exp1_police_walk2.png",
    E + "exp1_rice.png",
    E + "exp1_money.png",
    E + "exp1_fur.png",
    E + "exp1_box.png",
    E + "exp1_player_walk1_nomal.png",
    E + "exp1_player_walk2_nomal.png",
    E + "exp1_msg_start.png",
    E + "exp1_msg_text1.png",
    E + "exp1_msg_text2.png",
    E + "exp1_msg_text3.png",
    E + "exp1_info.png",
    E + "exp1_popup_finish.png",
    E + "exp_joystick_bg.png",
    E + "exp_joystick.png",
    E + "exp_setting.png",
    E + "exp_popup_btn_next.png",
    E + "exp_popup_btn_retry.png",
  ];

  let W = 0,
    H = 0,
    dpr = 1;
  let started = false,
    paused = false,
    over = false, // 게임 종료(성공/실패) 후 조작 차단
    raf = null,
    lastTs = 0;
  let player, input, items, enemies, collected, fails, animClock;

  let showPath = (() => {
    try {
      return localStorage.getItem("db") === "1";
    } catch (e) {
      return false;
    }
  })();

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
    player = { x: CONFIG.start.x, y: CONFIG.start.y, face: 1, moving: false };
    input = { x: 0, y: 0 };
    items = CONFIG.items.map((it) => Object.assign({ got: false }, it));
    enemies = CONFIG.enemies.map((e) => ({
      x: (e.x0 + e.x1) / 2,
      y: e.y,
      x0: e.x0,
      x1: e.x1,
      speed: e.speed,
      dir: e.dir,
    }));
    collected = 0;
    fails = 0;
    animClock = 0;
    over = false;
    updateCount();
  }

  function updateCount() {
    $count.text(`물자 ${collected}/3`);
  }

  /* ----- 물자 획득 메시지(중앙, 잠깐 노출) ----- */
  let msgTimer = null;
  function showMsg(src) {
    const $m = $("#exp1Msg");
    $("#exp1MsgImg").attr("src", E + src);
    $m.addClass("show");
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = setTimeout(() => $m.removeClass("show"), 2200);
  }

  function flashHit() {
    const $f = $("#hitFlash");
    $f.removeClass("show");
    void $f[0].offsetWidth;
    $f.addClass("show");
  }

  function speedMul() {
    return CONFIG.speedStage[Math.min(collected, 3)];
  }

  function fail() {
    fails++;
    flashHit();
    AR.Sound.sfx(SFX.hit);
    // 일본군에게 잡히면 물자 초기화 + 시작점으로 복귀
    collected = 0;
    items.forEach((it) => (it.got = false));
    updateCount();
    player.x = CONFIG.start.x;
    player.y = CONFIG.start.y;
    input.x = 0;
    input.y = 0;
    if (fails >= CONFIG.maxFails) finish();
  }

  /* ----- 입력 주축(가로/세로)에 맞는 통로 중 (px,py)에 가장 가까운 지점 -----
     horiz=true  → 가로 통로(층)만 대상  → y 가 통로선에 스냅되고 x 만 이동
     horiz=false → 세로 통로(사다리)만 대상 → x 가 사다리선에 스냅되고 y 만 이동
     "주축에 맞는 통로"에만 붙이므로, 가로 통로 위에선 상하 이동이 생기지 않고
     세로 사다리 위에선 좌우 이동이 생기지 않는다(깔끔한 레일 이동). */
  function nearestRail(px, py, horiz) {
    let best = { d: Infinity, x: px, y: py };
    for (const line of CONFIG.paths) {
      for (let i = 0; i < line.length - 1; i++) {
        const ax = line[i][0],
          ay = line[i][1];
        const bx = line[i + 1][0],
          by = line[i + 1][1];
        const segHoriz = Math.abs(by - ay) < Math.abs(bx - ax);
        if (segHoriz !== horiz) continue; // 주축에 맞는 통로만 후보
        const dx = bx - ax,
          dy = by - ay;
        const len2 = dx * dx + dy * dy || 1e-6;
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t * dx,
          cy = ay + t * dy;
        const d = Math.hypot(px - cx, py - cy);
        if (d < best.d) best = { d, x: cx, y: cy };
      }
    }
    return best;
  }
  /* ----- 충돌 판정: 대원·일본군 스프라이트(AABB) 겹침 비율 -----
     스프라이트는 중심정렬, 폭=정규화값(playerW/enemyW), 높이=폭×이미지비율.
     x·y 정규화 기준(W,H)이 다르므로 픽셀 공간에서 겹침 면적을 계산하고,
     겹침 면적이 더 작은 스프라이트 면적의 hitOverlap(=10%) 이상이면 충돌(=실패). */
  function rectPx(cxN, cyN, wN, img, sx = 1, sy = sx) {
    const w0 = wN * W;
    const h0 =
      w0 * (img && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1);
    const w = w0 * sx,
      h = h0 * sy;
    const cx = cxN * W,
      cy = cyN * H;
    return {
      l: cx - w / 2,
      r: cx + w / 2,
      t: cy - h / 2,
      b: cy + h / 2,
      area: w * h,
    };
  }
  function overlapHit(p, e) {
    const pr = rectPx(p.x, p.y, CONFIG.playerW, imgs.p_stand, CONFIG.hitScale);
    const er = rectPx(
      e.x,
      e.y,
      CONFIG.enemyW,
      imgs.e_stand,
      CONFIG.hitScale,
      CONFIG.hitScale * CONFIG.enemyHitScaleY,
    );
    const ox = Math.min(pr.r, er.r) - Math.max(pr.l, er.l);
    const oy = Math.min(pr.b, er.b) - Math.max(pr.t, er.t);
    if (ox <= 0 || oy <= 0) return false; // 겹치지 않음
    const inter = ox * oy;
    return inter / Math.min(pr.area, er.area) >= CONFIG.hitOverlap;
  }

  function update(dt) {
    if (over) return; // 게임 종료 후 조작/진행 정지
    animClock += dt;

    // 대원 이동 — 입력의 주축(가로/세로) 한 방향으로만 이동하고, 그 방향 통로(레일)에 스냅.
    // → 가로 통로 위에선 상하 이동 불가, 세로 사다리 위에선 좌우 이동 불가(깔끔한 4방향 레일 이동).
    const ix = Math.abs(input.x),
      iy = Math.abs(input.y);
    player.moving = ix > 0.05 || iy > 0.05;
    if (player.moving) {
      const horiz = ix >= iy; // 입력 주축(가로 우선)
      const sp =
        CONFIG.playerSpeed *
        speedMul() *
        Math.min(1, Math.hypot(input.x, input.y));
      let tx = player.x,
        ty = player.y;
      if (horiz) tx = clamp(player.x + Math.sign(input.x) * sp * dt);
      else ty = clamp(player.y + Math.sign(input.y) * sp * dt);
      // 주축에 맞는 통로가 railGrab 안에 있을 때만 그 통로 위로 스냅 이동
      const snap = nearestRail(tx, ty, horiz);
      if (
        snap.d <= CONFIG.railGrab &&
        (snap.x !== player.x || snap.y !== player.y)
      ) {
        player.x = snap.x;
        player.y = snap.y;
        if (Math.abs(input.x) > 0.01) player.face = input.x > 0 ? 1 : -1;
      }
    }

    // 일본군 순찰(좌우 왕복)
    for (const e of enemies) {
      e.x += e.dir * e.speed * dt;
      if (e.x >= e.x1) {
        e.x = e.x1;
        e.dir = -1;
      } else if (e.x <= e.x0) {
        e.x = e.x0;
        e.dir = 1;
      }
      // 충돌
      if (overlapHit(player, e)) {
        fail();
        return;
      }
    }

    // 물자 획득
    for (const it of items) {
      if (it.got) continue;
      if (Math.hypot(it.x - player.x, it.y - player.y) < CONFIG.pickR) {
        it.got = true;
        collected++;
        updateCount();
        showMsg(it.msg);
        AR.Sound.sfx(SFX.pickup);
      }
    }

    // 야영지 복귀(물자 3개 모두 획득 후)
    if (
      collected >= 3 &&
      Math.hypot(player.x - CONFIG.goal.x, player.y - CONFIG.goal.y) <
        CONFIG.goal.r
    ) {
      finish();
    }
  }

  // 이미지 비율 유지하며 중앙 기준으로 그림(폭=정규화)
  function drawSprite(img, nx, ny, nw, flip) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const w = nw * W;
    const h = w * (img.naturalHeight / img.naturalWidth);
    const x = PX(nx);
    const y = PY(ny);
    ctx.save();
    ctx.translate(x, y);
    if (flip < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function walkFrame(prefix) {
    // stand → walk1 → walk2 → walk1 ... (이동 중에만 교대)
    const f = Math.floor(animClock / 0.18) % 2;
    return imgs[f === 0 ? prefix + "walk1" : prefix + "walk2"];
  }

  // 대원 스프라이트: 물자 0개 → 맨손 세트(pe_*), 1개↑ → 드는 세트(p_*).
  // 맨손 에셋이 아직 없으면 현재(드는) 세트로 폴백.
  function playerSprite() {
    const frame = player.moving
      ? Math.floor(animClock / 0.18) % 2 === 0
        ? "walk1"
        : "walk2"
      : "stand";
    if (collected < 1) {
      const e = imgs["pe_" + frame];
      if (e && e.naturalWidth) return e;
    }
    return imgs["p_" + frame];
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 디버그 오버레이(좌표 튜닝용)
    if (showPath) {
      ctx.font = `bold ${Math.max(10, W * 0.014)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // 이동 가능 통로 — 폭(tube) + 중심선
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(80,180,255,0.22)";
      ctx.lineWidth = PX(CONFIG.pathWidth) * 2;
      CONFIG.paths.forEach((line) => {
        ctx.beginPath();
        line.forEach(([x, y], i) =>
          i ? ctx.lineTo(PX(x), PY(y)) : ctx.moveTo(PX(x), PY(y)),
        );
        ctx.stroke();
      });
      ctx.strokeStyle = "rgba(80,180,255,0.95)";
      ctx.lineWidth = 2;
      CONFIG.paths.forEach((line) => {
        ctx.beginPath();
        line.forEach(([x, y], i) =>
          i ? ctx.lineTo(PX(x), PY(y)) : ctx.moveTo(PX(x), PY(y)),
        );
        ctx.stroke();
      });
      // 시작점
      ctx.fillStyle = "rgba(255,210,90,0.95)";
      ctx.beginPath();
      ctx.arc(PX(CONFIG.start.x), PY(CONFIG.start.y), W * 0.01, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fc6";
      ctx.fillText("시작", PX(CONFIG.start.x), PY(CONFIG.start.y) - W * 0.03);
      // 야영지
      ctx.strokeStyle = "rgba(60,230,110,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        PX(CONFIG.goal.x),
        PY(CONFIG.goal.y),
        PX(CONFIG.goal.r),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.fillStyle = "#3e6";
      ctx.fillText("야영지", PX(CONFIG.goal.x), PY(CONFIG.goal.y) - W * 0.05);
      // 순찰 구간
      enemies.forEach((e, i) => {
        ctx.strokeStyle = "rgba(255,80,80,0.8)";
        ctx.beginPath();
        ctx.moveTo(PX(e.x0), PY(e.y));
        ctx.lineTo(PX(e.x1), PY(e.y));
        ctx.stroke();
      });
    }

    // 야영지 마커(물자 다 모으면 발광 표시)
    if (collected >= 3) {
      const pulse = 0.5 + 0.5 * Math.sin(animClock * 4);
      ctx.fillStyle = `rgba(255,225,120,${0.25 + pulse * 0.35})`;
      ctx.beginPath();
      ctx.arc(
        PX(CONFIG.goal.x),
        PY(CONFIG.goal.y),
        PX(CONFIG.goal.r),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // 물자(미획득만, 살짝 위아래 부유)
    for (const it of items) {
      if (it.got) continue;
      const bob = Math.sin(animClock * 3 + it.x * 10) * 0.008;
      drawSprite(imgs[it.sprite], it.x, it.y + bob, CONFIG.itemW, 1);
    }

    // 일본군(이동 방향으로 플립, 걷기 애니)
    for (const e of enemies) {
      drawSprite(walkFrame("e_"), e.x, e.y, CONFIG.enemyW, e.dir);
    }

    // 획득한 물자 상자 — 대원이 향한 쪽 위(오른쪽=1시 / 왼쪽=11시)에 위로 쌓임(획득 개수만큼)
    if (imgs.box && imgs.box.complete && imgs.box.naturalWidth) {
      const bw = CONFIG.boxW;
      const bh = bw * (imgs.box.naturalHeight / imgs.box.naturalWidth);
      // player.face: 오른쪽=1 → 1시(우상), 왼쪽=-1 → 11시(좌상)로 좌우 반전
      const ax = player.x + BOX_DIR.x * BOX_ANCHOR * player.face;
      const ay = player.y + BOX_DIR.y * BOX_ANCHOR;
      for (let k = 0; k < collected; k++) {
        drawSprite(imgs.box, ax, ay - k * bh * 0.85, bw, 1);
      }
    }

    // 대원(이동 중엔 걷기, 정지 시 stand)
    const pImg = playerSprite();
    drawSprite(pImg, player.x, player.y, CONFIG.playerW, player.face);

    // 히트박스(디버그) — overlapHit 이 쓰는 실제 충돌 박스. db 로 표시.
    if (showPath) {
      ctx.lineWidth = 2;
      const pr = rectPx(
        player.x,
        player.y,
        CONFIG.playerW,
        imgs.p_stand,
        CONFIG.hitScale,
      );
      ctx.strokeStyle = "rgba(255,140,0,0.95)"; // 대원(주황 — 파란 통로선과 구분)
      ctx.strokeRect(pr.l, pr.t, pr.r - pr.l, pr.b - pr.t);
      ctx.strokeStyle = "rgba(255,70,70,0.95)"; // 일본군(빨강)
      for (const e of enemies) {
        const er = rectPx(
          e.x,
          e.y,
          CONFIG.enemyW,
          imgs.e_stand,
          CONFIG.hitScale,
          CONFIG.hitScale * CONFIG.enemyHitScaleY,
        );
        ctx.strokeRect(er.l, er.t, er.r - er.l, er.b - er.t);
      }
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
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
    over = true; // 조작 차단
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

  // PC(뷰포트 1025px↑) = 방향키 / 모바일 = 조이스틱
  const isPC = () => window.innerWidth >= 1025;

  /* ----- PC: 방향키 입력 ----- */
  (function bindKeys() {
    const keys = { up: false, down: false, left: false, right: false };
    const map = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    function apply() {
      if (!input) return;
      if (!started || over || !isPC()) {
        input.x = 0;
        input.y = 0;
        return;
      }
      input.x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      input.y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    }
    window.addEventListener("keydown", (e) => {
      const k = map[e.key];
      if (!k) return;
      e.preventDefault();
      keys[k] = true;
      apply();
    });
    window.addEventListener("keyup", (e) => {
      const k = map[e.key];
      if (!k) return;
      keys[k] = false;
      apply();
    });
  })();

  /* ----- 모바일: 조이스틱 ----- */
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
      if (isPC() || !started || over) return; // 게임 중에만 조작
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
      $stick.css(
        "transform",
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
      );
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
    paused = false;
  });
  $("#btnNext").on("click", () => AR.go("bridge.html"));
  $("#btnRetry").on("click", resetGame);

  // 디버그: 게임 중 P키로 이동 가능 통로(path) 표시 토글 (localStorage.db="1" 로도 켬)
  window.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") showPath = !showPath;
  });

  window.addEventListener("resize", () => {
    if (started) sizeCanvas();
    if (input) {
      input.x = 0;
      input.y = 0;
    }
  });

  AR.preload(assets).then(() => sizeCanvas());
});
