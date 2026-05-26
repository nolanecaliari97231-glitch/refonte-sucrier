/* ============================================================
 * partners-loader.js  Chargement dynamique des partenaires
 *
 * Lit data/partners.json et reconstruit le contenu des sections
 * pour permettre au back-office (backoffice/partenaires.php) de
 * grer ajout/modification/suppression sans toucher au HTML.
 *
 * Le HTML statique sert de fallback : si le JSON n'est pas joignable
 * ou est invalide, on garde le rendu original.
 * ============================================================ */
(function () {
  'use strict';
  if (!document.querySelector('.about-partners-page')) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function logoHtml(item, size) {
    var w = size && size.w ? size.w : 160;
    var h = size && size.h ? size.h : 80;
    if (item.logo) {
      return '<img src="' + esc(item.logo) + '" alt="' + esc(item.name) + '" width="' + w + '" height="' + h + '" loading="lazy" decoding="async">';
    }
    return '<span class="partners-logo-text">' + esc(item.name) + '</span>';
  }

  var LOGO_BOOST_IDS = {
    'rezo-filibo': true,
    'labo-des-histoires': true,
    'kemeh': true,
    'kazabul': true,
    'point-lire': true,
    'ofb': true,
    'parc-naturel-marin': true,
    'handisport-martinique': true,
    'reseau-initiative-france': true,
    'la-reserve-creole': true,
    'librairie-michel-fortin': true
  };

  function itemHtml(item, opts) {
    opts = opts || {};
    var classes = 'partners-logo-item';
    if (!item.logo) classes += ' partners-logo-item--text';
    if (opts.label) classes += ' partners-logo-item--label';
    if (item.id === 'alliance-editeurs-independants') classes += ' partners-logo-item--alliance';
    if (item.id === 'prefecture-martinique') classes += ' partners-logo-item--prefet';
    if (LOGO_BOOST_IDS[item.id]) classes += ' partners-logo-item--boost';
    var inner = logoHtml(item, opts.size);
    if (item.url) {
      inner = '<a href="' + esc(item.url) + '" target="_blank" rel="noopener" aria-label="' + esc(item.name) + '">' + inner + '</a>';
    }
    return '<li class="' + classes + '">' + inner + '</li>';
  }

  function applySectionCopy(sectionEl, sectionData) {
    if (!sectionEl || !sectionData) return;
    var titleEl = sectionEl.querySelector('[id$="-title"], .partners-panel__title, h2');
    if (titleEl && sectionData.title_fr) {
      titleEl.textContent = sectionData.title_fr;
      titleEl.setAttribute('data-fr', sectionData.title_fr);
      if (sectionData.title_en) titleEl.setAttribute('data-en', sectionData.title_en);
    }
    var introEl = sectionEl.querySelector('.partners-panel__intro, .partners-panel > p');
    if (introEl && sectionData.intro_fr) {
      introEl.textContent = sectionData.intro_fr;
      introEl.setAttribute('data-fr', sectionData.intro_fr);
      if (sectionData.intro_en) introEl.setAttribute('data-en', sectionData.intro_en);
    }
  }

  function renderFlatSection(sectionEl, sectionData, opts) {
    opts = opts || {};
    if (!sectionEl || !sectionData) return;
    applySectionCopy(sectionEl, sectionData);
    var ul = sectionEl.querySelector('[data-partners-logos]');
    if (!ul) return;
    var items = Array.isArray(sectionData.items) ? sectionData.items : [];
    if (!items.length) {
      ul.innerHTML = '';
      return;
    }
    ul.innerHTML = items.map(function (it) {
      return itemHtml(it, { label: !!opts.label, size: opts.size });
    }).join('');
  }

  function renderBookshopsRegion(regionKey, sectionData) {
    if (!sectionData) return;
    var card = document.querySelector('[data-partners-region="' + regionKey + '"]');
    if (!card) return;
    var titleEl = card.querySelector('.partners-region-card__title');
    if (titleEl && sectionData.title_fr) {
      titleEl.textContent = sectionData.title_fr;
      titleEl.setAttribute('data-fr', sectionData.title_fr);
      if (sectionData.title_en) titleEl.setAttribute('data-en', sectionData.title_en);
    }
    var introEl = card.querySelector('.partners-region-card__intro, p');
    if (introEl && sectionData.intro_fr) {
      introEl.textContent = sectionData.intro_fr;
    }
    var badgeEl = card.querySelector('.partners-region-card__badge');
    if (badgeEl && sectionData.code) badgeEl.textContent = sectionData.code;
    var ul = card.querySelector('[data-partners-logos]');
    if (!ul) return;
    ul.innerHTML = (sectionData.items || []).map(function (it) { return itemHtml(it); }).join('');
  }

  function applyData(data) {
    if (!data || !data.sections) return;
    var s = data.sections;

    // Institutional
    var institEl = document.querySelector('[data-partners-section="institutional"]');
    if (institEl) renderFlatSection(institEl, s.institutional);

    // Labels
    var labelsEl = document.querySelector('[data-partners-section="labels"]');
    if (labelsEl) renderFlatSection(labelsEl, s.labels, { label: true });

    // Associations
    var assoEl = document.querySelector('[data-partners-section="associations"]');
    if (assoEl) renderFlatSection(assoEl, s.associations);

    var bookshopsEl = document.querySelector('.partners-panel--bookshops');
    if (bookshopsEl && s.bookshops_panel) {
      applySectionCopy(bookshopsEl, s.bookshops_panel);
    }

    // Librairies : chaque pays = une carte indpendante
    renderBookshopsRegion('martinique', s.bookshops_martinique);
    renderBookshopsRegion('guadeloupe', s.bookshops_guadeloupe);
    renderBookshopsRegion('france', s.bookshops_france);
    renderBookshopsRegion('canada', s.bookshops_canada);
    renderBookshopsRegion('chypre', s.bookshops_chypre);
    renderBookshopsRegion('senegal', s.bookshops_senegal);
  }

  fetch('data/partners.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data) applyData(data);
    })
    .catch(function () { /* fallback HTML statique */ });
})();
