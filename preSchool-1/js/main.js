$(function () {
  setTimeout(() => {
    const $homeMain = $(".home-main");
    $homeMain.removeClass("pointer-none");
  }, 2000);

  let currentNarration = null;

  // 선택 버튼 클릭 이벤트 처리 함수
  function handleSelectButtonClick($button, pageUrl, narrationUrl) {
    $button.on("click", function (e) {
      e.preventDefault();
      if ($button.hasClass("active")) {
        window.location.href = pageUrl;
        $button.removeClass("active");
      } else {
        $(".btn-select").removeClass("active");
        $button.addClass("active");

        // 기존 재생중인 나레이션이 있다면 중지
        if (currentNarration) {
          currentNarration.pause();
          currentNarration.currentTime = 0;
        }

        // 새로운 나레이션 재생
        currentNarration = new Audio(narrationUrl);
        currentNarration.play();
      }
    });
  }

  const $select1 = $(".select-1");
  const $select2 = $(".select-2");

  // 선택 버튼 1, 2 이벤트 설정
  handleSelectButtonClick($select1, "select1.html", "sound/dubs/Yu1_03.mp3");
  handleSelectButtonClick($select2, "select2.html", "sound/dubs/Yu1_04.mp3");
});
