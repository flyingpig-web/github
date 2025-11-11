document.title = "거문고 알아보기"; // 제목

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

$(function () {
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

  // 모바일 세로 팝업 삽입
  $(".container").append(
    "<div class='mobile-pop'><p>모바일 가로모드로 변경해 주세요.</p></div>"
  );

  document.addEventListener("click", (event) => {
    // 드래그 실패 시 클릭 사운드 억제 확인
    if (window.suppressClickSound) {
      return;
    }

    // 드래그 가능한 요소나 드롭 영역에서는 효과음 재생하지 않음
    const target = event.target;
    const isDraggable = target.closest(
      ".piece, .in-tray, .droppable, .empty-slot, .ui-draggable, .ui-droppable, .drag-helper"
    );

    // 드래그 중이거나 드래그 관련 이벤트인지 확인
    const isDragging =
      target.classList.contains("dragging") ||
      target.closest(".dragging") ||
      event.target.closest(".ui-draggable-dragging");

    if (!isDraggable && !isDragging) {
      const btnClickEffect = new Audio("sound/sfx/ui_click_01.wav");
      btnClickEffect.play();
    }
  });

  const winWidth = window.innerWidth;
  const bgm = $("#bgm")[0];

  // .home 클래스 클릭 시 나레이션 한번만 실행
  let isNarrationPlayed = false;
  $(".home").on("click", function () {
    if (!isNarrationPlayed) {
      const narration = new Audio("sound/ch_01/ch1_01.mp3"); // TODO: 소스변경
      narration.play();
      isNarrationPlayed = true;
    }
  });

  if (winWidth > 1420) {
    // bgm

    if (bgm) {
      bgm.play();
    }

    // 인트로 재생
    if (intro) {
      intro.play();
    }

    var intro = $(".intro")[0];
    if (intro) {
      intro.play();
    }

    var activeBgm = $("#active")[0];
    if (activeBgm) {
      // var file = activeBgm.src;

      // activeBgm.onended = function() {
      //   $(".slider-wrap").addClass("active")
      // };

      // BGM 재생 시작
      activeBgm.play();
    }
  } else {
    let main = true;
    let select = true;
    $("body").click(function () {
      var intro = $(".intro")[0];
      if (intro && main == true) {
        intro.play();
        main = false;
      }

      if (main == true) {
        if (bgm) {
          bgm.play();
        }
        main = false;
      }

      if (select == true) {
        if (intro) {
          intro.play();
        }
        select = false;
      }

      var activeBgm = $("#active")[0];
      if (activeBgm) {
        // BGM 재생 시작
        activeBgm.play();
      }
    });
  }
  var effect = $("#effect")[0];
  if (effect) {
    effect.play();
  }

  document.querySelectorAll("img").forEach(function (img) {
    img.setAttribute("aria-hidden", "true");
    img.setAttribute("alt", "");
  });

  // role="button" 속성을 가진 요소에 hover 사운드 추가
  document.addEventListener("mouseover", (event) => {
    const target = event.target;
    const isRoleButton =
      target.getAttribute("role") === "button" ||
      target.classList.contains("ui-draggable") ||
      target.closest('[role="button"]');

    if (isRoleButton) {
      const hoverSound = new Audio("sound/sfx/ui_hover_01.wav");
      hoverSound.play();
    }
  });

  // 카드 확대 효과음

  $(".ktm-card").on("click", function () {
    const cardExpandEffect = new Audio("sound/sfx/card_expand_01.wav");
    const $card = $(this);
    const $cardOff = $(".ktm-card-off");

    // 효과음 재생
    cardExpandEffect.play();

    $card.hide();
    $cardOff.show();
    // setTimeout(() => {
    //   $cardOff.addClass("expanded");
    // }, 150);

    setTimeout(() => {
      window.location.href = "ktm.html";
    }, 3000);
  });
});
