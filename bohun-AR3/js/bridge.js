/* 3_Bridge — 연결 컷(현봉학·알몬드 장군 설득 서사) → 목표② → 4_EXP②-AR
   진행: hot(오브젝트 터치) / next(자막+[다음]). 일부 컷은 자막+핫스팟 동시.

   ⚠️ 2026-08-13 "자문 후 수정요청안"(p9~17)으로 연결 파트를 전면 개편했다.
      · 서사: 라루 선장(메러디스 빅토리호 선원) 시점 → 미 10군단 통역관 현봉학의 설득으로 교체
      · 컷 구조: 1-1 / 2-1 / 2-2 / 3-1 / 3-2 / 4-1 / 4-2 / 5-1 / 5-2 (9컷)
      · 배경 9장 전부 신규 에셋(bridge_bg1-1 ~ 5-2). 구버전 bg1-2 / bg1-3 는 삭제됨.
      · 나레이션은 자막이 있는 6컷에만 붙는다(2-1 / 3-1 / 4-1 은 "자막 삭제"라 무음).
      · bridge_bg4-2 와 bridge_bg5-1 은 같은 그림(자막·진행방식만 다름).
      · 목표② 뒤 배경 = 마지막 컷(bridge_bg5-2). CutRunner 가 마지막 컷 배경을 그대로 두므로
        별도 교체 로직이 필요 없다(스킵 시에도 마지막 컷으로 crossTo 됨).
   hot 좌표(정규화)는 수정요청안 목업 실측값. */
document.title = "연결 — 크리스마스의 기적";

$(function () {
  const B = "img/3_BRIDGE/";

  const cuts = [
    // 연결1-1 : 흥남항 전경 — [다음] 진행(기존 Glow 터치는 삭제)
    {
      img: B + "bridge_bg1-1.png",
      text: "1950년 12월, 흥남항에서는 연합군의 대규모 철수 작전이 진행되고 있었다.",
      vo: "bridge_1-1.wav",
      next: true,
    },
    // 연결2-1 : 부두를 메운 피란민 — 어머니와 아이 터치(자막 없음)
    { img: B + "bridge_bg2-1.png", hot: { x: 0.49, y: 0.61 } },
    // 연결2-2 : 자막
    {
      img: B + "bridge_bg2-2.png",
      text: "하지만 항구에는 군인들뿐만 아니라, 전쟁을 피해 남쪽으로 가려는 수많은 피란민이 모여 있었다.",
      vo: "bridge_2-2.wav",
      next: true,
    },
    // 연결3-1 : 뒷짐 지고 선 인물(현봉학) 터치(자막 없음)
    { img: B + "bridge_bg3-1.png", hot: { x: 0.22, y: 0.58 } },
    // 연결3-2 : 자막
    {
      img: B + "bridge_bg3-2.png",
      text: "미 10군단 통역을 맡았던 현봉학은 눈앞의 피란민들을 외면할 수 없었다.",
      vo: "bridge_3-2.wav",
      next: true,
    },
    // 연결4-1 : 군단 사령부 — 코트를 입은 인물(현봉학) 터치(자막 없음)
    { img: B + "bridge_bg4-1.png", hot: { x: 0.43, y: 0.44 } },
    // 연결4-2 : 자막 + [다음]
    {
      img: B + "bridge_bg4-2.png",
      text: "“장군님, 피란민들을 이대로 두고 갈 수 없습니다. 함께 가야 합니다!”",
      vo: "bridge_4-2.wav",
      next: true,
    },
    // 연결5-1 : 자막 + 고민하는 알몬드 장군 터치([다음] 없음)
    {
      img: B + "bridge_bg5-1.png",
      text: "현봉학의 간절한 설득에 알몬드 장군은 결단을 내렸다.",
      vo: "bridge_5-1.wav",
      hot: { x: 0.63, y: 0.53 },
    },
    // 연결5-2 : 자막 → 목표②
    {
      img: B + "bridge_bg5-2.png",
      text: "“좋소. 가능한 한 많은 피란민을 함께 철수시키도록 합시다.”",
      vo: "bridge_5-2.wav",
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
  $("#objConfirm").on("click", () => AR.go("exp2_ar/index.html"));
});
