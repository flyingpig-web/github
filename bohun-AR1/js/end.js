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
  const $certDate = $("#certDate");

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

  // 플레이 날짜: YYYY.M.D (예: 2026.6.8)
  (function () {
    const d = new Date();
    $certDate.text(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`);
  })();

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
      console.warn("이름을 입력해 주세요.");
      return;
    }
    $certName.text(name); // 화면 동기화(측정 기준)

    const certImg = document.querySelector(".end-cert .cert-img");
    if (!certImg || !certImg.complete || !certImg.naturalWidth) {
      console.warn("수료증 이미지를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const filename = `한국광복군_OSS_수료증_${name}.png`;

    function triggerDownload(href, revoke) {
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(href), 4000);
    }

    // imgEl 을 수료증 바탕으로, 이름/번호를 합성한 캔버스 → PNG 다운로드.
    // 성공 false 반환 시(보안 예외 등) 폴백 시도 가능.
    function exportWith(imgEl) {
      try {
        const c = document.createElement("canvas");
        c.width = imgEl.naturalWidth;
        c.height = imgEl.naturalHeight;
        const g = c.getContext("2d");
        g.drawImage(imgEl, 0, 0);
        const imgRect = certImg.getBoundingClientRect(); // 화면 수료증 기준 좌표
        drawDomText(g, $certNo[0], imgRect, c); // 번호
        drawDomText(g, $certDate[0], imgRect, c); // 날짜
        drawDomText(g, $certName[0], imgRect, c); // 이름
        // toDataURL 은 tainted 캔버스에서 동기 예외 → 여기서 잡혀 폴백으로
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
        if (!exportWith(img)) {
          console.warn("이미지 저장에 실패했습니다. 화면을 캡처해 주세요.");
        }
      };
      img.onerror = function () {
        console.warn("이미지 저장에 실패했습니다. 화면을 캡처해 주세요.");
      };
      img.src = window.CERT_IMAGE_DATAURL;
    }

    function run() {
      // 1차: 화면에 로드된 이미지로(웹 서버에서 정상 동작)
      // 실패(tainted=file://) → 2차: 내장 base64 로 재시도
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
    "img/7_END/end_bg.png",
    "img/7_END/end_image.png",
    "img/7_END/end_title.png",
    "img/7_END/end_text_box.png",
    "img/7_END/end_scrap.png",
    "img/7_END/end_home.png",
  ]);
});
