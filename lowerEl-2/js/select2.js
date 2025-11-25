$(function () {
  const $upBtn = $(".up-btn");
  const $downBtn = $(".down-btn");
  const $finishBtn = $(".finish-btn");
  const $successBoard = $(".select-2-success");
  const $ktmWrapper = $(".ktm-wrapper");
  const $selectMain = $(".select-main-2");

  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmSuccess = $("#bgm-success")[0];

  bgmTutorial.play();
  setTimeout(() => {
    $selectMain.removeClass("pointer-none");
  }, 5000);

  $upBtn.on("click", function () {
    console.log("up");
  });

  $downBtn.on("click", function () {
    console.log("down");
  });

  $finishBtn.on("click", function () {
    console.log("finish");
    $successBoard.removeClass("display-none");
    $selectMain.addClass("pointer-none");
    bgmSuccess.play();

    setTimeout(() => {
      $successBoard.hide();
      $ktmWrapper.removeClass("display-none");
    }, 3000);
  });
});
