/* =========================================================================
   7_END — 기록 증서 (PDF 60p)
   - 이름 input → 밀랍 원통 "기록자" 이름표 위 동기화.
   - [증서 받기] = 증서 이미지 + 이름을 캔버스로 합성해 PNG 다운로드
     (외부 라이브러리 없이 캔버스 합성 = 전 브라우저 호환).
     1차: 화면의 .cert-img 사용(로컬 서버/배포 환경)
     2차: file:// 등에서 캔버스가 tainted 되면 내장 base64(window.CERT_IMAGE_DATAURL)로 재시도.
   - [처음으로] = 0_TITLE(index.html).
   ⚠️ 이름 좌표의 단일 기준은 css/end.css 의 `.cert-name` 이다(화면 = 다운로드).
   ========================================================================= */
document.title = "체험 완료 — 한국의 호소";

$(function () {
  const $name = $("#nameInput");
  const $certName = $("#certName");

  // 이름 동기화(이름표 위 표시)
  $name.on("input", function () {
    $certName.text($name.val().trim());
  });

  /* 요소에 걸린 CSS 회전각(rad)을 계산. transform 이 없으면 0.
     (matrix(a,b,c,d,e,f) / matrix3d 모두 첫 두 성분으로 각도를 얻는다) */
  function domRotation(cs) {
    const t = cs.transform;
    if (!t || t === "none") return 0;
    const m = t.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (!m) return 0;
    const p = m[1].split(",").map(parseFloat);
    if (p.length < 2 || !isFinite(p[0]) || !isFinite(p[1])) return 0;
    return Math.atan2(p[1], p[0]);
  }

  /* 화면의 텍스트 요소(el)를 증서 이미지(imgRect) 기준으로 캔버스(c)에 동일 위치/크기/각도로 그림.
     ★ `.cert-name` 의 CSS 기울기(--cert-name-tilt)를 그대로 읽어 캔버스에도 적용하므로
       화면과 다운로드 이미지가 항상 일치한다. */
  function drawDomText(g, el, imgRect, c) {
    const text = (el.textContent || "").trim();
    if (!text || !imgRect.width) return;
    // 회전된 요소의 getBoundingClientRect() 는 AABB 지만, transform-origin 이 중앙이라
    // 그 중심 좌표는 회전 전과 동일하다 → 중심 기준으로 배치하면 안전하다.
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const sx = c.width / imgRect.width;
    const sy = c.height / imgRect.height;

    g.save();
    g.fillStyle = cs.color;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * sy}px ${cs.fontFamily}`;
    g.textBaseline = "middle";
    g.textAlign = "left";

    // CSS letter-spacing 반영(캔버스 fillText 는 자간을 무시하므로 한 글자씩 그림)
    const ls = (parseFloat(cs.letterSpacing) || 0) * sx;
    const chars = [...text];
    const runW =
      chars.reduce((w, ch) => w + g.measureText(ch).width, 0) +
      ls * Math.max(0, chars.length - 1);

    // 요소 중심으로 원점을 옮기고 화면과 같은 각도로 회전 → 중앙 정렬로 한 글자씩
    g.translate((r.left + r.width / 2 - imgRect.left) * sx, (r.top + r.height / 2 - imgRect.top) * sy);
    g.rotate(domRotation(cs));

    let x = -runW / 2;
    for (const ch of chars) {
      g.fillText(ch, x, 0);
      x += g.measureText(ch).width + ls;
    }
    g.restore();
  }

  function triggerDownload(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* 지정한 이미지 소스로 캔버스 합성 후 다운로드. tainted 예외는 throw 되어 상위에서 폴백. */
  function exportWith(srcImg, screenImg, filename) {
    const c = document.createElement("canvas");
    c.width = srcImg.naturalWidth;
    c.height = srcImg.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(srcImg, 0, 0);
    // 좌표 기준은 항상 "화면에 보이는" 증서 이미지의 rect
    drawDomText(g, $certName[0], screenImg.getBoundingClientRect(), c);
    triggerDownload(c.toDataURL("image/png"), filename); // tainted 면 여기서 throw
  }

  $("#btnGet").on("click", function () {
    const name = $name.val().trim();
    if (!name) {
      $name.focus();
      console.warn("이름을 입력해 주세요.");
      return;
    }
    $certName.text(name); // 화면 동기화(측정 기준)

    const certImg = document.querySelector(".end-cert .cert-img");
    if (!certImg || !certImg.complete || !certImg.naturalWidth) {
      console.warn("증서 이미지를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const filename = `한국의호소_기록증서_${name}.png`;

    function run() {
      try {
        // 1차: 화면 이미지 그대로 사용
        exportWith(certImg, certImg, filename);
      } catch (e) {
        // 2차: 내장 base64(file:// 에서 캔버스 tainted 대비)
        const dataUrl = window.CERT_IMAGE_DATAURL;
        if (!dataUrl) {
          console.warn("이미지 저장에 실패했습니다. 로컬 서버로 실행하거나 화면을 캡처해 주세요.");
          return;
        }
        const fallback = new Image();
        fallback.onload = () => {
          try {
            exportWith(fallback, certImg, filename);
          } catch (e2) {
            console.warn("이미지 저장에 실패했습니다. 화면을 캡처해 주세요.");
          }
        };
        fallback.onerror = () => console.warn("증서 이미지를 불러오지 못했습니다.");
        fallback.src = dataUrl;
      }
    }

    // 폰트(Pretendard) 로드 완료 후 합성 → 글자 위치/폭 정확
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(run);
    } else {
      run();
    }
  });

  $("#btnHome").on("click", () => AR.go("index.html"));

  AR.preload([
    "img/7_END/end_bg.png",
    "img/7_END/end_image.png",
    "img/7_END/end_text_box.png",
    "img/7_END/end_scrap.png",
    "img/7_END/end_home.png",
  ]).then(() => {
    AR.Sound.armBgm("audio/BGM.mp3", { volume: 0.3 });
  });
});
