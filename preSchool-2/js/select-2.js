$(function () {
  const $info1 = $(".dimmed.info-1");
  const $tutorialBg = $(".dimmed.tutorial-bg-2");
  const $bgmTutorial = $("#bgm-tutorial")[0];
  const $selectMain = $(".select-main-2");
  const $centerElement = $(".center-element");
  const $bgmMain = $("#bgm-main")[0];

  // 타원 궤도 설정 (CSS ellipse-track과 일치)
  const ellipseA = 24; // 장축 반지름 (vw 단위) - 60vw / 2
  const ellipseB = 11.5; // 단축 반지름 (vw 단위) - 35vw / 2

  let isDragging = false;
  let draggedMoon = null;
  let rotationSpeed = 0;
  let lastAngle = 0;
  let centerImageInterval = null;
  let currentCenterImage = 1; // 1: center-disc.png, 2: center-disc-2.png

  // 올바른 회전 판별을 위한 변수들
  let rotationHistory = []; // 회전 방향 히스토리
  let correctRotationStartTime = null;
  let isCorrectRotation = false;
  let bgmStageIndex = 0; // 현재 재생할 BGM 스테이지 (0: stage-1, 1: stage-2, 2: stage-3)
  let bgmPlayTimeout = null;
  let lastRotationTime = 0; // 마지막 회전 시간
  let rotationGracePeriod = 2000; // 회전 중단 허용 시간 (2초)
  let lastBgmPlayTime = 0; // 마지막 BGM 재생 시간
  let bgmCooldownPeriod = 3000; // BGM 재생 후 최소 대기 시간 (3초)
  let rotationAfterBgm = 0; // BGM 재생 후 누적 회전량
  let requiredRotationForNextBgm = 360; // 다음 BGM을 위한 필요 회전량 (1바퀴 = 360도)
  let totalRotationForFirstBgm = 0; // 첫 번째 BGM을 위한 총 회전량
  let requiredRotationForFirstBgm = 360; // 첫 번째 BGM을 위한 필요 회전량 (1바퀴 = 360도)
  let lastValidAngle = 0; // 마지막 유효한 각도
  let isFirstAngleSet = false; // 첫 번째 각도 설정 여부
  let minAngleChange = 5; // 최소 각도 변화 (5도 이상 변해야 유효한 회전으로 인정)

  // BGM 요소들
  const $bgmStage1 = $("#bgm-stage-1")[0];
  const $bgmStage2 = $("#bgm-stage-2")[0];
  const $bgmStage3 = $("#bgm-stage-3")[0];
  const bgmStages = [$bgmStage1, $bgmStage2, $bgmStage3];
  const $mainPlayBgm = $("#select-2-main-play")[0];
  const $lyricsWrapper = $(".lyrics-wrapper");
  const $goodWrapper = $(".good-wrapper");

  // Person 요소들
  const $person1 = $("#person-1");
  const $person2 = $("#person-2");
  const $person3 = $("#person-3");
  const personElements = [$person1, $person2, $person3];

  // Person 이미지 경로
  const personImages = {
    normal: [
      "img/select/select-2-person-1.png",
      "img/select/select-2-person-2.png",
      "img/select/select-2-person-3.png",
    ],
    active: [
      "img/select/select-2-person-1-active.png",
      "img/select/select-2-person-2-active.png",
      "img/select/select-2-person-3-active.png",
    ],
  };

  // 가사 타이밍 설정
  const lyricsTimings = [
    { start: 0, end: 5, className: "" }, // 없음
    { start: 5, end: 10, className: "common" }, // lyrics-common.png
    { start: 10, end: 12.5, className: "lyrics-1" }, // lyrics-1.png
    { start: 12.5, end: 14.5, className: "common" }, // lyrics-common.png
    { start: 14.5, end: 17, className: "lyrics-2" }, // lyrics-2.png
    { start: 17, end: 19, className: "common" }, // lyrics-common.png
    { start: 19, end: 22, className: "lyrics-3" }, // lyrics-3.png
    { start: 22, end: 24, className: "common" }, // lyrics-common.png
    { start: 24, end: 27, className: "lyrics-4" }, // lyrics-4.png
    { start: 27, end: 29, className: "common" }, // lyrics-common.png
    { start: 30, end: Infinity, className: "" }, // 없음
  ];

  let lyricsInterval = null;
  let personActivationTimeout = null;
  let goodClassTimeout = null;

  $info1.on("click", function () {
    $info1.hide();
    $tutorialBg.removeClass("display-none");
    $bgmTutorial.play();
    setTimeout(() => {
      initEllipseDrag();
    }, 1000);
  });

  $(".close").on("click", function () {
    $bgmTutorial.pause();
    $tutorialBg.fadeOut(500);
    setTimeout(() => {
      $tutorialBg.hide();
      $selectMain.addClass("pointer-none");
      $bgmMain.play();
    }, 500);

    setTimeout(() => {
      $selectMain.removeClass("pointer-none");
    }, 5000);

    setTimeout(() => {
      $mainPlayBgm.play();
      startLyricsSync(); // 가사 동기화 시작
    }, 6000);
  });

  // 타원 궤도 드래그 시스템 초기화
  function initEllipseDrag() {
    // 초기 위치 설정
    $(".moon").each(function () {
      const angle = parseFloat($(this).data("angle"));
      updatePersonPosition($(this), angle);
    });

    // 드래그 이벤트 설정
    $(".moon").on("mousedown", function (e) {
      e.preventDefault();
      startDrag($(this), e);

      $(document).on("mousemove", handleDrag);
      $(document).on("mouseup", stopDrag);
    });

    $(".moon").on("touchstart", function (e) {
      e.preventDefault();
      startDrag($(this), e);

      $(document).on("touchmove", handleDrag);
      $(document).on("touchend", stopDrag);
    });
  }

  // 드래그 시작 공통 함수
  function startDrag($element, e) {
    isDragging = true;
    draggedMoon = $element;
    draggedMoon.addClass("dragging");

    // 드래그 시작 시 이미지 변경
    draggedMoon.find("img").attr("src", "img/select/moon-active.png");

    const currentAngle = parseFloat(draggedMoon.data("angle"));
    lastAngle = currentAngle;

    // 첫 번째 BGM을 위한 각도 추적 초기화 (드래그 시작 시에만)
    if (lastBgmPlayTime === 0 && !isFirstAngleSet) {
      lastValidAngle = currentAngle;
      isFirstAngleSet = true;
    }
  }

  // 드래그 처리
  function handleDrag(e) {
    if (!isDragging || !draggedMoon) return;

    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // 화면 중앙 기준 좌표 계산
    const containerRect = $selectMain[0].getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    const mouseX = clientX - centerX;
    const mouseY = clientY - centerY;

    // 타원 궤도상의 가장 가까운 점 찾기
    const angle = findClosestAngleOnEllipse(mouseX, mouseY);

    // 회전 속도 계산
    let angleDiff = angle - lastAngle;

    // 360도 경계 처리 (예: 359도에서 1도로 넘어가는 경우)
    if (angleDiff > 180) {
      angleDiff -= 360;
    } else if (angleDiff < -180) {
      angleDiff += 360;
    }

    rotationSpeed = angleDiff;
    lastAngle = angle;

    // 올바른 회전 판별
    checkCorrectRotation(angleDiff);

    // 모든 사람 위치 업데이트
    updateMoonPositions(angle - parseFloat(draggedMoon.data("angle")));

    // 실제 각도 변화를 기반으로 회전량 계산
    calculateActualRotation(angle);

    // 중앙 요소 회전 및 이미지 변경
    if (Math.abs(rotationSpeed) > 1) {
      startCenterImageAnimation();
    }
  }

  // 드래그 종료
  function stopDrag() {
    if (draggedMoon) {
      draggedMoon.removeClass("dragging");

      // 드래그 종료 시 이미지 원래대로 변경
      draggedMoon.find("img").attr("src", "img/select/moon.png");
    }
    isDragging = false;
    draggedMoon = null;

    // 드래그 종료 시 즉시 중앙 이미지 애니메이션 중지
    stopCenterImageAnimation();

    // 회전 상태 초기화
    resetRotationState();

    $(document).off("mousemove", handleDrag);
    $(document).off("mouseup", stopDrag);
    $(document).off("touchmove", handleDrag);
    $(document).off("touchend", stopDrag);
  }

  // 타원 궤도상의 가장 가까운 각도 찾기
  function findClosestAngleOnEllipse(mouseX, mouseY) {
    let closestAngle = 0;
    let minDistance = Infinity;

    // 360도를 1도씩 체크하여 가장 가까운 점 찾기
    for (let angle = 0; angle < 360; angle += 1) {
      const rad = (angle * Math.PI) / 180;
      // vw 단위를 픽셀로 변환 (둘 다 vw 단위)
      const x = ellipseA * Math.cos(rad) * (window.innerWidth / 100);
      const y = ellipseB * Math.sin(rad) * (window.innerWidth / 100);

      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);

      if (distance < minDistance) {
        minDistance = distance;
        closestAngle = angle;
      }
    }

    return closestAngle;
  }

  // 모든 사람 위치 업데이트
  function updateMoonPositions(angleDelta) {
    $(".moon").each(function () {
      const currentAngle = parseFloat($(this).data("angle"));
      const newAngle = (currentAngle + angleDelta + 360) % 360;
      $(this).data("angle", newAngle);
      updatePersonPosition($(this), newAngle);
    });
  }

  // 개별 달 위치 업데이트
  function updatePersonPosition($moon, angle) {
    const rad = (angle * Math.PI) / 180;
    const x = ellipseA * Math.cos(rad);
    const y = ellipseB * Math.sin(rad);

    // moon 크기의 절반만큼 오프셋 적용 (8vw / 2 = 4vw)
    $moon.css({
      left: `calc(50% + ${x}vw - 4vw)`,
      top: `calc(50% + ${y}vw - 4vw)`,
    });
  }

  // 실제 각도 변화를 기반으로 회전량 계산
  function calculateActualRotation(currentAngle) {
    // 첫 번째 BGM이 아직 재생되지 않은 경우에만 계산
    if (lastBgmPlayTime === 0) {
      if (!isFirstAngleSet) {
        // 첫 번째 각도 설정
        lastValidAngle = currentAngle;
        isFirstAngleSet = true;
        return;
      }

      // 각도 차이 계산
      let angleDiff = currentAngle - lastValidAngle;

      // 360도 경계 처리
      if (angleDiff > 180) {
        angleDiff -= 360;
      } else if (angleDiff < -180) {
        angleDiff += 360;
      }

      // 최소 각도 변화 이상일 때만 유효한 회전으로 인정
      if (Math.abs(angleDiff) >= minAngleChange) {
        totalRotationForFirstBgm += Math.abs(angleDiff);
        lastValidAngle = currentAngle;

        console.log(
          `유효한 회전 감지: +${Math.abs(angleDiff).toFixed(
            1
          )}도, 총 회전량: ${totalRotationForFirstBgm.toFixed(
            1
          )}도/${requiredRotationForFirstBgm}도`
        );
      }
    }
  }

  // 중앙 이미지 애니메이션 시작
  function startCenterImageAnimation() {
    // 이미 실행 중이면 중복 실행 방지
    if (centerImageInterval) return;

    centerImageInterval = setInterval(() => {
      if (currentCenterImage === 1) {
        $centerElement.find("img").attr("src", "img/select/center-disc-2.png");
        currentCenterImage = 2;
      } else {
        $centerElement.find("img").attr("src", "img/select/center-disc.png");
        currentCenterImage = 1;
      }
    }, 1000);
  }

  // 중앙 이미지 애니메이션 중지
  function stopCenterImageAnimation() {
    if (centerImageInterval) {
      clearInterval(centerImageInterval);
      centerImageInterval = null;
    }
  }

  // 올바른 회전 판별 함수
  function checkCorrectRotation(angleDiff) {
    const currentTime = Date.now();

    // 실제 회전이 있을 때만 히스토리에 추가
    if (Math.abs(angleDiff) > 0.5) {
      lastRotationTime = currentTime;

      // 회전 방향 히스토리에 추가 (시계방향: 양수, 반시계방향: 음수)
      rotationHistory.push({
        direction: angleDiff > 0 ? 1 : -1,
        speed: Math.abs(angleDiff),
        timestamp: currentTime,
      });

      // BGM 재생 후 회전량 누적 (기존 로직 유지)
      if (lastBgmPlayTime > 0) {
        rotationAfterBgm += Math.abs(angleDiff);
      }

      // 최근 10개의 회전 데이터만 유지
      if (rotationHistory.length > 10) {
        rotationHistory.shift();
      }
    }

    // 최소 5개의 데이터가 있어야 판별 시작
    if (rotationHistory.length < 5) return;

    // 올바른 회전 조건 확인 (더 엄격한 조건)
    const isConsistentDirection = checkConsistentDirection();
    const isConsistentSpeed = checkConsistentSpeed();
    const hasMinimumSpeed = checkMinimumSpeed();
    const isActualOrbitRotation = checkActualOrbitRotation();
    const isWithinGracePeriod =
      currentTime - lastRotationTime < rotationGracePeriod;

    const currentlyCorrect =
      isConsistentDirection &&
      isConsistentSpeed &&
      hasMinimumSpeed &&
      isActualOrbitRotation;

    if (currentlyCorrect && !isCorrectRotation) {
      // 올바른 회전 시작 - 하지만 첫 번째 BGM은 한바퀴 이상 돌려야 재생
      if (
        bgmStageIndex === 0 &&
        totalRotationForFirstBgm >= requiredRotationForFirstBgm
      ) {
        startCorrectRotation();
      } else if (bgmStageIndex > 0) {
        startCorrectRotation();
      }
    } else if (!currentlyCorrect && isCorrectRotation && !isWithinGracePeriod) {
      // 올바른 회전 중단 (유예 기간 초과 시에만)
      stopCorrectRotation();
    } else if (currentlyCorrect && isCorrectRotation) {
      // 올바른 회전 지속 중
      updateCorrectRotationDuration();
      // 다음 BGM 재생 조건 확인
      checkNextBgmPlayCondition(currentTime);
    }
  }

  // 일관된 방향 회전 확인 (왼쪽 방향 - 반시계방향만 허용)
  function checkConsistentDirection() {
    const recentRotations = rotationHistory.slice(-5);
    const counterClockwiseCount = recentRotations.filter(
      (r) => r.direction < 0
    ).length;

    // 80% 이상 반시계방향(왼쪽 방향)으로 회전해야만 OK
    return counterClockwiseCount >= 4;
  }

  // 일정한 속도 확인
  function checkConsistentSpeed() {
    const recentRotations = rotationHistory.slice(-5);
    const speeds = recentRotations.map((r) => r.speed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    // 평균 속도의 50% 이내 편차를 허용
    const tolerance = avgSpeed * 0.5;
    const consistentCount = speeds.filter(
      (speed) => Math.abs(speed - avgSpeed) <= tolerance
    ).length;

    return consistentCount >= 3; // 60% 이상 일정한 속도
  }

  // 최소 속도 확인 (더 엄격한 조건)
  function checkMinimumSpeed() {
    const recentRotations = rotationHistory.slice(-3);
    const avgSpeed =
      recentRotations.reduce((sum, r) => sum + r.speed, 0) /
      recentRotations.length;
    return avgSpeed >= 3; // 최소 3도/프레임 (더 엄격하게)
  }

  // 실제 궤도 회전 확인
  function checkActualOrbitRotation() {
    // 최근 회전 데이터에서 연속적인 각도 변화 확인
    const recentRotations = rotationHistory.slice(-5);
    if (recentRotations.length < 5) return false;

    // 각 회전이 최소 각도 변화 이상인지 확인
    const validRotations = recentRotations.filter(
      (r) => r.speed >= minAngleChange
    );
    return validRotations.length >= 4; // 80% 이상이 유효한 회전이어야 함
  }

  // 올바른 회전 시작
  function startCorrectRotation() {
    isCorrectRotation = true;
    correctRotationStartTime = Date.now();
    correctRotationDuration = 0;

    // BGM 순차 재생 시작
    playBGMSequentially();
  }

  // 올바른 회전 중단
  function stopCorrectRotation() {
    isCorrectRotation = false;
    correctRotationStartTime = null;
    correctRotationDuration = 0;

    // BGM 재생 중단 (현재 재생 중인 BGM은 보호)
    stopBGMSequence();
  }

  // 올바른 회전 지속 시간 업데이트
  function updateCorrectRotationDuration() {
    if (correctRotationStartTime) {
      correctRotationDuration = Date.now() - correctRotationStartTime;
    }
  }

  // 다음 BGM 재생 조건 확인
  function checkNextBgmPlayCondition(currentTime) {
    // 다음 BGM이 있고, 시간과 회전량 조건을 모두 만족하는지 확인
    const timeConditionMet = currentTime - lastBgmPlayTime >= bgmCooldownPeriod;
    const rotationConditionMet = rotationAfterBgm >= requiredRotationForNextBgm;

    if (
      bgmStageIndex < bgmStages.length &&
      timeConditionMet &&
      rotationConditionMet
    ) {
      playCurrentBGM();
    }
  }

  // BGM 순차 재생
  function playBGMSequentially() {
    // 기존 타이머 클리어
    if (bgmPlayTimeout) {
      clearTimeout(bgmPlayTimeout);
      bgmPlayTimeout = null;
    }

    // 모든 BGM 정지
    bgmStages.forEach((bgm) => {
      bgm.pause();
      bgm.currentTime = 0;
    });

    // 모든 person 이미지를 normal 상태로 초기화
    resetAllPersonImages();

    // good 클래스들 초기화
    resetGoodClasses();

    // BGM 인덱스 및 회전량 초기화
    bgmStageIndex = 0;
    totalRotationForFirstBgm = 0;
    lastValidAngle = 0;
    isFirstAngleSet = false;

    // 첫 번째 BGM 즉시 재생
    playCurrentBGM();
  }

  // 현재 BGM 재생
  function playCurrentBGM() {
    if (bgmStageIndex < bgmStages.length) {
      // 모든 BGM 정지 (중복 재생 방지)
      bgmStages.forEach((bgm) => {
        bgm.pause();
        bgm.currentTime = 0;
      });

      const currentBGM = bgmStages[bgmStageIndex];

      // 현재 BGM 재생
      currentBGM.currentTime = 0;
      currentBGM.play().catch((error) => {});

      // 모든 person 이미지를 1초간 active로 변경
      activatePersonImagesTemporarily();

      // good-wrapper에 해당 stage 클래스 추가
      addGoodClass(bgmStageIndex);

      // BGM Stage 3 재생 시 성공 alert
      if (bgmStageIndex === 2) {
        setTimeout(() => {
          $mainPlayBgm.pause();
          $selectMain.addClass("pointer-none");
          $(".select-completed").removeClass("display-none");

          setTimeout(() => {
            $(".select-completed .finish-animation").remove();
          }, 2000);

          setTimeout(() => {
            $(".select-completed .success-ment").removeClass("display-none");
            $("#success-ment")[0].play();
            $(".songpyun-before").removeClass("display-none");
          }, 2500);

          setTimeout(() => {
            $("#success-ment-2")[0].play();
          }, 7500);
        }, 2000);
      }

      // BGM 재생 시간 기록 및 회전량 초기화
      lastBgmPlayTime = Date.now();
      rotationAfterBgm = 0; // 다음 BGM을 위한 회전량 초기화
      bgmStageIndex++;
    }
  }

  // BGM 시퀀스 중단 (현재 재생 중인 BGM은 유지)
  function stopBGMSequence() {
    if (bgmPlayTimeout) {
      clearTimeout(bgmPlayTimeout);
      bgmPlayTimeout = null;
    }

    // 현재 재생 중인 BGM은 정지하지 않고, 다른 BGM만 정지
    bgmStages.forEach((bgm, index) => {
      // 현재 재생 중인 BGM이 아닌 경우에만 정지
      if (index !== bgmStageIndex - 1 || bgm.paused) {
        bgm.pause();
        bgm.currentTime = 0;
      }
    });

    // person 활성화 타이머가 있으면 취소
    if (personActivationTimeout) {
      clearTimeout(personActivationTimeout);
      personActivationTimeout = null;
      resetAllPersonImages();
    }

    // good 클래스 타이머가 있으면 취소
    if (goodClassTimeout) {
      clearTimeout(goodClassTimeout);
      goodClassTimeout = null;
    }

    // good 클래스들도 초기화
    resetGoodClasses();

    // bgmStageIndex는 초기화하지 않음 (현재 재생 상태 유지)
  }

  // 회전 상태 초기화 (BGM 재생 상태는 유지)
  function resetRotationState() {
    rotationHistory = [];
    correctRotationStartTime = null;
    correctRotationDuration = 0;
    lastRotationTime = 0;
    // lastBgmPlayTime과 rotationAfterBgm은 유지하여 BGM 진행 상황 보존
    // rotationAfterBgm = 0; // 제거: 드래그 끊겨도 회전량 유지
    // totalRotationForFirstBgm = 0; // 제거: 드래그 끊겨도 첫 번째 BGM 회전량 유지

    // person 활성화 타이머 정리
    if (personActivationTimeout) {
      clearTimeout(personActivationTimeout);
      personActivationTimeout = null;
      resetAllPersonImages();
    }

    // good 클래스 타이머 정리
    if (goodClassTimeout) {
      clearTimeout(goodClassTimeout);
      goodClassTimeout = null;
    }

    // good 클래스들도 초기화
    resetGoodClasses();

    if (isCorrectRotation) {
      isCorrectRotation = false;
      stopBGMSequence(); // 현재 재생 중인 BGM은 보호됨
    }
  }

  // 가사 동기화 시작
  function startLyricsSync() {
    // 기존 인터벌 정리
    if (lyricsInterval) {
      clearInterval(lyricsInterval);
    }

    // BGM 재생 이벤트 리스너 추가
    $mainPlayBgm.addEventListener("play", onMainBgmPlay);
    $mainPlayBgm.addEventListener("pause", onMainBgmPause);
    $mainPlayBgm.addEventListener("ended", onMainBgmEnded);

    // 현재 재생 중이면 즉시 동기화 시작
    if (!$mainPlayBgm.paused) {
      onMainBgmPlay();
    }
  }

  // BGM 재생 시작 시
  function onMainBgmPlay() {
    updateLyricsClass();
    lyricsInterval = setInterval(updateLyricsClass, 100); // 100ms마다 체크
  }

  // BGM 일시정지 시
  function onMainBgmPause() {
    if (lyricsInterval) {
      clearInterval(lyricsInterval);
      lyricsInterval = null;
    }
  }

  // BGM 종료 시 (루프로 다시 시작됨)
  function onMainBgmEnded() {
    // 루프 재생이므로 자동으로 다시 시작됨
    // play 이벤트가 다시 발생하여 onMainBgmPlay가 호출됨
  }

  // 현재 시간에 맞는 가사 클래스 업데이트
  function updateLyricsClass() {
    if ($mainPlayBgm.paused) return;

    const currentTime = $mainPlayBgm.currentTime;

    // 현재 시간에 해당하는 가사 타이밍 찾기
    const currentTiming = lyricsTimings.find(
      (timing) => currentTime >= timing.start && currentTime < timing.end
    );

    if (currentTiming) {
      // 모든 가사 클래스 제거
      $lyricsWrapper.removeClass("common lyrics-1 lyrics-2 lyrics-3 lyrics-4");

      // 현재 시간에 맞는 클래스 추가
      if (currentTiming.className) {
        $lyricsWrapper.addClass(currentTiming.className);
      }
    }
  }

  // 가사 동기화 정리
  function stopLyricsSync() {
    if (lyricsInterval) {
      clearInterval(lyricsInterval);
      lyricsInterval = null;
    }

    // 이벤트 리스너 제거
    $mainPlayBgm.removeEventListener("play", onMainBgmPlay);
    $mainPlayBgm.removeEventListener("pause", onMainBgmPause);
    $mainPlayBgm.removeEventListener("ended", onMainBgmEnded);

    // 가사 클래스 모두 제거
    $lyricsWrapper.removeClass("common lyrics-1 lyrics-2 lyrics-3 lyrics-4");
  }

  // 모든 Person 이미지를 1초간 active 상태로 변경
  function activatePersonImagesTemporarily() {
    // 기존 타이머가 있으면 취소
    if (personActivationTimeout) {
      clearTimeout(personActivationTimeout);
    }

    // 모든 person 이미지를 active로 변경
    personElements.forEach(($person, index) => {
      const activeImageSrc = personImages.active[index];
      $person.attr("src", activeImageSrc);
      $person.addClass("active");
    });

    // 1초 후 normal 상태로 복구
    personActivationTimeout = setTimeout(() => {
      resetAllPersonImages();
      personActivationTimeout = null;
    }, 1000);
  }

  // 모든 Person 이미지를 normal 상태로 초기화
  function resetAllPersonImages() {
    personElements.forEach(($person, index) => {
      const normalImageSrc = personImages.normal[index];
      $person.attr("src", normalImageSrc);
      $person.removeClass("active");
    });
  }

  // good-wrapper에 해당 stage 클래스를 1초간 추가
  function addGoodClass(stageIndex) {
    const goodClasses = ["good-1", "good-2", "good-3"];

    if (stageIndex >= 0 && stageIndex < goodClasses.length) {
      const goodClass = goodClasses[stageIndex];

      // 기존 타이머가 있으면 취소
      if (goodClassTimeout) {
        clearTimeout(goodClassTimeout);
      }

      // 기존 good 클래스들 제거 후 새로운 클래스 추가
      $goodWrapper.removeClass("good-1 good-2 good-3");
      $goodWrapper.addClass(goodClass);

      console.log(`Good class ${goodClass} added for 1 second`);

      // 1초 후 클래스 제거
      goodClassTimeout = setTimeout(() => {
        $goodWrapper.removeClass(goodClass);
        goodClassTimeout = null;
        console.log(`Good class ${goodClass} removed after 1 second`);
      }, 1000);
    }
  }

  // good-wrapper의 모든 good 클래스 제거
  function resetGoodClasses() {
    $goodWrapper.removeClass("good-1 good-2 good-3");
    console.log("All good classes reset");
  }

  $(".select-2-songpyun").on("click", function () {
    $(".select-2-songpyun").fadeOut(500);

    setTimeout(() => {
      $(".select-2-songpyun-half").fadeIn(500);
    }, 500);
  });

  $(".select-2-songpyun-half").on("click", function () {
    $(".select-2-songpyun-half").fadeOut(500);

    setTimeout(() => {
      $(".message").fadeIn(500);
    }, 500);
  });

  const $messageSound = $("#message-sound")[0];
  $(".message").on("click", function () {
    $(".message-content-2").removeClass("display-none");
    $(".message-content-2").fadeIn(500);
    $(".songpyun-before").fadeOut(500);
    $messageSound.play();
  });

  $(".message-content-close").on("click", function () {
    $(".message-content-2").fadeOut(500);
    $(".songpyun-before").fadeIn(500);
    $messageSound.pause();
    $messageSound.currentTime = 0;
  });
});
