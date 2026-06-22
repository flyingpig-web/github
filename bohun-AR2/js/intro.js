/* 1_INTRO — 도입 컷 시퀀스(9컷) → 목표① → 2_EXP①(미로/물자 게임)
   - 진행 방식(PDF 6~15p):
     · hot: 해당 오브젝트(glow+손)를 터치해야 다음 컷.
     · next: 자막 컷 → [다음] 버튼으로 진행.
   - 자막은 PDF Script/Video 카피. hot 좌표(정규화)는 예시이미지 기준 근사값(미세조정 가능). */
document.title = "도입 — 청산리의 독립군";

$(function () {
  const B = "img/1_Intro/";

  const cuts = [
    // 1-1 간도 지역(지도 발광부) 터치
    { img: B + "intro_bg1-1.png", hot: { x: 0.59, y: 0.28 } },
    // 1-2 자막
    {
      img: B + "intro_bg1-2.png",
      text: "1905년 을사늑약과 1910년 경술국치를 거치며, 나라를 잃은 한인들은 간도로 향했다.",
      vo: "intro_1-2.wav",
      next: true,
    },
    // 2-1 초가집 터치
    { img: B + "intro_bg2-1.png", hot: { x: 0.6, y: 0.55 } },
    // 2-2 자막 (서전서숙 / 신흥무관학교)
    {
      img: B + "intro_bg2-2.png",
      text: "한인들은 간도의 학교를 세웠고, 민족교육을 통해 독립운동의 힘을 키웠다.",
      vo: "intro_2-2.wav",
      next: true,
    },
    // 3-1 바위 터치
    { img: B + "intro_bg3-1.png", hot: { x: 0.56, y: 0.53 } },
    // 3-2 자막
    {
      img: B + "intro_bg3-2.png",
      text: "3·1운동 이후, 간도의 독립군들은 힘을 모아 항일 무장투쟁을 더욱 활발히 펼쳐 나갔다.",
      vo: "intro_3-2.wav",
      next: true,
    },
    // 4-1 주민들 터치
    { img: B + "intro_bg4-1.png", hot: { x: 0.7, y: 0.59 } },
    // 4-2 자막
    {
      img: B + "intro_bg4-2.png",
      text: "그 무장투쟁의 뒤에는, 식량과 물자를 나누며 독립군을 도운 간도 한인들이 있었다.",
      vo: "intro_4-2.wav",
      next: true,
    },
    // 5-1 자막 → 목표①
    {
      img: B + "intro_bg5.png",
      text: "이에 일본은 훈춘 사건을 구실로 간도에 군대를 보냈고,\n독립군이 활동하는 청산리 일대에도 긴장감이 높아졌다.",
      vo: "intro_5-1.wav",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "intro_popup_objective.png",
      B + "icon_touch_effect.png",
      B + "icon_touch.png",
      B + "btn_ok.png",
      B + "text_bg.png",
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
      voDir: "audio/narrations/", // 컷 도달 시 vo 파일 자동재생(없으면 무음)
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표① 팝업 → [임무 확인] → exp1
      onSkip: showObjective, // 스킵 → 목표①까지만
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  $("#btnObjConfirm").on("click", function () {
    AR.go("exp1.html");
  });
});
