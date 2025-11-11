$(function () {
  const select01Narration = new Audio("sound/ch_01/ch1_03b.mp3");
  const successSound = new Audio("sound/sfx/puzzle_success_01.wav");
  const dropSound = new Audio("sound/sfx/puzzle_wrong_01.wav");
  const transitionDimIn = new Audio("sound/sfx/transition_dim_in_01.wav");
  transitionDimIn.play();

  $(".dimmed.info-1").on("click", function () {
    $(".dimmed.info-1").remove();
    $(".dimmed.tutorial-1").show();
    $(".select-main").hide();
    select01Narration.play();
  });

  $(".close").on("click", function () {
    select01Narration.pause();
    $(".dimmed.tutorial-1").remove();
    $(".select-main").show();
  });
  setTimeout(() => {
    initPuzzleGame();
  }, 100);

  // select-01 퍼즐조각
  const $pieceWrapper = $(".piece-wrapper");
  const $trayLeft = $("#tray-left");
  const $trayRight = $("#tray-right");

  // 퍼즐 게임 초기화
  function initPuzzleGame() {
    const $pieces = $(".piece");

    // 각 조각에 고유 인덱스 부여
    $pieces.each(function (index) {
      $(this).attr("data-index", index);
      $(this).attr("data-original-position", index);
    });

    // 고정적으로 2,3,4,5번째 조각 선택 (인덱스 1,2,3,4)
    const selectedIndices = [1, 2, 3, 4];

    // 선택된 조각들을 tray로 이동
    selectedIndices.forEach((index, i) => {
      const $piece = $pieces.eq(index);
      const $targetTray = i < 2 ? $trayLeft : $trayRight;

      // 원래 치에 빈 슬롯 생성
      const $emptySlot = $('<div class="empty-slot droppable"></div>');
      $emptySlot.attr("data-target-index", index);
      $emptySlot.attr("data-grid-index", index); // 그리드 위치 저장
      // CSS Grid를 사용하여 위치 설정 (반응형)
      $emptySlot.css({
        gridArea: `${Math.floor(index / 3) + 1} / ${(index % 3) + 1}`,
      });

      // 조각을 tray로 이동
      $piece.detach().appendTo($targetTray);
      $piece.addClass("in-tray");

      // 빈 슬롯을 원래 위치에 추가
      $pieceWrapper.append($emptySlot);
    });

    // 약간의 지연 후 드래그 앤 드롭 설정 (DOM 업데이트 대기)
    setTimeout(() => {
      updateTrayPieceSizes(); // 초기 크기 설정
      setupDragAndDrop();
    }, 100);
  }

  // 드래그 앤 드롭 기능 설정
  function setupDragAndDrop() {
    // tray에 있는 조각들을 draggable로 만들기
    $(".in-tray").draggable({
      helper: function () {
        // 커스텀 helper 생성
        const $helper = $(this).clone();
        $helper.addClass("drag-helper"); // 최적화 클래스 추가

        // 원본 요소의 크기 가져오기
        // const originalWidth = $(this).width();
        // const originalHeight = $(this).height();

        // piece 클래스에서 index 추출 (예: piece-2 -> 2)
        const pieceClasses = $(this).attr("class").split(" ");
        let pieceIndex = null;

        for (let className of pieceClasses) {
          if (className.startsWith("piece-")) {
            pieceIndex = className.split("-")[1];
            break;
          }
        }

        // index에 따른 동적 이미지 경로 설정
        if (pieceIndex) {
          const imagePath = `img/select_01/piece-${pieceIndex}.png`;
          $helper.css("background-image", `url(${imagePath})`);
        }

        // $helper.css({
        //   opacity: 0.8,
        //   zIndex: 1001,
        //   transform: "rotate(3deg) scale(1.05)",
        //   boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        //   pointerEvents: "none",
        //   position: "absolute",
        //   width: originalWidth + "px",
        //   height: originalHeight + "px",
        //   transition: "none", // 모든 CSS 전환 효과 제거
        //   animation: "none", // 애니메이션 제거
        //   backgroundSize: "120%",
        //   backgroundRepeat: "no-repeat",
        //   backgroundPosition: "center",
        // });
        return $helper;
      },
      // helper: "clone",
      appendTo: "body", // helper를 body에 추가하여 전체 화면에서 이동 가능하게
      cursor: "grabbing",
      cursorAt: function () {
        // 요소의 중심에 마우스 커서가 오도록 동적 계산
        const width = $(this).width();
        const height = $(this).height();
        return {
          left: width / 2,
          top: height / 2,
        };
      }, // 마우스 커서가 요소 중심에 위치
      refreshPositions: true, // 위치 계산을 실시간으로 업데이트
      scroll: false, // 스크롤 효과 비활성화로 성능 향상
      start: function (event, ui) {
        // 드래그 시작 시 원본 요소는 그대로 유지
        // $(this).css({
        //   opacity: 0.3,
        //   transform: "scale(0.9)",
        // });
        $(this).addClass("dragging");
      },
      drag: function (event, ui) {
        // 드래그 중 로그 (너무 많이 출력되므로 필요시에만)
      },
      stop: function (event, ui) {
        // 원본 요소 스타일 복원 (투명도 변경하지 않았으므로 복원 불필요)
        // $(this).css({
        //   opacity: 1,
        //   transform: "",
        // });
        $(this).removeClass("dragging");
      },
    });

    // 빈 슬롯을 droppable로 만들기
    $(".droppable").droppable({
      accept: ".in-tray",
      drop: function (event, ui) {
        const $droppedPiece = ui.draggable;
        const $slot = $(this);
        const targetIndex = parseInt($slot.attr("data-target-index"));
        const pieceIndex = parseInt($droppedPiece.attr("data-index"));

        // 올바른 위치에 드롭했는지 확인
        if (targetIndex === pieceIndex) {
          // 올바른 위치: 원본은 tray에 그대로 두고 복사본을 그리드에 배치

          // 원본 piece를 tray에서 드래그 불가능하게 만들기
          $droppedPiece.draggable("destroy");
          $droppedPiece.removeClass("ui-draggable ui-draggable-handle");
          $droppedPiece.css({
            opacity: "0", // 사용됨을 표시
            pointerEvents: "none", // 클릭 방지
          });

          // 그리드에 배치할 새로운 조각 생성 (복사본)
          const $newPiece = $droppedPiece.clone();
          $newPiece.removeClass("in-tray");
          $newPiece.addClass("success");

          // 새 조각의 스타일을 그리드에 맞게 설정
          $newPiece.css({
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            width: "100%",
            height: "100%",
            gridArea: `${Math.floor(pieceIndex / 3) + 1} / ${
              (pieceIndex % 3) + 1
            }`,
            transform: "none",
            opacity: "1",
            pointerEvents: "auto",
          });

          // 빈 슬롯을 새 조각으로 교체
          $slot.replaceWith($newPiece);

          successSound.play();

          // 성공 효과
          $newPiece.addClass("placed-correctly");
          setTimeout(() => {
            $newPiece.removeClass("placed-correctly");
          }, 200);

          // 모든 조각이 맞춰졌는지 확인
          checkPuzzleComplete();
        } else {
          // 잘못된 위치: 원래 tray로 되돌아감 (revert 자동 처리)
          dropSound.play();
          // 이벤트 버블링 방지로 common.js의 btnClickEffect 차단
          event.stopPropagation();
        }
      },
    });
  }

  // tray 안의 조각들과 배치된 조각들 크기 업데이트
  function updateTrayPieceSizes() {
    // 가운데 그리드의 빈 슬롯 크기를 참조점으로 사용
    const $emptySlot = $(".empty-slot").first();
    if ($emptySlot.length === 0) {
      // 빈 슬롯이 없으면 piece-wrapper의 그리드 셀 크기 계산
      const $pieceWrapper = $(".piece-wrapper");
      if ($pieceWrapper.length === 0) return;

      const wrapperWidth = $pieceWrapper.width();
      const wrapperHeight = $pieceWrapper.height();
      const cellSize = Math.min(wrapperWidth, wrapperHeight) / 3;

      // 트레이에 있는 조각들 크기 업데이트
      $(".piece.in-tray").each(function () {
        $(this).css({
          width: cellSize + "px",
          height: cellSize + "px",
        });
      });

      // 이미 배치된 조각들 크기 업데이트 (CSS로 자동 조정되므로 필요시에만)
      return;
    }

    const gridPieceSize = $emptySlot.width();

    // 트레이에 있는 조각들 크기 업데이트
    $(".piece.in-tray").each(function () {
      $(this).css({
        width: gridPieceSize + "px",
        height: gridPieceSize + "px",
      });
    });

    // 이미 배치된 조각들은 CSS Grid에 의해 자동으로 크기가 조정되므로
    // 추가적인 크기 조정이 필요하지 않습니다.
  }

  // 퍼즐 완성 확인
  function checkPuzzleComplete() {
    const remainingSlots = $(".droppable").length;
    if (remainingSlots === 0) {
      // 완성 효과나 다음 단계로 진행하는 로직 추가 가능
      onPuzzleCompleted(); // 성공 화면 표시
    }
  }

  // 퍼즐 완성 시 들어가야함
  function onPuzzleCompleted() {
    $(".board").hide();

    // 완성 이미지 표시
    $(".select-01-completed-img").fadeIn(200, function () {
      // 페이드인 완료 후 glow 효과 활성화
      setTimeout(() => {
        $(this).addClass("glow-active");
      }, 300);
    });

    const successSound = new Audio("sound/ch_01/ch1_activity1A_play.wav");
    successSound.play();

    setTimeout(() => {
      $(".select-01-success").addClass("flex");
    }, 14000);
  }

  // 화면 크기 변경 감지
  let resizeTimeout;
  $(window).on("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      updateTrayPieceSizes();
    }, 10);
  });
});
