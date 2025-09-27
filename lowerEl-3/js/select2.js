$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorial2 = $(".dimmed.tutorial-2");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main-2");
  const $progressBarFill = $(".progress-bar-fill");

  let timerStarted = false;
  let gameTimer = null;

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

    // 예시: 게임 종료 처리
    $selectMain.addClass("pointer-none");

    // 음악 정지
    if ($bgmMain) {
      $bgmMain.pause();
    }

    // 결과 화면으로 이동하거나 다른 처리
    // alert("시간이 종료되었습니다!");
  }

  function startGame() {
    // 기존 게임 시작 로직
  }
});
