$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorialBg = $(".dimmed.tutorial-bg-2");
  const $container = $(".container");

  // sounds
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];

  $info1.on("click", function () {
    $info1.hide();
    $tutorialBg.removeClass("display-none");
    $bgmTutorial.play();
  });

  $(".close").on("click", function () {
    $bgmTutorial.pause();
    $tutorialBg.fadeOut(500);
    setTimeout(() => {
      $tutorialBg.hide();
      $bgmMain.play();
      $container.addClass("pointer-none");
    }, 500);

    setTimeout(() => {
      $container.removeClass("pointer-none");
      startGame();
    }, 9000);
  });

  function startGame() {
    console.log("startGame");
    $container.addClass("cursor-change");
    activateCursor();
  }

  function activateCursor() {
    const cursor = document.getElementById("custom-cursor");

    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
  }

  function deactivateCursor() {
    const cursor = document.getElementById("custom-cursor");
    cursor.style.display = "none";
    document.removeEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
    $container.removeClass("cursor-change");
  }
});
