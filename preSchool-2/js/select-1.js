$(function () {
  const $tutorialBg = $(".dimmed.tutorial-bg");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $bgmMain = $("#bgm-main")[0];
  const $selectMain = $(".select-main");

  $bgmTutorial.play();

  $(".close").on("click", function () {
    $bgmTutorial.pause();
    $tutorialBg.fadeOut(500);
    setTimeout(() => {
      $tutorialBg.hide();
      $bgmMain.play();
      $selectMain.addClass("pointer-none");
    }, 500);

    setTimeout(() => {
      $selectMain.removeClass("pointer-none");
      initDragDrop();
    }, 6000);
  });

  // 드래그앤드롭 초기화 함수
  function initDragDrop() {
    // 모든 piece 요소를 draggable로 설정
    $(".piece").draggable({
      revert: function (valid) {
        if (!valid) {
          // 즉시 실패 사운드 재생
          $("#fail-sound")[0].currentTime = 0;
          $("#fail-sound")[0].play();
        }
        return !valid; // invalid한 경우에만 revert
      },
      helper: "clone", // 드래그할 때 복사본 사용
      cursor: "move",
      zIndex: 1000,
      start: function (event, ui) {
        $(this).addClass("dragging");
      },
      stop: function (event, ui) {
        $(this).removeClass("dragging");
      },
    });

    // 모든 droppable 영역 설정
    $(".droppable").droppable({
      accept: function (draggable) {
        // 해당하는 piece만 받아들임 (예: tps는 tps-empty에만)
        const dropClass = $(this).attr("class").split(" ")[1]; // 예: "tps-empty"
        const pieceClass = draggable.attr("class").split(" ")[1]; // 예: "tps"
        const expectedPiece = dropClass.replace("-empty", ""); // "tps-empty" -> "tps"

        return pieceClass === expectedPiece;
      },
      hoverClass: "drop-hover",
      drop: function (event, ui) {
        const $droppedPiece = ui.draggable;
        const $dropZone = $(this);

        // 성공 표시
        $droppedPiece.addClass("dropped-success");

        // 드롭된 piece를 drop zone 위치로 이동
        $droppedPiece.css({
          position: "absolute",
          top: $dropZone.position().top,
          left: $dropZone.position().left,
          zIndex: 10,
        });

        // 원본 piece 숨기기
        $droppedPiece.hide();

        // drop zone에 성공 이미지 표시
        const pieceType = $droppedPiece.attr("class").split(" ")[1];
        $dropZone
          .children("img")
          .attr("src", `img/select/${pieceType}-active.png`);

        // 드롭 완료 처리
        $dropZone.addClass("filled");
        $droppedPiece.draggable("disable");

        // 클래스명에 따라 다른 성공 사운드 재생
        playSuccessSound(pieceType);

        // 성공 애니메이션 표시
        showFinishAnimation($dropZone);

        // 음표 표시
        showNote(pieceType);

        // 드래그앤드롭 성공시 계속재생
        playInfiniteSound(pieceType);

        // 모든 piece가 배치되었는지 확인
        checkAllPlaced();
      },
    });
  }

  function playInfiniteSound(pieceType) {
    const audioId = `success-infinite-${pieceType}`;
    const audio = $("#" + audioId)[0];
    audio.loop = true;
    audio.currentTime = 0;
    audio.play();
  }

  // 클래스명에 따라 성공 사운드 재생 함수
  function playSuccessSound(pieceType) {
    let audioId;

    // 클래스명에 따라 사운드 선택
    if (pieceType === "tps" || pieceType === "jg") {
      audioId = "success-tps-jg"; // yu2_07.mp3
    } else if (pieceType === "j" || pieceType === "sg") {
      audioId = "success-j-sg"; // yu2_07a.wav
    } else if (pieceType === "ggr" || pieceType === "b") {
      audioId = "success-ggr-b"; // yu2_07b.wav
    } else {
      // 기본 사운드 (예외 처리)
      audioId = "success-sound";
    }

    const audio = $("#" + audioId)[0];
    audio.currentTime = 0; // 사운드 처음부터 재생
    audio.play();
  }

  // 성공 애니메이션 표시 함수
  function showFinishAnimation($dropZone) {
    const $animation = $('<div class="finish-animation"></div>');
    const dropZonePos = $dropZone.position();

    // 애니메이션을 drop zone 중앙에 위치
    $animation.css({
      top: dropZonePos.top,
      left: dropZonePos.left,
    });

    // 애니메이션을 DOM에 추가
    $(".select-main").append($animation);

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      $animation.remove();
    }, 2000);
  }

  function showNote(pieceType) {
    const element = $(`.${pieceType}-empty .notes`);
    element.removeClass("display-none");
  }

  // 모든 악기가 배치되었는지 확인하는 함수
  function checkAllPlaced() {
    const totalPieces = $(".piece").length - 1;
    const placedPieces = $(".droppable.filled").length;

    if (totalPieces === placedPieces) {
      setTimeout(() => {
        stopAllInfiniteSounds();
        onPuzzleCompleted();
      }, 1000);
    }
  }

  // 모든 계속 재생되는 사운드를 정지하는 함수
  function stopAllInfiniteSounds() {
    const pieceTypes = ["b", "ggr", "tps", "jg", "j", "sg"];
    pieceTypes.forEach((pieceType) => {
      const audioId = `success-infinite-${pieceType}`;
      const audio = $("#" + audioId)[0];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
      }
    });

    $(".filled").each(function () {
      $(this).addClass("stopped");
    });
  }

  function onPuzzleCompleted() {
    const successSound = $("#success-tps-jg")[0];
    successSound.play();

    setTimeout(() => {
      $(".filled").each(function () {
        $(this).removeClass("stopped");
      });
    }, 1000);

    const song = $("#success-song")[0];
    song.play();

    setTimeout(() => {
      let fadeAudio = setInterval(() => {
        if (song.volume > 0.05) {
          song.volume -= 0.05;
        } else {
          song.volume = 0;
          song.pause();
          $(".filled").each(function () {
            $(this).addClass("stopped");
          });
          clearInterval(fadeAudio);
        }
      }, 200);
    }, 10500);

    setTimeout(() => {
      $(".select-completed").removeClass("display-none");

      setTimeout(() => {
        $(".select-completed .finish-animation").remove();
      }, 2000);

      setTimeout(() => {
        $(".select-completed .success-ment").removeClass("display-none");
        $("#success-ment")[0].play();
      }, 2500);

      setTimeout(() => {
        $("#success-ment-2")[0].play();
      }, 6500);
    }, 12500);

    setTimeout(() => {
      $(".select-completed").remove();
      $(".songpyun-before").removeClass("display-none");
    }, 15000);
  }

  $(".select-1-songpyun").on("click", function () {
    $(".select-1-songpyun").fadeOut(500);

    setTimeout(() => {
      $(".select-1-songpyun-half").fadeIn(500);
    }, 500);
  });

  $(".select-1-songpyun-half").on("click", function () {
    $(".select-1-songpyun-half").fadeOut(500);

    setTimeout(() => {
      $(".message").fadeIn(500);
    }, 500);
  });

  const $messageSound = $("#message-sound")[0];
  $(".message").on("click", function () {
    $(".message-content").removeClass("display-none");
    $(".message-content").fadeIn(500);
    $(".songpyun-before").fadeOut(500);
    $messageSound.play();
  });

  $(".message-content-close").on("click", function () {
    $(".message-content").fadeOut(500);
    $(".songpyun-before").fadeIn(500);
    $messageSound.pause();
    $messageSound.currentTime = 0;
  });
});
