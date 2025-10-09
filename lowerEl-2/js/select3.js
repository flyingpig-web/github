$(function () {
  const $info1 = $(".dimmed.info-1");
  const $selectMain = $(".select-main-3");
  const $tutorial = $(".tutorial-3");
  const $close = $(".close");
  const $ktmWrapper = $(".ktm-wrapper");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];
  const successBgm = $("#success-bgm")[0];

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
  let totalMoves = 0; // 총 움직임 횟수 (최대 22)
  const maxMoves = 22; // 최대 움직임 횟수
  let activeTimeouts = []; // 활성화된 setTimeout들을 추적

  // 진행도 업데이트 함수
  function updateProgress() {
    const progressPercentage = (totalMoves / maxMoves) * 100;
    $(".progress-bar-fill").css("height", `${progressPercentage}%`);
  }

  // 연주 중일 때 모든 notes 표시하는 함수
  function showAllNotes() {
    $(".notes").addClass("playing");
  }

  // 기존의 모든 setTimeout 정리
  function clearAllTimeouts() {
    activeTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    activeTimeouts = [];
  }

  // 모든 활성화된 sound-card 즉시 정리
  function clearAllActiveCards() {
    $(".sound-card.active").each(function () {
      removeCardImmediately($(this));
    });
  }

  // sound-card를 즉시 제거하는 함수
  function removeCardImmediately($card) {
    $card.removeClass("active");
    $card.css({
      transform: "scale(0.8) translateX(-50px)",
      opacity: "0",
      transition: "all 0.2s ease",
    });

    setTimeout(() => {
      $card.remove();
    }, 200);
  }

  // 연주가 끝났을 때 모든 notes와 arrow 숨기는 함수
  function hideAllNotes() {
    $(".notes").removeClass("playing");

    setTimeout(() => {
      $(".select-3-success").removeClass("display-none");
      successBgm.play();

      setTimeout(() => {
        $(".select-3-success").addClass("display-none");
        $ktmWrapper.removeClass("display-none");
      }, 3000);
    }, 500);
  }

  // jQuery UI 드래그 기능 사용
  $(".select-3-bow").draggable({
    start: function (event, ui) {
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

      // 충분한 거리를 움직였을 때만 방향 감지 (빠른 드래그를 위해 임계값 낮춤)
      if (Math.abs(deltaX) > 8) {
        // 8px 이상 움직였을 때만
        let currentDirection = deltaX > 0 ? "right" : "left";

        // 방향이 바뀌었을 때만 새로운 노트 재생
        if (currentDirection !== lastDirection) {
          // 움직임 횟수 증가 (최대 22번)
          if (totalMoves < maxMoves) {
            totalMoves++;
            updateProgress();
          }

          // 첫 번째 노트 재생 시 모든 notes 표시
          if (playIndex === 0) {
            showAllNotes();
          }

          // 현재 재생 중인 소리 멈춤
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }

          // 기존의 모든 setTimeout과 활성화된 카드들 즉시 정리
          clearAllTimeouts();
          clearAllActiveCards();

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

            // playIndex 즉시 증가 (progress와 동기화)
            playIndex++;

            // 200ms 후 카드 제거
            const timeoutId = setTimeout(() => {
              removeCardImmediately($targetCard);

              // 모든 노트 재생 완료 시 notes 숨김
              if (playIndex >= plays.length) {
                hideAllNotes();
              }
            }, 200);

            activeTimeouts.push(timeoutId);
          } else {
            // plays[playIndex]가 없어도 playIndex는 증가
            playIndex++;
          }

          lastDirection = currentDirection;
          // 위치를 현재 위치로 업데이트 (다음 방향 감지를 위해)
          lastPosition = { left: currentX, top: ui.position.top };
        }
      }
    },
    stop: function (event, ui) {
      isDragging = false;
      hasMovedEnough = false;
      lastDirection = null;

      // 현재 재생 중인 소리 멈춤
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }

      // 드래그 종료 시 남아있는 모든 카드 정리
      clearAllTimeouts();
      clearAllActiveCards();

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

    // 첫 번째 노트 재생 시 모든 notes 표시
    if (playIndex === 0) {
      showAllNotes();
    }

    // 현재 재생 중인 소리 멈춤
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // 기존의 모든 setTimeout과 활성화된 카드들 즉시 정리
    clearAllTimeouts();
    clearAllActiveCards();

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

    // playIndex 즉시 증가 (progress와 동기화)
    playIndex++;

    // 1000ms 후 카드 제거
    const timeoutId = setTimeout(() => {
      removeCardImmediately($targetCard);

      // 모든 노트 재생 완료 시 notes 숨김
      if (playIndex >= plays.length) {
        hideAllNotes();
      }
    }, 1000);

    activeTimeouts.push(timeoutId);
  }

  // 기존 클릭 이벤트는 제거하고 드래그 기능으로 대체
  $(".select-3-bow-wrapper").on("click", function () {
    $(".select-3-bow").css("transform", "rotate(0deg)");
    $(".select-3-arrow").fadeOut(500);
  });
});
