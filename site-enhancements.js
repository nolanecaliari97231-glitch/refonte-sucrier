/**
 * site-enhancements.js — UX transversal (a11y, i18n SEO, analytics, newsletter, scroll)
 * Chargé automatiquement par mobile-ux.js
 */
(function () {
  "use strict";

  var STORAGE = {
    newsletterDismissed: "sucrier_newsletter_dismissed",
    footerFeedback: "sucrier_footer_feedback_sent",
    currencyManual: "sucrier_currency_manual",
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function getLang() {
    try {
      return localStorage.getItem("sucrier_language") === "en" ? "en" : "fr";
    } catch (e) {
      return "fr";
    }
  }

  function t(fr, en) {
    return getLang() === "en" ? en : fr;
  }

  function injectStylesheet() {
    if ($('link[data-site-enhancements-css]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./site-enhancements.css?v=20260521";
    link.setAttribute("data-site-enhancements-css", "1");
    document.head.appendChild(link);
  }

  function injectFontPreload() {
    if ($('link[data-font-preload]')) return;
    var href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap";
    var preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "style";
    preload.href = href;
    preload.setAttribute("data-font-preload", "1");
    document.head.appendChild(preload);
  }

  function injectFaviconExtras() {
    if ($('link[rel="apple-touch-icon"]')) return;
    var icon = document.createElement("link");
    icon.rel = "apple-touch-icon";
    icon.sizes = "180x180";
    icon.href = "./images/site/logo-editions-sucrier.webp";
    document.head.appendChild(icon);
  }

  function injectHreflang() {
    if ($('link[hreflang="fr"]')) return;
    var path = window.location.pathname.replace(/^\//, "") || "index.html";
    if (!/\.html$/i.test(path) && path !== "") path = path + ".html";
    if (path === "" || path === "/") path = "index.html";
    var base = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
    ["fr", "en", "x-default"].forEach(function (lang) {
      var link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = lang === "x-default" ? "x-default" : lang;
      link.href = base + path;
      document.head.appendChild(link);
    });
  }

  function enhanceHeaderA11y() {
    document.querySelectorAll(".header-icons .icon-btn").forEach(function (btn) {
      if (btn.getAttribute("aria-label")) return;
      var href = (btn.getAttribute("href") || "").toLowerCase();
      if (href.indexOf("favoris") !== -1) {
        btn.setAttribute("aria-label", t("Favoris", "Favorites"));
      } else if (href.indexOf("panier") !== -1) {
        btn.setAttribute("aria-label", t("Panier", "Shopping cart"));
      }
    });
  }

  function setupPartialEnglishBanner() {
    if (getLang() !== "en" || $(".i18n-partial-banner")) return;
    var banner = document.createElement("div");
    banner.className = "i18n-partial-banner";
    banner.setAttribute("role", "status");
    banner.innerHTML =
      "<span>" +
      t(
        "Certaines pages sont encore en cours de traduction.",
        "Some pages are still being translated."
      ) +
      '</span><button type="button" data-switch-fr>' +
      t("Afficher en français", "View in French") +
      "</button>";
    document.body.insertBefore(banner, document.body.firstChild);
    banner.querySelector("[data-switch-fr]").addEventListener("click", function () {
      localStorage.setItem("sucrier_language", "fr");
      document.cookie = "sucrier_language=fr; path=/; max-age=31536000; SameSite=Lax";
      if (typeof window.switchLang === "function") window.switchLang("fr");
      else window.location.reload();
    });
  }

  function suggestCurrencyForEnglish() {
    if (getLang() !== "en") return;
    try {
      if (localStorage.getItem(STORAGE.currencyManual) === "1") return;
      if (localStorage.getItem("sucrier_currency")) return;
      var select = $("#currency-select");
      if (!select) return;
      if (select.value === "EUR") {
        select.value = "USD";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } catch (e) {
      /* no-op */
    }
  }

  function bindCurrencyManualFlag() {
    var select = $("#currency-select");
    if (!select) return;
    select.addEventListener(
      "change",
      function () {
        try {
          localStorage.setItem(STORAGE.currencyManual, "1");
        } catch (e) {
          /* no-op */
        }
      },
      { once: false }
    );
  }

  function setupScrollReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var nodes = document.querySelectorAll(
      ".section-bestsellers, .section-heros, .stats-band, .page-hero, .catalogue-layout"
    );
    nodes.forEach(function (el) {
      el.classList.add("reveal-on-scroll");
    });
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function setupAnalytics() {
    var cfg = window.SUCRIER_ANALYTICS || {};
    if (cfg.plausibleDomain) {
      var s = document.createElement("script");
      s.defer = true;
      s.dataset.domain = cfg.plausibleDomain;
      s.src = "https://plausible.io/js/script.js";
      document.head.appendChild(s);
    }
    if (cfg.clarityId) {
      window.clarity =
        window.clarity ||
        function () {
          (window.clarity.q = window.clarity.q || []).push(arguments);
        };
      var c = document.createElement("script");
      c.async = true;
      c.src = "https://www.clarity.ms/tag/" + encodeURIComponent(cfg.clarityId);
      document.head.appendChild(c);
    }

    window.sucrierTrack = function (eventName, props) {
      if (typeof window.plausible === "function") {
        window.plausible(eventName, { props: props || {} });
      }
      if (window.clarity) {
        try {
          window.clarity("event", eventName);
        } catch (e) {
          /* no-op */
        }
      }
      try {
        var events = JSON.parse(localStorage.getItem("sucrier_ux_events") || "[]");
        events.push({ event: eventName, at: new Date().toISOString(), props: props || {} });
        localStorage.setItem("sucrier_ux_events", JSON.stringify(events.slice(-80)));
      } catch (e) {
        /* no-op */
      }
    };

    document.addEventListener("click", function (e) {
      if (e.target.closest(".add-to-cart-btn")) {
        window.sucrierTrack("add_to_cart");
      }
      if (e.target.closest("[data-catalogue-sort]")) {
        window.sucrierTrack("catalog_sort_change");
      }
      if (e.target.closest(".catalogue-age-chip")) {
        window.sucrierTrack("catalog_age_filter");
      }
      if (e.target.closest("#language-select, #drawerLang")) {
        window.sucrierTrack("language_switch");
      }
    });
  }

  function setupFooterFeedback() {
    var footer = document.querySelector("footer .footer-grid") || document.querySelector("footer");
    if (!footer || $(".footer-feedback")) return;

    var block = document.createElement("div");
    block.className = "footer-feedback footer-col";
    block.innerHTML =
      '<p data-fr="Avez-vous trouvé ce que vous cherchiez ?" data-en="Did you find what you were looking for?">' +
      t("Avez-vous trouvé ce que vous cherchiez ?", "Did you find what you were looking for?") +
      '</p><form class="footer-feedback-form" data-footer-feedback>' +
      '<label class="sr-only" for="footer-feedback-select">' +
      t("Votre avis", "Your feedback") +
      "</label>" +
      '<select id="footer-feedback-select" name="feedback">' +
      '<option value="">' +
      t("Choisir…", "Choose…") +
      "</option>" +
      '<option value="yes">' +
      t("Oui, merci !", "Yes, thanks!") +
      "</option>" +
      '<option value="partial">' +
      t("En partie", "Partly") +
      "</option>" +
      '<option value="no">' +
      t("Non", "No") +
      "</option>" +
      "</select>" +
      '<button type="submit">' +
      t("Envoyer", "Send") +
      "</button></form>";

    footer.appendChild(block);
    block.querySelector("form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var val = block.querySelector("select").value;
      if (!val) return;
      try {
        localStorage.setItem(STORAGE.footerFeedback, val);
      } catch (e) {
        /* no-op */
      }
      window.sucrierTrack("footer_feedback", { answer: val });
      block.querySelector("p").textContent = t("Merci pour votre retour !", "Thanks for your feedback!");
      block.querySelector("form").remove();
    });

    try {
      if (localStorage.getItem(STORAGE.footerFeedback)) {
        block.querySelector("p").textContent = t("Merci pour votre retour !", "Thanks for your feedback!");
        block.querySelector("form").remove();
      }
    } catch (e) {
      /* no-op */
    }
  }

  function setupNewsletterPopup() {
    if (window.location.pathname.indexOf("panier") !== -1) return;
    if (window.location.pathname.indexOf("checkout") !== -1) return;
    try {
      if (localStorage.getItem(STORAGE.newsletterDismissed) === "1") return;
    } catch (e) {
      return;
    }

    var shown = false;
    function showPopup() {
      if (shown || $(".newsletter-popup")) return;
      shown = true;
      var popup = document.createElement("div");
      popup.className = "newsletter-popup";
      popup.setAttribute("role", "dialog");
      popup.setAttribute("aria-modal", "true");
      popup.setAttribute("aria-labelledby", "newsletter-popup-title");
      popup.innerHTML =
        '<div class="newsletter-popup__card">' +
        "<h3 id=\"newsletter-popup-title\">" +
        t("1 conseil de lecture par mois", "1 reading tip per month") +
        "</h3>" +
        "<p>" +
        t(
          "Recevez une sélection d'albums jeunesse caraïbéens pour vos enfants ou votre classe — sans spam.",
          "Get a monthly pick of Caribbean children's books for your family or classroom — no spam."
        ) +
        '</p><form action="./contact.html" method="get">' +
        '<input type="email" name="email" required placeholder="' +
        t("Votre e-mail", "Your email") +
        '" autocomplete="email">' +
        '<input type="hidden" name="subject" value="newsletter">' +
        '<div class="newsletter-popup__actions">' +
        '<button type="submit" class="btn-primary">' +
        t("Je m'inscris", "Subscribe") +
        '</button><button type="button" class="newsletter-popup__dismiss" data-dismiss-newsletter>' +
        t("Non merci", "No thanks") +
        "</button></div></form></div>";
      document.body.appendChild(popup);
      requestAnimationFrame(function () {
        popup.classList.add("is-visible");
      });
      popup.addEventListener("click", function (e) {
        if (e.target === popup) dismiss();
      });
      popup.querySelector("[data-dismiss-newsletter]").addEventListener("click", dismiss);
      function dismiss() {
        try {
          localStorage.setItem(STORAGE.newsletterDismissed, "1");
        } catch (e) {
          /* no-op */
        }
        popup.classList.remove("is-visible");
        setTimeout(function () {
          popup.remove();
        }, 280);
      }
    }

    var scrollTriggered = false;
    window.addEventListener(
      "scroll",
      function () {
        if (scrollTriggered) return;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max > 0 && window.scrollY / max >= 0.6) {
          scrollTriggered = true;
          showPopup();
        }
      },
      { passive: true }
    );
    setTimeout(function () {
      showPopup();
    }, 30000);
  }

  function enhanceCatalogueSkeleton() {
    var grid = $(".catalogue-grid");
    if (!grid || grid.classList.contains("is-ready")) return;
    if (grid.querySelector(".catalogue-skeleton-card")) return;
    var count = window.matchMedia("(max-width: 767px)").matches ? 6 : 8;
    var html = '<div class="catalogue-skeleton-grid" aria-hidden="true">';
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="catalogue-skeleton-card"><div class="catalogue-skeleton-card__media"></div>' +
        '<div class="catalogue-skeleton-card__body"><div class="catalogue-skeleton-line"></div>' +
        '<div class="catalogue-skeleton-line catalogue-skeleton-line--short"></div></div></div>';
    }
    html += "</div>";
    grid.insertAdjacentHTML("afterbegin", html);
  }

  function enhanceThemeFilterPictos() {
    var pictos = {
      aventure: "🌴",
      famille: "💛",
      apprentissage: "📚",
      caraibe: "🌊",
    };
    document.querySelectorAll('input[name="filter-theme"]').forEach(function (input) {
      var label = input.closest("label");
      if (!label || label.querySelector(".filter-theme-picto")) return;
      var val = input.value;
      var icon = pictos[val] || "✦";
      var text = label.textContent.trim();
      label.innerHTML =
        '<span class="filter-theme-picto"><span class="filter-theme-picto__icon" aria-hidden="true">' +
        icon +
        "</span><span>" +
        text +
        "</span></span>";
      label.insertBefore(input, label.firstChild);
    });
  }

  function init() {
    injectStylesheet();
    injectFontPreload();
    injectFaviconExtras();
    injectHreflang();
    enhanceHeaderA11y();
    setupPartialEnglishBanner();
    suggestCurrencyForEnglish();
    bindCurrencyManualFlag();
    setupScrollReveal();
    setupAnalytics();
    setupFooterFeedback();
    setupNewsletterPopup();
    enhanceCatalogueSkeleton();
    enhanceThemeFilterPictos();

    document.addEventListener("DOMContentLoaded", function () {
      enhanceThemeFilterPictos();
      enhanceCatalogueSkeleton();
    });
  }

  init();
})();
