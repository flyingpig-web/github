$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorial2 = $(".dimmed.tutorial-2");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main-2");
  const $progressBarFill = $(".progress-bar-fill");

  // sounds
  const yukSeong1 = $("#yuk-seong-1")[0];

  let timerStarted = false;
  let gameTimer = null;
  let clickedTargets = new Set(); // 클릭된 타겟들을 추적
  const totalTargets = 3; // 총 타겟 개수

  // 오디오 fadeOut 함수
  function fadeOutAudio(audioElement, duration) {
    if (!audioElement || audioElement.paused) return;

    const startVolume = audioElement.volume;
    const fadeStep = startVolume / (duration / 50); // 50ms마다 볼륨 감소

    const fadeInterval = setInterval(() => {
      if (audioElement.volume > fadeStep) {
        audioElement.volume -= fadeStep;
      } else {
        audioElement.volume = 0;
        audioElement.pause();
        audioElement.currentTime = 0;
        clearInterval(fadeInterval);
        console.log("오디오 fadeOut 완료");
      }
    }, 50);
  }

  $info1.on("click", function () {
    $info1.hide();
    $tutorial2.removeClass("display-none");
    $bgmTutorial.play();
    setTimeout(() => {
      $tutorial2.removeClass("pointer-none");
    }, 5000);
  });

  $(".start-btn").on("click", function () {
    $(".tutorial-2-popup-wrapper").removeClass("display-none");
  });

  $(".popup-close-yes").on("click", function () {
    $(".tutorial-2-popup-wrapper").addClass("display-none");
    $tutorial2.addClass("display-none");
    $bgmTutorial.pause();
    $bgmMain.play();
    $selectMain.removeClass("display-none");
    $selectMain.removeClass("pointer-none");

    // 게임 시작과 함께 타이머 시작
  });

  $(".popup-close-no").on("click", function () {
    $(".tutorial-2-popup-wrapper").addClass("display-none");
  });

  $selectMain.on("click", function () {
    $bgmMain.pause();
    $bgmMain.currentTime = 0;
    startTimer();
  });

  function startTimer() {
    if (timerStarted) return;
    yukSeong1.play();

    timerStarted = true;

    // progress-bar-fill 애니메이션 시작
    $progressBarFill.addClass("start-timer");

    // 30초 후 타이머 완료 함수 호출
    gameTimer = setTimeout(() => {
      onTimerComplete();
    }, 30000); // 30초

    console.log("30초 타이머 시작");
  }

  function onTimerComplete() {
    console.log("30초 타이머 완료!");

    // yukSeong1 사운드 fadeOut
    fadeOutAudio(yukSeong1, 1000);

    // 여기에 30초 지났을 때 실행할 로직 추가
    // 예: 게임 종료, 결과 화면 표시 등

    timerStarted = false;
    gameTimer = null;

    // 필요한 경우 추가 처리
    handleTimeUp();
  }

  function handleTimeUp() {
    // 30초가 지났을 때의 처리 로직
    console.log("시간 종료 처리");

    // 게임 종료 처리 - pointer-none 추가
    $selectMain.addClass("pointer-none");

    // 음악 정지
    if ($bgmMain) {
      $bgmMain.pause();
    }

    // 결과 화면으로 이동하거나 다른 처리
    // alert("시간이 종료되었습니다!");
  }

  // click-point 클릭 이벤트
  $(document).on("click", "[class*='click-point-']", function () {
    const $clickPoint = $(this);
    const soundId = $clickPoint.attr("data-sound");

    // 이미 클릭된 타겟인지 확인
    if (clickedTargets.has(soundId)) {
      return; // 이미 클릭된 경우 무시
    }

    // 클릭된 타겟 추가
    clickedTargets.add(soundId);

    // 1. click-point 안쪽 이미지의 display-none 제거
    $clickPoint.find("img").removeClass("display-none");

    // 2. 해당하는 target 이미지의 display-none 제거
    const targetClass = soundId.replace("target", "target"); // target-1 → target-1
    $(`.${targetClass}`).removeClass("display-none");

    // 3. data-sound에 해당하는 오디오 재생
    const audioElement = $(`#${soundId}`)[0];
    if (audioElement) {
      audioElement.play();
    }

    console.log(
      `${soundId} 클릭 완료 (${clickedTargets.size}/${totalTargets})`
    );

    // 4. 모든 타겟이 클릭되었는지 확인
    if (clickedTargets.size >= totalTargets) {
      onAllTargetsClicked();
    }
  });

  function onAllTargetsClicked() {
    console.log("성공! 모든 타겟 클릭 완료");

    // yukSeong1 사운드 fadeOut
    fadeOutAudio(yukSeong1, 1000);

    // 타이머 정지
    stopTimer();

    // 추가 성공 처리 로직
    handleSuccess();
  }

  function stopTimer() {
    if (gameTimer) {
      clearTimeout(gameTimer);
      gameTimer = null;
    }

    // 현재 progress-bar의 transform 위치 계산 및 고정
    const currentTransform = window.getComputedStyle(
      $progressBarFill[0]
    ).transform;

    // 애니메이션 제거하고 현재 위치로 고정
    $progressBarFill.removeClass("start-timer");
    $progressBarFill.css({
      transform: currentTransform,
      transition: "none",
    });

    timerStarted = false;
    console.log("타이머 정지 - 현재 위치에서 고정");
  }

  function handleSuccess() {
    // 성공 시 처리 로직
    console.log("게임 성공 처리");

    // 게임 비활성화 - pointer-none 추가
    $selectMain.addClass("pointer-none");

    // 성공 효과음이나 다른 처리 추가 가능
    // 예: 성공 화면 표시, 다음 단계로 이동 등
  }

  function resetGame() {
    clickedTargets.clear();

    // 모든 이미지 숨기기
    $("[class*='click-point-'] img").addClass("display-none");
    $("[class*='target-']").addClass("display-none");

    // 타이머 리셋
    if (gameTimer) {
      clearTimeout(gameTimer);
      gameTimer = null;
    }

    timerStarted = false;
    $progressBarFill.removeClass("start-timer");
    $progressBarFill.css({
      "animation-play-state": "running",
      transition: "transform 30s linear",
    });

    console.log("게임 리셋");
  }
});
