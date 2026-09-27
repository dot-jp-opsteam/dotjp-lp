/*
 * LPの設定。URLやIDの差し替えはこのファイルだけで完結する。
 * ページ内のすべての申込ボタン([data-cta])は、ここの applyUrl に UTM を付けたURLへ書き換えられる。
 */
window.LP_CONFIG = {
  // {{申込URL}} 説明会申込フォーム
  applyUrl: "https://www.dot-jp.or.jp/politician/",

  // 申込URLに付けるUTM(utm_content にはボタンの位置名が自動で入る)
  utm: {
    utm_source: "lp",
    utm_medium: "web",
    utm_campaign: "spring2027",
  },

  // 公式サイトの各ページ
  // {{要確認:NPO・NGOインターン/大使館・国際機関インターンの正式URL}}
  links: {
    official: "https://www.dot-jp.or.jp/",
    npo: "https://www.dot-jp.or.jp/",
    embassy: "https://www.dot-jp.or.jp/",
  },

  // GA4 の測定ID(例: "G-XXXXXXXXXX")。空のあいだは dataLayer への記録だけ行う
  // {{要確認:GA4 測定ID}}
  ga4Id: "",
};
