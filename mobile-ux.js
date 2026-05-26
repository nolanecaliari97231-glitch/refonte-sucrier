/* ============================================================
 * mobile-ux.js  Interactions mobile-first & UX
 *
 *  Burger menu + drawer plein cran
 *  Toast global (window.showToast)
 *  Sticky CTA mobile sur fiche livre
 *  Filtres mobile en drawer (catalogue)
 *  Skip-link injection automatique
 *
 * Charg APRS app.js. Nutilise aucune lib externe.
 * Respecte prefers-reduced-motion et reste 100% accessible.
 * ============================================================ */
(function () {
  'use strict';

  // ---------- Helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(el, ev, cb, opts) { if (el) el.addEventListener(ev, cb, opts || false); }

  function isMobile() { return window.matchMedia('(max-width: 1023px)').matches; }

  // ---------- 1. SKIP LINK ----------
  function injectSkipLink() {
    if ($('.skip-to-content')) return;
    var skip = document.createElement('a');
    skip.href = '#main-content';
    skip.className = 'skip-to-content';
    skip.textContent = 'Aller au contenu';
    skip.setAttribute('data-fr', 'Aller au contenu');
    skip.setAttribute('data-en', 'Skip to content');
    skip.setAttribute('tabindex', '0');
    document.body.insertBefore(skip, document.body.firstChild);

    var main = $('main') || $('.page-shell');
    if (main && !main.id) main.id = 'main-content';
  }

  // ---------- 2. BURGER MENU + DRAWER ----------
  function destroyMobileDrawer() {
    $$('.nav-burger').forEach(function (b) { b.parentNode && b.parentNode.removeChild(b); });
    $$('.mobile-drawer').forEach(function (d) { d.parentNode && d.parentNode.removeChild(d); });
    $$('.mobile-drawer-backdrop').forEach(function (bd) { bd.parentNode && bd.parentNode.removeChild(bd); });
    document.body.classList.remove('nav-open');
  }

  function buildMobileDrawer() {
    if (!isMobile()) {
      destroyMobileDrawer();
      return;
    }
    var header = $('header');
    if (!header) return;

    destroyMobileDrawer();

    // Bouton burger
    var burger = document.createElement('button');
    burger.type = 'button';
    burger.id = 'navBurger';
    burger.className = 'nav-burger';
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'mobileDrawer');
    burger.setAttribute('aria-label', 'Ouvrir le menu de navigation');
    burger.innerHTML =
      '<svg class="nav-burger__open" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
      '<svg class="nav-burger__close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>';
    header.appendChild(burger);

    // Drawer
    var drawer = document.createElement('aside');
    drawer.className = 'mobile-drawer';
    drawer.id = 'mobileDrawer';
    drawer.setAttribute('aria-label', 'Menu de navigation');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.hidden = false;

    var path = (location.pathname.split('/').pop() || 'index.html');

    function link(href, label, svg, currentClass) {
      var current = href === path ? ' aria-current="page"' : '';
      return '<a class="mobile-drawer__link' + (currentClass || '') + '" href="' + href + '"' + current + '>' +
        (svg || '') + '<span>' + label + '</span></a>';
    }

    var cartCount = (function () {
      var b = document.querySelector('.panier-badge'); return b ? b.textContent : '0';
    })();

    drawer.innerHTML =
      '<div class="mobile-drawer__group">' +
        '<p class="mobile-drawer__heading">Navigation</p>' +
        link('index.html', 'Accueil',
          '<svg viewBox="0 0 24 24"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z"/></svg>') +
        link('catalogue.html', 'Catalogue',
          '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M4 9h16M9 9v10"/></svg>') +
        link('a-propos.html', '\u00c0 propos',
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1"/></svg>') +
        link('contact.html', 'Contact',
          '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M4 7l8 6 8-6"/></svg>') +
      '</div>' +
      '<div class="mobile-drawer__group">' +
        '<p class="mobile-drawer__heading">Mon espace</p>' +
        link('compte.html', 'Mon compte',
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 16 0v1"/></svg>') +
        '<a class="mobile-drawer__link" href="favoris.html">' +
          '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '<span>Favoris</span>' +
        '</a>' +
        '<a class="mobile-drawer__link" href="panier.html">' +
          '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>' +
          '<span>Panier</span>' +
          '<span class="mobile-drawer__badge" data-drawer-cart-count>' + cartCount + '</span>' +
        '</a>' +
      '</div>' +
      '<div class="mobile-drawer__group">' +
        '<p class="mobile-drawer__heading">Pr\u00e9f\u00e9rences</p>' +
        '<div class="mobile-drawer__tools">' +
          '<label class="sr-only" for="drawerCurrency">Devise</label>' +
          '<select id="drawerCurrency" class="mobile-drawer__select" aria-label="Choisir la devise">' +
            '<option value="EUR">EUR (\u20ac)</option>' +
            '<option value="CAD">CAD ($)</option>' +
            '<option value="USD">USD ($)</option>' +
          '</select>' +
          '<label class="sr-only" for="drawerLang">Langue</label>' +
          '<select id="drawerLang" class="mobile-drawer__select" aria-label="Choisir la langue">' +
            '<option value="fr">Fran\u00e7ais</option>' +
            '<option value="en">English</option>' +
          '</select>' +
        '</div>' +
      '</div>';

    document.body.appendChild(drawer);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu de navigation');
      if (open) {
        setTimeout(function () {
          var first = drawer.querySelector('.mobile-drawer__link');
          if (first) first.focus();
        }, 60);
      } else {
        burger.focus();
      }
    }

    on(burger, 'click', function () { setOpen(!document.body.classList.contains('nav-open')); });
    on(backdrop, 'click', function () { setOpen(false); });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setOpen(false);
    });

    // Fermer si on navigue / si on repasse desktop
    on(drawer, 'click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    on(window, 'resize', function () {
      if (!isMobile()) {
        if (document.body.classList.contains('nav-open')) setOpen(false);
        destroyMobileDrawer();
      }
    });

    // Sync devise / langue avec les selects desktop si prsents
    var curr = $('#currency-select'), lang = $('#language-select');
    var dCurr = $('#drawerCurrency'), dLang = $('#drawerLang');
    if (curr && dCurr) {
      dCurr.value = curr.value;
      on(dCurr, 'change', function () {
        curr.value = dCurr.value;
        curr.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    if (lang && dLang) {
      dLang.value = lang.value;
      on(dLang, 'change', function () {
        lang.value = dLang.value;
        lang.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    // Met  jour le badge panier quand il change
    var headerBadge = document.querySelector('.panier-badge');
    if (headerBadge && 'MutationObserver' in window) {
      var mo = new MutationObserver(function () {
        var dBadge = $('[data-drawer-cart-count]');
        if (dBadge) dBadge.textContent = headerBadge.textContent;
      });
      mo.observe(headerBadge, { childList: true, characterData: true, subtree: true });
    }
  }

  // ---------- 3. TOAST ----------
  function ensureToastStack() {
    var stack = $('.toast-stack');
    if (stack) return stack;
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'false');
    document.body.appendChild(stack);
    return stack;
  }

  function showToast(message, opts) {
    opts = opts || {};
    var stack = ensureToastStack();
    if (opts.replace !== false) {
      stack.querySelectorAll('.toast').forEach(function (el) {
        el.classList.remove('is-visible');
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + (opts.type || 'success');
    toast.setAttribute('role', 'status');

    var icon = '';
    if ((opts.type || 'success') === 'success') {
      icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4 4 10-10"/></svg>';
    } else if (opts.type === 'error') {
      icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16v.01"/></svg>';
    } else {
      icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M11 12h1v5h1"/></svg>';
    }
    toast.innerHTML = icon + '<span>' + message + '</span>';

    if (opts.actionLabel && opts.actionHref) {
      var act = document.createElement('a');
      act.className = 'toast__action';
      act.href = opts.actionHref;
      act.textContent = opts.actionLabel;
      toast.appendChild(act);
    } else if (opts.actionLabel && typeof opts.onAction === 'function') {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast__action';
      btn.textContent = opts.actionLabel;
      btn.addEventListener('click', opts.onAction);
      toast.appendChild(btn);
    }

    stack.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });

    var duration = opts.duration || 3600;
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 260);
    }, duration);
  }

  window.showToast = showToast;

  // ---------- 4. STICKY CTA SUR FICHE LIVRE ----------
  function setupStickyCta() {
    if (!/livre\.html|fiche-livre\.html/.test(location.pathname)) return;

    function build() {
      if ($('.sticky-cta-mobile')) return;
      var titleNode = document.querySelector(
        '[data-book-title], #book-detail-title, .livre-detail-titre h1, h1.livre-titre, .livre-hero__title, .book-detail-content h2'
      );
      var priceNode = document.querySelector(
        '[data-book-price], #book-detail-price, .livre-prix, .livre-hero__price, .book-detail-price'
      );
      var btnRef = document.querySelector(
        '[data-add-to-cart], #book-detail-add-to-cart, .ajouter-panier, [data-action="add-to-cart"], .book-detail-content .add-to-cart-btn'
      );
      if (!titleNode || !btnRef) return;
      var title = titleNode.textContent.trim();
      var price = priceNode ? priceNode.textContent.trim() : '';

      var bar = document.createElement('div');
      bar.className = 'sticky-cta-mobile';
      bar.innerHTML =
        '<div class="sticky-cta-mobile__info">' +
          '<p class="sticky-cta-mobile__title">' + title + '</p>' +
          (price ? '<p class="sticky-cta-mobile__price">' + price + '</p>' : '') +
        '</div>' +
        '<button type="button" class="sticky-cta-mobile__btn">Ajouter</button>';
      document.body.appendChild(bar);
      document.body.classList.add('has-sticky-cta');

      bar.querySelector('button').addEventListener('click', function () {
        btnRef.click();
      });

      // Cacher le sticky quand le bouton principal est visible
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            bar.classList.toggle('is-hidden', e.isIntersecting);
          });
        }, { threshold: 0.4 });
        io.observe(btnRef);
      }
    }

    // Attendre que le DOM dynamique soit rempli (app.js peuple la page)
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      build();
      if ($('.sticky-cta-mobile') || tries > 40) clearInterval(t);
    }, 200);
  }

  // ---------- 6. FILTRES CATALOGUE EN DRAWER MOBILE ----------
  function setupCatalogueFilters() {
    var card = $('.filters-card');
    if (!card) return;
    if ($('.filters-mobile-trigger')) return;

    // Bouton trigger au-dessus de la grille
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'filters-mobile-trigger';
    trigger.setAttribute('aria-controls', 'filtersCard');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2"/><circle cx="18" cy="14" r="2"/><path d="M9 7h12M3 14h13M3 7h3M21 14h0"/></svg>' +
      '<span>Filtres</span>';

    var hero = $('.page-hero');
    var layout = $('.catalogue-layout');
    if (hero && hero.parentNode) {
      hero.appendChild(trigger);
    } else if (layout && layout.parentNode) {
      layout.parentNode.insertBefore(trigger, layout);
    }

    card.id = card.id || 'filtersCard';

    // Bouton close en haut du drawer
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'filters-card__close';
    close.setAttribute('aria-label', 'Fermer les filtres');
    close.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18L18 6"/></svg>';
    card.insertBefore(close, card.firstChild);

    // Bouton apply en bas
    var apply = document.createElement('div');
    apply.className = 'filters-card__apply';
    apply.innerHTML = '<button type="button" class="btn-primary">Voir les r\u00e9sultats</button>';
    card.appendChild(apply);

    function setOpen(open) {
      document.body.classList.toggle('filters-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        setTimeout(function () { close.focus(); }, 50);
      } else {
        trigger.focus();
      }
    }

    on(trigger, 'click', function () { setOpen(true); });
    on(close, 'click', function () { setOpen(false); });
    on(apply.querySelector('button'), 'click', function () { setOpen(false); });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('filters-open')) setOpen(false);
    });
  }

  // ---------- 7. AMLIORER LE LAZY LOADING ----------
  function lazyifyImages() {
    $$('img').forEach(function (img) {
      if (img.getAttribute('fetchpriority') === 'high') return;
      if (img.classList.contains('logo-img')) return;
      if (img.id === 'book-detail-main-image') return;
      if (img.closest('.hero, .hero-image, .hero-showcase')) {
        img.setAttribute('fetchpriority', 'high');
        img.removeAttribute('loading');
        return;
      }
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
  }

  // ---------- 8. NETTOYAGE DOUBLONS BURGER ----------
  // Observe le DOM : si app.js retire/ajoute un burger ou injecte un autre
  // bouton menu, on rebuild proprement pour eviter les doublons fantomes.
  function ensureSingleBurger() {
    if (!isMobile()) {
      destroyMobileDrawer();
      return;
    }
    var burgers = $$('.nav-burger');
    if (burgers.length === 0) {
      buildMobileDrawer();
      return;
    }
    if (burgers.length > 1) {
      // Garde le dernier (le plus recent), supprime les autres
      for (var i = 0; i < burgers.length - 1; i++) {
        burgers[i].parentNode && burgers[i].parentNode.removeChild(burgers[i]);
      }
    }
  }

  function watchBurger() {
    if (!('MutationObserver' in window)) return;
    var body = document.body;
    var mo = new MutationObserver(function () {
      ensureSingleBurger();
    });
    mo.observe(body, { childList: true, subtree: true });
  }

  function loadSiteEnhancements() {
    if (document.querySelector('script[data-site-enhancements]')) return;
    var s = document.createElement('script');
    s.src = './site-enhancements.js?v=20260521';
    s.defer = true;
    s.setAttribute('data-site-enhancements', '1');
    document.body.appendChild(s);
  }

  // ---------- INIT ----------
  function syncMobileChrome() {
    if (isMobile()) buildMobileDrawer();
    else destroyMobileDrawer();
  }

  function init() {
    injectSkipLink();
    syncMobileChrome();
    on(window, 'resize', syncMobileChrome);
    setupStickyCta();
    setupCatalogueFilters();
    lazyifyImages();
    watchBurger();
    loadSiteEnhancements();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
