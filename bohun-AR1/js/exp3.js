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
    hq: { x: 0.71, y: 0.65 }, // 충칭 한국광복군 총사령부(도로 위 지점) = 서신 수신
    depots: [
      // drop = 전달 완료 서신이 안착할 위치(각 건물 이미지의 왼쪽)
      {
        x: 0.21,
        y: 0.23,
        name: "라오허카우 1지대 1구대",
        drop: { x: 0.13, y: 0.11 },
      }, // 좌상단
      { x: 0.41, y: 0.44, name: "푸양 3지대", drop: { x: 0.4, y: 0.22 } }, // 중앙(도로 dip 바닥)
      { x: 0.8, y: 0.3, name: "진화 1지대 2구대", drop: { x: 0.73, y: 0.13 } }, // 우상단
    ],
    // 경로: exp3-agent2 의 노란선(닫힌 루프, 차도 따라). 폴리라인 최소거리로 이탈 판정.
    roads: [
      [
        [0.22, 0.24],
        [0.28, 0.22],
        [0.33, 0.24],
        [0.38, 0.33],
        [0.42, 0.42],
        [0.47, 0.43],
        [0.52, 0.43],
        [0.57, 0.35],
        [0.62, 0.25],
        [0.68, 0.22],
        [0.74, 0.25], // 10번 점
        [0.79, 0.31],
        [0.79, 0.35],
        [0.79, 0.44],
        [0.77, 0.51],
        [0.74, 0.55], // 15번 점
        [0.74, 0.7],
        [0.69, 0.62],
        [0.62, 0.58],
        [0.56, 0.55],
        [0.47, 0.67], // 20번 점
        [0.37, 0.76],
        [0.27, 0.78],
        [0.18, 0.8],
        [0.12, 0.64],
        [0.13, 0.55],
        [0.15, 0.45],
        [0.2, 0.35],
        [0.23, 0.28],
        [0.22, 0.24],
      ],
    ],
    reach: 0.07, // 체크포인트 도달 반경(정규화)
    dustThreshold: 0.02, // (감속 시작) 이만큼 벗어나면 흙먼지 + 감속 시작 (기존 0.1 → 80% 좁힘)
    blockThreshold: 0.04, // (벽) 이만큼 벗어나면 완전 차단 — 더 못 나감 (기존 0.2 → 80% 좁힘)
    speed: 0.22, // 이동 속도(정규화/초)
    offPenalty: 0, // 벽에서 바깥 방향 속도 배율(0 = 완전 0%). dustThreshold→blockThreshold 로 갈수록 100%→0%
    returnFloor: 0.4, // 복귀(경로에 가까워지는) 방향 최소 속도 배율 — 벽에 끼이지 않도록 항상 이 속도는 보장
  };
  const clamp = (v) => Math.max(0.03, Math.min(0.97, v));

  // 제어점(닫힌 루프) → Catmull-Rom 스플라인으로 부드러운 곡선화
  function smoothClosed(pts, segPer) {
    const p = pts.slice();
    if (p.length > 1 && p[0][0] === p.at(-1)[0] && p[0][1] === p.at(-1)[1])
      p.pop();
    const n = p.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n],
        p1 = p[i],
        p2 = p[(i + 1) % n],
        p3 = p[(i + 2) % n];
      for (let t = 0; t < segPer; t++) {
        const s = t / segPer,
          s2 = s * s,
          s3 = s2 * s;
        out.push([
          0.5 *
            (2 * p1[0] +
              (-p0[0] + p2[0]) * s +
              (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 +
              (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
          0.5 *
            (2 * p1[1] +
              (-p0[1] + p2[1]) * s +
              (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 +
              (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3),
        ]);
      }
    }
    out.push(out[0]); // 닫기
    return out;
  }
  // 화면 렌더 + 이탈 판정에 쓰는 부드러운 경로(제어점 = MAP.roads[0])
  const roadCurve = smoothClosed(MAP.roads[0], 10);

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
    "img/6_EXP3/exp3_msg_text.png",
    "img/6_EXP3/exp3_info.png",
    "img/6_EXP3/exp3_popup_finish.png",
    "img/common/exp_gage_bg.png",
    "img/common/exp_setting.png",
    "img/common/exp_popup_btn_next.png",
    "img/common/exp_popup_btn_retry.png",
    "img/common/clear_stamp.png",
  ];

  let W = 0,
    H = 0,
    dpr = 1;
  let started = false,
    paused = false,
    raf = null,
    lastTs = 0,
    finishing = false,
    finishTimer = null,
    startGate = false; // 시작 안내 팝업(체험 방법) 게이트 활성 여부
  let jeep, input, hasLetters, delivered, particles, stack;
  let pulseT = 0; // 상호작용 마커 펄스용 시간 누적(초)
  // 충칭 HQ 다음 펄스 순서(depots 인덱스): 지대3(푸양,idx1) → 지대2(진화 2구대,idx2) → 지대1(라오허카우 1구대,idx0)
  const PULSE_ORDER = [2, 1, 0];
  // 서신 획득 연출 타이밍(초): step=한 장씩 쌓이는 간격, popIn=등장, hold=쌓인 뒤 유지, fade=사라짐
  const STACK = { step: 0.3, popIn: 0.25, hold: 1.0, fade: 0.5 };
  const STACK_FADE_START = STACK.step * 3 + STACK.hold; // 1초 유지 후 fade 시작
  const STACK_TOTAL = STACK_FADE_START + STACK.fade;
  // localStorage 에 키가 있으면 경로(도로망) 표시 (개발/가이드용)
  const showPath = (() => {
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
    jeep = { x: MAP.start.x, y: MAP.start.y, angle: MAP.startAngle };
    input = { x: 0, y: 0 };
    hasLetters = false;
    delivered = 0;
    particles = [];
    pulseT = 0;
    stack = null; // 서신 획득 연출 상태(없음)
    MAP.depots.forEach((d) => {
      d.done = false;
      d.fadeIn = 0; // 지프에서 서신이 나타나는 fade in 진행도(0→1)
      d.anim = 1; // 전달 비행 애니 진행도(0→1)
      d.from = null; // 비행 시작 위치(차량)
    });
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

  // 서신 수신 안내 이미지(중앙) 표시
  let msgTimer = null;
  function showMsg() {
    const $m = $("#exp3Msg");
    $m.removeClass("show");
    void $m[0].offsetWidth;
    $m.addClass("show");
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = setTimeout(() => $m.removeClass("show"), 2600);
  }

  /* ----- 경로 이탈 거리(정규화) — 부드러운 경로(roadCurve) 최소거리 ----- */
  function distToPath(px, py) {
    let min = Infinity;
    for (let i = 0; i < roadCurve.length - 1; i++) {
      const [ax, ay] = roadCurve[i];
      const [bx, by] = roadCurve[i + 1];
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
    // 총사령부에서 서신 수신 → 이미지 메시지(중앙) + 차량 적재 애니
    if (
      !hasLetters &&
      Math.hypot(jeep.x - MAP.hq.x, jeep.y - MAP.hq.y) < MAP.reach
    ) {
      hasLetters = true;
      stack = { t: 0 }; // 차량에 붙어 딸려오며 쌓이는 연출(위치는 매 프레임 지프 기준)
      showMsg();
      AR.Sound.sfx(SFX.pickup);
    }
    // 각 지대 전달
    if (hasLetters) {
      for (const d of MAP.depots) {
        if (!d.done && Math.hypot(jeep.x - d.x, jeep.y - d.y) < MAP.reach) {
          d.done = true;
          d.from = { x: jeep.x, y: jeep.y }; // 차량에서 출발
          d.fadeIn = 0; // 지프에서 서신이 fade in 으로 등장
          d.anim = 0; // (fade in 후) 건물 왼쪽으로 날아가는 애니 시작
          delivered++;
          updateGage();
          toast(`${d.name} 전달 완료! (${delivered}/3)`);
          AR.Sound.sfx(SFX.deliver);
          // 3개 전달 완료 → 마지막 서신 전달 연출을 보여준 뒤 약 2초 후 성공 팝업
          if (delivered >= 3 && !finishing) {
            finishing = true;
            // 마지막 서신 전달 연출을 보여준 뒤 성공 팝업(exp2 와 동일하게 3초)
            finishTimer = setTimeout(finish, 3000);
          }
        }
      }
    }
  }

  const SFX = { pickup: "", deliver: "", dust: "" }; // ⚠️ 사운드 경로 미확정(Open Item)

  function update(dt) {
    pulseT += dt; // 마커 펄스용 시간 누적
    // 전방향 이동(횡스크롤 탑다운): 머리 = 조이스틱 방향, 그 방향으로 이동.
    const mag = Math.hypot(input.x, input.y);
    const dev = distToPath(jeep.x, jeep.y);
    const off = dev > MAP.dustThreshold; // 감속 시작 + 흙먼지
    // 이탈 정도에 비례해 100% → offPenalty(0=완전 정지)까지 선형 감속. 벽(blockThreshold)에서 0%.
    let penalty = 1;
    if (off) {
      const t =
        (dev - MAP.dustThreshold) /
        (MAP.blockThreshold - MAP.dustThreshold); // 0(감속시작)~1(벽)
      penalty = Math.max(MAP.offPenalty, 1 - t);
    }
    if (mag > 0.05) {
      const ang = Math.atan2(input.y, input.x);
      jeep.angle = ang; // 머리 = 이동 방향
      const step = (p) => {
        const sp = MAP.speed * p * Math.min(1, mag);
        return [
          clamp(jeep.x + Math.cos(ang) * sp * dt),
          clamp(jeep.y + Math.sin(ang) * sp * dt),
        ];
      };
      let [nx, ny] = step(penalty);
      let nd = distToPath(nx, ny);
      // 복귀(경로에 가까워지는) 방향은 returnFloor 최소 속도 보장 → 벽에 끼여 못 빠져나오는 것 방지.
      if (nd <= dev && penalty < MAP.returnFloor) {
        [nx, ny] = step(MAP.returnFloor);
        nd = distToPath(nx, ny);
      }
      // 벽: blockThreshold 너머로 '더' 벗어나는 이동은 완전 차단(바깥 방향 0% — 가로막힌 느낌).
      const allow = !(nd > dev && nd > MAP.blockThreshold);
      if (allow) {
        jeep.x = nx;
        jeep.y = ny;
        if (off) spawnDust();
      }
    }
    // 파티클
    for (const p of particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life < p.max);
    if (stack) {
      stack.t += dt; // 서신 획득 연출 진행(쌓임 → 1초 유지 → fade)
      if (stack.t > STACK_TOTAL) stack = null;
    }
    MAP.depots.forEach((d) => {
      if (!d.done) return;
      // 1) 지프에서 서신 fade in → 2) 완료 후 건물로 비행
      if (d.fadeIn < 1) {
        d.fadeIn = Math.min(1, d.fadeIn + dt / 0.2); // 좀 더 빨리 튀어나오게
      } else if (d.anim < 1) {
        d.anim = Math.min(1, d.anim + dt / 0.7);
      }
    });
    checkpoints();
  }

  function drawSpot(cp, done, pulse) {
    const img = done ? imgs.spotDone : imgs.spot;
    if (!img || !img.complete) return;
    // 현재 가야 하는 목표(pulse=true)만 100~130% 반복 스케일
    const k = pulse ? 1.15 + 0.15 * Math.sin((pulseT * Math.PI * 2) / 0.8) : 1;
    const s = W * 0.055 * k;
    // 느낌표 마커를 체크포인트 좌표 중앙에 배치
    ctx.drawImage(img, PX(cp.x) - s / 2, PY(cp.y) - s / 2, s, s);
  }

  // 현재 펄스(가이드) 대상: 서신 수령 전엔 HQ, 이후엔 순서상 가장 먼저 남은 지대
  function pulseTargetIdx() {
    if (!hasLetters) return -1; // -1 = HQ
    for (const i of PULSE_ORDER) if (!MAP.depots[i].done) return i;
    return null; // 전부 전달
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 경로 디버그 표시 — localStorage "db"="1" 일 때만
    if (showPath) {
      // 1) 부드러운 경로 라인
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.strokeStyle = "rgba(80,180,255,0.9)";
      ctx.setLineDash([W * 0.012, W * 0.01]);
      ctx.beginPath();
      roadCurve.forEach(([x, y], i) =>
        i ? ctx.lineTo(PX(x), PY(y)) : ctx.moveTo(PX(x), PY(y)),
      );
      ctx.stroke();
      ctx.setLineDash([]);

      const fs = Math.max(10, W * 0.015);
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 2) 제어점(번호) — 좌표 조정 참고용. "N번 점" 으로 지칭 가능.
      const cps = MAP.roads[0];
      for (let i = 0; i < cps.length - 1; i++) {
        const [x, y] = cps[i];
        ctx.fillStyle = "rgba(255,70,70,0.95)";
        ctx.beginPath();
        ctx.arc(PX(x), PY(y), W * 0.009, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(String(i), PX(x), PY(y));
      }

      // 3) 체크포인트(HQ / 지대) 위치 + 라벨
      const cks = [["HQ", MAP.hq.x, MAP.hq.y]].concat(
        MAP.depots.map((d, i) => ["지대" + (i + 1), d.x, d.y]),
      );
      // 마커 위에 겹치는 원(테두리)은 제거하고 라벨만 표시
      for (const [lab, x, y] of cks) {
        ctx.fillStyle = "rgba(60,230,110,0.95)";
        ctx.fillText(lab, PX(x), PY(y) - W * 0.025);
      }
    }

    // 체크포인트 마커(총사령부 + 미전달 지대). 순서상 현재 목표만 펄스.
    const pulseIdx = pulseTargetIdx();
    drawSpot(MAP.hq, hasLetters, pulseIdx === -1);
    MAP.depots.forEach((d, i) => drawSpot(d, d.done, i === pulseIdx));

    // 전달된 서신: 차량 → 건물 왼쪽으로 날아가 안착(비행 중엔 호를 그림)
    if (imgs.susin && imgs.susin.complete) {
      const dw = W * 0.035; // +10% 확대
      const dh = dw * (70 / 92);
      MAP.depots.forEach((d) => {
        if (!d.done) return;
        const fadeIn = d.fadeIn == null ? 1 : d.fadeIn;
        // 1단계: 지프 위치에서 서신이 fade in 되어 등장(아직 비행 X)
        if (fadeIn < 1) {
          ctx.globalAlpha = fadeIn;
          const fx = d.from ? d.from.x : d.drop.x;
          const fy = d.from ? d.from.y : d.drop.y;
          ctx.drawImage(imgs.susin, PX(fx) - dw / 2, PY(fy) - dh / 2, dw, dh);
          ctx.globalAlpha = 1;
          return;
        }
        // 2단계: 건물 왼쪽으로 날아가 안착(호를 그림)
        const t = d.anim == null ? 1 : Math.min(1, d.anim);
        const e = 1 - (1 - t) * (1 - t); // easeOut
        const fx = d.from ? d.from.x : d.drop.x;
        const fy = d.from ? d.from.y : d.drop.y;
        const x = fx + (d.drop.x - fx) * e;
        const y = fy + (d.drop.y - fy) * e - Math.sin(Math.PI * t) * 0.06; // 살짝 떠오르는 호
        ctx.drawImage(imgs.susin, PX(x) - dw / 2, PY(y) - dh / 2, dw, dh);
      });
    }

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
      ctx.rotate(jeep.angle); // 스프라이트 기본 방향 = 오른쪽(+x), 후진해도 고정
      ctx.drawImage(imgs.jeep, -jw / 2, -jh / 2, jw, jh);
      ctx.restore();
    }

    // 서신 획득 연출: 차량에 3장이 한 장씩 붙어 딸려오며 쌓인 뒤 1초 후 fade out
    if (stack && imgs.susin && imgs.susin.complete) {
      const sw = W * 0.033;
      const sh = sw * (70 / 92);
      const jh = W * 0.075 * (106 / 178);
      const baseX = PX(jeep.x); // 매 프레임 지프 위치 기준 → 차량을 따라 이동
      const baseY = PY(jeep.y) - jh * 0.55; // 차량 위에서 쌓임
      const gFade =
        stack.t > STACK_FADE_START
          ? Math.max(0, 1 - (stack.t - STACK_FADE_START) / STACK.fade)
          : 1;
      for (let i = 0; i < 3; i++) {
        const pop = Math.min(1, (stack.t - i * STACK.step) / STACK.popIn);
        if (pop <= 0) continue; // 아직 등장 전
        ctx.globalAlpha = pop * gFade;
        const rise = (1 - pop) * sh * 0.5; // 아래에서 살짝 솟아오르며 등장
        const y = baseY - i * sh * 0.6 + rise;
        ctx.drawImage(imgs.susin, baseX - sw / 2, y, sw, sh);
      }
      ctx.globalAlpha = 1;
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
    finishing = false;
    $("#gameStart").addClass("display-none");
    sizeCanvas();
    resetState();
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    if (finishTimer) {
      clearTimeout(finishTimer);
      finishTimer = null;
    }
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    started = false;
    AR.openPopup("#finishDim");
  }

  function resetGame() {
    if (finishTimer) {
      clearTimeout(finishTimer);
      finishTimer = null;
    }
    finishing = false;
    AR.closePopup("#finishDim");
    ctx.clearRect(0, 0, W, H);
    started = false;
    paused = false;
    // 재시작: 시작 안내 팝업 없이 곧바로 게임 시작
    startGame();
  }

  // 진입 시 시작 메시지 대신 "체험 방법 안내" 팝업을 게이트로 띄운다.
  function openStartGate() {
    startGate = true;
    $("#gameStart").addClass("display-none");
    AR.openPopup("#tutorialDim");
  }

  // PC(뷰포트 1025px↑) = 방향키 조작 / 모바일 = 조이스틱
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
      if (!input) return; // 게임 시작 전(resetState 이전)엔 무시
      if (!isPC()) {
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
      if (isPC()) return; // PC 에서는 조이스틱 비활성(방향키 사용)
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
  // 시작: 시작 오버레이(화면 전체) 아무 곳이나 터치/클릭
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
      startGate = false;
      startGame(); // 시작 게이트: 팝업 닫으면 게임 시작
    } else {
      paused = false; // 게임 중 튜토리얼 열람 후 닫기 → 재개
    }
  });
  $("#btnNext").on("click", () => AR.go("end.html"));
  $("#btnRetry").on("click", resetGame);

  window.addEventListener("resize", () => {
    if (started) sizeCanvas();
    // PC↔모바일 경계 전환 시 직전 입력이 남아 차가 계속 움직이는 것 방지
    if (input) {
      input.x = 0;
      input.y = 0;
    }
  });

  AR.preload(assets).then(() => {
    sizeCanvas();
    openStartGate(); // 진입 시 체험 방법 안내 팝업
  });
});
