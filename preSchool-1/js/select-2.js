$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorialBg = $(".dimmed.tutorial-bg-2");
  const $container = $(".container");
  const $select2Bg = $(".select-2-bg");
  const $wmWrapper = $(".wm-wrapper");

  // sounds
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];

  // 커서 이벤트 핸들러들을 저장할 변수들
  let handleMouseMove, handleMouseDown, handleMouseUp;
  let patternObj = {
    1: {
      src: "img/select-2/pattern-1.png",
      path: [1, 2, 3, 6, 5, 4, 7],
      isComplete: false,
    },
    2: {
      src: "img/select-2/pattern-2.png",
      path: [1, 4, 7, 5, 8, 6],
      isComplete: false,
    },
    3: {
      src: "img/select-2/pattern-3.png",
      path: [3, 6, 5, 8, 7],
      isComplete: false,
    },
    4: {
      src: "img/select-2/pattern-4.png",
      path: [3, 2, 1, 4, 7, 8, 5],
      isComplete: false,
    },
  };

  // 게임 상태 변수들
  let currentPattern = null; // 현재 패턴 객체
  let currentPatternKey = null; // 현재 패턴 키
  let isDrawing = false; // 현재 그리는 중인지
  let currentBgmIndex = 1; // 현재 재생할 bgm-pattern 인덱스 (1~8)
  let drawingPath = []; // 현재 드래그 중인 경로 (드래그 시작~끝까지만 유효)

  $info1.on("click", function () {
    $info1.hide();
    $tutorialBg.removeClass("display-none");
    $bgmTutorial.play();
  });

  $(".close").on("click", function () {
    $bgmTutorial.pause();
    $tutorialBg.fadeOut(500);
    activatePattern();

    setTimeout(() => {
      $tutorialBg.hide();
      $bgmMain.play();
      $container.addClass("pointer-none");
    }, 500);

    setTimeout(() => {
      $container.removeClass("pointer-none");
      startGame();
      // }, 9000);
    }, 1000);
  });

  function startGame() {
    $container.addClass("cursor-change");
    activateCursor();
    setupPatternDrawing();
  }

  function setupPatternDrawing() {
    // 마우스 이벤트
    $(".wm").on("mousedown", function (e) {
      e.preventDefault();
      const wmNumber = parseInt($(this).data("wm"));

      // 현재 패턴의 시작점인지 확인
      if (currentPattern && wmNumber === currentPattern.path[0]) {
        isDrawing = true;
        drawingPath = [wmNumber]; // 드래그 시작 - 경로 초기화

        // 홀수 음원 재생 (메기기)
        if (currentBgmIndex <= 8) {
          const bgm = $(`#bgm-pattern-${currentBgmIndex}`)[0];
          if (bgm) bgm.play();
        }
      }
    });

    $(".wm").on("mouseenter", function (e) {
      if (!isDrawing || !currentPattern) return;

      const wmNumber = parseInt($(this).data("wm"));
      const expectedNext = currentPattern.path[drawingPath.length];

      // 다음 경로가 맞는지 확인 (중복 방지)
      if (wmNumber === expectedNext && !drawingPath.includes(wmNumber)) {
        drawingPath.push(wmNumber);
      }
    });

    // 터치 이벤트
    $(".wm").on("touchstart", function (e) {
      e.preventDefault();
      const wmNumber = parseInt($(this).data("wm"));

      // 현재 패턴의 시작점인지 확인
      if (currentPattern && wmNumber === currentPattern.path[0]) {
        isDrawing = true;
        drawingPath = [wmNumber];

        // 홀수 음원 재생 (메기기)
        if (currentBgmIndex <= 8) {
          const bgm = $(`#bgm-pattern-${currentBgmIndex}`)[0];
          if (bgm) bgm.play();
        }
      }
    });

    // 터치 이동 이벤트 - document에 등록
    $(document).on("touchmove", function (e) {
      if (!isDrawing || !currentPattern) return;

      const touch = e.originalEvent.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      if (element && $(element).hasClass("wm")) {
        const wmNumber = parseInt($(element).data("wm"));
        const expectedNext = currentPattern.path[drawingPath.length];

        if (wmNumber === expectedNext && !drawingPath.includes(wmNumber)) {
          drawingPath.push(wmNumber);
        }
      }
    });

    $(document).on("mouseup touchend", function () {
      if (!isDrawing) return;

      // 드래그 종료 - 패턴 완성 여부 확인
      if (drawingPath.length === currentPattern.path.length) {
        // 경로가 완전히 일치하는지 확인
        const isCorrect = drawingPath.every(
          (wm, index) => wm === currentPattern.path[index]
        );

        if (isCorrect) {
          completePattern();
        }
      }

      // 드래그 종료 - 경로 초기화
      isDrawing = false;
      drawingPath = [];
    });
  }

  function completePattern() {
    // 짝수 음원 재생 (받기)
    if (currentBgmIndex + 1 <= 8) {
      const bgm = $(`#bgm-pattern-${currentBgmIndex + 1}`)[0];
      if (bgm) {
        bgm.play();
        // 받기 음원 재생 후 다음 메기기 음원 인덱스로 이동
        bgm.addEventListener(
          "ended",
          () => {
            currentBgmIndex += 2; // 다음 홀수 인덱스로
          },
          { once: true }
        );
      }
    }

    // 현재 패턴을 완료로 표시
    patternObj[currentPatternKey].isComplete = true;

    // 다음 패턴 활성화
    setTimeout(() => {
      activatePattern();
    }, 1000);
  }

  function activatePattern() {
    // 완료되지 않은 패턴 중에서 랜덤 선정
    const availablePatterns = Object.keys(patternObj).filter(
      (key) => !patternObj[key].isComplete
    );

    if (availablePatterns.length === 0) {
      return;
    }

    const randomKey =
      availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    currentPatternKey = randomKey;
    currentPattern = patternObj[randomKey];

    // 패턴 이미지 표시
    $(".pattern").remove(); // 기존 패턴 제거
    $wmWrapper.append(`<img src="${currentPattern.src}" class="pattern" />`);
  }

  function activateCursor() {
    const cursor = document.getElementById("custom-cursor");

    // 커서 이미지 설정
    cursor.src = "img/select-2/cursor.png";
    cursor.style.display = "block";

    // 이벤트 핸들러 함수들 정의
    handleMouseMove = (e) => {
      cursor.style.left = e.clientX + 60 + "px";
      cursor.style.top = e.clientY - 60 + "px";
    };

    handleMouseDown = (e) => {
      cursor.src = "img/select-2/cursor-active.png";
      // 이미지 드래그 방지
      e.preventDefault();
    };

    handleMouseUp = (e) => {
      cursor.src = "img/select-2/cursor.png";
    };

    // 터치 이벤트 핸들러들 정의
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        cursor.style.left = touch.clientX + 60 + "px";
        cursor.style.top = touch.clientY - 60 + "px";
      }
    };

    const handleTouchStart = (e) => {
      cursor.src = "img/select-2/cursor-active.png";
      // 터치 이벤트에서도 드래그 방지
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      cursor.src = "img/select-2/cursor.png";
    };

    // 드래그 이벤트 핸들러 추가
    const handleDragStart = (e) => {
      e.preventDefault(); // 드래그 시작 방지
    };

    const handleDrag = (e) => {
      e.preventDefault(); // 드래그 방지
      cursor.src = "img/select-2/cursor.png"; // 드래그 중에는 원래 커서로 복원
    };

    const handleDragEnd = (e) => {
      cursor.src = "img/select-2/cursor.png"; // 드래그 종료 시 원래 커서로 복원
    };

    // 이벤트 리스너 등록 (마우스 이벤트)
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("drag", handleDrag);
    document.addEventListener("dragend", handleDragEnd);

    // 터치 이벤트 리스너 등록
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // 전역 변수에 저장 (나중에 제거하기 위해)
    window.handleDragStart = handleDragStart;
    window.handleDrag = handleDrag;
    window.handleDragEnd = handleDragEnd;
    window.handleTouchMove = handleTouchMove;
    window.handleTouchStart = handleTouchStart;
    window.handleTouchEnd = handleTouchEnd;
  }

  function deactivateCursor() {
    const cursor = document.getElementById("custom-cursor");
    cursor.style.display = "none";

    // 이벤트 리스너 제거
    if (handleMouseMove)
      document.removeEventListener("mousemove", handleMouseMove);
    if (handleMouseDown)
      document.removeEventListener("mousedown", handleMouseDown);
    if (handleMouseUp) document.removeEventListener("mouseup", handleMouseUp);

    // 드래그 이벤트 리스너 제거
    if (window.handleDragStart)
      document.removeEventListener("dragstart", window.handleDragStart);
    if (window.handleDrag)
      document.removeEventListener("drag", window.handleDrag);
    if (window.handleDragEnd)
      document.removeEventListener("dragend", window.handleDragEnd);

    // 터치 이벤트 리스너 제거
    if (window.handleTouchMove)
      document.removeEventListener("touchmove", window.handleTouchMove);
    if (window.handleTouchStart)
      document.removeEventListener("touchstart", window.handleTouchStart);
    if (window.handleTouchEnd)
      document.removeEventListener("touchend", window.handleTouchEnd);

    $container.removeClass("cursor-change");
  }
});
