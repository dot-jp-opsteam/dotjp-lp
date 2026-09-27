# ドットジェイピー 議員インターン募集LP(春休み2027)

全国の大学生(主に1〜2年生)に「無料の説明会」へ申し込んでもらうためのランディングページ。
ビルド不要の静的サイト(HTML / CSS / JS + GSAP・ScrollTrigger 3.12.5)。仕様は `CLAUDE_1.md`。

## ローカルで確認する

プロジェクト直下で、どちらか一方を実行してブラウザで開く。

```bash
python -m http.server 8080      # → http://127.0.0.1:8080/
npx serve .                     # → 表示されたURL
```

`index.html` をダブルクリックで開くと一部が動かないことがあるので、必ずサーバー経由で開く。

## フォルダ構成

```
index.html
css/style.css          デザイントークン(:root)とすべてのスタイル
js/config.js           申込URL・UTM・外部リンク・GA4 ID(差し替えはここだけ)
js/main.js             スクロール物語・カウントアップ・固定CTAバー・計測
assets/img/            最適化済み画像(AVIF / WebP、-lg / -sm の2サイズ)
assets/img/ogp.jpg     OGP画像(1200×630)
assets/logo/           公式ロゴ(SVG / 2000px PNG)
assets/favicon.png     ロゴの「.jp」部分
tools/optimize_images.py  raw/ → 最適化画像を作り直す(Pillow 11.3以上)
tools/export_public.py    公開用ファイルだけを dist/ に書き出す
assets/img/raw/        元画像(公開しない)
inbox/                 受け取った素材の置き場(公開しない)
```

## 画像を差し替える

1. `assets/img/raw/` の元画像を同じファイル名で置き換える(実写写真は `raw/photos/…`、どの写真を使うかは `tools/optimize_images.py` の `PHOTOS`)
2. `python tools/optimize_images.py` を実行する(実写写真には色味をそろえる補正が自動でかかる)

## 公開する

ページ内に黄色い `{{要確認}}` 表示は残っていない(非表示にしている項目は下の表)。

**A. Netlify Drop(一番かんたん)**
1. `python tools/export_public.py` で `dist/` を作る
2. https://app.netlify.com/drop に `dist/` フォルダをドラッグ&ドロップ

**B. GitHub Pages(更新がpushだけで済む)**
1. このフォルダを `C:\Users\osuhi\github\` 以下にコピーしてリポジトリにする(OneDrive上に `.git` を置かない)
2. GitHubにリポジトリを作ってpush → Settings → Pages で `main` ブランチのルートを公開
3. `.gitignore` で `inbox/` `assets/img/raw/` `dist/` は除外済み

公開URLが決まったら、`index.html` の `og:image` を絶対URLにし、`og:url` を追加する。

## 計測(GA4 前提)

`window.dataLayer` に次のイベントを送る。GA4の測定IDを `js/config.js` の `ga4Id` に入れると gtag.js を読み込む。

| event | パラメータ | タイミング |
|---|---|---|
| `cta_click` | `cta_position`(header / hero / story_end / cost / schedule / final / sticky)、`link_url` | 申込ボタンのクリック |
| `story_progress` | `percent`(25 / 50 / 75 / 100) | スクロール物語の到達度 |

申込URLには `utm_source=lp&utm_medium=web&utm_campaign=spring2027&utm_content=[位置名]` が付く。

## 要確認・非表示にしているもの

2026-09-28 に、掲載許可・数字の表記・申込URLは確定(承認済み)。情報が届いていないものは、でっち上げずに非表示または言い換えにしている。

| 内容 | 今の状態 | 届いたらやること |
|---|---|---|
| 参加者の声(掲載許可済みの体験談3件) | セクションごと非表示(`index.html` の「6. 参加者の声」をコメントアウト) | コメントを外して中身を差し替え |
| メディア掲載の媒体名 | 非表示(信頼セクション内でコメントアウト) | コメントを外して媒体名(テキストのみ)を入れる |
| 春期2027の説明会日程/オンラインの形式 | 「日程は申込フォームで確認できます」と表記 | 必要なら具体日程を追記 |
| 未来自治体全国大会の日程 | 日付の欄なしで表示 | 2ヶ月の流れに時期を追記 |
| 満足度85%の調査年 | 「参加者へのアンケートより」とだけ表記 | 調査年を追記 |
| NPO・NGO/大使館・国際機関インターンのURL | 公式サイトのトップへリンク | `js/config.js` の `links` |
| GA4 測定ID | 未設定(dataLayer への記録のみ) | `js/config.js` の `ga4Id` |
| 公開URL | 未定 | `index.html` の `og:image` を絶対URLにし、`og:url` を追加 |
| 公式ロゴデータ | 高解像度化したロゴを使用中 | 広報から届いたら `assets/logo/` を差し替え |

## 補足

- 物語パート(セクション2)は2シーン。①s1(立ち止まる後ろ姿)「やりたいことが、まだわからない。」→ クロスフェード → ②s2(扉に手を伸ばす)「だから、動いてみる。挑戦の一歩目は、ここから。」(スクロール量はPC 200svh/スマホ 150svh)
- 物語とファーストビューの画像はAI生成のイメージ。ページ内にも注記している
- 物語は JS 無効・`prefers-reduced-motion: reduce` のとき、写真2枚+ことば2つを縦に並べた静止版になる
- s3〜s6 の画像ファイルは `assets/img/` に残してあるが、ページでは使っていない
- 写真フォルダの `09_do_not_use_source_unknown`(出典不明)と `05_logo_temp`(低解像度ロゴ)は使っていない
