$(function () {
  // ========== 상수 및 설정 ==========
  const CONFIG = {
    TOTAL_CARDS: 6,
    CARD_GAP_PERCENT: 32, // 카드 너비 30% + 갭 2%
    INITIAL_TRANSLATE_X: 35,
    THUMB_WIDTH_PERCENT: 4,
    MOVE_THRESHOLD: 5,
    SWIPE_THRESHOLD: 15,
    TAP_THRESHOLD: 50,
    CLICK_TIME_LIMIT: 300,
  };

  // ========== 전역 상태 변수 ==========
  let currentIndex = 0;
  let currentNarration = null;

  // 슬라이더 드래그 상태
  let isDragging = false;
  let dragStartX = 0;

  // 카드 스와이프 상태
  let cardIsSwiping = false;
  let swipeStartX = 0;
  let swipeStartY = 0;

  // 카드 인터랙션 상태
  let interactionState = {
    isMouseDown: false,
    isTouchActive: false,
    startTime: 0,
    hasMoved: false,
    startX: 0,
    startY: 0,
  };

  // 카드 뒤집기 상태 관리
  let flippedCards = new Set(); // 뒤집힌 카드들의 인덱스를 저장

  // ========== DOM 요소 캐싱 ==========
  const elements = {
    $cardsWrapper: $(".ktm-cards-wrapper"),
    $sliderThumb: $(".slider-thumb"),
    $sliderTrack: $(".slider-track"),
    $popupOverlay: $(".ktm-popup-overlay"),
    $popupCard: $(".ktm-popup-card"),
    $infoPopup: $(".ktm-info-popup"),
    $body: $("body"),
  };

  // ========== 오디오 객체 ==========
  const sounds = {
    cardOpen: new Audio("sound/sfx/card_open_01.wav"),
    popupOpen: new Audio("sound/sfx/popup_open_01.wav"),
  };

  // ========== 유틸리티 함수 ==========
  function getEventCoordinates(e) {
    const isTouch = e.type.includes("touch");
    return {
      x: isTouch ? e.touches[0].clientX : e.clientX,
      y: isTouch ? e.touches[0].clientY : e.clientY,
    };
  }

  function getEventEndCoordinates(e) {
    const isTouch = e.type.includes("touch");
    if (isTouch && e.changedTouches && e.changedTouches[0]) {
      return {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };
    }
    return {
      x: e.clientX || swipeStartX,
      y: e.clientY || swipeStartY,
    };
  }

  function calculateDistance(x1, y1, x2, y2) {
    return {
      deltaX: Math.abs(x2 - x1),
      deltaY: Math.abs(y2 - y1),
    };
  }

  function isValidIndex(index) {
    return index >= 0 && index < CONFIG.TOTAL_CARDS;
  }

  function preventTextSelection() {
    elements.$body.css("user-select", "none");
  }

  function restoreTextSelection() {
    elements.$body.css("user-select", "");
  }

  // ========== 내레이션 관리 ==========
  function playNarration(narrationUrl) {
    stopCurrentNarration();
    currentNarration = new Audio(narrationUrl);
    currentNarration.play();
  }

  function stopCurrentNarration() {
    if (currentNarration) {
      currentNarration.pause();
      currentNarration.currentTime = 0;
      currentNarration = null;
    }
  }

  // ========== 카드 위치 업데이트 ==========
  function updateCardPosition() {
    const translateX =
      CONFIG.INITIAL_TRANSLATE_X - currentIndex * CONFIG.CARD_GAP_PERCENT;
    elements.$cardsWrapper.css("transform", `translateX(${translateX}%)`);
    updateSliderThumb();
  }

  function updateSliderThumb() {
    const thumbPosition = (currentIndex / (CONFIG.TOTAL_CARDS - 1)) * 100;
    elements.$sliderThumb.css(
      "left",
      `calc(${thumbPosition}% - ${CONFIG.THUMB_WIDTH_PERCENT}%)`
    );
  }

  // ========== 카드 네비게이션 ==========
  function navigateToCard(newIndex) {
    if (isValidIndex(newIndex) && newIndex !== currentIndex) {
      stopCurrentNarration();
      currentIndex = newIndex;
      updateCardPosition();
    }
  }

  function navigatePrevious() {
    if (currentIndex > 0) {
      navigateToCard(currentIndex - 1);
    }
  }

  function navigateNext() {
    if (currentIndex < CONFIG.TOTAL_CARDS - 1) {
      navigateToCard(currentIndex + 1);
    }
  }

  // ========== 카드 뒤집기 관리 ==========
  function flipCard($card) {
    const cardIndex = parseInt($card.data("index"));
    const $img = $card.find("img");
    const originalSrc = $card.data("original-src");
    const cardOffSrc = "img/common/ktm_card_off.png";

    // 뒤집기 애니메이션 시작
    $card.addClass("flipping");

    // 애니메이션 중간 지점에서 이미지 변경
    setTimeout(() => {
      if (flippedCards.has(cardIndex)) {
        // 이미 뒤집힌 카드 -> 뒤집기 해제 (뒷면으로)
        $img.attr("src", cardOffSrc);
        flippedCards.delete(cardIndex);
        $card.removeClass("flipped");
      } else {
        // 뒤집히지 않은 카드 -> 뒤집기 (앞면으로)
        $img.attr("src", originalSrc);
        flippedCards.add(cardIndex);
        $card.addClass("flipped");
      }
    }, 300); // 애니메이션의 중간 지점

    // 애니메이션 완료 후 클래스 제거
    setTimeout(() => {
      $card.removeClass("flipping");
    }, 600);

    // 효과음 재생
    sounds.cardOpen.play();
  }

  function isCardFlipped($card) {
    const cardIndex = parseInt($card.data("index"));
    return flippedCards.has(cardIndex);
  }

  // ========== 팝업 관리 ==========
  function openCardPopup($card) {
    // 뒤집힌 카드만 팝업 열기 가능
    if (!isCardFlipped($card)) {
      return;
    }

    const originalSrc = $card.data("original-src");
    const narrationUrl = $card.data("narration");

    stopCurrentNarration();

    // 팝업 표시
    elements.$popupCard.find("img").attr("src", originalSrc);
    elements.$popupOverlay.css("display", "flex");

    // 효과음 재생
    sounds.popupOpen.play();

    // 애니메이션
    setTimeout(() => {
      elements.$popupCard.addClass("show");
    }, 150);
    setTimeout(() => {
      playNarration(narrationUrl);
    }, 1000);
  }

  function closePopup() {
    stopCurrentNarration();
    elements.$popupCard.removeClass("show");
    setTimeout(() => {
      elements.$popupOverlay.hide();
    }, 300);
  }

  function openInfoPopup() {
    stopCurrentNarration();
    sounds.popupOpen.play();
    elements.$infoPopup.css("display", "flex");
  }

  function closeInfoPopup() {
    elements.$infoPopup.hide();
  }

  // ========== 상호작용 상태 관리 ==========
  function resetInteractionState() {
    interactionState = {
      isMouseDown: false,
      isTouchActive: false,
      startTime: 0,
      hasMoved: false,
      startX: 0,
      startY: 0,
    };
  }

  function initializeInteraction(e, isTouch = false) {
    const coords = getEventCoordinates(e);
    interactionState = {
      isMouseDown: !isTouch,
      isTouchActive: isTouch,
      startTime: Date.now(),
      hasMoved: false,
      startX: coords.x,
      startY: coords.y,
    };

    // 스와이프 변수도 설정
    if (!cardIsSwiping) {
      swipeStartX = coords.x;
      swipeStartY = coords.y;
    }
  }

  function handleMove(e) {
    const coords = getEventCoordinates(e);
    const { deltaX, deltaY } = calculateDistance(
      interactionState.startX,
      interactionState.startY,
      coords.x,
      coords.y
    );

    // 움직임 감지
    if (deltaX > CONFIG.MOVE_THRESHOLD || deltaY > CONFIG.MOVE_THRESHOLD) {
      interactionState.hasMoved = true;

      // 스와이프 시작 조건
      if (
        deltaX > deltaY &&
        deltaX > CONFIG.SWIPE_THRESHOLD &&
        !cardIsSwiping
      ) {
        cardIsSwiping = true;
        swipeStartX = interactionState.startX;
        swipeStartY = interactionState.startY;
        preventTextSelection();
      }
    }
  }

  function handleEnd(e) {
    const duration = Date.now() - interactionState.startTime;
    const isQuickTap =
      duration < CONFIG.CLICK_TIME_LIMIT && !interactionState.hasMoved;

    if (isQuickTap && !cardIsSwiping) {
      return true; // 클릭으로 처리
    }

    restoreTextSelection();
    return false;
  }

  // ========== 스와이프 처리 ==========
  function handleSwipeEnd(e) {
    if (!cardIsSwiping) return;

    cardIsSwiping = false;
    const endCoords = getEventEndCoordinates(e);
    const deltaX = endCoords.x - swipeStartX;
    const deltaY = endCoords.y - swipeStartY;

    // 수평 스와이프 판정
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > CONFIG.TAP_THRESHOLD
    ) {
      stopCurrentNarration();

      if (deltaX > 0) {
        navigatePrevious();
      } else {
        navigateNext();
      }
    }
  }

  // ========== 슬라이더 드래그 처리 ==========
  function handleSliderDragStart(e) {
    e.preventDefault();
    isDragging = true;
    dragStartX = e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
    preventTextSelection();
  }

  function handleSliderDrag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const currentX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
    const deltaX = currentX - dragStartX;
    const trackWidth = elements.$sliderTrack.width();
    const movePercent = (deltaX / trackWidth) * 100;

    let newThumbPercent =
      (currentIndex / (CONFIG.TOTAL_CARDS - 1)) * 100 + movePercent;
    newThumbPercent = Math.max(0, Math.min(newThumbPercent, 100));

    elements.$sliderThumb.css(
      "left",
      `calc(${newThumbPercent}% - ${CONFIG.THUMB_WIDTH_PERCENT}%)`
    );
  }

  function handleSliderDragEnd() {
    if (!isDragging) return;

    isDragging = false;
    restoreTextSelection();

    const thumbLeft = parseFloat(elements.$sliderThumb.css("left"));
    const trackWidth = elements.$sliderTrack.width();
    const thumbPercent =
      ((thumbLeft + (trackWidth * CONFIG.THUMB_WIDTH_PERCENT) / 100) /
        trackWidth) *
      100;
    const newIndex = Math.round(
      (thumbPercent / 100) * (CONFIG.TOTAL_CARDS - 1)
    );

    navigateToCard(Math.max(0, Math.min(newIndex, CONFIG.TOTAL_CARDS - 1)));
  }

  // ========== 이벤트 바인딩 ==========
  function bindCardEvents() {
    // 카드 클릭 (데스크톱)
    $(".ktm-card-item").on("click", function (e) {
      e.preventDefault();
      const $card = $(this);

      if (isCardFlipped($card)) {
        // 뒤집힌 카드 클릭 시 팝업 열기
        openCardPopup($card);
      } else {
        // 뒤집히지 않은 카드 클릭 시 뒤집기
        flipCard($card);
      }
    });

    // 카드 마우스 이벤트
    $(".ktm-card-item").on("mousedown", function (e) {
      e.preventDefault();
      initializeInteraction(e, false);
    });

    // 카드 터치 이벤트
    $(".ktm-card-item").on("touchstart", function (e) {
      initializeInteraction(e, true);
    });

    $(".ktm-card-item").on("touchend", function (e) {
      if (handleEnd(e)) {
        e.preventDefault();
        const $card = $(this);

        if (isCardFlipped($card)) {
          // 뒤집힌 카드 터치 시 팝업 열기
          openCardPopup($card);
        } else {
          // 뒤집히지 않은 카드 터치 시 뒤집기
          flipCard($card);
        }
      }
    });

    // 전역 마우스/터치 이벤트
    $(document).on("mousemove.cardMouse touchmove.cardTouch", function (e) {
      if (interactionState.isMouseDown || interactionState.isTouchActive) {
        handleMove(e);
      }
    });

    $(document).on("mouseup.cardMouse touchend.cardTouch", function () {
      if (interactionState.isMouseDown || interactionState.isTouchActive) {
        handleEnd();
        resetInteractionState();
      }
    });
  }

  function bindSliderEvents() {
    // 슬라이더 트랙 클릭
    elements.$sliderTrack.on("click", function (e) {
      const rect = this.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const trackWidth = rect.width;
      const newIndex = Math.round(
        (clickX / trackWidth) * (CONFIG.TOTAL_CARDS - 1)
      );
      navigateToCard(newIndex);
    });

    // 슬라이더 썸 드래그
    elements.$sliderThumb.on("mousedown touchstart", handleSliderDragStart);
    $(document).on("mousemove touchmove", handleSliderDrag);
    $(document).on("mouseup touchend", handleSliderDragEnd);
  }

  function bindSwipeEvents() {
    // 컨테이너 스와이프 시작
    $(".ktm-cards-container").on("touchstart mousedown", function (e) {
      setTimeout(() => {
        if (!cardIsSwiping) {
          const coords = getEventCoordinates(e);
          swipeStartX = coords.x;
          swipeStartY = coords.y;
          cardIsSwiping = true;
        }
      }, 10);
    });

    // 전역 스와이프 처리
    $(document).on("touchmove.cardSwipe mousemove.cardSwipe", function (e) {
      if (cardIsSwiping) e.preventDefault();
    });

    $(document).on("touchend.cardSwipe mouseup.cardSwipe", handleSwipeEnd);
  }

  function bindPopupEvents() {
    // 팝업 오버레이 클릭 시 닫기
    elements.$popupOverlay.on("click", function (e) {
      if (e.target === this) closePopup();
    });

    // 모음집 설명창
    $(".ktm-info").on("click", openInfoPopup);
    $(".ktm-info-close, .ktm-info-popup").on("click", function (e) {
      if (e.target === this) closeInfoPopup();
    });
  }

  function bindKeyboardEvents() {
    $(document).on("keydown", function (e) {
      switch (e.key) {
        case "ArrowLeft":
          navigatePrevious();
          break;
        case "ArrowRight":
          navigateNext();
          break;
        case "Escape":
          closePopup();
          closeInfoPopup();
          break;
      }
    });
  }

  function bindNavigationEvents() {
    $(".btn-back, .btn-home").on("click", stopCurrentNarration);
  }

  // ========== 초기화 ==========
  function init() {
    bindCardEvents();
    bindSliderEvents();
    bindSwipeEvents();
    bindPopupEvents();
    bindKeyboardEvents();
    bindNavigationEvents();
    updateCardPosition();
  }

  // 시작
  init();
});
