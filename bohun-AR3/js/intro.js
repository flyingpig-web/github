/* 1_INTRO — 도입 컷 시퀀스(9컷) → 목표① → 2_EXP①(병력 이동 방어 게임)
   진행: hot(해당 오브젝트 glow+손 터치) / next(자막 컷 → [다음] 버튼).
   자막은 구성안(PDF 5~14p) 카피. hot 좌표(정규화)는 예시이미지 기준 근사값(미세조정 가능). */
document.title = "도입 — 크리스마스의 기적";

$(function () {
  const B = "img/1_INTRO/";

  const cuts = [
    // 1-1 북진하는 연합군(좌하단 발광부) 터치
    { img: B + "intro_bg1-1.png", hot: { x: 0.3, y: 0.66 } },
    // 1-2 자막
    {
      img: B + "intro_bg1-2.png",
      text: "1950년 11월, 국군과 유엔군은 북쪽으로 진격하였고,\n그중 미 제1해병사단은 함경남도 장진호 일대로 나아가고 있었다.",
      vo: "intro_1-2.wav",
      next: true,
    },
    // 2-1 산맥 능선 터치
    { img: B + "intro_bg2-1.png", hot: { x: 0.63, y: 0.26 } },
    // 2-2 자막
    {
      img: B + "intro_bg2-2.png",
      text: "그러던 11월 27일 밤. 영하 30도의 깊은 산속에 갑자기 기괴한 나팔과 꽹과리 소리가 울려 퍼졌다.",
      vo: "intro_2-2.wav",
      next: true,
    },
    // 3-1 조명총(조명탄) 터치
    { img: B + "intro_bg3-1.png", hot: { x: 0.4, y: 0.54 } },
    // 3-2 자막
    {
      img: B + "intro_bg3-2.png",
      text: "12만 명에 달하는 중국군이 몰려와 3만 명의 연합군을 추위와 공포 속에 몰아넣었다.",
      vo: "intro_3-2.wav",
      next: true,
    },
    // 4-1 막사 안 꺼진 조명 터치
    { img: B + "intro_bg4-1.png", hot: { x: 0.51, y: 0.15 } },
    // 4-2 자막
    {
      img: B + "intro_bg4-2.png",
      text: "미 제1해병사단장 올리버 스미스 장군은 고심 끝에 결단을 내렸다.",
      vo: "intro_4-2.wav",
      next: true,
    },
    // 4-3 자막(타이포) → 목표①
    {
      img: B + "intro_bg4-3.png",
      vo: "intro_4-3.wav",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "intro_popup_objective.png",
      B + "icon_touch_effect.png",
      B + "icon_touch.png",
      B + "text_bg.png",
      B + "skip_btn.png",
      B + "story_next_btn.png",
    ]);

  AR.preload(assets).then(() => {
    AR.CutRunner({
      stage: ".container",
      bg: "#cutBg",
      textEl: "#subtitleText",
      subtitle: "#subtitle",
      hotspot: "#hotspot",
      nextBtn: "#btnNext",
      skipBtn: "#btnSkip",
      voDir: "audio/narrations/", // 컷 도달 시 vo 자동재생(파일 없으면 무음)
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표① 팝업 → [확인] → exp1
      onSkip: showObjective, // 스킵 → 목표①까지만
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  // 목표 박스(또는 딤드) 터치 → 2_EXP① 이동
  $("#objConfirm").on("click", () => AR.go("exp1.html"));
});
