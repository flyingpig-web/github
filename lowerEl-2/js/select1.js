$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorial = $(".dimmed.tutorial");

  // sounds
  const bgmTutorial = $("#bgm-tutorial")[0];
  const bgmMain = $("#bgm-main")[0];

  $info1.on("click", function () {
    $info1.hide();
    $tutorial.removeClass("display-none");
    bgmTutorial.play();
  });

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
});
