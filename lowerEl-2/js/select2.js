$(function () {
  const $btnLeft = $(".btn-left");
  const $btnRight = $(".btn-right");
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

  let haegeumAngle = 0;

  // 해금 이미지 업데이트 함수
  function updateHaegeumImages(angle) {
    $("#haegeum-outline").attr(
      "src",
      `img/select/2/outline/outline-${angle}-deg.png`
    );
    $("#haegeum-body").attr("src", `img/select/2/body/body-${angle}-deg.png`);
    $("#haegeum-neck").attr("src", `img/select/2/neck/neck-${angle}-deg.png`);
    $("#haegeum-bow").attr("src", `img/select/2/bow/bow-${angle}-deg.png`);
    $("#haegeum-jua").attr("src", `img/select/2/jua/jua-${angle}-deg.png`);
    $("#haegeum-line").attr("src", `img/select/2/line/line-${angle}-deg.png`);
  }

  // 왼쪽 버튼: 각도 감소 (반시계 방향)
  $btnLeft.on("click", function () {
    haegeumAngle -= 45;
    // 0도 미만이면 315도로 순환
    if (haegeumAngle < 0) {
      haegeumAngle = 315;
    }
    updateHaegeumImages(haegeumAngle);
  });

  // 오른쪽 버튼: 각도 증가 (시계 방향)
  $btnRight.on("click", function () {
    haegeumAngle += 45;
    // 315도를 넘으면 0도로 순환
    if (haegeumAngle > 315) {
      haegeumAngle = 0;
    }
    updateHaegeumImages(haegeumAngle);
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
