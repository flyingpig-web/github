$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorial = $(".dimmed.tutorial");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];

  $info1.on("click", function () {
    console.log("sdfa");
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
      $(".select-main").removeClass("pointer-none");
      // }, 7000);
    }, 1000);
  });
});
