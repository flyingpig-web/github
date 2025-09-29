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

  $select3Player.on("click", function () {
    $select3Player.addClass("display-none");
    $select3Cursor.addClass("display-none");
    $select3PlayerActive.removeClass("display-none");
    $select3Jio.removeClass("display-none");

    $mainBgm.play();
    $select3Moktui.removeClass("display-none");
    $select3NoteWrapper.removeClass("display-none");
    $select3Bak.addClass("display-none");
    $select3BakActive.removeClass("display-none");
    $select3Chae.removeClass("display-none");

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
