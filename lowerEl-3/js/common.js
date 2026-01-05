document.title = "종묘제례악";

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
      const narration = $(".intro")[0];
      narration.play();
      isNarrationPlayed = true;
    }
  });

  document.querySelectorAll("img").forEach(function (img) {
    img.setAttribute("aria-hidden", "true");
    img.setAttribute("alt", "");
  });

  // 버튼 호버 효과음 (사운드 겹침 방지)
  var btnHoverEffect = new Audio("sound/sfx/ui_hover_01.wav");
  $(".btn-effect").on("mouseover", function () {
    if (btnHoverEffect.paused || btnHoverEffect.ended) {
      btnHoverEffect.currentTime = 0;
      btnHoverEffect.play();
    }
  });

  // role="button"이면서 data-hover-image 속성을 가진 요소의 hover 이미지 교체
  $('[role="button"][data-hover-image]').on("mouseenter", function () {
    const $this = $(this);
    const hoverImage = $this.attr("data-hover-image");
    const originalImage = $this.attr("src");

    // 원본 이미지를 data 속성에 저장
    $this.data("original-image", originalImage);
    // hover 이미지로 교체
    $this.attr("src", hoverImage);
  });

  $('[role="button"][data-hover-image]').on("mouseleave", function () {
    const $this = $(this);
    const originalImage = $this.data("original-image");

    // 원본 이미지로 복원
    if (originalImage) {
      $this.attr("src", originalImage);
    }
  });

  // ========== ktm.html에서 뒤로가기 후 ktm-wrapper fadeIn 처리 ==========
  // ktm.html에서 뒤로가기 클릭 시에만 작동하는 특수 처리
  function checkKtmBackReturn() {
    const fromKtmBack = sessionStorage.getItem("fromKtmBack");
    if (fromKtmBack === "true") {
      const $ktmWrapper = $(".ktm-wrapper");
      if ($ktmWrapper.length > 0) {
        // ktm-wrapper가 존재하면 fadeIn
        $ktmWrapper.fadeIn(500);
      }
      // 플래그 제거 (한 번만 실행)
      sessionStorage.removeItem("fromKtmBack");
    }
  }

  // 페이지 로드 시 체크
  checkKtmBackReturn();

  $(".ktm-card").on("click", function () {
    const cardExpandEffect = new Audio("sound/sfx/card_open_01.wav");
    const $card = $(this);
    const $cardOff = $(".ktm-card-off");

    // 흔들기 애니메이션 추가
    $card.addClass("shaking");

    // 효과음 재생
    cardExpandEffect.play();

    // 애니메이션이 끝난 후 카드 전환
    setTimeout(() => {
      $card.removeClass("shaking");
      $card.hide();
      $cardOff.show();
    }, 800); // shake 애니메이션 시간과 동일

    setTimeout(() => {
      window.location.href = "ktm.html";
    }, 1400);
  });
});
