(function () {
  var STORAGE_KEYS = {
    cart: "sucrier_cart",
    favorites: "sucrier_favorites",
    currency: "sucrier_currency",
    language: "sucrier_language",
    promo: "sucrier_promo",
  };
  var CURRENCY_CONFIG = {
    EUR: { code: "EUR", rate: 1 },
    CAD: { code: "CAD", rate: 1.47 },
    USD: { code: "USD", rate: 1.08 },
  };
  var BOOK_CATALOG = {
    "nikou-champion": {
      title: "Nikou champion",
      collection: "Nikou",
      price: 12,
      cover: "images/nikou-champion.png",
      gallery: ["images/nikou-champion.png", "images/bebe-nikou-dit-non.png", "images/sous-le-quenettier-mamy-ayuda-t2.png"],
      authors: [
        { name: "L. Ramassamy", slug: "l-ramassamy" },
        { name: "W. Deroche", slug: "w-deroche" },
      ],
      description:
        "Une aventure rythmée qui valorise l'effort, la confiance et l'esprit d'équipe. Nikou découvre qu'un champion se construit pas à pas, avec l'aide de ses proches.",
      specs: { pages: "36 pages", format: "21 x 29,7 cm", poids: "320 g" },
    },
    "circuit-ferme": {
      title: "Circuit fermé",
      collection: "Album jeunesse",
      price: 14,
      cover: "images/circuit-ferme.png",
      gallery: ["images/circuit-ferme.png", "images/salon-livre-martinique.png", "images/tice-et-metice.png"],
      authors: [
        { name: "J.-F. Silva", slug: "jf-silva" },
        { name: "O. J. F. Junior", slug: "ojf-junior" },
      ],
      description:
        "Un album sensible sur les liens familiaux et les non-dits, raconté à hauteur d'enfant. Le récit propose une lecture progressive, accessible aux lecteurs débutants.",
      specs: { pages: "40 pages", format: "22 x 22 cm", poids: "350 g" },
    },
    exocette: {
      title: "Exocette",
      collection: "Les histoires du Sucrier",
      price: 15,
      cover: "images/exocette.png",
      gallery: ["images/exocette.png", "images/nikou-musicien.png", "images/circuit-ferme.png"],
      authors: [
        { name: "Renata", slug: "renata" },
        { name: "W. Deroche", slug: "w-deroche" },
      ],
      description:
        "Une histoire poétique et colorée inspirée de la mer des Caraïbes. L'album mélange imaginaire, culture locale et découverte de l'environnement.",
      specs: { pages: "44 pages", format: "24 x 30 cm", poids: "390 g" },
    },
    "tice-et-metice": {
      title: "Tice et Métice",
      collection: "Plumes aventureuses",
      price: 13,
      cover: "images/tice-et-metice.png",
      gallery: ["images/tice-et-metice.png", "images/exocette.png", "images/nikou-champion.png"],
      authors: [
        { name: "K. Petevi", slug: "k-petevi" },
        { name: "Gecko Dalch", slug: "gecko-dalch" },
      ],
      description:
        "Deux héros attachants embarquent les lecteurs dans un voyage multilingue entre jeu et découverte. Idéal pour ouvrir la discussion autour des langues et de la diversité.",
      specs: { pages: "38 pages", format: "21 x 29,7 cm", poids: "330 g" },
    },
    "nikou-patron": {
      title: "Nikou patron",
      collection: "Nikou",
      price: 12,
      cover: "images/nikou-patron.png",
      gallery: ["images/nikou-patron.png", "images/nikou-champion.png", "images/nikou-musicien.png"],
      authors: [{ name: "Patrick Petevi", slug: "patrick-petevi" }, { name: "W. Deroche", slug: "w-deroche" }],
      description: "Nikou apprend à prendre des initiatives et à diriger avec bienveillance. Un album dynamique autour de la confiance en soi.",
      specs: { pages: "32 pages", format: "21 x 29,7 cm", poids: "310 g" },
    },
    "bebe-nikou-a-faim": {
      title: "Bébé Nikou a faim",
      collection: "Bébé Nikou",
      price: 10.5,
      cover: "images/bebe-nikou-a-faim.png",
      gallery: ["images/bebe-nikou-a-faim.png", "images/bebe-nikou-dit-non.png", "images/nikou-patron.png"],
      authors: [{ name: "Renata", slug: "renata" }, { name: "Wilfried Deroche", slug: "w-deroche" }],
      description: "Une histoire tendre pour les tout-petits autour des repas, des goûts et des émotions du quotidien.",
      specs: { pages: "24 pages", format: "20 x 20 cm", poids: "220 g" },
    },
    "nikou-musicien-album": {
      title: "Nikou musicien",
      collection: "Nikou",
      price: 12,
      cover: "images/nikou-musicien.png",
      gallery: ["images/nikou-musicien.png", "images/nikou-champion.png", "images/nikou-patron.png"],
      authors: [{ name: "Renata", slug: "renata" }, { name: "Wilfried Deroche", slug: "w-deroche" }],
      description: "Nikou découvre les sons, le rythme et la joie de créer en musique. Parfait pour éveiller la curiosité artistique.",
      specs: { pages: "32 pages", format: "21 x 29,7 cm", poids: "305 g" },
    },
    "mamy-ayuda-t1": {
      title: "Sous le quenettier de Mamy Ayuda — Tome 1",
      collection: "Sous le quenettier",
      price: 12,
      cover: "images/mamy-ayuda-t1.png",
      gallery: ["images/mamy-ayuda-t1.png", "images/sous-le-quenettier-mamy-ayuda-t2.png", "images/mamy-ayuda-t3.png"],
      authors: [{ name: "Katy François", slug: "katy-francois" }, { name: "Didier Duroc", slug: "didier-duroc" }],
      description: "Le premier tome d'une série chaleureuse où traditions, nature et transmission familiale occupent une place centrale.",
      specs: { pages: "40 pages", format: "24 x 30 cm", poids: "390 g" },
    },
    "mamy-ayuda-t3": {
      title: "Sous le quenettier de Mamy Ayuda — Tome 3",
      collection: "Sous le quenettier",
      price: 12,
      cover: "images/mamy-ayuda-t3.png",
      gallery: ["images/mamy-ayuda-t3.png", "images/sous-le-quenettier-mamy-ayuda-t2.png", "images/mamy-ayuda-t1.png"],
      authors: [{ name: "Katy François", slug: "katy-francois" }, { name: "Didier Duroc", slug: "didier-duroc" }],
      description: "Un nouveau voyage sous le quenettier, entre émotions, courage et liens familiaux.",
      specs: { pages: "40 pages", format: "24 x 30 cm", poids: "390 g" },
    },
    "compte-avec-nikou": {
      title: "Compte avec Nikou",
      collection: "Cahiers d'activités",
      price: 9.5,
      cover: "images/compte-avec-nikou.png",
      gallery: ["images/compte-avec-nikou.png", "images/nikou-formes.png", "images/le-cahier-de-nikou.png"],
      authors: [{ name: "Renata", slug: "renata" }],
      description: "Un support ludique pour apprendre à compter en s'amusant avec Nikou.",
      specs: { pages: "28 pages", format: "21 x 29,7 cm", poids: "240 g" },
    },
    "nikou-formes": {
      title: "Nikou joue avec les formes",
      collection: "Cahiers d'activités",
      price: 9.5,
      cover: "images/nikou-formes.png",
      gallery: ["images/nikou-formes.png", "images/compte-avec-nikou.png", "images/le-cahier-de-nikou.png"],
      authors: [{ name: "Renata", slug: "renata" }],
      description: "Activités visuelles pour reconnaître les formes et développer l'observation.",
      specs: { pages: "28 pages", format: "21 x 29,7 cm", poids: "240 g" },
    },
    "le-cahier-de-nikou": {
      title: "Le cahier de Nikou",
      collection: "Cahiers d'activités",
      price: 8.9,
      cover: "images/le-cahier-de-nikou.png",
      gallery: ["images/le-cahier-de-nikou.png", "images/coloriages-nikou-v1.png", "images/le-carnaval-de-nikou.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Exercices progressifs pour accompagner les premiers apprentissages de manière ludique.",
      specs: { pages: "36 pages", format: "21 x 29,7 cm", poids: "270 g" },
    },
    "le-carnaval-de-nikou": {
      title: "Le carnaval de Nikou",
      collection: "Nikou",
      price: 11.5,
      cover: "images/le-carnaval-de-nikou.png",
      gallery: ["images/le-carnaval-de-nikou.png", "images/stickers-carnaval-nikou.png", "images/poster-carnaval-nikou.png"],
      authors: [{ name: "Renata", slug: "renata" }],
      description: "Une immersion colorée dans l'univers du carnaval, avec des personnages attachants.",
      specs: { pages: "32 pages", format: "21 x 29,7 cm", poids: "300 g" },
    },
    "coloriages-nikou-v1": {
      title: "Les coloriages de Nikou — Volume 1",
      collection: "Cahiers d'activités",
      price: 7.9,
      cover: "images/coloriages-nikou-v1.png",
      gallery: ["images/coloriages-nikou-v1.png", "images/le-carnaval-de-nikou.png", "images/stickers-carnaval-nikou.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Un cahier de coloriage pour prolonger la lecture et développer la créativité.",
      specs: { pages: "24 pages", format: "21 x 29,7 cm", poids: "210 g" },
    },
    "lettres-ou-betes": {
      title: "Lettres ou bêtes ?",
      collection: "Abécédaire animalier",
      price: 13.5,
      cover: "images/lettres-ou-betes.png",
      gallery: ["images/lettres-ou-betes.png", "images/poster-abecedaire.png", "images/stickers-abecedaire.png"],
      authors: [{ name: "Renata", slug: "renata" }],
      description: "Un abécédaire original qui associe lettres et animaux de la Caraïbe.",
      specs: { pages: "40 pages", format: "24 x 24 cm", poids: "360 g" },
    },
    "les-couleurs-de-nikou": {
      title: "Les couleurs de Nikou",
      collection: "Nikou",
      price: 10.9,
      cover: "images/les-couleurs-de-nikou.png",
      gallery: ["images/les-couleurs-de-nikou.png", "images/nikou-formes.png", "images/compte-avec-nikou.png"],
      authors: [{ name: "Renata", slug: "renata" }],
      description: "Nikou explore les couleurs à travers des situations du quotidien et des jeux visuels.",
      specs: { pages: "28 pages", format: "21 x 29,7 cm", poids: "250 g" },
    },
    "comptines-karambole-bateaux": {
      title: "Les comptines de Karambole — Les bateaux",
      collection: "Comptines",
      price: 9.9,
      cover: "images/comptines-karambole-bateaux.png",
      gallery: ["images/comptines-karambole-bateaux.png", "images/exocette.png", "images/nikou-musicien.png"],
      authors: [{ name: "Rolyne PAM", slug: "rolyne-pam" }],
      description: "Des comptines illustrées autour de la mer pour chanter, écouter et apprendre.",
      specs: { pages: "20 pages", format: "20 x 20 cm", poids: "190 g" },
    },
    "poster-abecedaire": {
      title: "Poster abécédaire animalier",
      collection: "Papeterie",
      price: 6.5,
      cover: "images/poster-abecedaire.png",
      gallery: ["images/poster-abecedaire.png", "images/stickers-abecedaire.png", "images/stickers-fruits-martinique.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Poster éducatif grand format pour apprendre l'alphabet avec des animaux caribéens.",
      specs: { pages: "Poster", format: "A2", poids: "90 g" },
    },
    "poster-carnaval-nikou": {
      title: "Poster Vive le carnaval avec Nikou",
      collection: "Papeterie",
      price: 6.5,
      cover: "images/poster-carnaval-nikou.png",
      gallery: ["images/poster-carnaval-nikou.png", "images/stickers-carnaval-nikou.png", "images/le-carnaval-de-nikou.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Un poster coloré pour décorer une chambre ou un coin lecture sur le thème du carnaval.",
      specs: { pages: "Poster", format: "A2", poids: "90 g" },
    },
    "stickers-carnaval-nikou": {
      title: "Stickers Le carnaval de Nikou",
      collection: "Papeterie",
      price: 4.9,
      cover: "images/stickers-carnaval-nikou.png",
      gallery: ["images/stickers-carnaval-nikou.png", "images/le-carnaval-de-nikou.png", "images/poster-carnaval-nikou.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Planche de stickers pour prolonger l'univers du carnaval à la maison.",
      specs: { pages: "1 planche", format: "A4", poids: "40 g" },
    },
    "stickers-abecedaire": {
      title: "Stickers abécédaire animalier",
      collection: "Papeterie",
      price: 4.9,
      cover: "images/stickers-abecedaire.png",
      gallery: ["images/stickers-abecedaire.png", "images/poster-abecedaire.png", "images/lettres-ou-betes.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Stickers éducatifs pour jouer avec les lettres et les animaux.",
      specs: { pages: "1 planche", format: "A4", poids: "40 g" },
    },
    "stickers-fruits-martinique": {
      title: "Stickers Fruits de Martinique",
      collection: "Papeterie",
      price: 5.5,
      cover: "images/stickers-fruits-martinique.png",
      gallery: ["images/stickers-fruits-martinique.png", "images/stickers-abecedaire.png", "images/poster-abecedaire.png"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Planche quadrilingue pour découvrir les fruits de Martinique en s'amusant.",
      specs: { pages: "1 planche", format: "A4", poids: "45 g" },
    },
    "cle-usb-exocette": {
      title: "Clé USB audio Exocette",
      collection: "Produits dérivés",
      price: 12.9,
      cover: "images/cle-usb-exocette.png",
      gallery: ["images/cle-usb-exocette.png", "images/exocette.png", "images/comptines-karambole-bateaux.png"],
      authors: [{ name: "Les Editions du Sucrier", slug: "editions-du-sucrier" }],
      description: "Version audio d'Exocette sur clé USB pour écouter l'histoire partout.",
      specs: { pages: "Audio", format: "USB", poids: "35 g" },
    },
    "peluche-nikou": {
      title: "La peluche de Nikou",
      collection: "Produits dérivés",
      price: 18.9,
      cover: "images/peluche-nikou.png",
      gallery: ["images/peluche-nikou.png", "images/nikou-champion.png", "images/nikou-musicien.png"],
      authors: [{ name: "Les Editions du Sucrier", slug: "editions-du-sucrier" }],
      description: "Une peluche douce et fidèle au personnage pour accompagner les moments lecture.",
      specs: { pages: "Produit textile", format: "28 cm", poids: "210 g" },
    },
  };
  var PROMO_CODES = {
    SUCRIER10: { type: "percent", value: 10, label: "Remise de 10% appliquee." },
    LIVRAISON0: { type: "shipping", value: 100, label: "Livraison offerte appliquee." },
  };

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getCart() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []).map(function (item) {
      return {
        id: item.id,
        title: item.title,
        price: Number(item.price) || 0,
        image: item.image || "",
        qty: Math.max(1, Number(item.qty) || 1),
      };
    });
  }

  function setCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }

  function getPromoCode() {
    return (localStorage.getItem(STORAGE_KEYS.promo) || "").toUpperCase();
  }

  function setPromoCode(code) {
    if (!code) {
      localStorage.removeItem(STORAGE_KEYS.promo);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.promo, code.toUpperCase());
  }

  function getFavorites() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.favorites), []);
  }

  function setFavorites(favorites) {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }

  function parsePrice(priceText) {
    var normalized = String(priceText || "").replace(/[^0-9,.\-]/g, "").trim();
    if (!normalized) return 0;
    if (normalized.includes(",") && normalized.includes(".")) {
      if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
      } else {
        normalized = normalized.replace(/,/g, "");
      }
    } else {
      normalized = normalized.replace(",", ".");
    }
    var value = parseFloat(normalized);
    return Number.isFinite(value) ? value : 0;
  }

  function getSelectedCurrency() {
    var saved = localStorage.getItem(STORAGE_KEYS.currency);
    return CURRENCY_CONFIG[saved] ? saved : "EUR";
  }

  function setSelectedCurrency(currency) {
    if (!CURRENCY_CONFIG[currency]) return;
    localStorage.setItem(STORAGE_KEYS.currency, currency);
  }

  function getSelectedLanguage() {
    var saved = localStorage.getItem(STORAGE_KEYS.language);
    return saved === "en" ? "en" : "fr";
  }

  function setSelectedLanguage(language) {
    var normalized = language === "en" ? "en" : "fr";
    localStorage.setItem(STORAGE_KEYS.language, normalized);
  }

  function convertFromEUR(valueInEUR, currency) {
    var cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR;
    return valueInEUR * cfg.rate;
  }

  function formatPrice(valueInEUR) {
    var currency = getSelectedCurrency();
    var converted = convertFromEUR(valueInEUR, currency);
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: (CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR).code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }

  function getDisplayPriceNodes() {
    return document.querySelectorAll(
      ".book-card-prix, .catalogue-meta span:first-child, .cart-item-price"
    );
  }

  function primeDisplayPrices() {
    getDisplayPriceNodes().forEach(function (node) {
      if (node.dataset.priceEur) return;
      var eurValue = parsePrice(node.textContent);
      node.dataset.priceEur = String(eurValue);
    });
  }

  function renderDisplayPrices() {
    primeDisplayPrices();
    getDisplayPriceNodes().forEach(function (node) {
      var eurValue = parseFloat(node.dataset.priceEur || "0");
      node.textContent = formatPrice(Number.isFinite(eurValue) ? eurValue : 0);
    });
  }

  function applyLanguageSetting(language) {
    document.documentElement.setAttribute("lang", language === "en" ? "en" : "fr");
  }

  function bindPreferenceControls() {
    var currencySelect = document.getElementById("currency-select");
    var languageSelect = document.getElementById("language-select");

    if (currencySelect) {
      currencySelect.value = getSelectedCurrency();
      currencySelect.addEventListener("change", function () {
        setSelectedCurrency(currencySelect.value);
        renderCartPage();
        renderDisplayPrices();
      });
    }

    if (languageSelect) {
      languageSelect.value = getSelectedLanguage();
      languageSelect.addEventListener("change", function () {
        setSelectedLanguage(languageSelect.value);
        applyLanguageSetting(languageSelect.value);
      });
    }
  }

  function updateHeaderBadges() {
    var cart = getCart();
    var favorites = getFavorites();

    document.querySelectorAll(".panier-badge").forEach(function (badge) {
      badge.textContent = String(cart.length);
    });

    document.querySelectorAll(".icon-btn").forEach(function (btn) {
      if (!btn.textContent.includes("Favoris")) return;
      var labelNode = Array.from(btn.childNodes).find(function (node) {
        return node.nodeType === 3 && node.textContent.trim().length > 0;
      });
      if (labelNode) {
        labelNode.textContent = " Favoris (" + favorites.length + ")";
      }
    });
  }

  function toggleFavorite(productId, triggerButton) {
    var favorites = getFavorites();
    var exists = favorites.includes(productId);
    var next = exists
      ? favorites.filter(function (id) {
          return id !== productId;
        })
      : favorites.concat(productId);

    setFavorites(next);
    if (triggerButton) {
      triggerButton.classList.toggle("is-favorite", !exists);
      triggerButton.setAttribute("aria-pressed", String(!exists));
      triggerButton.classList.remove("is-pulsing");
      void triggerButton.offsetWidth;
      triggerButton.classList.add("is-pulsing");
      setTimeout(function () {
        triggerButton.classList.remove("is-pulsing");
      }, 380);
    }
    updateHeaderBadges();
  }

  function bindWishlistButtons() {
    var favorites = getFavorites();
    document.querySelectorAll(".wishlist-btn[data-product-id]").forEach(function (button) {
      var productId = button.getAttribute("data-product-id");
      var active = favorites.includes(productId);
      button.classList.toggle("is-favorite", active);
      button.setAttribute("aria-pressed", String(active));
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(productId, button);
      });
    });
  }

  function addToCartFromButton(button) {
    var card = button.closest("[data-product-id]");
    if (!card) return;
    var productId = card.getAttribute("data-product-id");
    var titleEl = card.querySelector(".book-card-titre, h3");
    var priceEl = card.querySelector(".book-card-prix, .catalogue-meta span");
    var imageEl = card.querySelector("img");
    var priceInEUR =
      priceEl && priceEl.dataset.priceEur
        ? parseFloat(priceEl.dataset.priceEur)
        : parsePrice(priceEl ? priceEl.textContent : "0");
    var item = {
      id: productId,
      title: titleEl ? titleEl.textContent.trim() : productId,
      price: Number.isFinite(priceInEUR) ? priceInEUR : 0,
      image: imageEl ? imageEl.getAttribute("src") : "",
      qty: 1,
    };

    var cart = getCart();
    var existing = cart.find(function (cartItem) {
      return cartItem.id === item.id;
    });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(item);
    }
    setCart(cart);
    updateHeaderBadges();

    button.textContent = "Ajoute";
    setTimeout(function () {
      button.textContent = "Ajouter";
    }, 800);
  }

  function bindAddToCartButtons() {
    document.querySelectorAll(".add-to-cart-btn").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        addToCartFromButton(button);
      });
    });
  }

  function renderCatalogueGrid() {
    var grid = document.querySelector(".catalogue-grid");
    if (!grid) return;

    var html = Object.keys(BOOK_CATALOG)
      .map(function (id) {
        var book = BOOK_CATALOG[id];
        var authors = book.authors
          .map(function (author) {
            return author.name;
          })
          .join(" · ");
        var previewImages = (book.gallery && book.gallery.length ? book.gallery : [book.cover]).join(",");
        return (
          '<article class="catalogue-card" data-product-id="' +
          id +
          '" data-collection="' +
          book.collection +
          '" data-preview-images="' +
          previewImages +
          '">' +
          '<div class="catalogue-card-media"><img src="' +
          book.cover +
          '" alt="' +
          book.title +
          '" class="catalogue-card-image"><span class="catalogue-preview-tag">Aperçu</span></div>' +
          '<div class="catalogue-card-body"><h3>' +
          book.title +
          "</h3><p>" +
          authors +
          '</p><div class="catalogue-meta"><span data-price-eur="' +
          String(book.price) +
          '">' +
          formatPrice(book.price) +
          '</span><button type="button" class="wishlist-btn" data-product-id="' +
          id +
          '" aria-label="Ajouter ' +
          book.title +
          ' aux favoris"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button><button type="button" class="add-to-cart-btn">Ajouter</button></div></div></article>'
        );
      })
      .join("");

    grid.innerHTML = html;
  }

  function computeCartTotals(cart, promoCode) {
    var subtotal = cart.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
    var shipping = subtotal >= 45 || subtotal === 0 ? 0 : 4.9;
    var promo = PROMO_CODES[promoCode];
    var discount = 0;
    if (promo) {
      if (promo.type === "percent") {
        discount = subtotal * (promo.value / 100);
      }
      if (promo.type === "shipping") {
        discount = shipping;
      }
    }
    var taxedBase = Math.max(0, subtotal - discount);
    var tax = taxedBase * 0.085;
    var total = Math.max(0, subtotal + shipping + tax - discount);
    return {
      subtotal: subtotal,
      shipping: shipping,
      discount: discount,
      tax: tax,
      total: total,
      promo: promo || null,
    };
  }

  function updateCartItemQuantity(index, delta) {
    var cart = getCart();
    var target = cart[index];
    if (!target) return;
    target.qty += delta;
    if (target.qty <= 0) {
      cart.splice(index, 1);
    }
    setCart(cart);
    renderCartPage();
    renderDisplayPrices();
  }

  function initCatalogueExperience() {
    var grid = document.querySelector(".catalogue-grid");
    var modal = document.getElementById("catalogue-detail-modal");
    if (!grid || !modal) return;

    var detailTitle = document.getElementById("catalogue-detail-title");
    var detailCollection = document.getElementById("catalogue-detail-collection");
    var detailAuthors = document.getElementById("catalogue-detail-authors");
    var detailPrice = document.getElementById("catalogue-detail-price");
    var detailDescription = document.getElementById("catalogue-detail-description");
    var detailSpecs = document.getElementById("catalogue-detail-specs");
    var detailMainImage = document.getElementById("catalogue-detail-main-image");
    var detailThumbs = document.getElementById("catalogue-detail-thumbs");
    var detailRecoList = document.getElementById("catalogue-detail-reco-list");
    var closeBtn = modal.querySelector(".catalogue-detail-close");

    function getPreviewImages(card) {
      var raw = card.getAttribute("data-preview-images") || "";
      return raw
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
    }

    function setupCardPreview(card) {
      var image = card.querySelector(".catalogue-card-image");
      var images = getPreviewImages(card);
      if (!image || images.length <= 1) return;
      var timer = null;
      var current = 0;
      var initial = images[0];

      card.addEventListener("mouseenter", function () {
        if (timer) return;
        timer = setInterval(function () {
          current = (current + 1) % images.length;
          image.src = images[current];
        }, 1100);
      });

      card.addEventListener("mouseleave", function () {
        if (timer) clearInterval(timer);
        timer = null;
        current = 0;
        image.src = initial;
      });
    }

    function closeDetailModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function setActiveThumb(index) {
      detailThumbs.querySelectorAll(".catalogue-detail-thumb").forEach(function (btn, btnIndex) {
        btn.classList.toggle("is-active", btnIndex === index);
      });
    }

    function openDetailModal(productId) {
      var book = BOOK_CATALOG[productId];
      if (!book) return;

      detailCollection.textContent = book.collection;
      detailTitle.textContent = book.title;
      detailDescription.textContent = book.description;
      detailPrice.dataset.priceEur = String(book.price);
      detailPrice.textContent = formatPrice(book.price);
      detailMainImage.src = book.cover;
      detailMainImage.alt = "Visuel du livre " + book.title;

      detailAuthors.innerHTML =
        "Auteurs : " +
        book.authors
          .map(function (author) {
            return '<a href="auteur.html?slug=' + author.slug + '">' + author.name + "</a>";
          })
          .join(" · ");

      detailSpecs.innerHTML =
        "<li><strong>Nombre de pages :</strong> " +
        book.specs.pages +
        "</li>" +
        "<li><strong>Format :</strong> " +
        book.specs.format +
        "</li>" +
        "<li><strong>Poids :</strong> " +
        book.specs.poids +
        "</li>";

      detailThumbs.innerHTML = "";
      book.gallery.forEach(function (src, index) {
        var thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "catalogue-detail-thumb" + (index === 0 ? " is-active" : "");
        thumb.innerHTML = '<img src="' + src + '" alt="">';
        thumb.addEventListener("click", function () {
          detailMainImage.src = src;
          setActiveThumb(index);
        });
        detailThumbs.appendChild(thumb);
      });

      var recommendations = Object.keys(BOOK_CATALOG)
        .filter(function (id) {
          return id !== productId;
        })
        .sort(function (a, b) {
          var aScore = BOOK_CATALOG[a].collection === book.collection ? 1 : 0;
          var bScore = BOOK_CATALOG[b].collection === book.collection ? 1 : 0;
          return bScore - aScore;
        })
        .slice(0, 4);

      detailRecoList.innerHTML = "";
      recommendations.forEach(function (id) {
        var rec = BOOK_CATALOG[id];
        var item = document.createElement("article");
        item.className = "catalogue-detail-reco-item";
        item.innerHTML =
          '<img src="' +
          rec.cover +
          '" alt="">' +
          "<div><h4>" +
          rec.title +
          "</h4><p>" +
          rec.collection +
          "</p></div>";
        item.addEventListener("click", function () {
          openDetailModal(id);
        });
        detailRecoList.appendChild(item);
      });

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      renderDisplayPrices();
    }

    grid.querySelectorAll(".catalogue-card").forEach(function (card) {
      setupCardPreview(card);
      card.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        openDetailModal(card.getAttribute("data-product-id"));
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeDetailModal);
    }
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeDetailModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeDetailModal();
      }
    });
  }

  function renderCartPage() {
    var list = document.querySelector(".cart-list");
    if (!list) return;
    var countNode = document.querySelector("[data-cart-count]");
    var promoForm = document.querySelector("[data-promo-form]");
    var promoInput = document.getElementById("promo-code");
    var promoFeedback = document.querySelector("[data-promo-feedback]");
    var clearCartButton = document.querySelector('[data-action="clear-cart"]');

    var cart = getCart();
    var promoCode = getPromoCode();
    var totals = computeCartTotals(cart, promoCode);
    list.innerHTML = "";
    if (countNode) {
      countNode.textContent = cart.length + (cart.length > 1 ? " articles" : " article");
    }

    if (cart.length === 0) {
      list.innerHTML =
        '<article class="cart-item cart-item--empty"><div class="cart-item-info"><h3>Votre panier est vide</h3><p>Ajoutez des livres depuis le catalogue pour commencer votre commande.</p></div></article>';
      var summary = document.querySelector(".cart-summary");
      if (summary) {
        summary.querySelectorAll("[data-summary]").forEach(function (el) {
          el.dataset.priceEur = "0";
          el.textContent = formatPrice(0);
        });
      }
      if (promoFeedback) {
        promoFeedback.textContent = "Ajoutez un article pour appliquer un code promo.";
      }
      updateHeaderBadges();
      return;
    }

    cart.forEach(function (item, index) {
      var article = document.createElement("article");
      article.className = "cart-item";
      article.setAttribute("data-cart-index", String(index));
      article.innerHTML =
        '<img src="' +
        item.image +
        '" alt="">' +
        '<div class="cart-item-info"><h3>' +
        item.title +
        "</h3><p>Quantite : " +
        item.qty +
        '</p></div><strong class="cart-item-price">' +
        formatPrice(item.price * item.qty) +
        '</strong><div class="qty-control"><button type="button" class="qty-btn" data-cart-action="decrease" aria-label="Diminuer la quantite">−</button><span class="qty-value">' +
        item.qty +
        '</span><button type="button" class="qty-btn" data-cart-action="increase" aria-label="Augmenter la quantite">+</button></div><button type="button" class="remove-item-btn" data-cart-action="remove" aria-label="Supprimer cet article">Supprimer</button>';
      list.appendChild(article);
    });

    var subNode = document.querySelector('[data-summary="subtotal"]');
    var shipNode = document.querySelector('[data-summary="shipping"]');
    var discountNode = document.querySelector('[data-summary="discount"]');
    var taxNode = document.querySelector('[data-summary="tax"]');
    var totalNode = document.querySelector('[data-summary="total"]');
    if (subNode) {
      subNode.dataset.priceEur = String(totals.subtotal);
      subNode.textContent = formatPrice(totals.subtotal);
    }
    if (shipNode) {
      shipNode.dataset.priceEur = String(totals.shipping);
      shipNode.textContent = formatPrice(totals.shipping);
    }
    if (discountNode) {
      discountNode.dataset.priceEur = String(totals.discount);
      discountNode.textContent = totals.discount ? "-" + formatPrice(totals.discount) : formatPrice(0);
    }
    if (taxNode) {
      taxNode.dataset.priceEur = String(totals.tax);
      taxNode.textContent = formatPrice(totals.tax);
    }
    if (totalNode) {
      totalNode.dataset.priceEur = String(totals.total);
      totalNode.textContent = formatPrice(totals.total);
    }

    if (promoInput) promoInput.value = promoCode;
    if (promoFeedback) {
      promoFeedback.textContent = totals.promo
        ? totals.promo.label
        : "Codes disponibles pour test : SUCRIER10, LIVRAISON0";
    }

    list.querySelectorAll("[data-cart-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var row = button.closest("[data-cart-index]");
        if (!row) return;
        var idx = Number(row.getAttribute("data-cart-index"));
        var action = button.getAttribute("data-cart-action");
        if (action === "increase") updateCartItemQuantity(idx, 1);
        if (action === "decrease") updateCartItemQuantity(idx, -1);
        if (action === "remove") updateCartItemQuantity(idx, -999);
      });
    });

    if (promoForm) {
      promoForm.onsubmit = function (event) {
        event.preventDefault();
        var code = String((promoInput && promoInput.value) || "")
          .trim()
          .toUpperCase();
        if (code && !PROMO_CODES[code]) {
          if (promoFeedback) promoFeedback.textContent = "Code promo invalide.";
          return;
        }
        setPromoCode(code);
        renderCartPage();
      };
    }

    if (clearCartButton) {
      clearCartButton.onclick = function () {
        setCart([]);
        setPromoCode("");
        renderCartPage();
        renderDisplayPrices();
      };
    }

    updateHeaderBadges();
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLanguageSetting(getSelectedLanguage());
    renderCatalogueGrid();
    primeDisplayPrices();
    bindPreferenceControls();
    bindWishlistButtons();
    bindAddToCartButtons();
    initCatalogueExperience();
    renderCartPage();
    renderDisplayPrices();
    updateHeaderBadges();
  });
})();
