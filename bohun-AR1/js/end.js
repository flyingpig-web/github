/* =========================================================================
   7_END 수료증
   - 이름 input → 수료증 위 이름 동기화. 번호 = YYMMDD 자동 생성.
   - [수료증 스크랩] = 수료증 이미지 + 이름/번호를 캔버스로 합성해 PNG 다운로드
     (외부 라이브러리 없이 캔버스 합성 = 전 브라우저 호환).
   ⚠️ 수료증 위 이름/번호 좌표는 임시값(Open Item: 수료증 레이아웃 확정).
      CSS(.cert-name/.cert-no) 와 아래 POS 를 함께 맞춘다.
   ========================================================================= */
document.title = "수료증 — 한국광복군 제2지대 OSS";

$(function () {
  // 수료증 natural 좌표(0~1) — CSS 오버레이와 동일하게 유지
  const POS = {
    nameX: 0.2,
    nameY: 0.435,
    nameFont: 0.03, // 글자 높이 / 수료증 높이
    noX: 0.12,
    noY: 0.105,
    noFont: 0.018,
    color: "#1c1208",
    noColor: "#5a4327",
  };

  const $name = $("#nameInput");
  const $certName = $("#certName");
  const $certNo = $("#certNo");

  // 수료증 번호: YYMMDD
  function todayNo() {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  }
  const certNumber = todayNo();
  $certNo.text(`제 ${certNumber} 호`);

  // 이름 동기화
  $name.on("input", function () {
    $certName.text($name.val().trim());
  });

  /* ----- 스크랩(캔버스 합성 다운로드) ----- */
  $("#btnScrap").on("click", function () {
    const name = $name.val().trim();
    if (!name) {
      $name.focus();
      alert("이름을 입력해 주세요.");
      return;
    }
    const base = new Image();
    base.crossOrigin = "anonymous";
    base.onload = function () {
      const c = document.createElement("canvas");
      c.width = base.naturalWidth;
      c.height = base.naturalHeight;
      const g = c.getContext("2d");

      const noPx = Math.round(c.height * POS.noFont);
      const namePx = Math.round(c.height * POS.nameFont);
      const FAM = '"Pretendard Variable", Pretendard, sans-serif';
      const noFont = `${noPx}px ${FAM}`;
      const nameFont = `600 ${namePx}px ${FAM}`;

      function render() {
        g.drawImage(base, 0, 0);
        // 번호
        g.fillStyle = POS.noColor;
        g.font = noFont;
        g.textBaseline = "alphabetic";
        g.fillText(`제 ${certNumber} 호`, c.width * POS.noX, c.height * POS.noY);
        // 이름
        g.fillStyle = POS.color;
        g.font = nameFont;
        g.fillText(name, c.width * POS.nameX, c.height * POS.nameY);

        try {
          const url = c.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = url;
          a.download = `한국광복군_OSS_수료증_${name}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch (e) {
          alert("이미지 저장에 실패했습니다. 화면을 캡처해 주세요.");
        }
      }

      // 캔버스 fillText 는 폰트 선로딩이 필요 — Pretendard 로드 후 렌더(미지원 시 즉시)
      if (document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load(noFont, `제 ${certNumber} 호`),
          document.fonts.load(nameFont, name),
        ])
          .then(render)
          .catch(render);
      } else {
        render();
      }
    };
    base.src = "img/7_END/end_image.png";
  });

  // 처음으로
  $("#btnHome").on("click", () => AR.go("index.html"));

  AR.preload([
    "img/7_END/end_bg.png",
    "img/7_END/end_image.png",
    "img/7_END/end_title.png",
    "img/7_END/end_text_box.png",
    "img/7_END/end_scrap.png",
    "img/7_END/end_home.png",
  ]);
});
