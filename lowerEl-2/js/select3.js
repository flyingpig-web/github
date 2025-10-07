$(function () {
  const $info1 = $(".dimmed.info-1");
  const $selectMain = $(".select-main-3");
  const $tutorial = $(".tutorial-3");
  const $close = $(".close");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];

  $info1.on("click", function () {
    $info1.hide();
    $tutorial.removeClass("display-none");
    bgmTutorial.play();
    setTimeout(() => {
      $tutorial.removeClass("pointer-none");
    }, 7000);
  });

  $close.on("click", function () {
    $tutorial.fadeOut(500);
    bgmTutorial.pause();
    bgmMain.play();
    setTimeout(() => {
      $selectMain.removeClass("pointer-none");
    }, 5000);
  });

  const plays = [
    $("#mi")[0],
    $("#ra")[0],
    $("#mi")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#mi")[0],
    $("#ra")[0],
    $("#mi")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#high-do")[0],
    $("#si")[0],
    $("#high-do")[0],
    $("#si")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#high-mi")[0],
    $("#high-do")[0],
    $("#high-mi")[0],
  ];

  let playIndex = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentAudio = null;
  let hasMovedEnough = false;

  // 간단한 클릭으로 테스트
  $(".select-3-bow").on("click", function (e) {
    console.log("활대 클릭됨");
    playNextNote();
  });

  // jQuery UI 드래그 기능 사용
  $(".select-3-bow").draggable({
    start: function (event, ui) {
      console.log("드래그 시작");
      isDragging = true;
      hasMovedEnough = false;
    },
    drag: function (event, ui) {
      if (!isDragging) return;

      const deltaX = ui.position.left - (ui.originalPosition.left || 0);
      const deltaY = ui.position.top - (ui.originalPosition.top || 0);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      console.log("움직임 거리:", distance);

      // 5% 이상 움직였는지 확인 (최소 20px)
      const minDistance = Math.max(20, window.innerWidth * 0.05);
      if (distance >= minDistance && !hasMovedEnough) {
        hasMovedEnough = true;
        console.log("충분히 움직임! 노트 재생");
        playNextNote();
      }
    },
    stop: function (event, ui) {
      console.log("드래그 종료");
      isDragging = false;
      hasMovedEnough = false;

      // 현재 재생 중인 소리 멈춤
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }

      // 활대 원래 위치로 복원
      $(this).css({
        transform: "translate(0, 0)",
        transition: "transform 0.3s ease",
      });

      setTimeout(() => {
        $(this).css("transition", "none");
      }, 300);
    },
  });

  // 다음 노트 재생
  function playNextNote() {
    if (playIndex >= plays.length) return;

    // 현재 재생 중인 소리 멈춤
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // 새 소리 재생
    currentAudio = plays[playIndex];
    currentAudio.currentTime = 0;
    currentAudio.play();

    // 해당 sound-card에 active 클래스 추가
    const $targetCard = $(`.sound-card[data-index="${playIndex}"]`);
    $targetCard.addClass("active");

    // 활대 움직임 효과
    const $bow = $(".select-3-bow");
    const moveX = (Math.random() - 0.5) * 20; // -10px ~ 10px
    const moveY = (Math.random() - 0.5) * 20;
    $bow.css("transform", `translate(${moveX}px, ${moveY}px)`);

    // 1초 후 active 클래스 제거 및 카드 축소
    setTimeout(() => {
      $targetCard.removeClass("active");
      $targetCard.css({
        transform: "scale(0.8) translateX(-50px)",
        opacity: "0",
        transition: "all 0.5s ease",
      });

      // 카드 완전히 사라진 후 제거
      setTimeout(() => {
        $targetCard.remove();
      }, 500);

      playIndex++;
    }, 1000);
  }

  // 기존 클릭 이벤트는 제거하고 드래그 기능으로 대체
  $(".select-3-bow-wrapper").on("click", function () {
    $(".select-3-bow").css("transform", "rotate(0deg)");
  });
});
