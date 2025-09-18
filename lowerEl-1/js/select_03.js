const ch1_09Narration = new Audio("sound/ch_01/ch1_09.mp3");
const ch1_11Narration = new Audio("sound/ch_01/ch1_11.mp3"); // 괘
const ch1_12Narration = new Audio("sound/ch_01/ch1_12.mp3"); // 줄
const ch1_13Narration = new Audio("sound/ch_01/ch1_13.mp3"); // 술대
const ch1_14Narration = new Audio("sound/ch_01/ch1_14.mp3");
const ch1_15Narration = new Audio("sound/ch_01/ch1_15.mp3");

$(function () {
  // 오디오 파일들
  const successSound = new Audio("sound/sfx/puzzle_success_01.wav"); // 띠링
  const failSound = new Audio("sound/sfx/puzzle_wrong_01.wav"); // 땡
  const transitionDimIn = new Audio("sound/sfx/transition_dim_in_01.wav");
  transitionDimIn.play();
  // 게임 상태 변수들
  let isInteractionEnabled = false;
  let completedItems = 0;
  const totalItems = 3;

  // 정답 매핑 (드래그 가능한 아이템과 드롭 존의 매칭)
  const answerMapping = {
    "gue.png": "gue-active.png",
    "jul.png": "jul-active.png",
    "suldae.png": "suldae-active.png",
  };

  // 내레이션 매핑
  const narrationMapping = {
    "gue-active.png": ch1_11Narration,
    "jul-active.png": ch1_12Narration,
    "suldae-active.png": ch1_13Narration,
  };

  $(".dimmed.info-1").on("click", function () {
    $(".dimmed.info-1").remove();
    $(".tutorial-3").show();
    $(".hint-3").hide();
    ch1_09Narration.play();

    setTimeout(() => {
      $(".select-03-bg").removeClass("pointer-none");
    }, 9000);
  });

  $(".select-start-btn").on("click", function () {
    $(".dimmed.select-03-popup").addClass("flex");
    new Audio("sound/sfx/popup_open_01.wav").play();
  });

  $(".select-03-popup .select-03-popup-confirm").on("click", function () {
    $(".dimmed.select-03-popup").removeClass("flex");
    $(".tutorial-3").hide();
    $(".select-start-btn").hide();
    $(".select-03").show();
    $(".hint-3").show();
    ch1_09Narration.pause();
    ch1_09Narration.currentTime = 0;

    // Ch1_14 내레이션 재생 (4초간 터치 불가능)
    ch1_14Narration.play();
    isInteractionEnabled = false;

    setTimeout(() => {
      isInteractionEnabled = true;
      initDragAndDrop();
    }, 4000); // 4초 후 인터랙션 활성화
  });

  $(".select-03-popup-cancel").on("click", function () {
    $(".dimmed.select-03-popup").removeClass("flex");
  });

  // 드래그 앤 드롭 초기화
  function initDragAndDrop() {
    $(".draggable").attr("role", "button");
    // 드래그 가능한 아이템들 설정
    $(".draggable").draggable({
      helper: "clone",
      revert: "invalid",
      zIndex: 1000,
      start: function (event, ui) {
        if (!isInteractionEnabled) {
          return false;
        }
        $(ui.helper).css({
          width: $(this).width(),
          height: $(this).height(),
        });
      },
    });

    // 드롭 존 설정
    $(".droppable").droppable({
      accept: ".draggable",
      drop: function (event, ui) {
        if (!isInteractionEnabled) return;

        const draggedItem = ui.draggable;
        const dropZone = $(this);
        const draggedSrc = draggedItem.attr("src").split("/").pop();
        const dropZoneSrc = dropZone.find("img").attr("src").split("/").pop();

        // 정답 확인
        if (answerMapping[draggedSrc] === dropZoneSrc) {
          // 정답인 경우
          handleCorrectAnswer(draggedItem, dropZone, dropZoneSrc);
        } else {
          // 오답인 경우
          handleWrongAnswer();
        }
      },
    });
  }

  // 정답 처리
  function handleCorrectAnswer(draggedItem, dropZone, dropZoneSrc) {
    // 성공 사운드 재생
    successSound.play();

    // 드래그된 아이템을 드롭존에 고정
    draggedItem.draggable("destroy");
    draggedItem.hide();

    // 드롭존의 이미지 표시 (힌트 클래스 제거 후 정상 표시)
    const $img = dropZone.find("img");
    $img.removeClass("hint-showing").css("opacity", "1").show();

    // info-box인 경우 힌트 클래스도 제거
    if (dropZone.hasClass("info-box")) {
      dropZone.removeClass("hint-showing");
    }

    dropZone.removeClass("droppable");
    dropZone.css({
      border: "none",
      "background-color": "transparent",
    });

    // 해당 명칭 내레이션 재생
    const narration = narrationMapping[dropZoneSrc];
    if (narration) {
      setTimeout(() => {
        narration.play();
      }, 500);
    }

    completedItems++;

    // 모든 아이템이 완료되었는지 확인
    if (completedItems === totalItems) {
      const resultSuccess = new Audio("sound/sfx/result_shimmer_01.wav");
      resultSuccess.play();
      setTimeout(() => {
        showCompletionMessage();
      }, 2000);
    }
  }

  // 오답 처리
  function handleWrongAnswer() {
    // 실패 사운드 재생
    failSound.play();
    // revert: "invalid" 설정으로 자동으로 원래 자리로 돌아감
  }

  const $hint = $(".btn-top.select-hint");
  let hintCount = 3;
  $hint.on("click", function () {
    if (hintCount > 0) {
      showHint();

      // 힌트 카운트 감소 및 UI 업데이트
      $hint.removeClass(`hint-${hintCount}`);
      hintCount--;
      $hint.addClass(`hint-${hintCount}`);

      // 힌트를 모두 사용했으면 버튼 비활성화
      if (hintCount === 0) {
        $hint.addClass("disabled");
      }
    }
  });

  // 힌트 기능 구현
  function showHint() {
    // 아직 완료되지 않은 드롭존들을 찾기
    const $uncompletedDropZones = $(".droppable").filter(function () {
      return $(this).hasClass("droppable");
    });

    // 안 풀린 것이 없으면 종료
    if ($uncompletedDropZones.length === 0) return;

    // 안 풀린 것들 중에서 랜덤으로 1개 선택
    const randomIndex = Math.floor(
      Math.random() * $uncompletedDropZones.length
    );
    const $selectedDropZone = $uncompletedDropZones.eq(randomIndex);
    const $img = $selectedDropZone.find("img");

    // info-box인 경우 부모 요소에 힌트 클래스 추가
    if ($selectedDropZone.hasClass("info-box")) {
      $selectedDropZone.addClass("hint-showing");

      // 2초 후 클래스 제거
      setTimeout(() => {
        $selectedDropZone.removeClass("hint-showing");
      }, 2000);
    } else {
      // 일반 요소인 경우 이미지에 힌트 클래스 추가
      $img.addClass("hint-showing");

      // 2초 후 클래스 제거
      setTimeout(() => {
        $img.removeClass("hint-showing");
      }, 2000);
    }
  }

  // 완료 메시지 표시
  function showCompletionMessage() {
    new Audio("sound/sfx/popup_open_01.wav").play();
    $(".select-03-popup-success").addClass("flex");

    $(".select-03-popup-success .select-03-popup-confirm").on(
      "click",
      function () {
        $(".select-03-popup-success").removeClass("flex");
      }
    );

    $(".select-03-popup-success .select-03-popup-cancel").on(
      "click",
      function () {
        $(".select-03-popup-success").removeClass("flex");
        $(".select-03-bg").addClass("pointer-none");
        $(".ktm-wrapper").addClass("pointer-none");
        setTimeout(() => {
          $(".select-03-success").show();
        }, 2000);
        setTimeout(() => {
          $(".select-03-success").fadeOut(500);
          $(".ktm-wrapper").fadeIn(500);
          ch1_15Narration.play();
        }, 4000);
        setTimeout(() => {
          $(".ktm-wrapper").removeClass("pointer-none");
        }, 9000);
      }
    );
  }
});
