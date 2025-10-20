$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorialBg = $(".dimmed.tutorial-bg");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main");
  const $belt = $(".belt");
  const $miyo = $(".miyo");
  const $strawberryMoveWrapper = $(".strawberry-move-wrapper");
  const $guageWrapper = $(".guage-wrapper");
  const $select1Glow = $(".select-1-glow");

  // sounds
  let bgmAR = $("#bgm-ar")[0];
  let bgmMR = $("#bgm-mr")[0];

  // game variables
  let beltInterval = null;
  let currentRound = 0; // 현재 라운드 (1, 2, 3, 4)
  let roundSuccess = [false, false, false, false]; // 각 라운드의 성공 여부
  const NORMAL_VOLUME = 0.5;
  const MR_ACTIVE_VOLUME = 1;

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
      $selectMain.addClass("pointer-none");
    }, 500);

    setTimeout(() => {
      $selectMain.removeClass("pointer-none");
      startGame();
    }, 6000);
  });

  function startGame() {
    $(".dan").addClass("dance");
    $(".dan").attr("src", "img/select-1/dan-dance.png");
    $(".hong").addClass("dance");
    $(".hong").attr("src", "img/select-1/hong-dance.png");
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
    setTimeout(() => activateStrawberry(2), 8800);
    setTimeout(() => activateStrawberry(3), 14500);
    setTimeout(() => activateStrawberry(4), 16500);

    // bgmAR timeupdate 이벤트로 mute 제어
    bgmAR.addEventListener("timeupdate", handleBgmARMute);
  }

  function activateStrawberry(round) {
    // $strawberryMoveWrapper 에 strawberry-move .active 클래스를 붙여서 append.
    const $strawberryMove = $(
      `<img src="img/select-1/strawberry-move.png" class="strawberry-move active">`
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

    // 7~9초: 1번 라운드 체크
    if (currentTime >= 7.2 && currentTime < 9.48) {
      bgmAR.volume = roundSuccess[0] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[0] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    }
    // 11.8~13.8초: 2번 라운드 체크
    else if (currentTime >= 11.7 && currentTime < 14.2) {
      bgmAR.volume = roundSuccess[1] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[1] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    }
    // 16~18초: 3번 라운드 체크
    else if (currentTime >= 16.7 && currentTime < 19) {
      bgmAR.volume = roundSuccess[2] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[2] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    }
    // 18~20초: 4번 라운드 체크
    else if (currentTime >= 19 && currentTime < 21.5) {
      bgmAR.volume = roundSuccess[3] ? NORMAL_VOLUME : 0;
      bgmMR.volume = roundSuccess[3] ? NORMAL_VOLUME : MR_ACTIVE_VOLUME;
    }
    // 다른 구간에서는 항상 재생
    else {
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

        // strawberry-move가 touch-point 영역에 반쯤이라도 들어왔는지 확인
        const strawberryCenterX =
          strawberryRect.left + strawberryRect.width / 2;
        const strawberryCenterY =
          strawberryRect.top + strawberryRect.height / 2;

        const isOverlapping =
          strawberryCenterX >= touchPointRect.left &&
          strawberryCenterX <= touchPointRect.right &&
          strawberryCenterY >= touchPointRect.top &&
          strawberryCenterY <= touchPointRect.bottom;

        if (isOverlapping) {
          // 성공 처리
          roundSuccess[currentRound - 1] = true;
          $currentStrawberry.removeClass("active").hide();
          $(`#strawberry-guage-${currentRound}`).fadeOut(500);

          // 라운드 초기화
          const completedRound = currentRound;
          currentRound = 0;

          // 게임 완료 체크
          if (roundSuccess.every((success) => success)) {
            setTimeout(() => {
              stopGame();
              alert("게임 완료!");
            }, 1000);
          }
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
  }
});
