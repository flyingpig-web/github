$(function () {
  const successSound = new Audio("sound/sfx/puzzle_success_01.wav");
  const dropSound = new Audio("sound/sfx/puzzle_wrong_01.wav");

  // 드래그 실패 시 클릭 사운드 방지를 위한 전역 플래그
  window.suppressClickSound = false;

  setTimeout(() => {
    // 퍼즐 게임 초기화
    initPuzzleGame();
    $(".select-02").fadeIn(500);
  }, 200);

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

    const selectedIndices = [0, 3, 4, 7, 8];

    // 선택된 조각들을 tray로 이동
    selectedIndices.forEach((index, i) => {
      const $piece = $pieces.eq(index);
      const $targetTray = i < 3 ? $trayLeft : $trayRight;

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
          const imagePath = `img/select_02/piece-${pieceIndex}.png`;
          $helper.css("background-image", `url(${imagePath})`);
        }

        $helper.css({
          opacity: 0.7,
          zIndex: 1001,
          transform: "rotate(5deg) scale(1.1)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
          pointerEvents: "none",
          position: "absolute",
          width: $(this).width() + "px",
          height: $(this).height() + "px",
          transition: "none", // 모든 CSS 전환 효과 제거
          animation: "none", // 애니메이션 제거
          backgroundSize: "120%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        });
        return $helper;
      },
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
      revert: "invalid", // 잘못된 위치에 드롭했을 때 원래 위치로 되돌아감
      revertDuration: 400, // 되돌아가는 애니메이션 지속 시간 (밀리초)
      start: function (event, ui) {
        // 드래그 시작 시 원본 요소는 그대로 유지
        // $(this).css({
        //   opacity: 0.3,
        //   transform: "scale(0.9)",
        // });
        // revert 애니메이션을 위한 클래스 추가
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
        // dragging 클래스 제거
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

          return true; // 성공적으로 드롭됨을 알림
        } else {
          // 잘못된 위치: 원래 tray로 되돌아감 (revert 자동 처리)
          dropSound.play();

          // 클릭 사운드 일시 억제
          window.suppressClickSound = true;
          setTimeout(() => {
            window.suppressClickSound = false;
          }, 100);

          // 이벤트 버블링과 기본 동작 완전 차단
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          return false; // 드롭 실패를 알려서 revert 작동
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
        width: gridPieceSize * 0.9 + "px",
        height: gridPieceSize * 0.9 + "px",
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

    $(".select-02-completed-img").fadeIn(200, function () {
      // 페이드인 완료 후 glow 효과 활성화
      setTimeout(() => {
        $(this).addClass("glow-active");
      }, 300);
    });
    $(".select-bg").addClass("pointer-none");
    const successSound = new Audio("sound/ch_01/ch1_activity1B_play.wav");
    successSound.play();

    setTimeout(() => {
      $(".select-02-success").fadeIn(200);
      const resultSuccess = new Audio("sound/sfx/result_success_01.wav");
      resultSuccess.play();
    }, 11000);

    setTimeout(() => {
      $(".ktm-wrapper").fadeIn(500);
      $(".ktm-wrapper").addClass("pointer-none");
      const finishSound = new Audio("sound/ch_01/ch1_05.mp3");
      finishSound.play();
      $(".select-02-success").fadeOut(500);
    }, 14000);

    setTimeout(() => {
      $(".ktm-wrapper").removeClass("pointer-none");
    }, 19000);
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
