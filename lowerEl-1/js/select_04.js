$(function () {
  const ch1_14ANarration = new Audio("sound/ch_01/ch1_14a.mp3");
  const ch1_15Narration = new Audio("sound/ch_01/ch1_15.mp3");

  $(".select-main").addClass("pointer-none");

  setTimeout(() => {
    ch1_14ANarration.play();
  }, 100);

  setTimeout(() => {
    $(".select-main").removeClass("pointer-none");
  }, 3000);
  let rotateAngle = 0;
  let zoomMode = false;

  // 거문고 이미지 업데이트 함수
  function updateGeomungoImage() {
    // 각도를 0-360 범위로 정규화
    const normalizedAngle = ((rotateAngle % 360) + 360) % 360;
    if (normalizedAngle === 0) {
      $(".geomungo-image").attr("src", `img/select_04/geomungo.png`);
    } else {
      $(".geomungo-image").attr(
        "src",
        `img/select_04/geomungo-${normalizedAngle}.png`
      );
    }
  }

  // $(".geomungo-image").on("mouseleave", function () {
  //   if (zoomMode) {
  //     toggleZoomMode();
  //   }
  // });

  // 줌 모드 상태 변수
  let isDragging = false;
  let currentZoomX = 0;
  let currentZoomY = 0;

  // 터치/마우스 이벤트에서 좌표 추출 헬퍼 함수
  function getEventCoordinates(e) {
    if (e.type.startsWith("touch")) {
      const touch =
        e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    } else {
      return { clientX: e.clientX, clientY: e.clientY };
    }
  }

  // 줌 모드 토글 함수
  function toggleZoomMode() {
    const $searchBtn = $(".select-04-control-search-btn");
    const $geomungoWrapper = $(".select-04-main-geomungo-wrapper");
    const $geomungoImage = $(".geomungo-image");

    if (!zoomMode) {
      // 줌 모드 활성화
      zoomMode = true;

      $searchBtn.addClass("active");
      $geomungoWrapper.addClass("zoom-mode");

      // 돋보기 렌즈 생성 (body에 직접 배치하여 어디든 이동 가능하게)
      const $magnifier = $('<div class="magnifier"></div>');
      $("body").append($magnifier);

      // 초기 돋보기 위치 설정 (중앙)
      const rect = $geomungoImage[0].getBoundingClientRect();
      currentZoomX = rect.width / 2;
      currentZoomY = rect.height / 2;
      updateMagnifierPosition(
        $magnifier,
        $geomungoImage,
        currentZoomX,
        currentZoomY
      );

      // 클릭/탭 이벤트로 확대 위치 변경
      $geomungoImage.on("click.zoom tap.zoom", function (e) {
        if (isDragging) return; // 드래그 중이면 클릭 무시

        const rect = this.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        currentZoomX = coords.clientX - rect.left;
        currentZoomY = coords.clientY - rect.top;
        updateMagnifierPosition(
          $magnifier,
          $geomungoImage,
          currentZoomX,
          currentZoomY
        );
      });

      // 드래그/터치 시작
      $geomungoImage.on("mousedown.zoom touchstart.zoom", function (e) {
        isDragging = true;
        const rect = this.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        currentZoomX = coords.clientX - rect.left;
        currentZoomY = coords.clientY - rect.top;
        updateMagnifierPosition(
          $magnifier,
          $geomungoImage,
          currentZoomX,
          currentZoomY
        );

        // 텍스트 선택 방지
        e.preventDefault();
        $(document).css("user-select", "none");
      });

      // 드래그/터치 중
      $(document).on("mousemove.zoom touchmove.zoom", function (e) {
        if (!isDragging || !zoomMode) return;

        const rect = $geomungoImage[0].getBoundingClientRect();
        const coords = getEventCoordinates(e);
        const x = coords.clientX - rect.left;
        const y = coords.clientY - rect.top;

        // 이미지 범위 내에서만 업데이트
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          currentZoomX = x;
          currentZoomY = y;
          updateMagnifierPosition(
            $magnifier,
            $geomungoImage,
            currentZoomX,
            currentZoomY
          );
        }
      });

      // 드래그/터치 종료
      $(document).on("mouseup.zoom touchend.zoom", function () {
        if (isDragging) {
          isDragging = false;
          $(document).css("user-select", "auto");
        }
      });

      // 커서 변경 (크로스헤어로 클릭/드래그 가능함을 표시)
      $geomungoImage.css({
        cursor: "crosshair",
      });

      // 돋보기 표시
      $magnifier.show();
    } else {
      // 줌 모드 비활성화
      zoomMode = false;
      isDragging = false;

      $searchBtn.removeClass("active");
      $geomungoWrapper.removeClass("zoom-mode");

      // 돋보기 제거
      $("body").find(".magnifier").remove();

      // 모든 이벤트 제거
      $geomungoImage.off("click.zoom tap.zoom mousedown.zoom touchstart.zoom");
      $(document).off(
        "mousemove.zoom touchmove.zoom mouseup.zoom touchend.zoom"
      );

      // 커서 복원
      $geomungoImage.css({
        cursor: "default",
      });

      // 텍스트 선택 복원
      $(document).css("user-select", "auto");
    }
  }

  // 돋보기 위치 업데이트 함수 (CSS 기반)
  function updateMagnifierPosition($magnifier, $geomungoImage, x, y) {
    const rect = $geomungoImage[0].getBoundingClientRect();
    const wrapperRect = $geomungoImage.parent()[0].getBoundingClientRect();

    // 돋보기 크기 (CSS에서 고정 크기 300px 사용)
    const magnifierSize = 300;
    const magnifierRadius = magnifierSize / 2;
    const zoomFactor = 1.5; // 확대 배율

    // 페이지 전체 기준으로 돋보기 위치 설정 (이미지 위치 + 로컬 좌표)
    const pageX = rect.left + x;
    const pageY = rect.top + y;

    $magnifier.css({
      left: pageX - magnifierRadius,
      top: pageY - magnifierRadius,
      display: "block",
      position: "fixed", // body에 배치되었으므로 fixed 사용
    });

    // 확대 이미지 요소가 없으면 생성
    let $zoomedImage = $magnifier.find(".magnifier-image");
    if ($zoomedImage.length === 0) {
      $zoomedImage = $('<div class="magnifier-image"></div>');
      $magnifier.empty().append($zoomedImage);
    }

    // 확대된 이미지의 배경 설정
    $zoomedImage.css({
      "background-image": `url(${$geomungoImage.attr("src")})`,
      "background-size": `${rect.width * zoomFactor}px ${
        rect.height * zoomFactor
      }px`,
      "background-repeat": "no-repeat",
    });

    // 마우스 포인터 위치를 중심으로 배경 위치 계산
    const bgX = -(x * zoomFactor - magnifierRadius);
    const bgY = -(y * zoomFactor - magnifierRadius);

    $zoomedImage.css({
      "background-position": `${bgX}px ${bgY}px`,
    });
  }

  // 초기 이미지 설정
  updateGeomungoImage();

  $(".select-04-control-search-btn").on("click", function () {
    toggleZoomMode();
  });

  $(".select-04-control-up-btn").on("click", function () {
    if (zoomMode) {
      toggleZoomMode();
    }
    rotateAngle += 45;
    updateGeomungoImage();
  });

  $(".select-04-control-down-btn").on("click", function () {
    if (zoomMode) {
      toggleZoomMode();
    }
    rotateAngle -= 45;
    updateGeomungoImage();
  });

  $(".select-04-control-finish-btn").on("click", function () {
    if (zoomMode) {
      toggleZoomMode();
    }
    $(".select-04-bg").addClass("pointer-none");
    $(".ktm-wrapper").addClass("pointer-none");
    const resultSuccess = new Audio("sound/sfx/result_success_01.wav");
    resultSuccess.play();
    $(".select-03-success").show();
    setTimeout(() => {
      $(".select-03-success").fadeOut(500);
      $(".ktm-wrapper").fadeIn(500);
      ch1_15Narration.play();
    }, 4000);
    setTimeout(() => {
      $(".ktm-wrapper").removeClass("pointer-none");
    }, 9000);
  });
});
