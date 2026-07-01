/* 4_EXP②-AR — AR 체험(유니티 담당, 웹 미구현)
   웹은 진입 셸만 제공: 완료(탑승 완료) 팝업으로 다음 단계 이동.
   - [다음으로] → 5_END(end.html)
   - [다시 하기] → 현재 페이지 재진입(AR 재시작 자리) */
document.title = "EXP② — AR 체험 (크리스마스의 기적)";

$(function () {
  const assets = [
    "img/4_EXP2-AR/ar_select_bg.png",
    "img/4_EXP2-AR/exp2_popup_finish.png",
    "img/4_EXP2-AR/exp_popup_btn_next.png",
    "img/4_EXP2-AR/exp_popup_btn_retry.png",
  ];

  AR.preload(assets).then(() => {
    AR.openPopup("#finishDim"); // 진입 시 탑승 완료 팝업 표시
  });

  $("#btnNext").on("click", () => AR.go("end.html"));
  $("#btnRetry").on("click", () => location.reload());
});
