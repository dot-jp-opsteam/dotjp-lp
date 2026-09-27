"""assets/img/raw の元画像を、公開用の AVIF / WebP に変換する。

使い方(プロジェクト直下で):  python tools/optimize_images.py
必要なもの: Pillow 11.3 以上(AVIF対応)
"""
import os
from PIL import Image, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "img", "raw")
OUT = os.path.join(ROOT, "assets", "img")

# AI画像:デスクトップ用(lg)とスマホ用(sm)。元が1672px幅なので拡大はしない
AI_IMAGES = ["kv", "s1", "s2", "s3", "s4", "s5", "s6"]
AI_SIZES = {"lg": 2000, "sm": 1000}

# 実写写真:カード・半分幅でしか使わないので小さめ
PHOTOS = {
    "trust-kokkai": "01_trust_cta/p12_kokkai-mae-group.jpg",
    "trust-group": "01_trust_cta/p57_group-photo.jpg",
    "trust-contest": "01_trust_cta/p55_contest-team.jpg",
    "act-fieldwork": "02_activities/p38_fieldwork-farm.jpg",
    "act-sns": "02_activities/p37_pr-work-laptop.jpg",
    "act-study": "02_activities/p36_study-session.jpg",
    "act-office": "02_activities/p12_office-work-1.jpg",
    "act-research": "02_activities/p38_discussion-docs.jpg",
    "act-presentation": "03_events/p12_presentation-2.jpg",
    "ev-kickoff": "03_events/p57_event-workshop-1.jpg",
    "ev-halftime": "03_events/p55_seminar.jpg",
    "ev-contest": "03_events/p12_presentation-1.jpg",
    "ev-final": "03_events/p57_event-workshop-2.jpg",
    "bg-sunset": "04_background/p12_sunset.jpg",
}
PHOTO_SIZES = {"lg": 1200, "sm": 700}


def grade(im):
    """実写写真の色味をそろえる:彩度を少し下げ、暖かいトーンに寄せる"""
    im = ImageEnhance.Color(im).enhance(0.86)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.04 + 4)))
    b = b.point(lambda v: int(v * 0.94))
    im = Image.merge("RGB", (r, g, b))
    return ImageEnhance.Contrast(im).enhance(0.97)


def save_variants(im, name, sizes):
    """各サイズを AVIF と WebP で保存し、(ファイル名, 幅, 高さ, バイト数) を返す"""
    results = []
    for suffix, width in sizes.items():
        w = min(width, im.width)
        h = round(im.height * w / im.width)
        resized = im.resize((w, h), Image.LANCZOS)
        for ext, opts in (("avif", {"quality": 55}), ("webp", {"quality": 80, "method": 6})):
            path = os.path.join(OUT, f"{name}-{suffix}.{ext}")
            resized.save(path, **opts)
            results.append((os.path.basename(path), w, h, os.path.getsize(path)))
    return results


def main():
    rows = []
    for name in AI_IMAGES:
        im = Image.open(os.path.join(RAW, f"{name}.png")).convert("RGB")
        rows += save_variants(im, name, AI_SIZES)

    for name, rel in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(os.path.join(RAW, "photos", rel))).convert("RGB")
        rows += save_variants(grade(im), name, PHOTO_SIZES)

    # OGP:1200x630 に中央で切り抜き
    ogp = Image.open(os.path.join(RAW, "ogp.png")).convert("RGB")
    ogp = ImageOps.fit(ogp, (1200, 630), Image.LANCZOS, centering=(0.5, 0.5))
    ogp_path = os.path.join(OUT, "ogp.jpg")
    ogp.save(ogp_path, quality=85, optimize=True, progressive=True)
    rows.append(("ogp.jpg", 1200, 630, os.path.getsize(ogp_path)))

    # favicon:ロゴから赤いドット付きの「.jp」部分を正方形で切り出す(形・色は変えない)
    logo = Image.open(os.path.join(ROOT, "assets", "logo", "dotjp-logo_2000px.png")).convert("RGBA")
    jp = logo.crop((30, 0, 1960, 1054))
    side = max(jp.size) + 80
    canvas = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    canvas.alpha_composite(jp, ((side - jp.width) // 2, (side - jp.height) // 2))
    fav_path = os.path.join(ROOT, "assets", "favicon.png")
    canvas.resize((180, 180), Image.LANCZOS).save(fav_path, optimize=True)
    rows.append(("../favicon.png", 180, 180, os.path.getsize(fav_path)))

    total = 0
    for fname, w, h, size in rows:
        total += size
        print(f"{fname:32s} {w:5d}x{h:<5d} {size / 1024:8.1f} KB")
    print(f"{'合計':30s} {total / 1024 / 1024:14.2f} MB")


if __name__ == "__main__":
    main()
