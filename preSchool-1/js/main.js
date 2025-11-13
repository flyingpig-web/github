$(function () {
  // 현재 재생중인 나레이션 관리
  let currentNarration = null;

  setTimeout(() => {
    const $homeMain = $(".home-main");
    $homeMain.removeClass("pointer-none");
  }, 3000);

  // 선택 버튼 마우스오버/리브 이벤트 처리 함수
  function handleSelectButtonHover($button, pageUrl, narrationUrl) {
    // 버튼에 transition 스타일 추가
    $button.css({
      transition: "scale 0.3s ease",
    });

    // 마우스 오버 시 나레이션 재생 및 scale 애니메이션
    $button.on("mouseenter", function () {
      // 기존 재생중인 나레이션이 있다면 중지
      if (currentNarration) {
        currentNarration.pause();
        currentNarration.currentTime = 0;
      }

      // 새로운 나레이션 재생
      currentNarration = new Audio(narrationUrl);
      currentNarration.play();

      // scale 애니메이션
      $(this).css("scale", "1.1");
    });

    // 마우스 리브 시 나레이션 정지 및 scale 복원
    $button.on("mouseleave", function () {
      if (currentNarration) {
        currentNarration.pause();
        currentNarration.currentTime = 0;
      }

      // scale 복원
      $(this).css("scale", "1");
    });

    // 클릭 시 페이지 이동 (링크 기본 기능 사용)
    $button.on("click", function (e) {
      window.location.href = pageUrl;
    });
  }

  // 선택 버튼 1, 2 이벤트 설정
  handleSelectButtonHover(
    $(".select-1"),
    "select1.html",
    "sound/dubs/Yu1_03.mp3"
  );
  handleSelectButtonHover(
    $(".select-2"),
    "select2.html",
    "sound/dubs/Yu1_04.mp3"
  );
});
