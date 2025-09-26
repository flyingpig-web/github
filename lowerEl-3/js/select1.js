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
  const heemun = $("#heemun")[0];

  let comboCount = 0;
  let gameStarted = false;
  let clickedElements = new Set(); // 클릭된 요소들을 추적
  let currentSetProgress = {}; // 각 세트별 진행 상황

  // 세트별 이미지 정의 (이미지가 있는 note만)
  const sets = [
    {
      id: "set1",
      images: [
        "dwo.png",
        "bak.png",
        "chook-a.png",
        "chook-a.png",
        "chook-a.png",
        "julgo-a.png",
      ],
      completed: false,
      clickedCount: 0,
    },
    {
      id: "set2",
      images: ["chook-b.png", "chook-b.png", "chook-b.png", "julgo-b.png"],
      completed: false,
      clickedCount: 0,
    },
    {
      id: "set3",
      images: ["chook-c.png", "chook-c.png", "chook-c.png", "julgo-c.png"],
      completed: false,
      clickedCount: 0,
    },
    {
      id: "set4",
      images: ["sijak.png"],
      completed: false,
      clickedCount: 0,
    },
  ];

  let gameEndTimer = null;

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

    // "시작" 이미지 감지를 위한 주기적 체크 시작
    startSijakImageCheck();
  }

  function startSijakImageCheck() {
    const checkInterval = setInterval(() => {
      if (!gameStarted) {
        clearInterval(checkInterval);
        return;
      }

      // "시작" 이미지 찾기
      const sijakImages = $(".note img[src*='sijak.png']");

      if (sijakImages.length > 0) {
        const targetRect = $targetZone[0].getBoundingClientRect();

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

  function startGameEndSequence() {
    gameEndTimer = setTimeout(() => {
      // heemun 음원 fadeOut
      fadeOutAudio(heemun, 2000, () => {
        // fadeOut 완료 후 alert 표시
        alert("활동이 완료되었습니다!");
        gameStarted = false;
      });
    }, 10000); // 5초 후
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

  function getImageFileName(imgSrc) {
    return imgSrc.split("/").pop();
  }

  function findSetByImage(imageName) {
    for (let set of sets) {
      if (set.images.includes(imageName) && !set.completed) {
        return set;
      }
    }
    return null;
  }

  function checkSetCompletion(set) {
    return set.clickedCount >= set.images.length;
  }

  function increaseCombo() {
    comboCount++;

    // 콤보에 따라 이미지 표시
    if (comboCount === 1) {
      $combo1.show().addClass("combo-effect");
      setTimeout(() => $combo1.removeClass("combo-effect"), 1000);
    } else if (comboCount === 2) {
      $combo2.show().addClass("combo-effect");
      setTimeout(() => $combo2.removeClass("combo-effect"), 1000);
    } else if (comboCount === 3) {
      $combo3.show().addClass("combo-effect");
      setTimeout(() => $combo3.removeClass("combo-effect"), 1000);

      // 3콤보 달성 시 게임 완료
      setTimeout(() => {
        alert("축하합니다! 3콤보를 달성했습니다!");
      }, 1500);
    }
  }

  function resetGame() {
    comboCount = 0;
    clickedElements.clear();
    sets.forEach((set) => {
      set.completed = false;
      set.clickedCount = 0;
    });
    $(".combo1, .combo2, .combo3").hide();

    // 게임 종료 타이머가 있다면 정리
    if (gameEndTimer) {
      clearTimeout(gameEndTimer);
      gameEndTimer = null;
    }
  }

  // note 이미지 클릭 이벤트
  $(document).on("click", ".note img", function () {
    // 중복 클릭 방지
    const elementId =
      $(this).attr("src") + "_" + $(this).closest(".note").index();
    if (clickedElements.has(elementId)) {
      return;
    }

    if (checkNoteInTargetZone(this)) {
      const imageName = getImageFileName($(this).attr("src"));
      const targetSet = findSetByImage(imageName);

      if (targetSet) {
        // 클릭된 요소 기록
        clickedElements.add(elementId);
        targetSet.clickedCount++;

        // 세트 완성 확인
        if (checkSetCompletion(targetSet)) {
          targetSet.completed = true;
          increaseCombo();

          if ($("#effect")[0]) {
            $("#effect")[0].play(); // 효과음 재생
          }
        }
      }
    } else {
      // 빗나간 경우 게임 리셋
      //   resetGame();
    }
  });

  // 초기 콤보 이미지 숨김
  $(".combo1, .combo2, .combo3").hide();
});
