$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorialBg = $(".dimmed.tutorial-bg-2");
  const $container = $(".container");

  // sounds
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];

  // 커서 이벤트 핸들러들을 저장할 변수들
  let handleMouseMove, handleMouseDown, handleMouseUp;

  $info1.on("click", function () {
    $info1.hide();
    $tutorialBg.removeClass("display-none");
    $bgmTutorial.play();
  });

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
      // }, 9000);
    }, 1000);
  });

  function startGame() {
    console.log("startGame");
    $container.addClass("cursor-change");
    activateCursor();
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
