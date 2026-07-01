/* =========================================================================
   5_END — 체험 완료(훈장)
   - 이름 input → 훈장 명판 위 이름 동기화.
   - [훈장 받기] = 훈장 이미지 + 이름을 캔버스로 합성해 PNG 다운로드
     (외부 라이브러리 없이 캔버스 합성 = 전 브라우저 호환).
   - [처음으로] = 0_TITLE(index.html).
   ⚠️ 명판 위 이름 좌표는 임시값(Open Item): CSS(.medal-name) 와 화면 동시 기준.
   ========================================================================= */
document.title = "체험 완료 — 크리스마스의 기적";

$(function () {
  const $name = $("#nameInput");
  const $medalName = $("#medalName");

  // 이름 동기화(명판 위 표시)
  $name.on("input", function () {
    $medalName.text($name.val().trim());
  });

  // 화면의 텍스트 요소(el)를 훈장 이미지(imgRect) 기준으로 캔버스(c)에 동일 위치/크기로 그림
  function drawDomText(g, el, imgRect, c) {
    const text = (el.textContent || "").trim();
    if (!text || !imgRect.width) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const sx = c.width / imgRect.width;
    const sy = c.height / imgRect.height;
    g.fillStyle = cs.color;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * sy}px ${cs.fontFamily}`;
    g.textBaseline = "middle";
    g.textAlign = "left";
    // CSS letter-spacing 반영(캔버스 fillText 는 자간을 무시하므로 한 글자씩 그림)
    const ls = (parseFloat(cs.letterSpacing) || 0) * sx;
    const chars = [...text];
    // 보이는 글자열 폭(글자폭 합 + 글자 사이 자간) — 박스 중앙 정렬용
    const runW =
      chars.reduce((w, ch) => w + g.measureText(ch).width, 0) +
      ls * Math.max(0, chars.length - 1);
    const boxL = (r.left - imgRect.left) * sx;
    const boxW = r.width * sx;
    let x = boxL + (boxW - runW) / 2; // 화면(justify-center)과 동일하게 박스 안 중앙
    const y = (r.top - imgRect.top + r.height / 2) * sy;
    for (const ch of chars) {
      g.fillText(ch, x, y);
      x += g.measureText(ch).width + ls;
    }
  }

  /* ----- 훈장 받기(캔버스 합성 다운로드) ----- */
  $("#btnGet").on("click", function () {
    const name = $name.val().trim();
    if (!name) {
      $name.focus();
      console.warn("이름을 입력해 주세요.");
      return;
    }
    $medalName.text(name); // 화면 동기화(측정 기준)

    const medalImg = document.querySelector(".end-medal .medal-img");
    if (!medalImg || !medalImg.complete || !medalImg.naturalWidth) {
      console.warn("훈장 이미지를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const filename = `크리스마스의기적_훈장_${name}.png`;

    function triggerDownload(href) {
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function run() {
      try {
        const c = document.createElement("canvas");
        c.width = medalImg.naturalWidth;
        c.height = medalImg.naturalHeight;
        const g = c.getContext("2d");
        g.drawImage(medalImg, 0, 0);
        const imgRect = medalImg.getBoundingClientRect();
        drawDomText(g, $medalName[0], imgRect, c); // 명판 위 이름
        triggerDownload(c.toDataURL("image/png"));
      } catch (e) {
        // file:// 등에서 캔버스 tainted → 로컬 서버 권장
        console.warn("이미지 저장에 실패했습니다. 로컬 서버로 실행하거나 화면을 캡처해 주세요.");
      }
    }

    // 폰트(Pretendard) 로드 완료 후 합성 → 글자 위치 정확
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(run);
    } else {
      run();
    }
  });

  $("#btnHome").on("click", () => AR.go("index.html"));
});
