$(function () {
  const $tutorialBg = $(".dimmed.tutorial-bg-2");
  const $container = $(".container");
  const $selectMain = $(".select-main");
  const $select2Bg = $(".select-2-bg");
  const $wmWrapper = $(".wm-wrapper");
  const $selectCompleted = $(".select-completed");
  const $finishBg = $(".finish-bg");

  // sounds
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const bgmFinish = $("#bgm-finish")[0];
  const puzzleSuccess = $("#puzzle-success")[0];

  $bgmTutorial.play();

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
  let currentPlayingAudio = null; // 현재 재생 중인 오디오
  let audioQueue = []; // 재생 대기 중인 오디오 큐
  let patternStartTime = null; // 패턴 그리기 시작 시간

  $(".close").on("click", function () {
    $bgmTutorial.pause();
    $tutorialBg.fadeOut(500);

    setTimeout(() => {
      $tutorialBg.hide();
      $bgmMain.play();
      $container.addClass("pointer-none");
    }, 500);

    setTimeout(() => {
      $container.removeClass("pointer-none");
      startGame();
    }, 9000);
  });

  function startGame() {
    $container.addClass("cursor-change");
    activatePattern();
    activateCursor();
    setupPatternDrawing();
  }

  // 춤 시작 함수
  function startDance() {
    $(".dan-2").addClass("dance");
    $(".dan-2").attr("src", "img/select-2/dan-dance.png");
    $(".hong-2").addClass("dance");
    $(".hong-2").attr("src", "img/select-2/hong-dance.png");
  }

  // 춤 중지 함수
  function stopDance() {
    $(".dan-2").removeClass("dance");
    $(".dan-2").attr("src", "img/select-2/dan.png");
    $(".hong-2").removeClass("dance");
    $(".hong-2").attr("src", "img/select-2/hong.png");
  }

  // 오디오 재생 관리 함수
  function playAudioSafe(audioElement, audioIndex) {
    if (!audioElement) return;

    // 현재 재생 중인 오디오가 있으면 큐에 추가
    if (currentPlayingAudio && !currentPlayingAudio.paused) {
      audioQueue.push({ element: audioElement, index: audioIndex });
      return;
    }

    // 재생 시작
    currentPlayingAudio = audioElement;
    audioElement.play();

    // 재생 완료 시 다음 오디오 재생
    audioElement.addEventListener("ended", function onEnded() {
      audioElement.removeEventListener("ended", onEnded);
      currentPlayingAudio = null;

      // audio-8 재생 완료 시 게임 종료
      if (audioIndex === 8) {
        gameComplete();
      }

      // 큐에 대기 중인 오디오가 있으면 재생
      if (audioQueue.length > 0) {
        const nextAudioData = audioQueue.shift();
        playAudioSafe(nextAudioData.element, nextAudioData.index);
      }
    });
  }

  // 게임 완료 함수
  function gameComplete() {
    // 여기에 게임 완료 로직 추가
    // 예: 완료 화면 표시, 커서 비활성화 등
    showFinishAnimation();
    deactivateCursor();
  }

  function setupPatternDrawing() {
    // 마우스 이벤트
    $(".wm").on("mousedown", function (e) {
      e.preventDefault();
      const wmNumber = parseInt($(this).data("wm"));

      // 현재 패턴의 시작점인지 확인 (이미 그리기 시작했으면 무시)
      if (currentPattern && wmNumber === currentPattern.path[0] && !isDrawing) {
        isDrawing = true;
        drawingPath = [wmNumber]; // 드래그 시작 - 경로 초기화
        patternStartTime = Date.now(); // 패턴 그리기 시작 시간 기록

        // 시작점 수박 스케일 업 & 글로우 효과
        $(this).addClass("active");

        // puzzle_success_01 사운드 재생
        if (puzzleSuccess) {
          puzzleSuccess.currentTime = 0;
          puzzleSuccess.play();
        }

        // 홀수 음원 재생 (메기기)
        if (currentBgmIndex <= 8) {
          const bgm = $(`#bgm-pattern-${currentBgmIndex}`)[0];
          if (bgm) playAudioSafe(bgm, currentBgmIndex);
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

        // 수박 스케일 업 & 글로우 효과
        $(this).addClass("active");

        // puzzle_success_01 사운드 재생
        if (puzzleSuccess) {
          puzzleSuccess.currentTime = 0;
          puzzleSuccess.play();
        }
      }
    });

    // 터치 이벤트
    $(".wm").on("touchstart", function (e) {
      e.preventDefault();
      const wmNumber = parseInt($(this).data("wm"));

      // 현재 패턴의 시작점인지 확인 (이미 그리기 시작했으면 무시)
      if (currentPattern && wmNumber === currentPattern.path[0] && !isDrawing) {
        isDrawing = true;
        drawingPath = [wmNumber];
        patternStartTime = Date.now(); // 패턴 그리기 시작 시간 기록

        // 시작점 수박 스케일 업 & 글로우 효과
        $(this).addClass("active");

        // puzzle_success_01 사운드 재생
        if (puzzleSuccess) {
          puzzleSuccess.currentTime = 0;
          puzzleSuccess.play();
        }

        // 홀수 음원 재생 (메기기)
        if (currentBgmIndex <= 8) {
          const bgm = $(`#bgm-pattern-${currentBgmIndex}`)[0];
          if (bgm) playAudioSafe(bgm, currentBgmIndex);
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

          // 수박 스케일 업 & 글로우 효과
          $(element).addClass("active");

          // puzzle_success_01 사운드 재생
          if (puzzleSuccess) {
            puzzleSuccess.currentTime = 0;
            puzzleSuccess.play();
          }
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
    // 패턴 완료 시간 계산
    const patternEndTime = Date.now();
    const drawingTime = (patternEndTime - patternStartTime) / 1000; // 초 단위

    // 시간에 따른 reaction 표시
    showReaction(drawingTime);

    // 패턴 완성 시 춤 시작
    startDance();

    // 2초 후 춤 중지
    setTimeout(() => {
      stopDance();
    }, 2000);

    // 짝수 음원 재생 (받기)
    if (currentBgmIndex + 1 <= 8) {
      const evenIndex = currentBgmIndex + 1;
      const bgm = $(`#bgm-pattern-${evenIndex}`)[0];
      if (bgm) {
        playAudioSafe(bgm, evenIndex);
      }
    }

    // 다음 메기기 음원 인덱스로 즉시 이동 (짝수 음원 재생과 관계없이)
    currentBgmIndex += 2;

    // 현재 패턴을 완료로 표시
    patternObj[currentPatternKey].isComplete = true;

    // 다음 패턴 활성화
    setTimeout(() => {
      activatePattern();
    }, 4300);
  }

  // reaction 표시 함수
  function showReaction(drawingTime) {
    let reactionClass = "";
    let reactionSrc = "";
    let bgm = "";

    // 시간에 따라 클래스와 이미지 결정
    if (drawingTime <= 1) {
      reactionClass = "slow";
      reactionSrc = "img/select-2/reaction-slow.png";
      bgm = "bgm-wm-pattern-slow";
    } else if (drawingTime <= 3) {
      reactionClass = "good";
      reactionSrc = "img/select-2/reaction-good.png";
      bgm = "bgm-wm-pattern-good";
    } else {
      reactionClass = "fast";
      reactionSrc = "img/select-2/reaction-fast.png";
      bgm = "bgm-wm-pattern-fast";
    }

    // reaction 요소 생성 및 추가
    const $reaction = $(
      `<img src="${reactionSrc}" class="reaction ${reactionClass}" />`
    );
    $selectMain.append($reaction);
    $(`#${bgm}`)[0].currentTime = 0;
    $(`#${bgm}`)[0].play();

    // 0.8초 후 제거
    setTimeout(() => {
      $reaction.remove();
    }, 800);
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

    // 모든 수박의 active 클래스 초기화
    $(".wm").removeClass("active");

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

  // 성공 애니메이션 표시 함수
  function showFinishAnimation() {
    $selectCompleted.removeClass("display-none");
    // pattern 이미지와 active 클래스 지우기
    $selectMain.find(".pattern").remove();
    $wmWrapper.find(".wm").removeClass("active");

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      bgmFinish.play();
      $finishBg.removeClass("display-none");
      $selectCompleted.addClass("display-none");
    }, 2000);

    setTimeout(() => {
      $finishBg.removeClass("pointer-none");
    }, 5000);
  }

  // 커서 비활성화 함수
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

  $(".wm-finish").on("click", () => {
    $("#bgm-card-open")[0].play();
    $(".wm-finish").fadeOut(500);

    setTimeout(() => {
      $(".wm-finish-half").fadeIn(500);
    }, 500);

    setTimeout(() => {
      $(".wm-finish-half").fadeOut(500);
      $(".wm-finish-message").fadeIn(500);
      $(".wm-finish-message").removeClass("pointer-none");
    }, 1500);
  });

  $(".wm-finish-half").on("click", () => {
    $(".wm-finish-half").fadeOut(500);
    setTimeout(() => {
      $(".wm-finish-message").fadeIn(500);
      $(".wm-finish-message").removeClass("pointer-none");
    }, 500);
  });

  const $messageSound = $("#message-sound")[0];
  $(".wm-finish-message").on("click", () => {
    $(".message-content-2").removeClass("display-none");
    $(".message-content-2").fadeIn(500);
    $(".finish-bg").fadeOut(500);
    $messageSound.play();
  });

  $(".message-content-close").on("click", function () {
    $(".message-content-2").fadeOut(500);
    $(".finish-bg").fadeIn(500);
    $messageSound.pause();
    $messageSound.currentTime = 0;
  });
});
