$(function () {
  const $tutorial = $(".dimmed.tutorial");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];

  bgmTutorial.play();

  $(".close").on("click", function () {
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
    const cardExpandEffect = new Audio("sound/sfx/card_expand_01.wav");
    const $card = $(this);
    const $cardOff = $(".ktm-card-off");

    // 효과음 재생
    cardExpandEffect.play();

    $card.hide();
    $cardOff.show();

    setTimeout(() => {
      window.location.href = "ktm.html";
    }, 3000);
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

  // targetSound
  const soundMap = {
    neck: { src: "ch2_07", isPlayed: false },
    body: { src: "ch2_08", isPlayed: false },
    jua: { src: "ch2_09", isPlayed: false },
    bow: { src: "ch2_10", isPlayed: false },
  };
  const effect = $("#effect")[0];

  const paintMap = {
    neck: "",
    body: "",
    jua: "",
    bow: "",
  };

  $targetNeck.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-neck.png");
    currentTarget = "neck";
    if (!soundMap[currentTarget].isPlayed) {
      $(`#${soundMap[currentTarget].src}`)[0].play();
      soundMap[currentTarget].isPlayed = true;
    }
  });
  $targetBody.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-body.png");
    currentTarget = "body";
    if (!soundMap[currentTarget].isPlayed) {
      $(`#${soundMap[currentTarget].src}`)[0].play();
      soundMap[currentTarget].isPlayed = true;
    }
  });
  $targetJua.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-jua.png");
    currentTarget = "jua";
    if (!soundMap[currentTarget].isPlayed) {
      $(`#${soundMap[currentTarget].src}`)[0].play();
      soundMap[currentTarget].isPlayed = true;
    }
  });
  $targetBow.on("click", function () {
    $targetMenu.attr("src", "img/select/haegeum/menu-bow.png");
    currentTarget = "bow";
    if (!soundMap[currentTarget].isPlayed) {
      $(`#${soundMap[currentTarget].src}`)[0].play();
      soundMap[currentTarget].isPlayed = true;
    }
  });

  $paintBlue.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    paintMap[currentTarget] = "blue";
    $(`#haegeum-${currentTarget}`).attr(
      "src",
      `img/select/haegeum/${currentTarget}-blue.png`
    );
    checkPaintMapComplete();
  });
  $paintPink.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    paintMap[currentTarget] = "pink";
    $(`#haegeum-${currentTarget}`).attr(
      "src",
      `img/select/haegeum/${currentTarget}-pink.png`
    );
    checkPaintMapComplete();
  });
  $paintGreen.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    paintMap[currentTarget] = "green";
    $(`#haegeum-${currentTarget}`).attr(
      "src",
      `img/select/haegeum/${currentTarget}-green.png`
    );
    checkPaintMapComplete();
  });
  $paintYellow.on("click", function () {
    effect.currentTime = 0;
    effect.play();
    paintMap[currentTarget] = "yellow";
    $(`#haegeum-${currentTarget}`).attr(
      "src",
      `img/select/haegeum/${currentTarget}-yellow.png`
    );
    checkPaintMapComplete();
  });

  const $select1Success = $(".select-1-success");
  const $successButton = $(".success-button");

  // paintMap이 모두 채워졌는지 확인하는 함수
  function checkPaintMapComplete() {
    const allParts = Object.values(paintMap);
    const isComplete = allParts.every((color) => color !== "");

    if (isComplete) {
      $select1Success.removeClass("display-none");
    }
  }

  $successButton.on("mousedown", function () {
    $successButton.attr("src", "img/select/haegeum/success-active.png");
  });

  $successButton.on("mouseup", function () {
    $successButton.attr("src", "img/select/haegeum/success.png");
  });

  $successButton.on("mouseleave", function () {
    $successButton.attr("src", "img/select/haegeum/success.png");
  });

  $successButton.on("click", function () {
    const queryParams = new URLSearchParams();
    for (const [part, color] of Object.entries(paintMap)) {
      queryParams.append(part, color);
    }
    window.location.href = `select2.html?${queryParams.toString()}`;
  });
});
