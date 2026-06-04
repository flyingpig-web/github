/* 1_INTRO — 도입 컷 시퀀스(9컷) → 목표① → exp1(유니티)
   - 진행 방식은 프로토타입(PDF 5~14p) 기준:
     · hot: 해당 오브젝트(glow+손)를 터치해야 다음 컷.
     · next: 자막 컷 → [다음] 버튼으로 진행.
   - 자막은 PDF 카피 그대로. hot 좌표(정규화)는 예시이미지 기준 근사값(미세조정 가능). */
document.title = "도입 — 긴급 임무";

$(function () {
  const B = "img/1_INTRO/";

  const cuts = [
    // 1-1 태극기 터치
    { img: B + "intro_bg1-1.png", hot: { x: 0.55, y: 0.17 } },
    // 1-2 [다음] (자막 — 한 줄, 폭 맞춰 자동 축소)
    {
      img: B + "intro_bg1-2.png",
      text: "1940년 9월 17일, 대한민국 임시정부는 충칭에서 정규군인 한국광복군을 창설했다.",
      next: true,
    },
    // 2-1 광복군 훈련 이미지 터치
    { img: B + "intro_bg2-1.png", hot: { x: 0.48, y: 0.16 } },
    // 2-2 [다음] (자막)
    {
      img: B + "intro_bg2-2.png",
      text: "이후 한국광복군은 인도·버마 전선 등에서 연합군과 협력하며 항일 작전을 이어 갔다.",
      next: true,
    },
    // 3-1 장교 막사 건물 터치
    { img: B + "intro_bg3-1.png", hot: { x: 0.4, y: 0.6 } },
    // 3-2 작전 현황판 터치 (자막)
    {
      img: B + "intro_bg3-2.png",
      text: "1944년, 한국광복군은 미국 OSS와 함께 조국으로 향하기 위한 국내 진공작전을 추진했다.",
      hot: { x: 0.42, y: 0.62 },
    },
    // 3-3 [다음] (자막)
    {
      img: B + "intro_bg3-3.png",
      text: "1945년 봄, 한국광복군 제2지대는 무전, 정보수집, 폭파, 침투 등 OSS 특수훈련에 들어갔다.",
      next: true,
    },
    // 4-1 해 터치
    { img: B + "intro_bg4-1.png", hot: { x: 0.78, y: 0.4 } },
    // 4-2 [다음] → 목표① (자막, 스킵 없음)
    {
      img: B + "intro_bg4-2.png",
      text: "하지만 작전 준비가 진행될수록 훈련소 경비와 보안 유지도 광복군의 주요 임무가 됐다.",
      next: true,
      skip: false,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "intro_popup_objective.png",
      "img/common/icon_touch_effect.png",
      B + "icon_touch.png",
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
      onEnd: showObjective, // 마지막 컷 [다음] → 목표① 팝업 → [임무 확인] → exp1
      onSkip: () => AR.go("exp1.html"), // 스킵 → 바로 EXP①(유니티)
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
