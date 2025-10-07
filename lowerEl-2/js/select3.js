$(function () {
  const $info1 = $(".dimmed.info-1");
  const $selectMain = $(".select-main-3");
  const $tutorial = $(".tutorial-3");
  const $close = $(".close");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];

  $info1.on("click", function () {
    $info1.hide();
    $tutorial.removeClass("display-none");
    bgmTutorial.play();
    setTimeout(() => {
      $tutorial.removeClass("pointer-none");
    }, 7000);
  });

  $close.on("click", function () {
    $tutorial.fadeOut(500);
    bgmTutorial.pause();
    bgmMain.play();
    setTimeout(() => {
      $selectMain.removeClass("pointer-none");
    }, 5000);
  });

  const plays = [
    $("#mi")[0],
    $("#ra")[0],
    $("#mi")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#mi")[0],
    $("#ra")[0],
    $("#mi")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#high-do")[0],
    $("#si")[0],
    $("#high-do")[0],
    $("#si")[0],
    $("#ra")[0],
    $("#ra")[0],
    $("#high-mi")[0],
    $("#high-do")[0],
    $("#high-mi")[0],
  ];

  let playIndex = 0;

  const play = new Audio(plays[playIndex]);

  // data-index와 playIndex가 같으면 sound-card 의 height를 100%로 변경
  $(".select-3-bow-wrapper").on("click", function () {
    $(".select-3-bow").css("transform", "rotate(0deg)");
  });

  $(".select-3-arrow").on("click", function () {
    $(".select-3-arrow").css("transform", "rotate(0deg)");
  });
});
