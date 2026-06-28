/* =========================================================================
   EXP② 모스부호 리듬게임
   - 신호가 우→좌로 흘러 좌측 판정선에 닿는 순간 전신기 터치.
   - 점/선 구분 없이 "탭 타이밍"만 판정(확정). 20개 중 10개↑ 성공 → 교신 완료.
   ⚠️ 정확한 판정 폭/속도/출제 시퀀스는 세부 기획 확정 시 상단 CONFIG 에서 조정
      (Open Item: EXP② 출제 시퀀스 / ±5% 판정의 px·ms 수치).
   ========================================================================= */
document.title = "EXP② — 모스부호 교신";

$(function () {
  // 테스트 모드(localStorage bohun_show_path="1") → 신호 속도 3배(시간값 전체 1/3 스케일)
  const TEST = (() => {
    try {
      return localStorage.getItem("bohun_show_path") === "1";
    } catch (e) {
      return false;
    }
  })();
  const SPEED = TEST ? 3 : 1;

  /* ----- 튜닝 상수(가변) ----- */
  const CONFIG = {
    total: 20, // 총 신호 수(= MESSAGE 심볼 합)
    needSuccess: 10, // 교신 완료 기준
    firstAt: 3600 / SPEED, // 첫 신호가 판정선에 닿는 시각(ms)
    travel: 4000 / SPEED, // 우측 진입 → 판정선 도달까지 이동 시간(ms) — 0.5배속
    goodWindow: 300 / SPEED, // ±판정 허용(ms) ≈ 프로토타입 "±5%" (0.5배속에 맞춰 2배)
    hitFrac: 0.046, // 트랙 폭 대비 판정선 x 위치(좌측, .morse-hit-line 과 맞춤)
  };

  // 교신 메시지: 글자별 모스 그룹(고정). 간격: 심볼 < 글자 < 단어(EAGLE|SEND).
  // ※ 이동 속도를 0.5배로 낮추면서 화면상 부호 간격은 동일하게 유지하기 위해
  //    시간 도메인 값(firstAt/travel/goodWindow/GAP)을 모두 2배로 스케일했다.
  const MESSAGE = [
    { ch: "E", code: "." },
    { ch: "A", code: ".-" },
    { ch: "G", code: "--." },
    { ch: "L", code: ".-.." },
    { ch: "E", code: "." },
    { ch: "S", code: "...", word: true }, // EAGLE 다음 단어 간격
    { ch: "E", code: "." },
    { ch: "N", code: "-." },
    { ch: "D", code: "-.." },
  ];
  const GAP = { symbol: 940 / SPEED, letter: 1840 / SPEED, word: 3000 / SPEED };

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
  ].concat(["E", "A", "G", "L", "S", "N", "D"].map((c) => `img/4_EXP2/exp2_text_${c}.png`));

  const canvas = document.getElementById("morseCanvas");
  const ctx = canvas.getContext("2d");
  const $key = $("#morseKey");
  const $keyImg = $("#morseKeyImg");
  const $hitLine = $("#hitLine");
  const $judge = $("#morseJudge");
  const $gage = $("#gageText");

  let beats = []; // { t, judged, ok, dash, ch, group }
  let groups = []; // { ch, beats:[], shown }
  let started = false;
  let paused = false;
  let startGate = false; // 시작 안내 팝업(체험 방법) 게이트 활성 여부
  let raf = null;
  let clock = 0; // 누적 게임 시각(ms)
  let lastTs = 0;
  let success = 0;
  let done = 0;
  let finishing = false;
  let finishTimer = null;

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

  // MESSAGE → 신호 비트 + 글자 그룹. 심볼 도달 시각을 그룹/단어 간격으로 누적.
  function buildBeats() {
    beats = [];
    groups = [];
    let t = CONFIG.firstAt;
    MESSAGE.forEach((m, li) => {
      if (li > 0) t += m.word ? GAP.word : GAP.letter;
      const g = { ch: m.ch, beats: [], shown: false };
      m.code.split("").forEach((s, si) => {
        if (si > 0) t += GAP.symbol;
        const b = { t, judged: false, ok: false, dash: s === "-", ch: m.ch, group: g };
        beats.push(b);
        g.beats.push(b);
      });
      groups.push(g);
    });
  }

  // 그룹이 모두 판정되면, 전부 성공한 글자만 "교신 내용"에 추가.
  function tryLetter(g) {
    if (!g || g.shown) return;
    if (!g.beats.every((b) => b.judged)) return;
    g.shown = true;
    const box = document.getElementById("morseLetter");
    if (!box) return;
    if (g.beats.every((b) => b.ok)) {
      // 성공: 글자 이미지
      const img = document.createElement("img");
      img.src = `img/4_EXP2/exp2_text_${g.ch}.png`;
      img.alt = g.ch;
      box.appendChild(img);
    } else {
      // 실패: 폭을 가진 빈 칸(자리 유지 → 틀린 위치가 공백으로 보임)
      const blank = document.createElement("span");
      blank.className = "letter-blank";
      box.appendChild(blank);
    }
  }

  function hitX() {
    return (canvas._w || 0) * CONFIG.hitFrac;
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function xAt(dt) {
    const w = canvas._w || 0;
    const hx = hitX();
    return hx + (dt / CONFIG.travel) * (w - hx);
  }

  function draw() {
    const w = canvas._w || 0;
    const h = canvas._h || 0;
    ctx.clearRect(0, 0, w, h);
    const cy = h * 0.5; // 모스 심볼 행(스트립 중앙)
    const dotR = Math.max(3, h * 0.12); // 점(작은 원)
    const dashLen = dotR * 4.2; // 선(긴 막대) 길이
    const barH = dotR * 1.05;

    for (const b of beats) {
      const dt = b.t - clock; // +면 아직 도달 전
      if (dt > CONFIG.travel) continue;
      const x = xAt(dt);
      if (x < -dashLen) continue;
      if (b.judged) ctx.fillStyle = b.ok ? "#5ad16b" : "#e05656";
      else ctx.fillStyle = Math.abs(dt) <= CONFIG.goodWindow ? "#ffe98a" : "#f0ece0";
      if (b.dash) {
        roundRect(ctx, x - dashLen / 2, cy - barH / 2, dashLen, barH, barH / 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
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
          tryLetter(b.group);
        }
      }
      draw();
      // 모든 신호 판정 후 바로 끝내지 않고 잠깐 여유(마지막 dot 결과·연출 노출)
      if (done >= beats.length && !finishing) {
        finishing = true;
        // 완료 순간 EAGLE SEND → '각 지대 즉각 전달' 교차 디졸브
        revealKor();
        // 한글 노출을 잠깐 보여준 뒤 성공 팝업(교차 디졸브 0.6초 + 여유)
        finishTimer = setTimeout(finish, 3000);
      }
    }
    raf = requestAnimationFrame(loop);
  }

  function updateGage() {
    $gage.text(`성공률 ${success}/${CONFIG.total}`);
    // 프레임 안쪽(좌6%~우94%, 폭 88%) 기준으로 좌→우 채움
    $("#gageFill").css("width", (success / CONFIG.total) * 88 + "%");
  }

  function tap() {
    if (!started || paused || done >= beats.length) return;
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
    tryLetter(target.group);
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

  // 완료 시: EAGLE SEND(영문 이미지) → '각 지대 즉각 전달'(한글) 교차 디졸브
  function revealKor() {
    const en = document.getElementById("morseLetter");
    if (en) en.style.opacity = "0";
    const ko = document.getElementById("morseLetterKor");
    if (ko) ko.classList.add("show");
  }
  // 시작/재시작 시 한글 레이어 숨기고 영문 표시 복구
  function resetKor() {
    const en = document.getElementById("morseLetter");
    if (en) en.style.opacity = "";
    const ko = document.getElementById("morseLetterKor");
    if (ko) ko.classList.remove("show");
  }

  function startGame() {
    if (started) return;
    started = true;
    $("#gameStart").addClass("display-none");
    document.getElementById("morseLetter").innerHTML = "";
    resetKor();
    sizeCanvas();
    buildBeats();
    clock = 0;
    lastTs = 0;
    success = 0;
    done = 0;
    finishing = false;
    updateGage();
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
    // 성공 여부와 무관하게 결과 팝업(성공 기준 미달 시 [다시 하기] 유도)
    AR.openPopup("#finishDim");
  }

  function resetGame() {
    if (finishTimer) {
      clearTimeout(finishTimer);
      finishTimer = null;
    }
    AR.closePopup("#finishDim");
    // 재시작: 시작 메시지 없이 곧바로 전신기 터치 단계로
    armTelegraph();
    document.getElementById("morseLetter").innerHTML = "";
    resetKor();
    ctx.clearRect(0, 0, canvas._w || 0, canvas._h || 0);
    started = false;
    paused = false;
    finishing = false;
    updateGage();
  }

  /* ----- 시작 흐름 -----
     진입 시 시작 메시지 대신 "체험 방법 안내" 팝업을 게이트로 띄운다.
     팝업 닫기 → 전신기 핫스팟 노출(armed) → 전신기 터치 → 게임 시작. */
  function openStartGate() {
    startGate = true;
    $("#gameStart").addClass("display-none"); // 시작 메시지 오버레이 미사용
    AR.openPopup("#tutorialDim");
  }
  function armTelegraph() {
    $("#gameStart")
      .removeClass("display-none")
      .addClass("armed"); // dim 제거(전신기가 그대로 보이도록)
    $("#gameStart .start-msg, #gameStart .start-touch").addClass("display-none");
    $("#startHotspot").removeClass("display-none");
  }

  /* ----- 이벤트 ----- */
  // 전신기 핫스팟 클릭 → 게임 시작. startGame 이 #gameStart 를 숨김.
  $("#startHotspot").on("click touchstart", function (e) {
    e.preventDefault();
    e.stopPropagation();
    startGame();
  });
  // 누르고 있는 동안 ON 이미지 유지, 떼면 OFF 로 복귀
  function keyDown(e) {
    e.preventDefault();
    $keyImg.attr("src", "img/4_EXP2/exp2_morse_on.png");
    tap();
  }
  function keyUp() {
    $keyImg.attr("src", "img/4_EXP2/exp2_morse_off.png");
  }
  $key.on("mousedown touchstart", keyDown);
  $key.on("mouseup mouseleave touchend touchcancel", keyUp);

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
    if (startGate) {
      // 시작 게이트: 팝업 닫으면 전신기 터치 단계로 진입
      startGate = false;
      armTelegraph();
    } else {
      paused = false; // 게임 중 튜토리얼 열람 후 닫기 → 재개
    }
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
    openStartGate(); // 진입 시 체험 방법 안내 팝업
  });
});
