/* =========================================================================
   bohun-AR1 공통 스크립트
   - 섹션 공통 유틸(프리로드/사운드/팝업/컷 시퀀스/네비게이션)을 window.AR 로 노출.
   - 각 섹션 js(intro.js, bridge1.js, exp2.js ...)에서 AR.* 를 사용한다.
   - 기존 lowerEl / preSchool 컨벤션(% + absolute, role="button")을 따른다. 폰트=Pretendard.
   ========================================================================= */
(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------
     1. 이미지 프리로드
     - 섹션 진입 시 그 섹션에서 쓸 이미지를 먼저 받아두고 시작한다.
     - 실패(404 등)해도 reject 하지 않고 계속 진행(저사양/누락 대비).
     --------------------------------------------------------------------- */
  // 이미 요청한 URL(프리로드/프리페치 공용) — 중복 다운로드 방지
  const requested = new Set();

  function preload(urls) {
    const list = (urls || []).filter(Boolean);
    return Promise.all(
      list.map(
        (src) =>
          new Promise((resolve) => {
            requested.add(src);
            const img = new Image();
            img.onload = img.onerror = () => resolve(src);
            img.src = src;
          })
      )
    );
  }

  /* ---------------------------------------------------------------------
     1-b. 백그라운드 프리페치 (프로젝트 전역 이미지 미리받기)
     - 현재 화면을 막지 않고(논블로킹), 낮은 동시성으로 이미지를 캐시에 채운다.
     - 같은 출처라 한 페이지에서 받아두면 다음 페이지에서 즉시 캐시 히트.
     --------------------------------------------------------------------- */
  function prefetch(urls, concurrency) {
    const queue = (urls || []).filter((u) => u && !requested.has(u));
    if (!queue.length) return;
    queue.forEach((u) => requested.add(u));
    const max = concurrency || 4;
    let i = 0;
    function next() {
      if (i >= queue.length) return;
      const src = queue[i++];
      const img = new Image();
      img.onload = img.onerror = next; // 한 장 끝나면 다음 장
      img.src = src;
    }
    for (let k = 0; k < Math.min(max, queue.length); k++) next();
  }

  // 현재 페이지 기준으로 "다음 화면들 → 공통 → 현재/이전" 순서로 전역 프리페치.
  // window.AR_MANIFEST(preload-manifest.js)가 있을 때만 동작.
  function prefetchFlow(currentFile) {
    const M = global.AR_MANIFEST;
    if (!M || !Array.isArray(M.flow)) return;
    const file = (currentFile || location.pathname.split("/").pop() || "").toLowerCase();
    const idx = M.flow.findIndex((f) => file.endsWith(f.page.toLowerCase()));
    const order = [];
    if (idx >= 0) {
      for (let i = idx + 1; i < M.flow.length; i++) order.push(...M.flow[i].images); // 다음 화면 우선
      order.push(...(M.common || []));
      order.push(...M.flow[idx].images); // 현재(재방문/팝업 대비)
      for (let i = 0; i < idx; i++) order.push(...M.flow[i].images); // 이전
    } else {
      // 매니페스트에 없는 페이지: 공통 + 전체
      order.push(...(M.common || []));
      M.flow.forEach((f) => order.push(...f.images));
    }
    // 첫 페인트를 방해하지 않도록 idle 시점에 시작
    const start = () => prefetch(order);
    if (typeof global.requestIdleCallback === "function") {
      global.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 800);
    }
  }

  /* ---------------------------------------------------------------------
     2. 사운드 매니저
     - 배경음(bgm) 1채널 + 효과음(sfx) 멀티. 파일이 없으면 조용히 무시.
     - 설정 팝업의 배경음/효과음 ON/OFF 와 연동(localStorage 저장).
     --------------------------------------------------------------------- */
  const Sound = (() => {
    const KEY_BGM = "bohun_bgm_on";
    const KEY_SFX = "bohun_sfx_on";
    let bgmOn = localStorage.getItem(KEY_BGM) !== "off";
    let sfxOn = localStorage.getItem(KEY_SFX) !== "off";
    let bgm = null;
    const cache = {};

    function load(src) {
      if (!src) return null;
      if (!cache[src]) {
        const a = new Audio(src);
        a.preload = "auto";
        cache[src] = a;
      }
      return cache[src];
    }

    function sfx(src) {
      if (!sfxOn || !src) return;
      try {
        const base = load(src);
        // 효과음은 겹쳐 재생될 수 있으므로 복제 재생
        const a = base.cloneNode ? base.cloneNode() : base;
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {
        /* 무음 폴백 */
      }
    }

    function playBgm(src, { loop = true, volume = 0.5 } = {}) {
      try {
        if (bgm) bgm.pause();
        bgm = load(src);
        if (!bgm) return;
        bgm.loop = loop;
        bgm.volume = volume;
        if (bgmOn) {
          const p = bgm.play();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) {}
    }

    function stopBgm() {
      try {
        if (bgm) {
          bgm.pause();
          bgm.currentTime = 0;
        }
      } catch (e) {}
    }

    function setBgm(on) {
      bgmOn = on;
      localStorage.setItem(KEY_BGM, on ? "on" : "off");
      try {
        if (!bgm) return;
        if (on) {
          const p = bgm.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          bgm.pause();
        }
      } catch (e) {}
    }

    function setSfx(on) {
      sfxOn = on;
      localStorage.setItem(KEY_SFX, on ? "on" : "off");
    }

    /* 내레이션(V.O) — bgm/sfx 와 독립된 1채널.
       화면(컷)에 도달하면 자동 재생. 새 내레이션 재생 시 이전 것은 정지.
       재사용: AR.Sound.playNarration("audio/narrations/intro_1-2.wav") */
    let voice = null;
    function playNarration(src, { volume = 1 } = {}) {
      if (!src) return;
      try {
        stopNarration();
        voice = load(src);
        if (!voice) return;
        voice.loop = false;
        voice.volume = volume;
        voice.currentTime = 0;
        const p = voice.play();
        if (p && p.catch) p.catch(() => {}); // 자동재생 차단/누락 시 무음 진행
      } catch (e) {}
    }
    function stopNarration() {
      try {
        if (voice) {
          voice.pause();
          voice.currentTime = 0;
        }
      } catch (e) {}
    }

    return {
      sfx,
      playBgm,
      stopBgm,
      setBgm,
      setSfx,
      playNarration,
      stopNarration,
      isBgmOn: () => bgmOn,
      isSfxOn: () => sfxOn,
    };
  })();

  /* ---------------------------------------------------------------------
     3. 팝업(딤드+다이얼로그) 열기/닫기 — common.css 의 .dimmed/.dialog 사용
     --------------------------------------------------------------------- */
  function openPopup(sel) {
    // 딤드 + 안쪽 다이얼로그 모두 표시(.dialog 는 .flex 일 때만 보임)
    $(sel).addClass("flex").find(".dialog").addClass("flex");
  }
  function closePopup(sel) {
    $(sel).removeClass("flex").find(".dialog").removeClass("flex");
  }

  /* ---------------------------------------------------------------------
     4. 섹션 이동
     --------------------------------------------------------------------- */
  function go(href) {
    global.location.href = href;
  }

  /* ---------------------------------------------------------------------
     5. CutRunner — 도입/연결 같은 "이미지 컷 전환 시퀀스" 공통 엔진
     config = {
       stage:   컷 클릭 영역 셀렉터(보통 ".container" 또는 ".cut-stage")
       bg:      배경 엘리먼트 셀렉터(background-image 를 교체)
       textEl:  자막 텍스트 셀렉터(없으면 생략)
       subtitle: 자막 래퍼 셀렉터(텍스트 있을 때만 표시)
       nextBtn / skipBtn / touchHint: 셀렉터(옵션)
       cuts:    [{ img, text, vo }]  // vo = 내레이션 사운드 경로(옵션)
       onEnd:   마지막 컷 이후 호출(보통 목표 팝업 표시)
     }
     - 클릭(터치) 또는 [다음] → 다음 컷. [스킵] → 즉시 onEnd.
     --------------------------------------------------------------------- */
  function CutRunner(config) {
    const cfg = Object.assign(
      { stage: ".container", bg: ".cut-bg", textEl: null, subtitle: null, voDir: "" },
      config
    );
    const cuts = cfg.cuts || [];
    let idx = -1;
    let ended = false;
    const $hot = cfg.hotspot ? $(cfg.hotspot) : $();

    /* ----- 컷 배경 크로스 디졸브(블랙 경유 X) -----
       cfg.bg 엘리먼트를 2겹으로 운용한다. 새 컷은 뒤 레이어에 깔고 opacity 0→1로
       올리는 동안 앞 레이어(이전 이미지)가 그대로 보여 두 이미지가 겹쳐 디졸브된다.
       (기존: 한 장의 background-image 교체 + opacity 0→1 → 0구간에 검정이 비쳐 블랙 디졸브)
       HTML 은 그대로 두고 init 시 트윈(복제) 레이어를 만들어 둘을 번갈아 쓴다. */
    const dissolveMs = cfg.dissolveMs == null ? 600 : cfg.dissolveMs;
    let front = 0;
    function bgLayers() {
      const base = document.querySelector(cfg.bg);
      if (!base) return null;
      if (!base._twin) {
        const twin = base.cloneNode(false);
        twin.removeAttribute("id"); // id 중복 방지
        twin.style.opacity = "0";
        base.style.opacity = "1";
        base.parentNode.insertBefore(twin, base.nextSibling);
        base._twin = twin;
      }
      return [base, base._twin];
    }
    function crossTo(imgUrl) {
      const ls = bgLayers();
      if (!ls) return;
      const cur = ls[front];
      const nxt = ls[front ^ 1];
      nxt.style.backgroundImage = `url("${imgUrl}")`;
      // 자막(5)/핫스팟(8)/버튼(7)보다 아래로 유지하면서 두 bg 레이어 간 위/아래만 제어
      nxt.style.zIndex = "1";
      cur.style.zIndex = "0";
      nxt.style.transition = "none";
      nxt.style.opacity = "0";
      void nxt.offsetWidth; // reflow → 트랜지션 리트리거
      nxt.style.transition = `opacity ${dissolveMs}ms ease`;
      nxt.style.opacity = "1";
      front ^= 1;
    }

    // 자막을 한 줄로 유지하며 자막바 폭에 맞게 폰트 자동 축소(최대 = CSS rem 기준)
    function fitSubtitle() {
      if (!cfg.textEl || !cfg.subtitle) return;
      const p = document.querySelector(cfg.textEl);
      const box = document.querySelector(cfg.subtitle);
      if (!p || !box || box.classList.contains("display-none")) return;
      p.style.fontSize = ""; // CSS 기준(rem)으로 리셋 후 측정
      const cs = getComputedStyle(box);
      const avail =
        box.clientWidth -
        parseFloat(cs.paddingLeft || 0) -
        parseFloat(cs.paddingRight || 0);
      if (avail <= 0) return;
      let size = parseFloat(getComputedStyle(p).fontSize);
      let guard = 0;
      while (p.scrollWidth > avail && size > 6 && guard < 400) {
        size -= 0.5;
        p.style.fontSize = size + "px";
        guard++;
      }
    }

    function show(i) {
      if (i < 0 || i >= cuts.length) return;
      idx = i;
      const cut = cuts[i];
      // 배경 크로스 디졸브(이전 컷 위로 새 컷이 겹쳐 페이드 — 블랙 경유 X)
      crossTo(cut.img);

      // 자막(있을 때만 자막바 표시). 개행 무시 → 한 줄, 폭에 맞게 자동 축소.
      if (cfg.textEl) {
        $(cfg.textEl).text(cut.text || "");
        if (cfg.subtitle) $(cfg.subtitle).toggleClass("display-none", !cut.text);
        fitSubtitle();
      }

      // 내레이션(V.O) — 해당 컷 도달 시 자동재생(voDir + 파일명). 컷 전환 시 이전 것은 정지.
      Sound.stopNarration();
      if (cut.vo) Sound.playNarration(cfg.voDir + cut.vo);

      // 스킵 버튼(cut.skip === false 면 숨김)
      if (cfg.skipBtn)
        $(cfg.skipBtn).toggleClass("display-none", cut.skip === false);

      // 진행 방식: 오브젝트 핫스팟(glow+손) vs [다음] 버튼
      const useHot = !!cut.hot;
      if (cfg.nextBtn) $(cfg.nextBtn).toggleClass("display-none", useHot);
      if ($hot.length) {
        if (useHot) {
          $hot
            .css({ left: cut.hot.x * 100 + "%", top: cut.hot.y * 100 + "%" })
            .removeClass("display-none");
        } else {
          $hot.addClass("display-none");
        }
      }
    }

    function next() {
      if (ended) return;
      if (idx >= cuts.length - 1) end();
      else {
        Sound.sfx(cfg.clickSfx);
        show(idx + 1);
      }
    }

    function end() {
      if (ended) return;
      ended = true;
      Sound.stopBgm();
      Sound.stopNarration();
      $hot.addClass("display-none");
      if (typeof cfg.onEnd === "function") cfg.onEnd();
    }

    function skip() {
      Sound.stopNarration(); // 스킵 시 진행 중 내레이션 정지
      // 스킵 시 배경을 스토리 마지막 컷 이미지로 교체(목표 팝업 뒤에 마지막 장면이 보이도록)
      const last = cuts[cuts.length - 1];
      if (last) crossTo(last.img);
      if (typeof cfg.onSkip === "function") cfg.onSkip();
      else end();
    }

    function bind() {
      // 진행: 핫스팟(해당 오브젝트) 또는 [다음] 버튼만. (아무 곳이나 클릭 금지)
      if ($hot.length) $hot.on("click", next);
      if (cfg.nextBtn) $(cfg.nextBtn).on("click", next);
      if (cfg.skipBtn) $(cfg.skipBtn).on("click", skip);
      $(global).on("resize", fitSubtitle); // 창 크기 변하면 자막 한 줄 재맞춤
    }

    function start() {
      bind();
      show(0);
      // 웹폰트(Pretendard) 로드 후 글자폭이 바뀔 수 있어 한 번 더 한 줄 맞춤
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(fitSubtitle).catch(() => {});
      }
    }

    return { start, next, end, current: () => idx };
  }

  /* ---------------------------------------------------------------------
     6. 설정 팝업 공통 바인딩 (게임 화면 공용)
     opts = { popup, toggleBgm, toggleSfx, closeBtn, onPause, onResume }
     - 토글 버튼은 <button data-on>... 이미지 2장(on/off)을 교체.
     --------------------------------------------------------------------- */
  function bindSettings(opts) {
    const o = opts || {};
    function paint($btn, on) {
      $btn.attr("data-on", on ? "1" : "0");
      const onImg = $btn.data("img-on");
      const offImg = $btn.data("img-off");
      if (onImg && offImg)
        $btn.find("img").attr("src", on ? onImg : offImg);
    }
    if (o.toggleBgm) {
      const $b = $(o.toggleBgm);
      paint($b, Sound.isBgmOn());
      $b.on("click", function () {
        const on = !(($(this).attr("data-on") || "1") === "1");
        paint($(this), on);
        Sound.setBgm(on);
      });
    }
    if (o.toggleSfx) {
      const $b = $(o.toggleSfx);
      paint($b, Sound.isSfxOn());
      $b.on("click", function () {
        const on = !(($(this).attr("data-on") || "1") === "1");
        paint($(this), on);
        Sound.setSfx(on);
      });
    }
    if (o.openBtn)
      $(o.openBtn).on("click", function () {
        openPopup(o.popup);
        if (typeof o.onPause === "function") o.onPause();
      });
    if (o.closeBtn)
      $(o.closeBtn).on("click", function () {
        closePopup(o.popup);
        if (typeof o.onResume === "function") o.onResume();
      });
  }

  /* ---------------------------------------------------------------------
     7. 노출
     --------------------------------------------------------------------- */
  global.AR = {
    preload,
    prefetch,
    prefetchFlow,
    Sound,
    openPopup,
    closePopup,
    go,
    CutRunner,
    bindSettings,
  };

  /* ---------------------------------------------------------------------
     8. 페이지 공통 초기화(DOM ready)
     --------------------------------------------------------------------- */
  $(function () {
    // 모바일 세로 → 가로 안내
    if (!$(".mobile-pop").length) {
      $(".container").append(
        "<div class='mobile-pop'><p>모바일 가로모드로 변경해 주세요.</p></div>"
      );
    }

    // 이미지 접근성 속성
    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) img.setAttribute("alt", "");
      img.setAttribute("aria-hidden", "true");
    });

    // role="button" + data-hover-image hover 교체
    $('[role="button"][data-hover-image]')
      .on("mouseenter", function () {
        const $t = $(this);
        $t.data("orig-src", $t.attr("src"));
        $t.attr("src", $t.attr("data-hover-image"));
      })
      .on("mouseleave", function () {
        const $t = $(this);
        const o = $t.data("orig-src");
        if (o) $t.attr("src", o);
      });

    // 공통 클릭 효과음(등록된 경우에만). 섹션에서 AR.clickSfx 지정 가능.
    $(document).on("click", '[role="button"], button, .btn, .btn-effect', function () {
      if (global.AR && global.AR.clickSfx) Sound.sfx(global.AR.clickSfx);
    });

    // 디버그 토글: Ctrl + ;  → localStorage.db "1" 설정/삭제 토글 후 새로고침
    $(document).on("keydown", function (e) {
      if (e.ctrlKey && (e.key === ";" || e.code === "Semicolon")) {
        e.preventDefault();
        try {
          if (localStorage.getItem("db") === "1") {
            localStorage.removeItem("db");
            console.log("[debug] db OFF");
          } else {
            localStorage.setItem("db", "1");
            console.log("[debug] db ON");
          }
        } catch (err) {}
        location.reload();
      }
    });

    // 프로젝트 전역 이미지 프리페치 — 현재 화면을 본 뒤(idle) 다음 화면들을 미리 받아둠.
    prefetchFlow();
  });
})(window);
