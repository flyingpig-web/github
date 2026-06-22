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
  function preload(urls) {
    const list = (urls || []).filter(Boolean);
    return Promise.all(
      list.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => resolve(src);
            img.src = src;
          })
      )
    );
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
      // 배경 교체 + 페이드
      const $bg = $(cfg.bg);
      $bg.css("background-image", `url("${cut.img}")`);
      $bg.removeClass("fade-in");
      void $bg[0]?.offsetWidth; // reflow 후 재적용(애니메이션 리트리거)
      $bg.addClass("fade-in");

      // 자막(있을 때만 자막바 표시). 기본은 한 줄(폭에 맞게 자동 축소)이나,
      // 문구에 명시적 개행(\n)이 있으면 <br> 로 강제 줄바꿈(nowrap 라도 <br>는 줄을 나눔).
      if (cfg.textEl) {
        const safe = $("<div>").text(cut.text || "").html().replace(/\n/g, "<br>");
        $(cfg.textEl).html(safe);
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
      if (last) {
        const $bg = $(cfg.bg);
        $bg.css("background-image", `url("${last.img}")`);
        $bg.removeClass("fade-in");
        void $bg[0]?.offsetWidth;
        $bg.addClass("fade-in");
      }
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
  });
})(window);
