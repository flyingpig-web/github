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
  // 이름/번호 위치·크기·색은 CSS(.cert-name/.cert-no) 가 단일 기준.
  // 스크랩 시 화면의 해당 요소 위치를 측정해 그대로 캔버스에 그림 → 화면=스크랩 일치.
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

  // 화면의 텍스트 요소(el)를 수료증 이미지(imgRect) 기준으로 캔버스(c)에 동일 위치/크기로 그림
  function drawDomText(g, el, imgRect, c) {
    const text = (el.textContent || "").trim();
    if (!text || !imgRect.width) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const sx = c.width / imgRect.width;
    const sy = c.height / imgRect.height;
    g.fillStyle = cs.color;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * sy}px ${cs.fontFamily}`;
    g.textBaseline = "top";
    g.textAlign = "left";
    // 자간(letter-spacing): canvas fillText 는 자간을 무시하므로 글자별로 그림
    const ls = (parseFloat(cs.letterSpacing) || 0) * sy;
    let x = (r.left - imgRect.left) * sx;
    const y = (r.top - imgRect.top) * sy;
    for (const chr of text) {
      g.fillText(chr, x, y);
      x += g.measureText(chr).width + ls;
    }
  }

  /* ----- 스크랩(캔버스 합성 다운로드) ----- */
  $("#btnScrap").on("click", function () {
    const name = $name.val().trim();
    if (!name) {
      $name.focus();
      alert("이름을 입력해 주세요.");
      return;
    }
    $certName.text(name); // 화면 동기화(측정 기준)

    const base = new Image();
    base.crossOrigin = "anonymous";
    base.onload = function () {
      const c = document.createElement("canvas");
      c.width = base.naturalWidth;
      c.height = base.naturalHeight;
      const g = c.getContext("2d");

      function render() {
        g.drawImage(base, 0, 0);
        const certImg = document.querySelector(".end-cert .cert-img");
        const imgRect = certImg.getBoundingClientRect();
        drawDomText(g, $certNo[0], imgRect, c); // 번호
        drawDomText(g, $certName[0], imgRect, c); // 이름

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

      // 폰트(Pretendard) 로드 완료 후 렌더 → 글자폭/위치 정확
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(render).catch(render);
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
