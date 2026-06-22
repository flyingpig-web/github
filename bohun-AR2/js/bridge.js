/* 3_Bridge — 연결 컷(8컷) → 목표② → 4_EXP②-AR(유니티 로딩화면)
   진행: hot(오브젝트 터치) / next(자막+[다음]). 자막은 PDF 24~32p 카피. */
document.title = "연결 — 청산리의 독립군";

$(function () {
  const B = "img/3_Bridge/";

  const cuts = [
    // 1-1 발자국 터치
    { img: B + "bridge_bg1-1.png", hot: { x: 0.4, y: 0.62 } },
    // 1-2 자막
    {
      img: B + "bridge_bg1-2.png",
      text: "“일본군이 우리를 도와준 동포들까지 위협하니, 더는 가만히 앉아 지켜볼 수 없을 지경이다.”",
      vo: "bridge_1-2.wav",
      next: true,
    },
    // 2-1 모닥불 터치
    { img: B + "bridge_bg2-1.png", hot: { x: 0.48, y: 0.5 } },
    // 2-2 자막
    {
      img: B + "bridge_bg2-2.png",
      text: "“그동안 동포들의 도움으로 버텨온 우리가, 어찌 그들의 위협을 모른 척할 수 있겠는가?”",
      vo: "bridge_2-2.wav",
      next: true,
    },
    // 3-1 김좌진 장군과 간부들 터치
    { img: B + "bridge_bg3-1.png", hot: { x: 0.5, y: 0.5 } },
    // 3-2 자막
    {
      img: B + "bridge_bg3-2.png",
      text: "“적의 병력과 무기가 우리보다 훨씬 강하지만, 청산리의 험한 산세는 우리 편이 되어 줄 것이다.”",
      vo: "bridge_3-2.wav",
      next: true,
    },
    // 4-1 백운평 계곡 입구 터치
    { img: B + "bridge_bg4-1.png", hot: { x: 0.5, y: 0.5 } },
    // 4-2 자막 → 목표②
    {
      img: B + "bridge_bg4-2.png",
      text: "“백운평 골짜기로 끌어들여 측각을 잡고 싸우면, 우리는 반드시 일본군을 이길 수 있을 것이다.”",
      vo: "bridge_4-2.wav",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "bridge_popup_objective.png",
      "img/1_Intro/icon_touch_effect.png",
      "img/1_Intro/icon_touch.png",
      "img/1_Intro/btn_ok.png",
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
      voDir: "audio/narrations/",
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표② → [임무 확인] → 4_EXP②-AR
      onSkip: showObjective,
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  $("#btnObjConfirm").on("click", function () {
    // 4_EXP②-AR 은 유니티 담당. 웹은 진입 셸(exp2.html)로 이동.
    AR.go("exp2.html");
  });
});
