$(function () {
  const $selectMain = $(".select-main-3");
  const $tutorial = $(".tutorial-3");
  const $close = $(".close");
  const $ktmWrapper = $(".ktm-wrapper");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];
  const successBgm = $("#success-bgm")[0];

  setTimeout(() => {
    $tutorial.removeClass("pointer-none");
  }, 5000);

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
  let currentAudio = null;
  let lastDirection = null; // 'left', 'right', null
  let lastPosition = { left: 0, top: 0 };
  let totalMoves = 0; // 총 움직임 횟수 (최대 22)
  const maxMoves = 22; // 최대 움직임 횟수
  let activeTimeouts = []; // 활성화된 setTimeout들을 추적
  let isMiPaused = false; // mi 카드 재생 중 2초 대기 상태

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
    }, 1500);
  }

  // jQuery UI 드래그 기능 사용
  $(".select-3-bow").draggable({
    start: function (event, ui) {
      isDragging = true;
      hasMovedEnough = false;
      lastDirection = null;
      lastPosition = { left: ui.position.left, top: ui.position.top };

      // 드래그 시작 시 note 애니메이션 시작
      $("#note-1").addClass("animate-out");
      $("#note-2").addClass("animate-out");
      $("#note-3").addClass("animate-out");
    },
    drag: function (event, ui) {
      if (!isDragging) return;

      // mi 카드 재생 중이면 드래그 불가
      if (isMiPaused) return;

      $(".select-3-arrow").hide();

      // 마우스 위치가 .select-3-bow-wrapper 영역 안에 있는지 확인
      const $wrapper = $(".select-3-bow-wrapper");
      const wrapperOffset = $wrapper.offset();
      const wrapperWidth = $wrapper.outerWidth();
      const wrapperHeight = $wrapper.outerHeight();

      const mouseX = event.pageX;
      const mouseY = event.pageY;

      const isInWrapper =
        mouseX >= wrapperOffset.left &&
        mouseX <= wrapperOffset.left + wrapperWidth &&
        mouseY >= wrapperOffset.top &&
        mouseY <= wrapperOffset.top + wrapperHeight;

      // wrapper 영역 밖이면 진행하지 않음
      if (!isInWrapper) {
        return;
      }

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

            // 모든 움직임 완료 시 즉시 완료 처리
            if (totalMoves >= maxMoves) {
              hideAllNotes();
              return;
            }
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

          // playIndex가 범위를 벗어나지 않도록 체크
          if (playIndex < plays.length) {
            // 새 소리 재생
            currentAudio = plays[playIndex];
            currentAudio.currentTime = 0;
            currentAudio.play();

            // 해당 sound-card에 active 클래스 추가
            const $targetCard = $(`.sound-card[data-index="${playIndex}"]`);
            $targetCard.addClass("active");

            // mi 카드인지 확인
            const isMiCard = $targetCard.hasClass("mi");

            // 활대 움직임 효과
            const $bow = $(".select-3-bow");
            const moveX = (Math.random() - 0.5) * 20; // -10px ~ 10px
            const moveY = (Math.random() - 0.5) * 20;
            $bow.css("transform", `translate(${moveX}px, ${moveY}px)`);

            // mi 카드면 1초 대기, 일반 카드는 400ms 후 제거
            const removeDelay = isMiCard ? 1000 : 400;

            if (isMiCard) {
              // mi 카드 재생 중 드래그 비활성화
              isMiPaused = true;
            }

            const timeoutId = setTimeout(() => {
              removeCardImmediately($targetCard);
              // mi 카드 대기 종료
              if (isMiCard) {
                isMiPaused = false;
              }
            }, removeDelay);

            activeTimeouts.push(timeoutId);
          }

          // playIndex 증가 (progress와 동기화)
          playIndex++;

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
      isMiPaused = false; // mi 카드 대기 상태 초기화

      // 드래그 종료 시 note 애니메이션 정지
      $("#note-1").removeClass("animate-out");
      $("#note-2").removeClass("animate-out");
      $("#note-3").removeClass("animate-out");

      // 현재 재생 중인 소리 멈춤
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }

      // 드래그 종료 시 남아있는 모든 카드 정리
      clearAllTimeouts();
      clearAllActiveCards();

      // 모든 움직임 완료 시 완료 처리
      if (totalMoves >= maxMoves) {
        hideAllNotes();
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

  // 기존 클릭 이벤트는 제거하고 드래그 기능으로 대체
  $(".select-3-bow-wrapper").on("click", function () {
    $(".select-3-bow").css("transform", "rotate(0deg)");
    $(".select-3-arrow").hide();
  });
});
