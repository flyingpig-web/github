$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorial = $(".dimmed.tutorial");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $rail = $(".rail");
  const $targetZone = $(".target-zone");
  const $combo1 = $(".combo1");
  const $combo2 = $(".combo2");
  const $combo3 = $(".combo3");
  const $targetZoneEffect = $(".target-zone-effect");
  const $select1Success = $(".select-1-success");
  const $ktmWrapper = $(".ktm-wrapper");

  // sounds
  const heemun = $("#heemun")[0];
  const heemunFinish = $("#heemun-finish")[0];
  const success = $("#success")[0];
  const finishSound = $("#finish-sound")[0];

  let gameStarted = false;
  let gameEndTimer = null;
  let activatedCombos = new Set(); // 이미 활성화된 콤보들을 추적
  let playerVisibleTimers = {}; // player visible 타이머들을 추적

  $info1.on("click", function () {
    $info1.hide();
    $tutorial.removeClass("display-none");
    $bgmTutorial.play();
  });

  $(".close").on("click", function () {
    $bgmTutorial.pause();
    $tutorial.fadeOut(500);
    setTimeout(() => {
      $tutorial.hide();
      $bgmMain.play();
    }, 500);

    setTimeout(() => {
      startGame();
      $(".select-main").removeClass("pointer-none");
    }, 7500);
  });

  function startGame() {
    gameStarted = true;
    $rail.addClass("moving");
    heemun.play();

    // 콤보 및 "시작" 이미지 감지를 위한 주기적 체크 시작
    startImageCheck();
  }

  function startImageCheck() {
    const checkInterval = setInterval(() => {
      if (!gameStarted) {
        clearInterval(checkInterval);
        return;
      }

      const targetRect = $targetZone[0].getBoundingClientRect();

      // data-combo 속성을 가진 이미지들 체크
      $("div[data-combo]").each(function () {
        const comboNumber = $(this).attr("data-combo");
        const imageRect = this.getBoundingClientRect();

        // 이미지가 target-zone과 겹치는지 확인
        if (
          !activatedCombos.has(comboNumber) &&
          targetRect.left < imageRect.right &&
          targetRect.right > imageRect.left &&
          targetRect.top < imageRect.bottom &&
          targetRect.bottom > imageRect.top
        ) {
          activateCombo(comboNumber);
          activatedCombos.add(comboNumber);
        }
      });

      // note 이미지들이 target-zone을 통과할 때 player 활성화 체크
      $(".note img").each(function () {
        const imageRect = this.getBoundingClientRect();
        const imageSrc = $(this).attr("src");

        // 이미지가 target-zone을 통과하는지 확인 (이미지의 중심이 target-zone을 지날 때)
        const imageCenterX = imageRect.left + imageRect.width / 2;

        if (
          imageCenterX >= targetRect.left &&
          imageCenterX <= targetRect.right &&
          imageRect.top < targetRect.bottom &&
          imageRect.bottom > targetRect.top
        ) {
          activatePlayerByImage(imageSrc);
        }
      });

      // "시작" 이미지 체크
      const sijakImages = $(".note img[src*='sijak.png']");
      if (sijakImages.length > 0) {
        sijakImages.each(function () {
          const imageRect = this.getBoundingClientRect();

          // "시작" 이미지가 target-zone을 완전히 지났는지 확인
          if (imageRect.right < targetRect.left) {
            clearInterval(checkInterval);
            startGameEndSequence();
            return false; // each 루프 종료
          }
        });
      }
    }, 100); // 100ms마다 체크
  }

  function activateCombo(comboNumber) {
    // 해당 콤보 이미지 활성화
    if (comboNumber === "1") {
      $combo1.show().addClass("combo-effect");
      setTimeout(() => $combo1.removeClass("combo-effect"), 1000);
    } else if (comboNumber === "2") {
      $combo2.show().addClass("combo-effect");
      setTimeout(() => $combo2.removeClass("combo-effect"), 1000);
    } else if (comboNumber === "3") {
      $combo3.show().addClass("combo-effect");
      setTimeout(() => $combo3.removeClass("combo-effect"), 1000);
    }

    // 효과음 재생
    if ($("#effect")[0]) {
      $("#effect")[0].play();
    }
  }

  function getInstrumentalFromImage(imageSrc) {
    const fileName = imageSrc.split("/").pop();

    if (fileName.includes("dwo")) return "dwo";
    if (fileName.includes("bak")) return "bak";
    if (fileName.includes("chook")) return "chook"; // a,b,c 구분 없이
    if (fileName.includes("julgo")) return "julgo"; // a,b,c 구분 없이
    if (fileName.includes("sijak")) return "sijak";

    return null;
  }

  function activatePlayerByImage(imageSrc) {
    const instrumental = getInstrumentalFromImage(imageSrc);

    if (!instrumental) return;

    // sijak이 활성화되면 모든 player를 visible로 유지
    if (instrumental === "sijak") {
      // 모든 기존 타이머 제거
      Object.values(playerVisibleTimers).forEach((timer) => {
        clearTimeout(timer);
      });
      playerVisibleTimers = {};

      // 모든 player와 spotlight에 visible 클래스 추가 (타이머 없이 유지)
      $(".player").addClass("visible");
      $(".spotlight").addClass("visible");
      return;
    }

    // 해당 instrumental을 가진 player 찾기
    const $player = $(`.player[data-instrumental="${instrumental}"]`);

    if ($player.length > 0) {
      const playerId = $player.attr("id");
      const playerNumber = playerId.replace("player", "");
      const $spotlight = $(`#spotlight${playerNumber}`);

      // 이미 타이머가 있다면 제거 (중복 방지)
      if (playerVisibleTimers[playerId]) {
        clearTimeout(playerVisibleTimers[playerId]);
      }

      // player와 spotlight에 visible 클래스 추가
      $player.addClass("visible");
      $spotlight.addClass("visible");

      // 0.3초 후 visible 클래스 제거
      playerVisibleTimers[playerId] = setTimeout(() => {
        $player.removeClass("visible");
        $spotlight.removeClass("visible");
        delete playerVisibleTimers[playerId];
      }, 300);
    }
  }

  function startGameEndSequence() {
    gameEndTimer = setTimeout(() => {
      // heemun 음원 fadeOut
      fadeOutAudio(heemun, 2000, () => {
        // 활동완료
        gameStarted = false;
        $select1Success.removeClass("display-none");
        success.play();
        $(".select-main").addClass("pointer-none");

        setTimeout(() => {
          heemunFinish.play();
          setTimeout(() => {
            $select1Success.addClass("display-none");
            fadeOutAudio(heemunFinish, 1000);
            $ktmWrapper.removeClass("display-none");
            $ktmWrapper.addClass("pointer-none");
            finishSound.play();
            setTimeout(() => {
              $ktmWrapper.removeClass("pointer-none");
            }, 5000);
          }, 10000);
        }, 4000);
      });
    }, 6000); // 6초 후
  }

  function fadeOutAudio(audioElement, duration, callback) {
    const startVolume = audioElement.volume;
    const fadeStep = startVolume / (duration / 50); // 50ms 간격으로 볼륨 감소

    const fadeInterval = setInterval(() => {
      if (audioElement.volume > fadeStep) {
        audioElement.volume -= fadeStep;
      } else {
        audioElement.volume = 0;
        audioElement.pause();
        clearInterval(fadeInterval);
        if (callback) callback();
      }
    }, 50);
  }

  function checkNoteInTargetZone(clickedImg) {
    if (!gameStarted) return false;

    const targetRect = $targetZone[0].getBoundingClientRect();
    const noteRect = clickedImg.getBoundingClientRect();

    // 클릭된 note가 target-zone과 겹치는지 확인
    if (
      targetRect.left < noteRect.right &&
      targetRect.right > noteRect.left &&
      targetRect.top < noteRect.bottom &&
      targetRect.bottom > noteRect.top
    ) {
      return true;
    }
    return false;
  }

  function showTargetZoneEffect() {
    // 1. display-none 제거
    $targetZoneEffect.removeClass("display-none");

    // 2. 0.1초 후 active 클래스 추가
    setTimeout(() => {
      $targetZoneEffect.addClass("active");

      // 3. 0.2초 후 display-none 다시 추가
      setTimeout(() => {
        $targetZoneEffect.removeClass("active").addClass("display-none");
      }, 100);
    }, 100);
  }

  function resetGame() {
    activatedCombos.clear();
    $(".combo1, .combo2, .combo3").hide();

    // 게임 종료 타이머가 있다면 정리
    if (gameEndTimer) {
      clearTimeout(gameEndTimer);
      gameEndTimer = null;
    }

    // player visible 타이머들 정리
    Object.values(playerVisibleTimers).forEach((timer) => {
      clearTimeout(timer);
    });
    playerVisibleTimers = {};

    // 모든 player와 spotlight에서 visible 클래스 제거
    $(".player").removeClass("visible");
    $(".spotlight").removeClass("visible");
  }

  // note 이미지 클릭 이벤트
  $(document).on("click", ".note img", function () {
    if (!gameStarted) return;

    // target-zone에서 클릭했는지 확인
    if (checkNoteInTargetZone(this)) {
      showTargetZoneEffect();

      // 효과음 재생
      if ($("#effect")[0]) {
        $("#effect")[0].play();
      }
    }
  });

  // 초기 콤보 이미지 숨김
  $(".combo1, .combo2, .combo3").hide();

  $(".ktm-card").on("click", function () {
    const cardExpandEffect = new Audio("sound/sfx/card_expand_01.wav");
    const $card = $(this);
    const $cardOff = $(".ktm-card-off");

    // 효과음 재생
    cardExpandEffect.play();

    $card.hide();
    $cardOff.show();

    setTimeout(() => {
      window.location.href = "ktm.html";
    }, 3000);
  });
});
