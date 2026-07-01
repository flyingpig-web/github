#!/usr/bin/env python3
"""img/ 폴더를 스캔해 js/preload-manifest.js 를 재생성한다.
이미지 추가/삭제/이동 후 프로젝트 루트(bohun-AR3)에서 실행:
    python3 scripts/gen-preload-manifest.py
매니페스트는 페이지별·체험 흐름 순서로 정리되며, common.js 의 전역 프리페치가 이 파일을 사용한다.
"""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = "img"
EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")

# 폴더 → 페이지 (체험 흐름 순서). 폴더가 없으면 이미지 빈 배열.
FLOW = [
    ("index.html",  "0_TITLE"),
    ("intro.html",  "1_INTRO"),
    ("exp1.html",   "2_EXP1"),
    ("bridge.html", "3_BRIDGE"),
    ("exp2.html",   "4_EXP2-AR"),
    ("end.html",    "5_END"),
]


def imgs(folder):
    if not folder:
        return []
    d = os.path.join(ROOT, IMG, folder)
    if not os.path.isdir(d):
        return []
    return [f"{IMG}/{folder}/{f}" for f in sorted(os.listdir(d)) if f.lower().endswith(EXT)]


def main():
    manifest = {
        "common": imgs("common"),
        "flow": [{"page": p, "images": imgs(f)} for p, f in FLOW],
    }
    js = (
        "/* 자동 생성: img/ 폴더 스캔 결과. 이미지 추가/삭제 시 "
        "`python3 scripts/gen-preload-manifest.py` 로 재생성.\n"
        "   페이지별·흐름 순서대로 정리된 전체 이미지 매니페스트(프로젝트 전역 프리로드용). */\n"
        "window.AR_MANIFEST = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n"
    )
    out = os.path.join(ROOT, "js", "preload-manifest.js")
    with open(out, "w", encoding="utf-8") as fp:
        fp.write(js)
    total = len(manifest["common"]) + sum(len(p["images"]) for p in manifest["flow"])
    print(f"생성 완료: {out} (총 {total}장)")


if __name__ == "__main__":
    main()
