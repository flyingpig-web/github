/* 1_INTRO — 도입 컷 시퀀스(9컷) → 목표① → 2_EXP①(잠입 게임)
   진행: hot(해당 오브젝트 glow+손 터치) / next(자막 컷 → [다음] 버튼).
   자막·내레이션은 구성안(PDF 5~14p) 카피. hot 좌표(정규화)는 예시이미지 그리드 기준. */
document.title = "도입 — 한국의 호소";

$(function () {
  const B = "img/1_INTRO/";
  const C = "img/common/";

  // 목표① 배경 = 유라시아 전도(부산 → 블라디보스토크 경로). bridge_bg1-1 과 동일 소스.
  const OBJ_BG = B + "intro_bg5-2.png";

  const cuts = [
    // 도입1-1 : 어두운 회의장, 책상 위 조약 문서 터치
    { img: B + "intro_bg1-1.png", hot: { x: 0.5, y: 0.63 } },
    // 도입1-2 : 자막
    {
      img: B + "intro_bg1-2.png",
      text: "1905년, 일본은 을사늑약으로 대한제국의 외교권을 빼앗았다.",
      vo: "intro_1-2.wav",
      next: true,
    },
    // 도입2-1 : 중명전 집무실, 고종(발광 실루엣) 터치
    { img: B + "intro_bg2-1.png", hot: { x: 0.6, y: 0.64 } },
    // 도입2-2 : 자막
    {
      img: B + "intro_bg2-2.png",
      text: "고종 황제는 조약의 위법성을 알리려 외국에 친서를 보냈으나,\n일본은 고종 황제를 덕수궁에 가두고 삼엄하게 감시했다.",
      vo: "intro_2-2.wav",
      next: true,
    },
    // 도입3-1 : 밤 침실, 편지(서찰) 터치
    { img: B + "intro_bg3-1.png", hot: { x: 0.48, y: 0.67 } },
    // 도입3-2 : 자막
    {
      img: B + "intro_bg3-2.png",
      text: "그러던 1907년, 세계 각국 대표가 모이는 만국평화회의가\n네덜란드 헤이그에서 개최된다는 소식이 전해졌다.",
      vo: "intro_3-2.wav",
      next: true,
    },
    // 도입4-1 : 백지 위임장 클로즈업, 위임장 터치
    { img: B + "intro_bg4-1.png", hot: { x: 0.46, y: 0.64 } },
    // 도입4-2 : 자막
    {
      img: B + "intro_bg4-2.png",
      text: "고종 황제는 이준을 비밀리에 불러들여 백지 위임장을 건넸다.",
      vo: "intro_4-2.wav",
      next: true,
    },
    // 도입4-3 : 타이포 컷(문구가 이미지에 렌더되어 있어 자막바 미표시) + 고종 V.O.
    {
      img: B + "intro_bg5-1.png",
      vo: "intro_4-3.wav",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      OBJ_BG,
      B + "intro_popup_objective.png",
      C + "btn_ok.png",
      C + "icon_touch_effect.png",
      C + "icon_touch.png",
      C + "text_bg.png",
      C + "skip_btn.png",
      C + "story_next_btn.png",
    ]);

  AR.preload(assets).then(() => {
    AR.Sound.armBgm("audio/BGM.mp3", { volume: 0.35 });
    AR.CutRunner({
      stage: ".container",
      bg: "#cutBg",
      textEl: "#subtitleText",
      subtitle: "#subtitle",
      hotspot: "#hotspot",
      nextBtn: "#btnNext",
      skipBtn: "#btnSkip",
      voDir: "audio/", // 컷 도달 시 vo 자동재생(파일 없으면 무음)
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표① 팝업 → [확인] → exp1
      onSkip: showObjective, // 스킵 → 목표①까지만
    }).start();
  });

  function showObjective() {
    // 목표① 배경 = 이동 경로 지도. cut-bg 는 crossTo 용 twin 이 있어 둘 다 교체한다.
    $(".cut-bg").css("background-image", `url("${OBJ_BG}")`);
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  // 목표① [확인] → 2_EXP① 이동
  $("#objConfirm").on("click", () => AR.go("exp1.html"));
});
