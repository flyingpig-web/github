$(function () {
  // 현재 재생중인 나레이션 관리
  let currentNarration = null;

  // 선택 버튼 마우스오버/리브 이벤트 처리 함수
  function handleSelectButtonHover($button, pageUrl, narrationUrl) {
    // 마우스 오버 시 나레이션 재생
    $button.on("mouseenter", function () {
      // 기존 재생중인 나레이션이 있다면 중지
      if (currentNarration) {
        currentNarration.pause();
        currentNarration.currentTime = 0;
      }

      // 새로운 나레이션 재생
      currentNarration = new Audio(narrationUrl);
      currentNarration.play();
    });

    // 마우스 리브 시 나레이션 정지
    $button.on("mouseleave", function () {
      if (currentNarration) {
        currentNarration.pause();
        currentNarration.currentTime = 0;
      }
    });

    // 클릭 시 페이지 이동 (링크 기본 기능 사용)
    $button.on("click", function (e) {
      window.location.href = pageUrl;
    });
  }

  // 선택 버튼 1, 2, 3 이벤트 설정
  handleSelectButtonHover(
    $(".btn-select-01"),
    "select_01.html",
    "sound/ch_01/ch1_02.mp3"
  );
  handleSelectButtonHover(
    $(".btn-select-02"),
    "select_03.html",
    "sound/ch_01/ch1_03.mp3"
  );
  handleSelectButtonHover(
    $(".btn-select-03"),
    "ktm.html",
    "sound/ch_01/ch1_03a.mp3"
  );
});
