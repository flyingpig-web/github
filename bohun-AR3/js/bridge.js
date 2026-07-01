/* 3_Bridge — 연결 컷(메러디스 빅토리호 이야기) → 목표② → 4_EXP②-AR
   진행: hot(오브젝트 터치) / next(자막+[다음]). 일부 컷은 자막+핫스팟 동시.
   자막은 구성안(PDF 22~31p) 카피. hot 좌표(정규화)는 예시이미지 기준 근사값(미세조정 가능). */
document.title = "연결 — 크리스마스의 기적";

$(function () {
  const B = "img/3_BRIDGE/";

  const cuts = [
    // 연결1-1 : 항구 전경 + 메러디스 빅토리호 터치
    {
      img: B + "bridge_bg1-1.png",
      text: "흥남항에는 수많은 배가 군인과 무기, 차량과 군수 물자를 싣고 있었다.",
      vo: "bridge_1-1.wav",
      hot: { x: 0.73, y: 0.35 },
    },
    // 연결2-1 : 메러디스호 클로즈 + 군수품 터치
    {
      img: B + "bridge_bg1-2.png",
      text: "마지막까지 부두에 남아 있던 한 척의 배. 거대한 화물선 메러디스 빅토리호였다.",
      vo: "bridge_2-1.wav",
      hot: { x: 0.38, y: 0.66 },
    },
    // 연결2-2 : 자막
    {
      img: B + "bridge_bg1-3.png",
      text: "“우리 배는 원래 군수 물자를 실어 나르는 화물선이었습니다. 사람을 태울 공간이 아니었지요.”",
      vo: "bridge_2-2.wav",
      next: true,
    },
    // 연결3-1 : 피란민 행렬 + 아이와 어머니 터치
    { img: B + "bridge_bg2-1.png", hot: { x: 0.51, y: 0.66 } },
    // 연결3-2 (1) : 자막
    {
      img: B + "bridge_bg2-2.png",
      text: "“하지만 부두에는 아직 배에 오르지 못한 피란민들이 가득했습니다.”",
      vo: "bridge_3-2a.wav",
      next: true,
    },
    // 연결3-2 (2) : 이어지는 자막
    {
      img: B + "bridge_bg2-2.png",
      text: "“영하 20도의 매서운 추위 속, 적군은 점점 가까워지고 있었습니다. 저 사람들을 두고 갈 수는 없었습니다.”",
      vo: "bridge_3-2b.wav",
      next: true,
    },
    // 연결4-1 : 갑판 군수품 + 군수품 터치
    {
      img: B + "bridge_bg3-1.png",
      text: "라루 선장은 결단을 내렸다.",
      vo: "bridge_4-1.wav",
      hot: { x: 0.3, y: 0.51 },
    },
    // 연결4-2 : 자막
    {
      img: B + "bridge_bg3-2.png",
      text: "“무기를 내려라! 한 사람이라도 더 태워야 한다!”",
      vo: "bridge_4-2.wav",
      next: true,
    },
    // 연결4-3 : 자막 → 목표②
    {
      img: B + "bridge_bg3-2.png",
      text: "선원들은 무기와 물자를 내리고 피란민 태울 자리를 만들기 시작했다.",
      vo: "bridge_4-3.wav",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "bridge_popup_objective.png",
      B + "btn_ok.png",
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
      voDir: "audio/narrations/",
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표② → [확인] → 4_EXP②-AR
      onSkip: showObjective,
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  // 목표 박스 터치 → 4_EXP②-AR(웹 진입 셸)로 이동
  $("#objConfirm").on("click", () => AR.go("exp2.html"));
});
