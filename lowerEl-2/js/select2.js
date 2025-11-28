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

  const filterPalette = {
    blue: "brightness(2) sepia(1) saturate(500%) hue-rotate(175deg)", // #6ec9ff - 밝은 청록색
    pink: "brightness(2.5) sepia(1) saturate(284%) hue-rotate(284deg)", // #ff9eb5 - 연한 분홍
    green: "brightness(2) sepia(1) saturate(300%) hue-rotate(40deg)", // #b9f26d - 밝은 연두
    yellow: "brightness(2) sepia(1) saturate(520%) hue-rotate(10deg)", // #ffd76d - 밝은 노랑
  };

  // URL 쿼리 파라미터에서 색상 정보 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const paintMap = {
    neck: urlParams.get("neck"),
    body: urlParams.get("body"),
    jua: urlParams.get("jua"),
    bow: urlParams.get("bow"),
  };

  // 초기 색상 필터 적용
  function applyInitialFilters() {
    if (paintMap.neck && filterPalette[paintMap.neck]) {
      $("#haegeum-neck").css("filter", filterPalette[paintMap.neck]);
    }
    if (paintMap.body && filterPalette[paintMap.body]) {
      $("#haegeum-body").css("filter", filterPalette[paintMap.body]);
    }
    if (paintMap.jua && filterPalette[paintMap.jua]) {
      $("#haegeum-jua").css("filter", filterPalette[paintMap.jua]);
    }
    if (paintMap.bow && filterPalette[paintMap.bow]) {
      $("#haegeum-bow").css("filter", filterPalette[paintMap.bow]);
    }
  }

  // 페이지 로드 시 필터 적용
  applyInitialFilters();

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

    // 이미지 변경 후 필터 다시 적용 (이미지 src 변경 시 필터가 유지되도록)
    applyInitialFilters();
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
