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
    $tutorial.fadeOut(200);
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
  let lastDirection = null; // 'left', 'right', null
  let lastPosition = { left: 0, top: 0 };
  let directionChangeCount = 0; // 방향 변경 횟수 추적

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
      lastDirection = null;
      lastPosition = { left: ui.position.left, top: ui.position.top };
    },
    drag: function (event, ui) {
      if (!isDragging) return;

      const currentX = ui.position.left;
      const lastX = lastPosition.left;
      const deltaX = currentX - lastX;

      // 충분한 거리를 움직였을 때만 방향 감지
      if (Math.abs(deltaX) > 15) {
        // 15px 이상 움직였을 때만
        let currentDirection = deltaX > 0 ? "right" : "left";

        // 방향이 바뀌었을 때만 새로운 노트 재생
        if (currentDirection !== lastDirection) {
          console.log("방향 변경됨! 노트 재생 -", playIndex);

          // 현재 재생 중인 소리 멈춤
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }

          // 새 소리 재생 (안전하게 체크)
          if (plays[playIndex]) {
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
                transition: "all 0.2s ease",
              });

              // 카드 완전히 사라진 후 제거
              setTimeout(() => {
                $targetCard.remove();
              }, 100);

              // 인덱스 증가
              playIndex++;
              console.log("다음 인덱스:", playIndex);
            }, 200);
          } else {
            console.log("연주 완료! 더 이상 재생할 노트가 없습니다.");
          }

          lastDirection = currentDirection;
          // 위치를 현재 위치로 업데이트 (다음 방향 감지를 위해)
          lastPosition = { left: currentX, top: ui.position.top };
        }
      }
    },
    stop: function (event, ui) {
      console.log("드래그 종료");
      isDragging = false;
      hasMovedEnough = false;
      lastDirection = null;

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

    console.log("노트 재생:", playIndex);

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
        transition: "all 0.2s ease",
      });

      // 카드 완전히 사라진 후 제거
      setTimeout(() => {
        $targetCard.remove();
      }, 200);

      // 인덱스 증가는 여기서만 한 번
      playIndex++;
      console.log("다음 인덱스:", playIndex);
    }, 1000);
  }

  // 기존 클릭 이벤트는 제거하고 드래그 기능으로 대체
  $(".select-3-bow-wrapper").on("click", function () {
    $(".select-3-bow").css("transform", "rotate(0deg)");
  });
});
