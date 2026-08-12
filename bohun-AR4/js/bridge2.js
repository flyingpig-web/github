/* 5_Bridge② — 목표③ 전용 화면(컷 없음, PDF 52p)
   배경(축음기 장면) 딤드 + 목표③ 팝업 → [확인] → 6_EXP③ */
document.title = "연결② — 한국의 호소";

$(function () {
  const assets = [
    "img/6_EXP3/exp3_bg.png",
    "img/5_BRIDGE2/bridge2_popup_objective.png",
    "img/common/btn_ok.png",
  ];

  AR.preload(assets).then(() => {
    AR.Sound.armBgm("audio/BGM.mp3", { volume: 0.35 });
    AR.openPopup("#objectiveDim");
  });

  $("#objConfirm").on("click", () => AR.go("exp3.html"));
});
