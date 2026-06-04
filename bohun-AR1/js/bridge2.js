/* 5_Bridge② — 연결 컷(4컷) → 목표③ → exp3(운전게임)
   진행: hot(오브젝트 터치) / next(자막+[다음]). 자막은 PDF 35~39p 카피. */
document.title = "연결② — 서신 전달 임무";

$(function () {
  const B = "img/5_Bridge2/";

  const cuts = [
    // 1-1 메모지 터치
    { img: B + "bridge2_bg1-1.png", hot: { x: 0.48, y: 0.6 } },
    // 1-2 [다음] (자막)
    {
      img: B + "bridge2_bg1-2.png",
      text: "“현시간부터 각 지대는 즉시 보안 태세에 돌입하라”는 총사령부의 명령이 떨어졌다.",
      next: true,
    },
    // 2-1 짚차 터치
    { img: B + "bridge2_bg2-1.png", hot: { x: 0.62, y: 0.55 } },
    // 2-2 [다음] → 목표③ (자막)
    {
      img: B + "bridge2_bg2-2.png",
      text: "총사령부에서 서신을 받아, 각 지대에 직접 전달해야 한다!",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "bridge2_popup_objective.png",
      "img/common/icon_touch_effect.png",
      "img/1_INTRO/icon_touch.png",
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
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표③ → [임무 확인] → exp3
      onSkip: showObjective, // 스킵 → 목표③까지만(바로 exp3 로 가지 않음)
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  $("#btnObjConfirm").on("click", function () {
    AR.go("exp3.html");
  });
});
