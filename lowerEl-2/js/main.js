$(function () {
  // 현재 재생중인 나레이션 관리
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

  // 선택 버튼 1, 2 이벤트 설정
  handleSelectButtonClick(
    $(".btn-select-01"),
    "select1.html",
    "sound/dubs/ch2_03.mp3"
  );
  handleSelectButtonClick(
    $(".btn-select-02"),
    "select2.html",
    "sound/dubs/ch2_04.mp3"
  );
  handleSelectButtonClick(
    $(".btn-select-03"),
    "ktm.html",
    "sound/dubs/ch2_04a.mp3"
  );
});
