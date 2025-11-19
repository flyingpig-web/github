document.title = "민속음악 알기";

$(function () {
  // 모바일 세로 팝업 삽입
  $(".container").append(
    "<div class='mobile-pop'><p>모바일 가로모드로 변경해 주세요.</p></div>"
  );

  // 클릭 효과음 - 특정 버튼 요소들에만 적용
  const btnClickEffect = new Audio("sound/sfx/ui_click_01.wav");

  // role="button" 속성을 가진 요소들에만 클릭 사운드 적용
  $(document).on(
    "click",
    '[role="button"], button, .btn, .btn-effect',
    function (event) {
      // 드래그앤드롭 관련 이벤트는 제외
      if (!$(this).hasClass("piece") && !$(this).hasClass("dragging")) {
        btnClickEffect.currentTime = 0; // 사운드 처음부터 재생
        btnClickEffect.play();
      }
    }
  );

  // .home 클래스 클릭 시 나레이션 한번만 실행
  let isNarrationPlayed = false;
  $(".home").on("click", function () {
    if (!isNarrationPlayed) {
      const narration = new Audio("sound/dubs/yu2_01.mp3");
      narration.play();
      isNarrationPlayed = true;
    }
  });

  document.querySelectorAll("img").forEach(function (img) {
    img.setAttribute("aria-hidden", "true");
    img.setAttribute("alt", "");
  });

  // 버튼 호버 효과음
  var btnHoverEffect = new Audio("sound/sfx/ui_hover_01.wav");
  $(".btn-effect").on("mouseover", function () {
    btnHoverEffect.play();
  });

  function downloadPDF() {
    const link = document.createElement("a");
    link.href = "files/pdf/yu-2.pdf";
    link.download = "덩실덩실 한가위.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  $(".download-btn").on("click", function () {
    downloadPDF();
  });
});
