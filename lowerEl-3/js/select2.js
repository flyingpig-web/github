$(function () {
  // DOM Elements
  const $info1 = $(".dimmed.info-1");
  const $tutorial2 = $(".dimmed.tutorial-2");
  const $selectMain = $(".select-main-2");
  const $progressBarFill = $(".progress-bar-fill");
  const $successScreen = $(".select-2-success");

  // Audio Elements
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const yukSeong1 = $("#yuk-seong-1")[0];

  // Game State
  let timerStarted = false;
  let gameTimer = null;
  let clickedTargets = new Set();
  const totalTargets = 3;

  // Check if restart parameter exists
  const urlParams = new URLSearchParams(window.location.search);
  const isRestart = urlParams.get("restart") === "true";

  // Skip tutorial if restart
  if (isRestart) {
    $info1.hide();
    $tutorial2.addClass("display-none");
    $selectMain.removeClass("display-none pointer-none");
    $bgmMain.play();
  }

  // Audio fadeOut utility function
  function fadeOutAudio(audioElement, duration) {
    if (!audioElement || audioElement.paused) return;

    const startVolume = audioElement.volume;
    const fadeStep = startVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (audioElement.volume > fadeStep) {
        audioElement.volume -= fadeStep;
      } else {
        audioElement.volume = 0;
        audioElement.pause();
        audioElement.currentTime = 0;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  // Show success screen with fadeIn effect
  function showSuccessScreen() {
    $successScreen.removeClass("display-none").fadeIn(500);
  }

  // Timer Functions
  function startTimer() {
    if (timerStarted) return;

    yukSeong1.play();
    timerStarted = true;
    $progressBarFill.addClass("start-timer");

    gameTimer = setTimeout(() => {
      onTimerComplete();
    }, 30000);
  }

  function onTimerComplete() {
    fadeOutAudio(yukSeong1, 1000);
    timerStarted = false;
    gameTimer = null;
    handleTimeUp();
  }

  function stopTimer() {
    if (gameTimer) {
      clearTimeout(gameTimer);
      gameTimer = null;
    }

    const currentTransform = window.getComputedStyle(
      $progressBarFill[0]
    ).transform;
    $progressBarFill.removeClass("start-timer").css({
      transform: currentTransform,
      transition: "none",
    });

    timerStarted = false;
  }

  // Game End Handlers
  function handleTimeUp() {
    $selectMain.addClass("pointer-none");

    if ($bgmMain) {
      $bgmMain.pause();
    }

    showSuccessScreen();
  }

  function handleSuccess() {
    $selectMain.addClass("pointer-none");
    showSuccessScreen();
  }

  function onAllTargetsClicked() {
    fadeOutAudio(yukSeong1, 1000);
    stopTimer();
    handleSuccess();
  }

  // Initial tutorial flow
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
    $selectMain.removeClass("display-none pointer-none");
    $bgmMain.play();
  });

  $(".popup-close-no").on("click", function () {
    $(".tutorial-2-popup-wrapper").addClass("display-none");
  });

  // Start timer when bgmMain ends
  $bgmMain.addEventListener("ended", function () {
    startTimer();
  });

  // Skip bgmMain and start timer immediately on click
  $selectMain.on("click", function () {
    $bgmMain.currentTime = 0;
    $bgmMain.pause();
    startTimer();
  });

  // Target click handling
  $(document).on("click", "[class*='click-point-']", function () {
    const $clickPoint = $(this);
    const soundId = $clickPoint.attr("data-sound");

    if (clickedTargets.has(soundId)) {
      return;
    }

    clickedTargets.add(soundId);

    // Show completion indicator
    $clickPoint.find("img").removeClass("display-none");

    // Show target image
    const targetClass = soundId.replace("target", "target");
    $(`.${targetClass}`).removeClass("display-none");

    // Play target sound
    const audioElement = $(`#${soundId}`)[0];
    if (audioElement) {
      audioElement.play();
    }

    // Check if all targets completed
    if (clickedTargets.size >= totalTargets) {
      onAllTargetsClicked();
    }
  });
});
