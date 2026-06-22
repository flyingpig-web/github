/* =========================================================================
   5_END — 편지(청산리 전투 승리)
   - 이름 input → 편지 위 이름 동기화.
   - [편지 보관하기] = 편지 이미지 + 이름을 캔버스로 합성해 PNG 다운로드
     (외부 라이브러리 없이 캔버스 합성 = 전 브라우저 호환).
   - AR1 수료증과 동일 로직이나 번호/날짜 없이 이름만 오버레이.
   ⚠️ 편지 위 이름 좌표는 임시값(Open Item): CSS(.cert-name) 와 화면 동시 기준.
   ========================================================================= */
document.title = "편지 — 청산리 전투 승리";

$(function () {
  const $name = $("#nameInput");
  const $certName = $("#certName");

  // 이름 동기화
  $name.on("input", function () {
    $certName.text($name.val().trim());
  });

  // 화면의 텍스트 요소(el)를 편지 이미지(imgRect) 기준으로 캔버스(c)에 동일 위치/크기로 그림
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
    const ls = (parseFloat(cs.letterSpacing) || 0) * sy;
    const chars = [...text];
    // 렌더 글자열 폭(글자폭 합 + 글자 사이 letter-spacing) — 정렬 계산용
    const runW =
      chars.reduce((w, ch) => w + g.measureText(ch).width, 0) +
      ls * Math.max(0, chars.length - 1);
    // 요소 박스(캔버스 좌표)
    const boxL = (r.left - imgRect.left) * sx;
    const boxW = r.width * sx;
    // CSS text-align 을 캔버스에도 반영(화면과 동일하게 박스 안에서 정렬)
    let x =
      cs.textAlign === "center"
        ? boxL + (boxW - runW) / 2
        : cs.textAlign === "right" || cs.textAlign === "end"
          ? boxL + boxW - runW
          : boxL;
    const y = (r.top - imgRect.top) * sy;
    for (const chr of chars) {
      g.fillText(chr, x, y);
      x += g.measureText(chr).width + ls;
    }
  }

  /* ----- 편지 보관(캔버스 합성 다운로드) ----- */
  $("#btnScrap").on("click", function () {
    const name = $name.val().trim();
    if (!name) {
      $name.focus();
      console.warn("이름을 입력해 주세요.");
      return;
    }
    $certName.text(name); // 화면 동기화(측정 기준)

    const certImg = document.querySelector(".end-cert .cert-img");
    if (!certImg || !certImg.complete || !certImg.naturalWidth) {
      console.warn("편지 이미지를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const filename = `청산리_독립군_편지_${name}.png`;

    function triggerDownload(href, revoke) {
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(href), 4000);
    }

    function exportWith(imgEl) {
      try {
        const c = document.createElement("canvas");
        c.width = imgEl.naturalWidth;
        c.height = imgEl.naturalHeight;
        const g = c.getContext("2d");
        g.drawImage(imgEl, 0, 0);
        const imgRect = certImg.getBoundingClientRect();
        drawDomText(g, $certName[0], imgRect, c); // 이름
        triggerDownload(c.toDataURL("image/png"));
        return true;
      } catch (e) {
        return false;
      }
    }

    // file:// 등에서 캔버스가 tainted 면 내장 base64(같은 출처) 이미지로 재시도
    function fallbackBase64() {
      if (!window.CERT_IMAGE_DATAURL) {
        console.warn("이미지 저장에 실패했습니다. 로컬 서버로 실행하거나 화면을 캡처해 주세요.");
        return;
      }
      const img = new Image();
      img.onload = function () {
        if (!exportWith(img)) console.warn("이미지 저장에 실패했습니다. 화면을 캡처해 주세요.");
      };
      img.onerror = function () {
        console.warn("이미지 저장에 실패했습니다. 화면을 캡처해 주세요.");
      };
      img.src = window.CERT_IMAGE_DATAURL;
    }

    function run() {
      if (!exportWith(certImg)) fallbackBase64();
    }

    // 폰트(Pretendard) 로드 완료 후 합성 → 글자폭/위치 정확
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(run);
    } else {
      run();
    }
  });

  // 처음으로
  $("#btnHome").on("click", () => AR.go("index.html"));

  AR.preload([
    "img/5_End/end_bg.png",
    "img/5_End/end_image.png",
    "img/5_End/end_text_box.png",
    "img/5_End/end_scrap.png",
    "img/5_End/end_home.png",
  ]);
});
