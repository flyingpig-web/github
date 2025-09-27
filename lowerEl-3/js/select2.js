$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorial2 = $(".dimmed.tutorial-2");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main-2");

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
  });

  $(".popup-close-no").on("click", function () {
    $(".tutorial-2-popup-wrapper").addClass("display-none");
  });

  $selectMain.on("click", function () {
    $bgmMain.pause();
  });
});
