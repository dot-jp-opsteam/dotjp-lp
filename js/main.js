/*
 * ドットジェイピー 議員インターン募集LP
 * 演出と計測。HTMLは静止版で完結しているので、ここが動かなくても情報はすべて読める。
 */
(function () {
  "use strict";

  var config = window.LP_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.dataLayer = window.dataLayer || [];

  /* ---------- 計測 ---------- */

  // dataLayer にイベントを積む(GA4 / GTM がこれを拾う)
  function track(event, params) {
    var payload = { event: event };
    for (var key in params) payload[key] = params[key];
    window.dataLayer.push(payload);
  }

  // config.js に GA4 の測定IDがあれば gtag.js を読み込む
  function loadGa4() {
    if (!config.ga4Id) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.ga4Id);
    document.head.appendChild(s);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", config.ga4Id);
  }

  /* ---------- リンク ---------- */

  // 申込URL + UTM を組み立てる。utm_content にはボタンの位置名が入る
  function buildApplyUrl(position) {
    var url = new URL(config.applyUrl || "https://www.dot-jp.or.jp/politician/");
    var utm = config.utm || {};
    for (var key in utm) url.searchParams.set(key, utm[key]);
    url.searchParams.set("utm_content", position);
    return url.toString();
  }

  // すべての [data-cta] を config の申込URLに差し替え、クリックを計測する
  function setupCtas() {
    document.querySelectorAll("[data-cta]").forEach(function (a) {
      var position = a.getAttribute("data-cta");
      a.href = buildApplyUrl(position);
      a.addEventListener("click", function () {
        track("cta_click", { cta_position: position, link_url: a.href });
      });
    });
  }

  // 公式サイトなどへのリンク([data-link])を config の値に差し替える
  function setupLinks() {
    var links = config.links || {};
    document.querySelectorAll("[data-link]").forEach(function (a) {
      var url = links[a.getAttribute("data-link")];
      if (url) a.href = url;
    });
  }

  /* ---------- スマホ下部固定CTAバー ---------- */

  // ファーストビューを過ぎたら表示し、最終CTAが見えている間は隠す
  function setupStickyBar() {
    var bar = document.querySelector(".cta-bar");
    var hero = document.querySelector(".hero");
    var final = document.querySelector(".final");
    if (!bar || !hero || !final || !("IntersectionObserver" in window)) return;

    var heroVisible = true;
    var finalVisible = false;
    var link = bar.querySelector("a");

    function update() {
      var show = !heroVisible && !finalVisible;
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
      link.tabIndex = show ? 0 : -1;
    }

    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      update();
    }).observe(hero);

    new IntersectionObserver(function (entries) {
      finalVisible = entries[0].isIntersecting;
      update();
    }).observe(final);
  }

  /* ---------- 控えめなフェードイン ---------- */

  function setupReveal() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });
    document.documentElement.classList.add("reveal-ready");
  }

  /* ---------- 数字のカウントアップ ---------- */

  function setupCountUp() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    var nums = document.querySelectorAll("[data-count]");
    var format = new Intl.NumberFormat("ja-JP");

    function run(el) {
      var target = Number(el.getAttribute("data-count"));
      var duration = 1400;
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format.format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 物語画像の先読み ---------- */

  // ファーストビュー表示中に、物語の画像を読み込み始める
  function preloadStory() {
    var imgs = document.querySelectorAll(".story img");
    var start = function () { imgs.forEach(function (img) { img.loading = "eager"; }); };
    if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 600);
  }

  /* ---------- スクロール物語(2シーン・2.5D演出) ---------- */

  // シーンの要素をまとめて取り出す
  function getScene(stage, n) {
    var scene = stage.querySelector(".scene--" + n);
    return {
      el: scene,
      media: scene.querySelector(".scene__media"),
      light: scene.querySelector(".scene__light"),
      caption: scene.querySelector(".scene__caption"),
    };
  }

  // ①立ち止まる後ろ姿 → クロスフェード → ②扉へ手を伸ばす
  function buildStory(isMobile) {
    var stage = document.querySelector(".story__stage");
    var grain = stage.querySelector(".story__grain");
    var s1 = getScene(stage, 1);
    var s2 = getScene(stage, 2);
    var reported = {};

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: function () { return "+=" + window.innerHeight * (isMobile ? 1.5 : 2); },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          // 到達度の計測(25/50/75/100%)
          [25, 50, 75, 100].forEach(function (p) {
            if (!reported[p] && self.progress * 100 >= p - 0.5) {
              reported[p] = true;
              track("story_progress", { percent: p });
            }
          });
        },
      },
    });

    // ① ゆっくりズームイン。前景の光は背景より大きく動かしてパララックスを出す
    tl.fromTo(s1.media, { scale: 1 }, { scale: 1.1, duration: 0.55 }, 0);
    tl.fromTo(s1.light, { yPercent: 6 }, { yPercent: -6, duration: 0.55 }, 0);

    // 写真をクロスフェード。ことばが重ならないよう、①は先に消し、②は写真が替わってから出す
    tl.to(s1.caption, { autoAlpha: 0, y: -16, duration: 0.07, ease: "power2.in" }, 0.36);
    tl.to(s2.el, { autoAlpha: 1, duration: 0.15 }, 0.42);
    tl.to(s1.el, { autoAlpha: 0, duration: 0.15 }, 0.47);

    // ② 扉へ少しだけ近づく
    tl.fromTo(s2.media, { scale: 1 }, { scale: 1.25, duration: 0.58 }, 0.42);
    tl.fromTo(s2.light, { yPercent: 6 }, { yPercent: -6, duration: 0.58 }, 0.42);
    tl.fromTo(s2.caption, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.55);

    // フィルムグレインは全体を通して動かす
    tl.fromTo(grain, { yPercent: -8 }, { yPercent: 8, duration: 1 }, 0);
    // 最後に少し余韻を残してからピンを外す
    tl.to({}, { duration: 0.12 });
    return tl;
  }

  // GSAP が読めて、動きを減らす設定でもないときだけ演出版に切り替える
  function setupStory() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    var root = document.documentElement;
    var mm = gsap.matchMedia();
    mm.add({
      isDesktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      isMobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
    }, function (context) {
      root.classList.add("is-cinematic");
      buildStory(context.conditions.isMobile);
      return function () { root.classList.remove("is-cinematic"); };
    });
  }

  /* ---------- 起動 ---------- */

  loadGa4();
  setupCtas();
  setupLinks();
  setupStickyBar();
  setupReveal();
  setupCountUp();
  setupStory();
  if (document.readyState === "complete") preloadStory();
  else window.addEventListener("load", preloadStory);
})();
