$(function () {
  const $select3Player = $("#select-3-player");
  const $select3PlayerActive = $("#select-3-player-active");
  const $select3Cursor = $("#select-3-cursor");
  const $select3Bak = $("#select-3-bak");
  const $select3BakActive = $("#select-3-bak-active");
  const $select3Moktui = $("#select-3-moktui");
  const $select3Chae = $("#select-3-chae");
  const $select3NoteWrapper = $(".select-3-note-wrapper");
  const $select3Jio = $("#select-3-jio");
  const $mainBgm = $("#main-bgm")[0];
  const $successBgm = $("#success-bgm")[0];
  const $select3Success = $(".select-3-success");
  const $ktmWrapper = $(".ktm-wrapper");
  const $ch315 = $("#ch3-15")[0];

  function bakToggle() {
    $select3Bak.toggleClass("display-none");
    $select3BakActive.toggleClass("display-none");
  }
  function bakInteraction() {
    setTimeout(() => bakToggle(), 2500);
    setTimeout(() => bakToggle(), 3000);
    setTimeout(() => bakToggle(), 3500);
    setTimeout(() => bakToggle(), 4000);
    setTimeout(() => bakToggle(), 4400);
    setTimeout(() => bakToggle(), 4900);
  }

  function moktuiInteraction() {
    // 2.9초에 첫 번째 애니메이션
    setTimeout(() => {
      $select3Moktui.removeClass("moktui-rotate");
      setTimeout(() => $select3Moktui.addClass("moktui-rotate"), 10);
    }, 2900);

    // 3.9초에 두 번째 애니메이션
    setTimeout(() => {
      $select3Moktui.removeClass("moktui-rotate");
      setTimeout(() => $select3Moktui.addClass("moktui-rotate"), 10);
    }, 3800);

    // 4.9초에 세 번째 애니메이션
    setTimeout(() => {
      $select3Moktui.removeClass("moktui-rotate");
      setTimeout(() => $select3Moktui.addClass("moktui-rotate"), 10);
    }, 4700);

    // 5.9초에 애니메이션 클래스 제거
    setTimeout(() => {
      $select3Moktui.removeClass("moktui-rotate");
    }, 5900);
  }

  function chaeInteraction() {
    setTimeout(() => {
      $select3Chae.toggleClass("chae-play");
    }, 3000);
    setTimeout(() => {
      $select3Chae.toggleClass("chae-play");
    }, 4200);
    setTimeout(() => {
      $select3Chae.toggleClass("chae-play");
    }, 4210);
    setTimeout(() => {
      $select3Chae.toggleClass("chae-play");
    }, 5400);
    setTimeout(() => {
      $select3Chae.toggleClass("chae-play");
    }, 5410);
  }

  $select3Player.on("click", function () {
    $select3Player.addClass("display-none");
    $select3Cursor.addClass("display-none");
    $select3PlayerActive.removeClass("display-none");
    $select3Jio.removeClass("display-none");

    $mainBgm.play();
    $select3Moktui.removeClass("display-none");
    $select3NoteWrapper.removeClass("display-none");
    $select3Chae.removeClass("display-none");

    // bak interaction
    bakInteraction();

    // moktui interaction
    moktuiInteraction();

    // chae interaction
    chaeInteraction();

    setTimeout(() => {
      $select3Success.removeClass("display-none").fadeIn(500);
      $successBgm.play();
    }, 7000);

    setTimeout(() => {
      $select3Success.addClass("display-none");
      $ktmWrapper.removeClass("display-none").fadeIn(500);
      $ktmWrapper.addClass("pointer-none");
      $ch315.play();
    }, 10000);

    setTimeout(() => {
      $ktmWrapper.removeClass("pointer-none");
    }, 14000);
  });
});
