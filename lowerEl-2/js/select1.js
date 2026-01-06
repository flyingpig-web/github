$(function () {
  const $tutorial = $(".dimmed.tutorial");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];

  bgmTutorial.play();

  $tutorial.on("click", function () {
    bgmTutorial.pause();
    $tutorial.fadeOut(500);
    setTimeout(() => {
      $tutorial.hide();
      bgmMain.play();
    }, 500);

    setTimeout(() => {
      $(".select-main").removeClass("pointer-none");
    }, 3500);
  });

  // note 이미지 클릭 이벤트
  $(document).on("click", ".note img", function () {
    if (!gameStarted) return;

    // target-zone에서 클릭했는지 확인
    if (checkNoteInTargetZone(this)) {
      showTargetZoneEffect();

      // 효과음 재생
      if ($("#effect")[0]) {
        $("#effect")[0].play();
      }
    }
  });

  // 초기 콤보 이미지 숨김
  $(".combo1, .combo2, .combo3").hide();

  $(".ktm-card").on("click", function () {
    const cardExpandEffect = new Audio("sound/sfx/card_open_01.wav");
    const $card = $(this);
    const $cardOff = $(".ktm-card-off");

    // 흔들기 애니메이션 추가
    $card.addClass("shaking");

    // 효과음 재생
    cardExpandEffect.play();

    // 애니메이션이 끝난 후 카드 전환
    setTimeout(() => {
      $card.removeClass("shaking");
      $card.hide();
      $cardOff.show();
    }, 800); // shake 애니메이션 시간과 동일

    setTimeout(() => {
      window.location.href = "ktm.html";
    }, 1400);
  });

  const $targetNeck = $("#target-neck");
  const $targetBody = $("#target-body");
  const $targetJua = $("#target-jua");
  const $targetBow = $("#target-bow");
  const $targetMenu = $("#target-menu");
  var currentTarget = "neck"; // neck, body, jua, bow

  // paints
  const $paintBlue = $("#paint-blue");
  const $paintPink = $("#paint-pink");
  const $paintGreen = $("#paint-green");
  const $paintYellow = $("#paint-yellow");
  const $paintLavander = $("#paint-lavander");
  const $paintNone = $("#paint-none");

  // targetSound
  const soundMap = {
    neck: { src: "ch2_07" },
    body: { src: "ch2_08" },
    jua: { src: "ch2_09" },
    bow: { src: "ch2_10" },
  };
  const effect = $("#effect")[0];

  // paintMap: 페인트 색상 저장, 다음페이지로 넘어가기 전에 모든 페인트가 채워져 있는지 확인, 다음페이지에 전달할 색상 데이터
  const paintMap = {
    neck: "",
    body: "",
    jua: "",
    bow: "",
  };

  $targetNeck.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-neck.png");
    currentTarget = "neck";
    $(`#${soundMap[currentTarget].src}`)[0].play();
  });
  $targetBody.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-body.png");
    currentTarget = "body";
    $(`#${soundMap[currentTarget].src}`)[0].play();
  });
  $targetJua.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-jua.png");
    currentTarget = "jua";
    $(`#${soundMap[currentTarget].src}`)[0].play();
  });
  $targetBow.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-bow.png");
    currentTarget = "bow";
    $(`#${soundMap[currentTarget].src}`)[0].play();
  });

  const filterPalette = {
    blue: "brightness(2) sepia(1) saturate(500%) hue-rotate(175deg)", // #6ec9ff - 밝은 청록색
    pink: "brightness(2.5) sepia(1) saturate(284%) hue-rotate(284deg)", // #ff9eb5 - 연한 분홍
    green: "brightness(2) sepia(1) saturate(300%) hue-rotate(40deg)", // #b9f26d - 밝은 연두
    yellow: "brightness(2) sepia(1) saturate(520%) hue-rotate(10deg)", // #ffd76d - 밝은 노랑
    lavander: "brightness(1.5) sepia(1) saturate(300%) hue-rotate(250deg)", // #d59fff - 연한 보라색
    none: "none",
  };

  function toggleLeftBoxEffect() {
    $(".left-box-effect").toggleClass("display-none");
    setTimeout(() => {
      $(".left-box-effect").toggleClass("display-none");
    }, 1000);
  }

  $paintBlue.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    toggleLeftBoxEffect();
    paintMap[currentTarget] = "blue";
    $(`#haegeum-${currentTarget}`).css("filter", filterPalette.blue);
    checkPaintMapComplete();
  });
  $paintPink.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    toggleLeftBoxEffect();
    paintMap[currentTarget] = "pink";
    $(`#haegeum-${currentTarget}`).css("filter", filterPalette.pink);
    checkPaintMapComplete();
  });
  $paintGreen.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    toggleLeftBoxEffect();
    paintMap[currentTarget] = "green";
    $(`#haegeum-${currentTarget}`).css("filter", filterPalette.green);
    checkPaintMapComplete();
  });
  $paintYellow.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    toggleLeftBoxEffect();
    paintMap[currentTarget] = "yellow";
    $(`#haegeum-${currentTarget}`).css("filter", filterPalette.yellow);
    checkPaintMapComplete();
  });
  $paintLavander.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    toggleLeftBoxEffect();
    paintMap[currentTarget] = "lavander";
    $(`#haegeum-${currentTarget}`).css("filter", filterPalette.lavander);
    checkPaintMapComplete();
  });

  $paintNone.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    toggleLeftBoxEffect();
    paintMap[currentTarget] = "none";
    $(`#haegeum-${currentTarget}`).css("filter", filterPalette.none);
    checkPaintMapComplete();
  });

  const $select1Success = $(".select-1-success");
  const $successButton = $(".success-button");
  const $select1ConfirmWrapper = $(".select-1-confirm-wrapper");
  const $confirmPopupConfirm = $(".confirm-popup-confirm");
  const $confirmPopupCancel = $(".confirm-popup-cancel");

  // paintMap이 모두 채워졌는지 확인하는 함수
  function checkPaintMapComplete() {
    const allParts = Object.values(paintMap);
    const isComplete = allParts.every((color) => color !== "");

    if (isComplete) {
      $select1Success.removeClass("display-none");
    }
  }

  $successButton.on("click", function () {
    $select1ConfirmWrapper.removeClass("display-none");
  });

  $confirmPopupConfirm.on("click", function () {
    const queryParams = new URLSearchParams();
    for (const [part, color] of Object.entries(paintMap)) {
      queryParams.append(part, color);
    }
    window.location.href = `select2.html?${queryParams.toString()}`;
  });

  $confirmPopupCancel.on("click", function () {
    $select1ConfirmWrapper.addClass("display-none");
  });
});
