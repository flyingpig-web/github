/* 3_Bridge① — 연결 컷(4컷) → 목표② → exp2(모스게임)
   진행: hot(오브젝트 터치) / next(자막+[다음]). 자막은 PDF 25~29p 카피. */
document.title = "연결① — 침입 보고";

$(function () {
  const B = "img/3_Bridge1/";

  const cuts = [
    // 1-1 손전등 터치
    { img: B + "bridge1_bg1-1.png", hot: { x: 0.3, y: 0.74 } },
    // 1-2 [다음] (자막)
    {
      img: B + "bridge1_bg1-2.png",
      text: "“훈련장비가 보관 중인 창고에 누군가 침입했다. 즉시 대장님께 보고 해야 한다!”",
      next: true,
    },
    // 2-1 이범석 터치
    { img: B + "bridge1_bg2-1.png", hot: { x: 0.42, y: 0.5 } },
    // 2-2 [다음] → 목표② (자막)
    {
      img: B + "bridge1_bg2-2.png",
      text: "“작전 계획이 노출됐을 수 있으니, 즉시 총사령부에 알려라!”",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "bridge1_popup_objective.png",
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
      onEnd: showObjective, // 마지막 컷 [다음] → 목표② → [확인] → exp2
      onSkip: showObjective, // 스킵 → 목표②까지만(바로 exp2 로 가지 않음)
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  $("#btnObjConfirm").on("click", function () {
    AR.go("exp2.html");
  });
});
