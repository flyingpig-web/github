$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorialBg = $(".dimmed.tutorial-bg");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main");
  const $belt = $(".belt");
  const $miyo = $(".miyo");
  const $strawberryMoveWrapper = $(".strawberry-move-wrapper");
  const $strawberryMove = $(".strawberry-move");
  console.log($strawberryMove);

  // sounds
  let bgmAR = $("#bgm-ar")[0];
  let bgmMR = $("#bgm-mr")[0];

  // game variables
  let beltInterval = null;

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
    beltInterval = setInterval(() => {
      $belt.toggleClass("active");
    }, 500);
  }

  function stopGame() {
    $(".dan").removeClass("dance");
    $(".dan").attr("src", "img/select-1/dan.png");
    $(".hong").removeClass("dance");
    $(".hong").attr("src", "img/select-1/hong.png");
    $(".miyo").addClass("stop");
    $strawberryMoveWrapper.removeClass("active");
    clearInterval(beltInterval);
    bgmAR.pause();
    bgmMR.pause();
  }
});
