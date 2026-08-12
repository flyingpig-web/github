/* 3_Bridge① — 연결 컷 시퀀스(9컷) → 목표② → 4_EXP②-AR
   진행: hot(오브젝트 터치) / next(자막 + [다음]).
   자막·내레이션은 구성안(PDF 26~36p) 카피. 연결2-2/2-3 은 같은 이미지에서 자막만 이어짐. */
document.title = "연결① — 한국의 호소";

$(function () {
  const B = "img/3_BRIDGE1/";
  const C = "img/common/";

  const cuts = [
    // 연결①1-1 : 유라시아 전도 — 이동 경로(지도) 터치
    { img: B + "bridge_bg1-1.png", hot: { x: 0.18, y: 0.24 } },
    // 연결①1-2 : 자막(이상설·이위종 합류 삽화)
    {
      img: B + "bridge_bg1-2.png",
      text: "블라디보스토크에 도착한 이준은 북간도에서 이상설을,\n러시아 수도 상트페테르부르크에서 외교관 이위종과 합류했다.",
      vo: "bridge1_1-2.wav",
      next: true,
    },
    // 연결①2-1 : 러시아 황실의 문 터치
    { img: B + "bridge_bg2-1.png", hot: { x: 0.16, y: 0.33 } },
    // 연결①2-2 : 자막
    {
      img: B + "bridge_bg2-2.png",
      text: "세 특사는 러시아 황제를 만나려 했으나, 일본을 의식한 황제는 끝내 만나주지 않았다.",
      vo: "bridge1_2-2.wav",
      next: true,
    },
    // 연결①2-3 : 같은 이미지에서 자막만 이어짐
    {
      img: B + "bridge_bg2-2.png",
      text: "다행히 이위종의 아버지 이범진의 도움으로, 세 특사는 헤이그로 향할 수 있었다.",
      vo: "bridge1_2-3.wav",
      next: true,
    },
    // 연결①3-1 : 헤이그 HS역 도착
    {
      img: B + "bridge_bg3-1.png",
      text: "1907년 6월 25일, 마침내 세 특사는 헤이그에 도착했다.",
      vo: "bridge1_3-1.wav",
      next: true,
    },
    // 연결①3-2 : 굳게 닫힌 만국평화회의장 문
    {
      img: B + "bridge_bg3-2.png",
      text: "하지만, 일본이 손을 써둔 탓에 회의장 안으로 들어갈 수 없었다.",
      vo: "bridge1_3-2.wav",
      next: true,
    },
    // 연결①4-1 : 광장 — 외국 기자들 무리 터치
    { img: B + "bridge_bg4-1.png", hot: { x: 0.37, y: 0.6 } },
    // 연결①4-2 : 이상설 V.O.
    {
      img: B + "bridge_bg4-2.png",
      text: "회의장에 들어갈 수 없다면, 회의장 밖에서 사람들을 설득합시다!",
      vo: "bridge1_4-2.wav",
      next: true,
    },
  ];

  const assets = cuts
    .map((c) => c.img)
    .concat([
      B + "bridge1_popup_objective.png",
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
      voDir: "audio/",
      cuts,
      onEnd: showObjective, // 마지막 컷 [다음] → 목표② → [확인] → 4_EXP②-AR
      onSkip: showObjective,
    }).start();
  });

  function showObjective() {
    $("#subtitle, #btnNext, #btnSkip, #hotspot").addClass("display-none");
    AR.openPopup("#objectiveDim");
  }

  // 목표② [확인] → 4_EXP②-AR(로딩 → AR 방식 선택)
  $("#objConfirm").on("click", () => AR.go("exp2.html"));
});
