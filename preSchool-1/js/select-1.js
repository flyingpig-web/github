$(function () {
  const $container = $(".container");
  const $tutorialBg = $(".dimmed.tutorial-bg");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main");
  const $belt = $(".belt");
  const $miyo = $(".miyo");
  const $strawberryMoveWrapper = $(".strawberry-move-wrapper");
  const $guageWrapper = $(".guage-wrapper");
  const $select1Glow = $(".select-1-glow");
  const $selectCompleted = $(".select-completed");
  const $finishBg = $(".finish-bg");

  // sounds
  let bgmAR = $("#bgm-ar")[0];
  let bgmMR = $("#bgm-mr")[0];
  const bgmFinish = $("#bgm-finish")[0];
  const bgmFinish2 = $("#bgm-finish-2")[0];

  // game variables
  let beltInterval = null;
  let currentRound = 0; // 현재 라운드 (1, 2, 3, 4)
  let roundSuccess = [false, false, false, false]; // 각 라운드의 성공 여부
  let progressFillInset = 100; // progress-bar-fill의 clip-path inset 값 (100%에서 시작)
  const NORMAL_VOLUME = 0.5;
  const MR_ACTIVE_VOLUME = 1;

  $bgmTutorial.play();

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
    }, 6000);
  });

  function startGame() {
    $(".miyo").removeClass("stop");
    $strawberryMoveWrapper.addClass("active");

    bgmAR.play();
    bgmMR.play();
    bgmAR.volume = NORMAL_VOLUME;
    bgmMR.volume = NORMAL_VOLUME;
    beltInterval = setInterval(() => {
      $belt.toggleClass("active");
    }, 500);

    setTimeout(() => activateStrawberry(1), 5000);
    setTimeout(() => activateStrawberry(2), 10000);
    setTimeout(() => activateStrawberry(3), 14500);
    setTimeout(() => activateStrawberry(4), 17500);

    // bgmAR timeupdate 이벤트로 mute 제어
    bgmAR.addEventListener("timeupdate", handleBgmARMute);

    setTimeout(() => {
      stopGame();
    }, 30000);
  }

  function activateStrawberry(round) {
    // $strawberryMoveWrapper 에 strawberry-move .active 클래스를 붙여서 append.
    const $strawberryMove = $(
      `<img src="img/select-1/strawberry-move.png" class="strawberry-move active" data-round="${round}">`
    );
    $strawberryMoveWrapper.append($strawberryMove);

    const $strawberryGuage = $(
      `<img src="img/select-1/strawberry-guage.png" class="strawberry-guage active" id="strawberry-guage-${round}">`
    );
    $guageWrapper.append($strawberryGuage);
    currentRound = round;
  }

  function handleBgmARMute(e) {
    const currentTime = bgmAR.currentTime;

    // time은 변경되면안됨 (AR 의 구간임)
    if (currentTime >= 7.2 && currentTime < 9.48) {
      bgmAR.volume = roundSuccess[0] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[0] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    } else if (currentTime >= 11.7 && currentTime < 14.2) {
      bgmAR.volume = roundSuccess[1] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[1] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    } else if (currentTime >= 16.7 && currentTime < 19) {
      bgmAR.volume = roundSuccess[2] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[2] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    } else if (currentTime >= 19 && currentTime < 21.5) {
      bgmAR.volume = roundSuccess[3] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[3] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    } else {
      bgmAR.volume = NORMAL_VOLUME;
      bgmMR.volume = NORMAL_VOLUME;
    }
  }

  function showGlowEffect() {
    $select1Glow.addClass("active");

    // 0.6초 안에 glow-01.png부터 glow-11.png까지 순차적으로 표시
    const glowImages = [];
    for (let i = 1; i <= 11; i++) {
      glowImages.push(`img/glow/glow-${i.toString().padStart(2, "0")}.png`);
    }

    const intervalTime = 600 / glowImages.length; // 0.6초를 11개로 나눔 (약 54.5ms)
    let currentIndex = 0;

    const glowInterval = setInterval(() => {
      if (currentIndex < glowImages.length) {
        $select1Glow.attr("src", glowImages[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(glowInterval);
        // 모든 이미지 표시 완료 후 active 클래스 제거
        setTimeout(() => {
          $select1Glow.removeClass("active");
        }, 100); // 마지막 이미지를 잠깐 더 보여주기 위해 100ms 추가
      }
    }, intervalTime);
  }

  // touch-point 클릭 이벤트 (성공 처리)
  $(".touch-point").on("click", function () {
    $miyo.addClass("active");

    // glow 효과 실행
    showGlowEffect();

    // active 애니메이션 완료 후 active 클래스 제거하여 miyo-up-down 애니메이션 재시작
    setTimeout(() => {
      $miyo.removeClass("active");
    }, 2000); // miyo-active 애니메이션 시간과 동일 (2초)

    // strawberry-move가 touch-point 영역에 도달했는지 확인
    if (currentRound > 0) {
      const $currentStrawberry = $(`.strawberry-move.active`).last();
      if ($currentStrawberry.length > 0) {
        const strawberryRect = $currentStrawberry[0].getBoundingClientRect();
        const touchPointRect = this.getBoundingClientRect();

        let isOverlapping = !(
          strawberryRect.right < touchPointRect.left ||
          strawberryRect.left > touchPointRect.right ||
          strawberryRect.bottom < touchPointRect.top ||
          strawberryRect.top > touchPointRect.bottom
        );

        if (isOverlapping) {
          // 클릭한 딸기의 실제 라운드 번호 가져오기
          const clickedRound = parseInt($currentStrawberry.data("round"));

          // 성공 처리
          roundSuccess[clickedRound - 1] = true;
          $("#round-success-sound")[0].play();
          $currentStrawberry.addClass("success");
          $currentStrawberry.attr("src", "img/select-1/strawberry-success.png");

          // touch-point opacity 효과
          $(".touch-point").css("opacity", "0");
          setTimeout(() => {
            $(".touch-point").css("opacity", "1");
          }, 1000);

          // dan, hong 성공 애니메이션
          $(".dan").addClass("dance");
          $(".dan").attr("src", "img/select-1/dan-dance.png");
          $(".hong").addClass("dance");
          $(".hong").attr("src", "img/select-1/hong-dance.png");

          // 1초 후 원래 상태로 복원
          setTimeout(() => {
            $(".dan").removeClass("dance");
            $(".dan").attr("src", "img/select-1/dan.png");
            $(".hong").removeClass("dance");
            $(".hong").attr("src", "img/select-1/hong.png");
          }, 2000);

          // progress-bar-fill 업데이트 (25%씩 감소)
          progressFillInset -= 25;
          $(".progress-bar-fill").css(
            "clip-path",
            `inset(${progressFillInset}% 0 0 0)`
          );

          $(`#strawberry-guage-${clickedRound}`).hide();

          // 성공한 딸기는 active 클래스를 유지하여 계속 움직임
          // active 클래스를 제거하지 않음
        }
      }
    }
  });

  function stopGame() {
    $(".dan").removeClass("dance");
    $(".dan").attr("src", "img/select-1/dan.png");
    $(".hong").removeClass("dance");
    $(".hong").attr("src", "img/select-1/hong.png");
    $miyo.addClass("stop");
    $strawberryMoveWrapper.removeClass("active");
    clearInterval(beltInterval);
    bgmAR.removeEventListener("timeupdate", handleBgmARMute);
    bgmAR.pause();
    bgmMR.pause();

    finish();
  }

  function finish() {
    showFinishAnimation();
  }

  // 성공 애니메이션 표시 함수
  function showFinishAnimation() {
    $selectCompleted.removeClass("display-none");
    $("#bgm-congratulation")[0].play();

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      bgmFinish.play();
      $finishBg.removeClass("display-none");
      $selectCompleted.addClass("display-none");
    }, 3000);

    setTimeout(() => {
      $finishBg.removeClass("pointer-none");
    }, 5000);
  }

  $(".strawberry-finish").on("click", () => {
    bgmFinish2.play();
    $(".strawberry-finish").fadeOut(500);

    setTimeout(() => {
      $(".strawberry-finish-half").fadeIn(500);
    }, 500);

    setTimeout(() => {
      $(".strawberry-finish-half").removeClass("pointer-none");
    }, 2000);
  });

  $(".strawberry-finish-half").on("click", () => {
    $(".strawberry-finish-half").fadeOut(500);
    setTimeout(() => {
      $(".strawberry-finish-message").fadeIn(500);
      $(".strawberry-finish-message").removeClass("pointer-none");
    }, 500);
  });

  const $messageSound = $("#message-sound")[0];
  $(".strawberry-finish-message").on("click", () => {
    $(".message-content").removeClass("display-none");
    $(".message-content").fadeIn(500);
    $(".finish-bg").fadeOut(500);
    $messageSound.play();
  });

  $(".message-content-close").on("click", function () {
    $(".message-content").fadeOut(500);
    $(".finish-bg").fadeIn(500);
    $messageSound.pause();
    $messageSound.currentTime = 0;
  });
});
