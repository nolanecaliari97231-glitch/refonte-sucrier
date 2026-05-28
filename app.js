(function () {
  /**
   * Vue d'ensemble du fichier:
   * 1) Configuration globale (catalogue par defaut, devise, stockage local)
   * 2) Chargement du contenu CMS (api/content.php -> fusion dans le front)
   * 3) Rendu des pages (catalogue, fiche produit, auteurs, partenaires, panier)
   * 4) Comportements utilisateur (panier, favoris, auth, i18n, navigation)
   *
   * Le principe important:
   * - BOOK_CATALOG_DEFAULT = base front statique
   * - contenu.json (via API) = surcouche editable en backoffice
   * - les fonctions "apply*" injectent les textes/donnees CMS dans le DOM
   */
  var STORAGE_KEYS = {
    cart: "sucrier_cart",
    favorites: "sucrier_favorites",
    currency: "sucrier_currency",
    language: "sucrier_language",
    promo: "sucrier_promo",
    segment: "sucrier_segment",
    authEvents: "sucrier_auth_events",
    session: "sucrier_session",
    accounts: "sucrier_accounts",
    cookieConsent: "sucrier_cookie_consent",
    fxRatesCache: "sucrier_fx_rates_cache",
    shippingMode: "sucrier_shipping_mode",
    shippingPostalCountry: "sucrier_shipping_postal_country",
    shippingNote: "sucrier_shipping_note",
    orderHistory: "sucrier_order_history",
    shippingAddresses: "sucrier_shipping_addresses",
    proResourceDownloads: "sucrier_pro_resource_downloads",
    recentlyViewed: "sucrier_recently_viewed",
    recentlyViewedHidden: "sucrier_recently_viewed_hidden",
  };
  var CURRENCY_CONFIG = {
    EUR: { code: "EUR", rate: 1 },
    CAD: { code: "CAD", rate: 1 },
    USD: { code: "USD", rate: 1 },
  };
  var FX_STATE = {
    ready: false,
    source: "",
    rateDate: "",
    stale: false,
  };
  var DEFAULT_BOOK_WEIGHT_G = 280;
  var SHIPPING_POSTAL_ZONE_TIERS = {
    dom_martinique_near: [
      { maxWeightG: 500, amountEur: 15.69 },
      { maxWeightG: 1000, amountEur: 19.69 },
      { maxWeightG: 2000, amountEur: 22.49 },
      { maxWeightG: 5000, amountEur: 28.59 },
      { maxWeightG: 10000, amountEur: 47.19 },
      { maxWeightG: 15000, amountEur: 69.39 },
      { maxWeightG: 20000, amountEur: 89.79 },
    ],
    dom_international: [
      { maxWeightG: 500, amountEur: 34.59 },
      { maxWeightG: 1000, amountEur: 38.69 },
      { maxWeightG: 2000, amountEur: 53.29 },
      { maxWeightG: 5000, amountEur: 77.89 },
      { maxWeightG: 10000, amountEur: 147.39 },
      { maxWeightG: 15000, amountEur: 209.29 },
      { maxWeightG: 20000, amountEur: 254.99 },
      { maxWeightG: 30000, amountEur: 254.99 },
    ],
  };
  var SHIPPING_POSTAL_ZONE_ALIASES = {
    martinique: "dom_martinique_near",
    antilles_usa: "dom_martinique_near",
    international_other: "dom_international",
  };
  var SHIPPING_COUNTRY_ZONE_MAP = {
    MQ: "dom_martinique_near",
    GP: "dom_martinique_near",
    AG: "dom_martinique_near",
    AN: "dom_martinique_near",
    BB: "dom_martinique_near",
    DM: "dom_martinique_near",
    US: "dom_martinique_near",
    GD: "dom_martinique_near",
    GY: "dom_martinique_near",
    HT: "dom_martinique_near",
    MS: "dom_martinique_near",
    KN: "dom_martinique_near",
    VC: "dom_martinique_near",
    LC: "dom_martinique_near",
    TT: "dom_martinique_near",
    VG: "dom_martinique_near",
    FR: "dom_international",
    RE: "dom_international",
    CA: "dom_international",
    GB: "dom_international",
    DE: "dom_international",
    ES: "dom_international",
    IT: "dom_international",
  };
  var SHIPPING_LOCAL_PERSONAL_EUR = 1.5;
  var BOOK_CATALOG_DEFAULT = {
    "nikou-champion": {
      title: "Nikou champion",
      collection: "Nikou",
      price: 10,
      catalogueCoverPosition: "top",
      cover: "images/catalog/nikou-champion-cover.webp",
      gallery: [
        "images/catalog/nikou-champion-cover.webp",
        "images/catalog/nikou-champion-planche-sports.png",
        "images/catalog/nikou-champion-planche-athletisme.png",
      ],
      authors: [
        { name: "Léanne Ramassamy", slug: "l-ramassamy" },
        { name: "Wilfried Deroche", slug: "w-deroche" },
      ],
      description:
        "Nikou est infatigable : il court, il saute, il cabriole ! Un jour, il deviendra un grand champion. Et toi ?\n\nUn album pour permettre aux petits de découvrir le sport et encourager leur envie de pratiquer une activité physique régulière. Album inclusif, quadrilingue (français, créole, espagnol, anglais), avec des personnages en situation de handicap.",
      ageGroup: "3-5",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-10-9",
        pages: "44 pages",
        format: "170 x 240 mm · couverture rigide",
        publicationDate: "À partir de 3 ans",
      },
    },
    "circuit-ferme": {
      title: "Circuit fermé",
      collection: "Bulles de Sucrier",
      price: 16,
      cover: "images/catalog/circuit-ferme-premiere-couverture.webp",
      gallery: [
        "images/catalog/circuit-ferme-premiere-couverture.webp",
        "images/catalog/circuit-ferme-planche-1.png",
        "images/catalog/circuit-ferme-planche-2.png",
      ],
      authors: [
        { name: "Jean Fritz Junior ODNÉ", slug: "ojf-junior" },
        { name: "Jean Francisco Silva", slug: "jf-silva" },
      ],
      description:
        "Sur la route nationale, les embouteillages sont devenus un lieu où l'on prend son mal en patience… ou où l'on se montre sous les flashs des passants — jusqu'au jour où il n'y a plus une voiture. Pour Alice et Jacob, l'enquête commence dans cette première BD de la collection Bulles de Sucrier, avec une intrigue décalée sur des enjeux d'actualité. Version numérique : livre numérique africain (Cyber Scribe, distributeur France / Europe · Gencod 3012427330018 · csfdis@cyber-scribe.fr).",
      ageGroup: "9+",
      languages: ["Français"],
      specs: {
        isbn: "978-2-9563225-6-6",
        pages: "56 pages",
        format: "Format A4 (album BD)",
        publicationDate: "Dès 9 ans",
      },
    },
    exocette: {
      title: "Exocette (tome 1) — 2e édition",
      collection: "Les histoires du Sucrier",
      price: 14,
      cover: "images/catalog/exocette-premiere-couverture.webp",
      gallery: [
        "images/catalog/exocette-premiere-couverture.webp",
        "images/catalog/exocette-tome-1-planche-2.png",
        "images/catalog/exocette-tome-1-planche-3.png",
      ],
      authors: [
        { name: "Renata", slug: "renata" },
        { name: "W. Deroche", slug: "w-deroche" },
      ],
      description:
        "Exocette n'a pas peur des pêcheurs : elle est courageuse et toujours de bonne humeur… mais elle aussi un problème à affronter. Album labellisé qui aborde avec humour et tendresse le handicap, encourage l'activité physique et éveille aux enjeux du milieu marin. Réalisé avec le Parc naturel marin de Martinique, l'Office français de la biodiversité et le Comité régional Handisport. L'histoire existe aussi en livre audio quadrilingue sur https://1voix1histoire.com",
      ageGroup: "6-8",
      languages: ["Français", "Créole martiniquais", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-13-0",
        pages: "56 pages",
        format: "21 x 21 cm",
        publicationDate: "Dès 6 ans",
      },
    },
    "tice-et-metice": {
      title: "Tice et Métice",
      collection: "Les histoires du Sucrier",
      price: 13,
      cover: "images/catalog/tice-et-metice-premiere-couverture.webp",
      gallery: [
        "images/catalog/tice-et-metice-premiere-couverture.webp",
        "images/catalog/tice-et-metice-planche-interieure.webp",
        "images/catalog/tice-et-metice-quatrieme-couverture.webp",
      ],
      authors: [
        { name: "Karine Petevi", slug: "k-petevi" },
        { name: "Gecko Dalch" },
      ],
      description:
        "En décembre 2022, Les Éditions du Sucrier accueillent depuis Chypre la proposition de Karine Petevi pour publier ce premier album jeunesse, illustré par Gecko Dalch : une ouverture internationale qui met en avant la Martinique au sein de la collection Les histoires du Sucrier.\n\nL'histoire de Tice et Métice est un dialogue entre deux oiseaux très différents qui se rencontrent et font connaissance en échangeant autour de leurs expériences respectives. Tice, toute blanche, s'extasie sur le plumage multicolore de Métice. Ce dernier lui raconte alors les sept voyages qui lui ont permis d'acquérir ses couleurs extraordinaires. Il s'agit d'une histoire qui invite à la découverte et à l'acceptation de l'autre dans sa différence, tout en sollicitant la vision, l'odorat, l'ouïe et le toucher. Album quadrilingue français, créole martiniquais, espagnol et anglais : il favorise l'éveil linguistique des plus jeunes et se prête à la mise en voix et à la théâtralisation.",
      ageGroup: "6-8",
      languages: ["Français", "Créole martiniquais", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-08-6",
        pages: "40 pages",
        format: "17 x 24 cm · couverture rigide",
        publicationDate: "À partir de 6 ans",
      },
    },
    "exocette-et-la-mer-de-plastique": {
      title: "Exocette et la mer de plastique (tome 2)",
      collection: "Les histoires du Sucrier",
      price: 15,
      comingSoon: false,
      cover: "images/catalog/exocette-tome-2-premiere-couverture.png",
      gallery: [
        "images/catalog/exocette-tome-2-premiere-couverture.png",
        "images/catalog/exocette-tome-2-quatrieme-couverture.png",
      ],
      authors: [
        { name: "Renata", slug: "renata" },
        { name: "Wilfried Deroche", slug: "w-deroche" },
      ],
      description:
        "La mer des Caraïbes est de plus en plus sale et polluée. Exocette en a assez ! Il faut faire quelque chose, mais quoi ? …\n\nDeux cadeaux : une chanson et une vidéo (QR codes à l'intérieur). Album quadrilingue (français, kréyol, espagnol, anglais) pour sensibiliser petits lecteurs et grands aux déchets plastiques. Avec le soutien de la Préfecture de Martinique, du Parc naturel marin de Martinique, de l'Office français de la biodiversité et de La Mer en Commun.",
      ageGroup: "6-8",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-12-3",
        pages: "Album carré 21 x 21 cm",
        format: "Quadrilingue",
        publicationDate: "2026",
      },
    },
    "nikou-patron": {
      title: "Nikou patron",
      collection: "Nikou",
      price: 12,
      catalogueCoverPosition: "top",
      cover: "images/catalog/nikou-patron-premiere-couverture.webp",
      gallery: [
        "images/catalog/nikou-patron-premiere-couverture.webp",
        "images/catalog/nikou-patron-planche-interieure.png",
        "images/catalog/nikou-patron-quatrieme-couverture.png",
      ],
      authors: [
        { name: "Patrick Petito", slug: "patrick-petito" },
        { name: "Wilfried Deroche", slug: "w-deroche" },
      ],
      description:
        "Embarque avec Nikou et son Papi pour une belle balade en mer ! L’occasion de découvrir la navigation à voile traditionnelle martiniquaise. Album jeunesse quadrilingue (français, créole, espagnol, anglais). Réalisé sous le parrainage de l’Office français de la Biodiversité. Chanson et vidéo accessibles via des QR codes ; 7 compositions musicales originales.",
      ageGroup: "3-5",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-01-7",
        pages: "40 pages",
        format: "17 x 24 cm · couverture rigide · dos-carré cousu collé",
        publicationDate: "Disponible à partir du 20 août 2025 · À partir de 3 ans",
      },
    },
    "bebe-nikou-a-faim": {
      title: "Bébé Nikou a faim",
      collection: "Bébé Nikou",
      price: 11.5,
      cover: "images/catalog/bebe-nikou-a-faim.webp",
      gallery: [
        "images/catalog/bebe-nikou-a-faim.webp",
        "images/catalog/bebe-nikou-a-faim-planche-interieure.webp",
        "images/catalog/bebe-nikou-a-faim-quatrieme-couverture.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }, { name: "W. Deroche", slug: "w-deroche" }],
      description:
        "Bébé Nikou a tellement faim qu’il est prêt à dévorer son livre préféré ! Mais son papa va le rassasier avec de bons fruits frais et juteux. Album tout-carton quadrilingue pour l’éveil linguistique et l’éducation nutritionnelle grâce aux fruits des Antilles. Réalisé sous le parrainage de l’Office français de la Biodiversité.",
      ageGroup: "1-3",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-9563225-5-9",
        pages: "20 pages tout-carton",
        format: "15 x 15 cm",
        publicationDate: "Juillet 2021 · Dès 1 an",
      },
    },
    "bebe-nikou-dit-non": {
      title: "Bébé Nikou dit non",
      collection: "Bébé Nikou",
      price: 11.5,
      cover: "images/catalog/bebe-nikou-dit-non.webp",
      gallery: [
        "images/catalog/bebe-nikou-dit-non.webp",
        "images/catalog/bebe-nikou-dit-non-planche-interieure.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }, { name: "W. Deroche", slug: "w-deroche" }],
      description:
        "Le soleil brille, la mer est belle, mais Bébé Nikou est de mauvaise humeur : il dit non à tout ! Un joli album tout-carton pour apprécier les plaisirs de la mer, du grand air… et la patience des parents. Quadrilingue (français, créole, espagnol, anglais). Labellisé « La mer en commun ».",
      ageGroup: "1-3",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-11-6",
        pages: "20 pages tout-carton",
        format: "15 x 15 cm",
        publicationDate: "Dès 1 an",
      },
    },
    "nikou-musicien-album": {
      title: "Nikou musicien",
      collection: "Nikou",
      price: 12,
      catalogueCoverPosition: "top",
      cover: "images/catalog/nikou-musicien.webp",
      gallery: [
        "images/catalog/nikou-musicien.webp",
        "images/catalog/nikou-musicien-planche-interieure.webp",
        "images/catalog/nikou-musicien-quatrieme-couverture.webp",
      ],
      authors: [
        { name: "Renata", slug: "renata" },
        { name: "W. Deroche", slug: "w-deroche" },
        { name: "Renée-Laure Zou", slug: null },
      ],
      description:
        "Quel musicien, ce Nikou ! Seul ou avec ses amis, il passe sa journée à explorer instruments et styles musicaux — du bèlè au zouk, en passant par la musique classique. Album quadrilingue · 7 compositions musicales originales via QR codes. Compositrice : Renée-Laure Zou.",
      ageGroup: "3-5",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-9563225-7-3",
        pages: "44 pages",
        format: "17 x 24 cm",
        publicationDate: "Dès 3 ans",
      },
    },
    "bons-points-nikou": {
      title: "Bons points Nikou — 30 bons points quadrilingues",
      collection: "Nikou",
      price: 3,
      catalogCategory: "bons-points",
      catalogueSquareNudge: true,
      cover: "images/bons-points-nikou/lot-emballage.webp",
      gallery: [
        "images/bons-points-nikou/lot-emballage.webp",
        "images/bons-points-nikou/lot-cinq-visuels.webp",
        "images/bons-points-nikou/bon-point-joyeux.webp",
        "images/bons-points-nikou/bon-point-sage.webp",
        "images/bons-points-nikou/bon-point-energique.webp",
        "images/bons-points-nikou/bon-point-intrepide.webp",
        "images/bons-points-nikou/bon-point-agile.webp",
        "images/bons-points-nikou/bon-point-studieux.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Lot de 30 bons points quadrilingues. Récompensez les petits avec les messages positifs de Nikou ! Une occasion supplémentaire d’aborder les langues de manière simple et ludique. Vente à l’unité possible : nous contacter.\n\nFormat 8,5 × 5,5 cm, coins arrondis. 5 visuels différents, 5 messages différents. Quadrilingue : français, créole martiniquais, espagnol, anglais. Conception-illustration : Renata. © Les Éditions du Sucrier.",
      ageGroup: "3-5",
      languages: ["Français", "Créole martiniquais", "Espagnol", "Anglais"],
      specs: {
        format: "8,5 × 5,5 cm · coins arrondis",
        pages: "Lot de 30 bons points · 5 visuels",
        publicationDate: "Dès 3 ans",
      },
    },
    "compte-avec-nikou": {
      title: "Compte avec Nikou",
      collection: "Nikou",
      price: 6,
      catalogueCoverPosition: "top",
      cover: "images/catalog/compte-avec-nikou.webp",
      gallery: [
        "images/catalog/compte-avec-nikou.webp",
        "images/catalog/compte-avec-nikou-planche-interieure.webp",
        "images/catalog/compte-avec-nikou-planche-interieure-2.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Un album pour apprendre à compter tout en découvrant la nature. Un vocabulaire soigné pour apprendre à bien parler. En fin de volume, des informations pour s'instruire. Avec Nikou, c'est facile de grandir !\n\nAlbum jeunesse · format 15,3×21,7 cm · 38 pages · couverture rigide · Édité par Orphie · Diffusé par Les Éditions du Sucrier.",
      ageGroup: "3-5",
      languages: ["Français"],
      specs: {
        isbn: "978-2-87763-655-1",
        pages: "38 pages",
        format: "15,3 x 21,7 cm · couverture rigide",
        publicationDate: "Dès 3 ans",
      },
    },
    "nikou-formes": {
      title: "Nikou joue avec les formes",
      collection: "Nikou",
      price: 9,
      catalogueCoverPosition: "top",
      cover: "images/catalog/nikou-formes-premiere-couverture.webp",
      gallery: [
        "images/catalog/nikou-formes-premiere-couverture.webp",
        "images/catalog/nikou-formes-quatrieme-couverture.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Nikou joue avec les formes — Nikou ka jwé épi sé fòm-la — Nikoo plays with shapes.\n\nNikou se trompe, il fait quelques bêtises… Pas si facile de jouer avec les formes ! Sauras-tu l'aider à tout remettre en ordre ?\n\nAlbum jeunesse trilingue (français, créole de Martinique, anglais) pour découvrir les formes à travers les mésaventures de Nikou. En fin de volume, le Dico de Nikou apporte quelques informations sur les formes géométriques. La chanson de l'album, proposée dans les trois langues avec les partitions, est accessible via des QR codes.\n\nAlbum jeunesse · format 17×24 cm · 44 pages · couverture rigide · Les Éditions du Sucrier.",
      ageGroup: "3-5",
      languages: ["Français", "Créole martiniquais", "Anglais"],
      specs: {
        isbn: "978-2-9563225-3-5",
        pages: "44 pages",
        format: "17 x 24 cm · couverture rigide",
        publicationDate: "Dès 3 ans",
      },
    },
    "le-cahier-de-nikou": {
      title: "Le cahier de Nikou — niveau 1",
      collection: "Nikou",
      price: 7,
      catalogCategory: "cahiers",
      cover: "images/le-cahier-de-nikou/premiere-couverture.webp",
      gallery: [
        "images/le-cahier-de-nikou/premiere-couverture.webp",
        "images/le-cahier-de-nikou/planche-libellules.webp",
        "images/le-cahier-de-nikou/planche-tortues.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Le cahier de Nikou niveau 1 (3–4 ans). Nikou propose aux enfants un ensemble d’activités riches et variées pour soutenir de façon simple et ludique les premiers apprentissages abordés à l’école maternelle, tout en améliorant leur connaissance de l’environnement.\n\nDécouvrir les nombres et leurs utilisations · explorer les formes et les grandeurs · se repérer dans l’espace · découvrir le monde vivant. Concept, textes et illustrations : Renata. © Les Éditions du Sucrier.",
      ageGroup: "3-4",
      languages: ["Français"],
      specs: {
        isbn: "978-2-9563225-2-8",
        pages: "36 pages",
        format: "Format A4 · couverture souple · reliure piqûre à cheval",
        publicationDate: "Dès 3 ans · niveau 1 (3–4 ans)",
      },
    },
    "le-carnaval-de-nikou": {
      title: "Le carnaval de Nikou",
      collection: "Nikou",
      price: 6,
      catalogueCoverPosition: "top",
      cover: "images/catalog/le-carnaval-de-nikou.webp",
      gallery: [
        "images/catalog/le-carnaval-de-nikou.webp",
        "images/catalog/le-carnaval-de-nikou-planche-interieure.webp",
        "images/catalog/le-carnaval-de-nikou-planche-interieure-2.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Nikou revient pour te faire découvrir les costumes et les couleurs du carnaval antillais. Vite, prépare-toi à faire la fête avec lui ! Comment Nikou va-t-il se déguiser ? Chaque jour, il hésite et essaie trois tenues différentes… En fin d'album, quelques informations essentielles sur les costumes traditionnels portés par Nikou et quelques coloriages offerts.\n\nAlbum jeunesse · format 15,3×21,7 cm · 34 pages · album broché · Édité par Orphie · Diffusé par Les Éditions du Sucrier.",
      ageGroup: "3-5",
      languages: ["Français"],
      specs: {
        isbn: "978-2-87763-987-3",
        pages: "34 pages",
        format: "15,3 x 21,7 cm · album broché",
        publicationDate: "Dès 3 ans",
      },
    },
    "coloriages-nikou-v1": {
      title: "Les coloriages de Nikou — Volume 1 : Le carnaval",
      collection: "Nikou",
      price: 6,
      catalogCategory: "cahiers",
      catalogueSquareNudge: true,
      catalogueCoverPosition: "top",
      cover: "images/coloriages-nikou-volume-1/premiere-couverture.webp",
      gallery: [
        "images/coloriages-nikou-volume-1/premiere-couverture.webp",
        "images/coloriages-nikou-volume-1/planche-diable-rouge.webp",
        "images/coloriages-nikou-volume-1/planche-mariee.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Les coloriages de Nikou, volume 1 : Le carnaval. Tous les costumes de Nikou en grand format à colorier au feutre ou à la peinture — diable rouge, mariée, et les autres figures du carnaval — pour prolonger l’univers de l’album à la maison ou en classe.\n\nCahier d’activités format A4, illustrations intégrales. Conception et illustrations : Renata. © Les Éditions du Sucrier.",
      ageGroup: "3-5",
      languages: ["Français"],
      specs: {
        pages: "Cahier A4 · illustrations à colorier",
        format: "Couverture souple · format A4",
        publicationDate: "Dès 3 ans",
      },
    },
    "lettres-ou-betes": {
      title: "Lettres ou bêtes ? Abécédaire animalier de la Caraïbe",
      collection: "Lettres ou bêtes",
      price: 15,
      catalogueCoverPosition: "top",
      cover: "images/catalog/lettres-ou-betes-premiere-couverture.webp",
      gallery: [
        "images/catalog/lettres-ou-betes-premiere-couverture.webp",
        "images/catalog/lettres-ou-betes-quatrieme-couverture.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "À chaque lettre correspond un habitant vivant ou imaginaire issu du bassin caraïbéen pour apprendre l’alphabet en respirant la biodiversité de nos îles.",
      ageGroup: "3-5",
      languages: ["Français"],
      specs: { isbn: "978-2-9563225-0-4", pages: "64 pages", format: "170 x 240 mm", publicationDate: "Dès 3 ans" },
    },
    "les-couleurs-de-nikou": {
      title: "Les couleurs de Nikou",
      collection: "Nikou",
      price: 6,
      catalogueCoverPosition: "top",
      cover: "images/catalog/les-couleurs-de-nikou.webp",
      gallery: [
        "images/catalog/les-couleurs-de-nikou.webp",
        "images/catalog/les-couleurs-de-nikou-planche-interieure.webp",
        "images/catalog/les-couleurs-de-nikou-planche-interieure-2.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Un album tout en rimes pour découvrir les couleurs de la nature avec Nikou. En fin de volume, quelques informations pour s'instruire et quelques coloriages offerts. Avec Nikou, c'est facile de grandir !\n\nAlbum jeunesse · format 15,3×21,7 cm · 36 pages · Édité par Orphie · Diffusé par Les Éditions du Sucrier.",
      ageGroup: "3-5",
      languages: ["Français"],
      specs: {
        isbn: "978-2-87763-654-4",
        pages: "36 pages",
        format: "15,3 x 21,7 cm",
        publicationDate: "Dès 3 ans",
      },
    },
    "comptines-karambole-bateaux": {
      title: "Les comptines de Karambole",
      collection: "Hors collection — parutions événements",
      price: 12,
      cover: "images/catalog/comptines-karambole-bateaux.webp",
      gallery: [
        "images/catalog/comptines-karambole-bateaux.webp",
        "images/catalog/comptines-karambole-bateaux-planche-interieure.webp",
        "images/catalog/comptines-karambole-bateaux-planche-interieure-2.webp",
      ],
      authors: [{ name: "Rolyne Pam", slug: "rolyne-pam" }],
      description:
        "Premier ouvrage de Rolyne Pam, Les comptines de Karambole puise dans ses souvenirs d'enfance en Guadeloupe et dans les airs entendus au foyer. Enseignante, elle propose seize comptines et chansons quadrilingues (français, créole, espagnol, anglais) pour que les tout-petits nomment bateaux, îles et nature de la Caraïbe tout en s'amusant — un pont entre famille, classe et patrimoine sonore des îles.",
      ageGroup: "3-5",
      languages: ["Français", "Créole", "Espagnol", "Anglais"],
      specs: {
        isbn: "978-2-493439-07-9",
        pages: "28 pages",
        format: "24 x 17 cm",
        publicationDate: "Quadrilingue · dès 3 ans",
      },
    },
    "poster-abecedaire": {
      title: "Poster abécédaire animalier de la Caraïbe",
      collection: "Lettres ou bêtes",
      price: 5,
      catalogCategory: "posters",
      catalogueCoverPosition: "top",
      languages: ["Français"],
      cover: "images/catalog/poster-abecedaire.webp",
      gallery: ["images/catalog/poster-abecedaire.webp"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Poster 50 × 70 cm sur papier couché mat 300 g — édition 2020 — pour afficher tous les alphabets et animaux caraïbéens créés avec Renata.",
      specs: { pages: "Affiche", format: "50 x 70 cm", publicationDate: "Dès 3 ans" },
    },
    "poster-carnaval-nikou": {
      title: "Poster Vive le carnaval avec Nikou",
      collection: "Nikou",
      price: 5,
      catalogCategory: "posters",
      catalogueCoverPosition: "top",
      languages: ["Français"],
      cover: "images/catalog/poster-carnaval-nikou.webp",
      gallery: ["images/catalog/poster-carnaval-nikou.webp"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description:
        "Format 42 × 60 cm imprimé sur papier couché mat pour afficher tous les costumes que Nikou a empruntés lors du carnaval martiniquais.",
      specs: { pages: "Affiche", format: "42 x 60 cm", publicationDate: "Dès 3 ans · 5 €" },
    },
    "stickers-carnaval-nikou": {
      title: "Planche stickers Le carnaval de Nikou",
      collection: "Nikou",
      price: 3,
      catalogCategory: "autres",
      catalogueSquareNudge: true,
      languages: ["Français"],
      cover: "images/catalog/stickers-carnaval-nikou.webp",
      gallery: ["images/catalog/stickers-carnaval-nikou.webp"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Planche d'autocollants avec les tenues du carnaval de Nikou pour créer, jouer et décorer.",
      specs: { pages: "1 planche", format: "A4", publicationDate: "PVP 3 €" },
    },
    "stickers-abecedaire": {
      title: "Stickers abécédaire animalier",
      collection: "Lettres ou bêtes",
      price: 3,
      catalogCategory: "autres",
      catalogueSquareNudge: true,
      languages: ["Français"],
      cover: "images/catalog/stickers-abecedaire.webp",
      gallery: ["images/catalog/stickers-abecedaire.webp"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description: "Stickers éducatifs pour jouer avec les lettres et les animaux.",
      specs: { pages: "1 planche", format: "A4", poids: "40 g" },
    },
    "stickers-fruits-martinique": {
      title: "Stickers Fruits de Martinique",
      collection: "Bébé Nikou",
      price: 3,
      catalogCategory: "autres",
      ageGroup: "3-6",
      languages: ["Français", "Créole martiniquais", "Espagnol", "Anglais"],
      cover: "images/catalog/stickers-fruits-martinique.webp",
      gallery: ["images/catalog/stickers-fruits-martinique.webp"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description:
        "Planche A4 glacée où les fruits martiniquais portent quatre langues : parfait complément après la lecture des albums Bébé Nikou.",
      specs: { pages: "1 planche", format: "A4", poids: "45 g" },
    },
    "coloriages-lettres-ou-betes": {
      title: "Lettres ou bêtes ? — Cahier de coloriage",
      collection: "Lettres ou bêtes",
      price: 6,
      catalogCategory: "cahiers",
      catalogueCoverPosition: "top",
      cover: "images/catalog/coloriages-lettres-ou-betes.webp",
      gallery: ["images/catalog/coloriages-lettres-ou-betes.webp"],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "S’inspirant des principes de l’art-thérapie, ce cahier de coloriage s’adresse à tous les artistes curieux et amoureux de la nature, à partir de 5 ans. Format A5 · 26 pages en couleur.",
      ageGroup: "6-8",
      specs: { format: "Format A5", pages: "26 pages en couleur", publicationDate: "Dès 5 ans" },
    },
    "sous-main-abecedaire": {
      title: "Sous-main / set de table — Abécédaire animalier de la Caraïbe",
      collection: "Lettres ou bêtes",
      price: 6,
      catalogCategory: "sous-mains",
      catalogueSquareNudge: true,
      cover: "images/catalog/sous-main-abecedaire.webp",
      gallery: ["images/catalog/sous-main-abecedaire.webp"],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "Format A3 en Feuille de Pierre® (Mineral Print) : papier sans bois, résistant et waterproof. En dessinant, en travaillant ou en mangeant, votre enfant continue d’apprendre son alphabet avec les animaux caribéens.",
      ageGroup: "3-5",
      specs: { format: "Format A3 · Feuille de Pierre®", publicationDate: "Dès 3 ans" },
    },
    "djouboum": {
      title: "Djouboum !",
      collection: "Les histoires du Sucrier",
      price: 0,
      comingSoon: true,
      catalogHidden: true,
      catalogCategory: "autres",
      cover: "images/catalog/exocette-tome-2-premiere-couverture.png",
      gallery: ["images/catalog/exocette-tome-2-premiere-couverture.png", "images/catalog/exocette-premiere-couverture.webp"],
      authors: [{ name: "Renata", slug: "renata" }, { name: "Wilfried Deroche", slug: "w-deroche" }],
      description:
        "Serious game pour découvrir les richesses de la biodiversité aquatique caribéenne avec Exocette ! Jeu de plateau — à paraître en 2026. Visuel provisoire.",
      ageGroup: "6-8",
      specs: { publicationDate: "À paraître en 2026 · dès 6 ans" },
    },
    "sac-a-dos-vole-wo": {
      title: "Volé wo, volé lwen ! — Sac à dos brodé",
      collection: "Les histoires du Sucrier",
      price: 10,
      catalogCategory: "autres",
      cover: "images/catalog/sac-a-dos-vole-wo.webp",
      gallery: ["images/catalog/sac-a-dos-vole-wo.webp"],
      authors: [{ name: "Collectif", slug: "collectif" }],
      description:
        "Sac à dos en coton indien naturel, brodé en Martinique (poisson volant). L’idéal pour emporter partout son album Exocette, ses produits préférés des Éditions du Sucrier et même un petit goûter ! Format 37 × 41 cm.",
      ageGroup: "6-8",
      specs: { format: "37 × 41 cm · coton indien brodé en Martinique", publicationDate: "Dès 6 ans" },
    },
    "peluche-nikou": {
      title: "La peluche de Nikou",
      collection: "Nikou",
      price: 5,
      catalogCategory: "autres",
      catalogueProductPhoto: true,
      ageGroup: "2-6",
      hideLanguages: true,
      hideIsbn: true,
      hidePublicationDate: true,
      cover: "images/catalog/peluche-nikou-vue-marina.webp",
      gallery: [
        "images/catalog/peluche-nikou-vue-marina.webp",
        "images/catalog/peluche-nikou.webp",
        "images/catalog/peluche-nikou-vue-profil.webp",
      ],
      authors: [{ name: "Renata", slug: "renata" }],
      description:
        "L’indispensable petite peluche pour donner vie à Nikou, la mascotte préférée des petits, et partager avec lui de grandes aventures ! Conception : Renata. Fabrication : Mascottes en FolizZ (France/Chine). Normes CE · hauteur 18 cm.",
      specs: {
        pages: "Peluche officielle Nikou",
        format: "Hauteur 18 cm · normes CE",
      },
    },
  };
  var CATALOG_FILTER_GROUPS_DEFAULT = [
    { id: "albums", label_fr: "Albums de jeunesse", label_en: "Children's albums", parent: "" },
    { id: "cahiers", label_fr: "Cahiers d'activités", label_en: "Activity workbooks", parent: "" },
    { id: "bebe-nikou", label_fr: "Collection Bébé Nikou", label_en: "Baby Nikou collection", parent: "" },
    { id: "autres-produits", label_fr: "Nos autres produits", label_en: "Other products", parent: "", is_group: true },
    { id: "posters", label_fr: "Posters", label_en: "Posters", parent: "autres-produits" },
    { id: "bons-points", label_fr: "Bons points", label_en: "Reward charts", parent: "autres-produits" },
    { id: "sous-mains", label_fr: "Sous-mains", label_en: "Desk pads", parent: "autres-produits" },
    { id: "autres", label_fr: "Autres", label_en: "Other", parent: "autres-produits" },
  ];
  var CATALOG_CATEGORY_DEFAULTS = {
    "peluche-nikou": "autres",
    "bons-points-nikou": "bons-points",
    "le-cahier-de-nikou": "cahiers",
    "coloriages-nikou-v1": "cahiers",
    "coloriages-lettres-ou-betes": "cahiers",
    "bebe-nikou-a-faim": "bebe-nikou",
    "bebe-nikou-dit-non": "bebe-nikou",
    "poster-abecedaire": "posters",
    "poster-carnaval-nikou": "posters",
    "stickers-carnaval-nikou": "autres",
    "stickers-abecedaire": "autres",
    "stickers-fruits-martinique": "autres",
    "sous-main-abecedaire": "sous-mains",
    "djouboum": "autres",
    "sac-a-dos-vole-wo": "autres",
  };
  /** Ordre d’affichage — catalogue PDF n°11 (mai 2026). */
  var CATALOG_DISPLAY_ORDER = [
    "peluche-nikou",
    "nikou-champion",
    "nikou-musicien-album",
    "nikou-patron",
    "bons-points-nikou",
    "le-cahier-de-nikou",
    "nikou-formes",
    "coloriages-nikou-v1",
    "poster-carnaval-nikou",
    "stickers-carnaval-nikou",
    "compte-avec-nikou",
    "le-carnaval-de-nikou",
    "les-couleurs-de-nikou",
    "bebe-nikou-dit-non",
    "bebe-nikou-a-faim",
    "stickers-fruits-martinique",
    "circuit-ferme",
    "comptines-karambole-bateaux",
    "tice-et-metice",
    "exocette-et-la-mer-de-plastique",
    "exocette",
    "sac-a-dos-vole-wo",
    "poster-abecedaire",
    "coloriages-lettres-ou-betes",
    "lettres-ou-betes",
    "sous-main-abecedaire",
    "stickers-abecedaire",
  ];
  var CATALOG_BESTSELLER_IDS = [
    "nikou-champion",
    "circuit-ferme",
    "exocette",
    "tice-et-metice",
    "nikou-musicien-album",
    "le-carnaval-de-nikou",
  ];
  var CATALOG_NEW_RELEASE_IDS = [
    "nikou-champion",
    "circuit-ferme",
    "sac-a-dos-vole-wo",
    "comptines-karambole-bateaux",
  ];
  var CATALOG_AWARD_IDS = ["exocette", "exocette-et-la-mer-de-plastique"];

  function getCatalogSortMode() {
    return CATALOGUE_STATE.sort || "editorial";
  }

  function sortCatalogProductIds(ids) {
    var mode = getCatalogSortMode();
    var list = ids.slice();
    if (mode === "editorial") return list;

    if (mode === "novelty") {
      return list.sort(function (a, b) {
        var ia = CATALOG_DISPLAY_ORDER.indexOf(a);
        var ib = CATALOG_DISPLAY_ORDER.indexOf(b);
        if (ia === -1) ia = 9999;
        if (ib === -1) ib = 9999;
        return ia - ib;
      });
    }

    if (mode === "price-asc" || mode === "price-desc") {
      return list.sort(function (a, b) {
        var pa = Number((BOOK_CATALOG[a] || {}).price) || 0;
        var pb = Number((BOOK_CATALOG[b] || {}).price) || 0;
        return mode === "price-asc" ? pa - pb : pb - pa;
      });
    }

    if (mode === "age") {
      var ageOrder = { "0-3": 0, "3-5": 1, "6-8": 2, "9+": 3 };
      return list.sort(function (a, b) {
        var aa = ageOrder[inferAgeGroup(BOOK_CATALOG[a] || {})] ?? 9;
        var ab = ageOrder[inferAgeGroup(BOOK_CATALOG[b] || {})] ?? 9;
        return aa - ab;
      });
    }

    if (mode === "popular") {
      return list.sort(function (a, b) {
        var sa = CATALOG_BESTSELLER_IDS.indexOf(a);
        var sb = CATALOG_BESTSELLER_IDS.indexOf(b);
        if (sa === -1) sa = 999;
        if (sb === -1) sb = 999;
        if (sa !== sb) return sa - sb;
        var ia = CATALOG_DISPLAY_ORDER.indexOf(a);
        var ib = CATALOG_DISPLAY_ORDER.indexOf(b);
        if (ia === -1) ia = 9999;
        if (ib === -1) ib = 9999;
        return ia - ib;
      });
    }

    return list;
  }

  function bookHasMarketingBadge(book, bookId, flagKey, fallbackIds) {
    if (book && Object.prototype.hasOwnProperty.call(book, flagKey)) {
      return !!book[flagKey];
    }
    return fallbackIds.indexOf(bookId) !== -1;
  }

  function getBookMarketingBadges(bookId, book) {
    var badges = [];
    if (book && book.comingSoon) return badges;
    if (bookHasMarketingBadge(book, bookId, "badgeNew", CATALOG_NEW_RELEASE_IDS)) {
      badges.push({ key: "new", label: t("ui.badgeNew", "Nouveauté") });
    }
    if (bookHasMarketingBadge(book, bookId, "badgeBestseller", CATALOG_BESTSELLER_IDS)) {
      badges.push({ key: "bestseller", label: t("ui.badgeBestseller", "Best-seller") });
    }
    if (bookHasMarketingBadge(book, bookId, "badgeAward", CATALOG_AWARD_IDS)) {
      badges.push({ key: "award", label: t("ui.badgeAward", "Prix littéraire") });
    }
    return badges;
  }

  function isBookVisibleInCatalog(bookId) {
    var book = BOOK_CATALOG[bookId];
    return !!(book && !book.catalogHidden);
  }

  function isBookEligibleForRecommendations(bookId) {
    var book = BOOK_CATALOG[bookId];
    if (!book || book.catalogHidden) return false;
    if (book.comingSoon) return false;
    return true;
  }

  function getCatalogProductIds() {
    return Object.keys(BOOK_CATALOG)
      .filter(function (id) {
        return isBookVisibleInCatalog(id);
      })
      .sort(function (a, b) {
      var ia = CATALOG_DISPLAY_ORDER.indexOf(a);
      var ib = CATALOG_DISPLAY_ORDER.indexOf(b);
      if (ia === -1) ia = 9999;
      if (ib === -1) ib = 9999;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b, "fr");
    });
  }

  var HERO_DISPLAY_ORDER_DEFAULT = [
    "nikou",
    "bebe-nikou",
    "exocette",
    "tice-et-metice",
    "alice-et-jacob",
  ];
  var HERO_DISPLAY_ORDER = HERO_DISPLAY_ORDER_DEFAULT.slice();

  var HERO_PROFILES_DEFAULT = {
    nikou: {
      id: "nikou",
      name: { fr: "Nikou", en: "Nikou" },
      tagline: {
        fr: "Petit manicou curieux · Collection phare",
        en: "Curious little opossum · Flagship series",
      },
      portrait: "images/catalog/nikou-surfeur.webp",
      cardClass: "heros-card--nikou",
      imageFit: "contain",
      imagePosition: "center 88%",
      relatedBooks: [
        "nikou-champion",
        "nikou-musicien-album",
        "nikou-patron",
        "nikou-formes",
        "le-cahier-de-nikou",
        "bebe-nikou-dit-non",
        "bebe-nikou-a-faim",
      ],
      intro: {
        fr: "Créé en 2011 par l’autrice-illustratrice Renata, cet infatigable petit manikou a pour mission d’éveiller et d’instruire les petits de 3 à 6 ans, de manière ludique, drôle et poétique. Depuis 2022, c’est l’illustrateur Wilfried Deroche qui lui donne vie, avec justesse, humour et créativité. La collection Nikou compte 7 albums à ce jour : 3 publiés aux Éditions Orphie entre 2011 et 2015, les 4 suivants aux Éditions du Sucrier.",
        en: "Created in 2011 by author-illustrator Renata, this tireless little opossum sets out to awaken and teach children aged 3 to 6 in a playful, funny, and poetic way. Since 2022, illustrator Wilfried Deroche has brought him to life with accuracy, humour, and creativity. The Nikou series now includes 7 albums: 3 published by Éditions Orphie between 2011 and 2015, and the next 4 by Les Éditions du Sucrier.",
      },
      traits: {
        fr: ["Curieux et têtu", "Aime le sport et la musique", "Héros inclusif", "Quadrilingue"],
        en: ["Curious and stubborn", "Loves sport and music", "Inclusive hero", "Quadrilingual books"],
      },
      schoolUse: {
        fr: "Les albums Nikou soutiennent les premiers apprentissages (formes, couleurs, nombres), l’éveil linguistique (français, créole, espagnol, anglais) et l’activité physique. La peluche est un médiateur idéal en maternelle pour ritualiser les temps de lecture.",
        en: "Nikou books support early learning (shapes, colours, counting), language awareness (French, Creole, Spanish, English), and physical activity. The plush toy is an ideal classroom companion to anchor story time.",
      },
    },
    "bebe-nikou": {
      id: "bebe-nikou",
      name: { fr: "Bébé Nikou", en: "Baby Nikou" },
      tagline: {
        fr: "Tout-petit attachant · Collection cartonnée",
        en: "Adorable toddler · Board book series",
      },
      portrait: "images/heros/bebe-nikou.png",
      cardClass: "heros-card--bebe",
      imageFit: "contain",
      imagePosition: "center center",
      relatedBooks: ["bebe-nikou-dit-non", "bebe-nikou-a-faim", "stickers-fruits-martinique"],
      intro: {
        fr: "Le petit frère de Nikou voit le jour en 2021 sous les doigts de l’illustrateur Wilfried Deroche et la plume de Renata. Il s’adresse aux tout-petits de moins de 3 ans. Sa collection compte à ce jour 2 albums.",
        en: "Nikou’s little brother was born in 2021, illustrated by Wilfried Deroche and written by Renata. He speaks to children under 3. The series currently includes 2 board books.",
      },
      traits: {
        fr: ["Dès 1 an", "Albums tout-carton", "Quadrilingue", "Éveil sensoriel"],
        en: ["From age 1", "Board books", "Quadrilingual", "Sensory awakening"],
      },
      schoolUse: {
        fr: "Bébé Nikou a faim favorise l’éveil linguistique, la découverte des fruits locaux et l’éducation nutritionnelle. Bébé Nikou dit non invite à parler des émotions et de la patience des adultes. Albums cartonnés adaptés aux tout-petits en crèche et en maternelle petite section.",
        en: "Bébé Nikou a faim supports language awareness, local fruit discovery, and nutritional education. Bébé Nikou dit non opens conversations about emotions and adult patience. Sturdy board books suited to nurseries and the youngest kindergarten classes.",
      },
    },
    exocette: {
      id: "exocette",
      name: { fr: "Exocette", en: "Exocette" },
      tagline: {
        fr: "Poisson volant courageux · Mer et différence",
        en: "Brave flying fish · Sea and difference",
      },
      portrait: "images/heros/exocette.png",
      cardClass: "heros-card--exocette",
      imageFit: "contain",
      imagePosition: "center center",
      relatedBooks: ["exocette", "exocette-et-la-mer-de-plastique"],
      intro: {
        fr: "Malgré son handicap, elle n’a pas peur des pêcheurs et rien ne lui résiste. Cette petite femelle poisson volant caribéenne, apparue en 2020, est la création de l’autrice Renata, magistralement illustrée par Wilfried Deroche. Ses aventures sont à découvrir dans 2 albums.",
        en: "Despite her disability, she is not afraid of fishermen and nothing stops her. This little Caribbean flying fish, who appeared in 2020, was created by author Renata and magnificently illustrated by Wilfried Deroche. Her adventures are told in 2 albums.",
      },
      traits: {
        fr: ["Courageuse", "Humour et tendresse", "Handicap abordé avec pudeur", "Partenaires scientifiques"],
        en: ["Brave", "Gentle humour", "Disability addressed with care", "Scientific partners"],
      },
      schoolUse: {
        fr: "L’album aborde avec humour et tendresse la problématique du handicap, valorise l’activité physique et enrichit la connaissance du milieu marin. Idéal en CP-CE pour le langage oral, la lecture à voix haute et les projets « Questionner le monde ». Version audio sur 1voix1histoire.com.",
        en: "The book addresses disability with humour and tenderness, encourages physical activity, and builds knowledge of the marine environment. Ideal in early elementary grades for oral language, read-aloud, and “exploring the world” projects. Audio version on 1voix1histoire.com.",
      },
    },
    "tice-et-metice": {
      id: "tice-et-metice",
      name: { fr: "Tice et Métice", en: "Tice and Métice" },
      tagline: {
        fr: "Deux oiseaux, sept voyages · Acceptation de l’autre",
        en: "Two birds, seven journeys · Accepting difference",
      },
      portrait: "images/heros/tice-et-metice.png?v=20260519-nobg",
      cardClass: "heros-card--tice",
      imageFit: "contain",
      imagePosition: "center center",
      relatedBooks: ["tice-et-metice"],
      intro: {
        fr: "Créés en 2023 à Chypre par l’autrice franco-chypriote Karine Petevi et l’illustrateur Gecko Dalch, ces deux oiseaux nous entraînent avec beaucoup de fraîcheur et de tendresse à la découverte de l’autre et du monde.",
        en: "Created in 2023 in Cyprus by Franco-Cypriot author Karine Petevi and illustrator Gecko Dalch, these two birds invite readers with freshness and tenderness to discover others and the world.",
      },
      traits: {
        fr: ["Album quadrilingue", "Éveil des sens", "Voyages et cultures", "Mise en voix théâtrale"],
        en: ["Quadrilingual album", "Awakening the senses", "Journeys and cultures", "Great for dramatic reading"],
      },
      schoolUse: {
        fr: "Six couleurs, six voyages pour découvrir le monde depuis la Martinique. L’album sollicite la vision, l’odorat, l’ouïe et le toucher ; il favorise l’éveil linguistique et se prête à la théâtralisation en classe.",
        en: "Six colours, six journeys to discover the world from Martinique. The book engages sight, smell, hearing, and touch; it supports language awareness and works beautifully for classroom performance.",
      },
    },
    "alice-et-jacob": {
      id: "alice-et-jacob",
      name: { fr: "Alice et Jacob", en: "Alice and Jacob" },
      tagline: {
        fr: "Jeunes enquêteurs · Collection Bulles de Sucrier",
        en: "Young detectives · Bulles de Sucrier series",
      },
      portrait: "images/heros/alice-et-jacob.jpg",
      cardClass: "heros-card--alice",
      imageFit: "contain",
      imagePosition: "center center",
      relatedBooks: ["circuit-ferme"],
      intro: {
        fr: "Les deux héros de la BD jeunesse caribéenne sont nés en 2022 sous la plume et les doigts de l’auteur Jean Fritz Junior Odne et Jean Francisco Sliva, artistes haïtiens.",
        en: "The two heroes of this Caribbean graphic novel for young readers were born in 2022, written and drawn by Haitian artists Jean Fritz Junior Odne and Jean Francisco Sliva.",
      },
      traits: {
        fr: ["Esprit d’équipe", "Curiosité", "Regard décalé sur l’actualité", "Bande dessinée"],
        en: ["Team spirit", "Curiosity", "Offbeat take on current events", "Graphic novel"],
      },
      schoolUse: {
        fr: "Circuit fermé propose une enquête menée par deux enfants face à une situation inédite : démarche de résolution de problème, argumentation et lecture de l’image en bande dessinée. Adapté au cycle 3 (CM1-CM2-6e).",
        en: "Closed Circuit offers a mystery led by two children facing an unusual situation: problem-solving, reasoning, and reading images in comics form. Suited to upper elementary (ages 9–12).",
      },
    },
  };
  var HERO_PROFILES = Object.assign({}, HERO_PROFILES_DEFAULT);

  function heroText(value, fallback) {
    if (!value) return fallback || "";
    if (typeof value === "string") return value;
    var lang = I18N_STATE.language === "en" ? "en" : "fr";
    return value[lang] || value.fr || value.en || fallback || "";
  }

  function renderHomeHeroesSection() {
    var grid = document.querySelector("[data-heros-grid]");
    if (!grid) return;

    grid.innerHTML = HERO_DISPLAY_ORDER.map(function (heroId, index) {
      var hero = HERO_PROFILES[heroId];
      if (!hero) return "";
      var name = escapeCatalogHtml(heroText(hero.name, heroId));
      var tagline = escapeCatalogHtml(heroText(hero.tagline, ""));
      var fit = hero.imageFit === "cover" ? "cover" : "contain";
      var pos = hero.imagePosition || "center center";
      var imgLoading = index === 0 ? "eager" : "lazy";
      var imgFetch = index === 0 ? ' fetchpriority="high"' : "";
      return (
        '<a href="./heros.html?id=' +
        encodeURIComponent(heroId) +
        '" class="heros-card ' +
        (hero.cardClass || "") +
        '">' +
        '<div class="heros-card-frame">' +
        '<img src="' +
        hero.portrait +
        '" alt="' +
        name +
        '" class="heros-card-img heros-card-img--' +
        fit +
        '" style="object-position:' +
        pos +
        '" width="420" height="520" decoding="async" loading="' +
        imgLoading +
        '"' +
        imgFetch +
        ">" +
        "</div>" +
        '<div class="heros-infos"><h3 class="heros-nom">' +
        name +
        '</h3><p class="heros-desc">' +
        tagline +
        "</p><span class=\"heros-cta\">" +
        escapeCatalogHtml(t("ui.heroDiscover", "Découvrir")) +
        ' <span aria-hidden="true">→</span></span></div>' +
        "</a>"
      );
    }).join("");
  }

  function renderHeroDetailPage() {
    var page = document.querySelector(".hero-detail-page");
    if (!page) return;

    var params = new URLSearchParams(window.location.search);
    var requestedId = params.get("id");
    var heroId = HERO_PROFILES[requestedId] ? requestedId : HERO_DISPLAY_ORDER[0];
    var hero = HERO_PROFILES[heroId];
    if (!hero) return;

    var portrait = document.getElementById("hero-detail-portrait");
    var nameNode = document.getElementById("hero-detail-name");
    var taglineNode = document.getElementById("hero-detail-tagline");
    var introNode = document.getElementById("hero-detail-intro");
    var traitsNode = document.getElementById("hero-detail-traits");
    var schoolNode = document.getElementById("hero-detail-school");
    var booksNode = document.getElementById("hero-detail-books");

    document.title = heroText(hero.name, heroId) + " — " + t("meta.siteTitle", "Les Éditions du Sucrier");

    if (portrait) {
      portrait.src = hero.portrait;
      portrait.alt = heroText(hero.name, heroId);
      portrait.classList.toggle("hero-detail-portrait--cover", hero.imageFit === "cover");
      portrait.classList.toggle("hero-detail-portrait--contain", hero.imageFit !== "cover");
      portrait.style.objectPosition = hero.imagePosition || "center center";
    }
    if (nameNode) nameNode.textContent = heroText(hero.name, heroId);
    if (taglineNode) taglineNode.textContent = heroText(hero.tagline, "");
    if (introNode) introNode.textContent = heroText(hero.intro, "");
    if (traitsNode) {
      var traits = hero.traits && (hero.traits[I18N_STATE.language] || hero.traits.fr);
      traitsNode.innerHTML = (traits || [])
        .map(function (item) {
          return "<li>" + escapeCatalogHtml(item) + "</li>";
        })
        .join("");
    }
    if (schoolNode) schoolNode.textContent = heroText(hero.schoolUse, "");

    var navNode = document.getElementById("hero-detail-nav");
    if (navNode) {
      navNode.innerHTML = HERO_DISPLAY_ORDER.map(function (id) {
        var h = HERO_PROFILES[id];
        if (!h) return "";
        var active = id === heroId ? " hero-nav-chip--active" : "";
        return (
          '<a href="./heros.html?id=' +
          encodeURIComponent(id) +
          '" class="hero-nav-chip' +
          active +
          '">' +
          escapeCatalogHtml(heroText(h.name, id)) +
          "</a>"
        );
      }).join("");
    }

    if (booksNode) {
      booksNode.innerHTML = "";
      (hero.relatedBooks || []).forEach(function (bookId) {
        var book = getLocalizedBook(bookId);
        if (!book) return;
        var link = document.createElement("a");
        link.className = "hero-related-book";
        link.href = "./livre.html?id=" + encodeURIComponent(bookId);
        link.innerHTML =
          '<img src="' +
          book.cover +
          '" alt="" loading="lazy" decoding="async"><span><strong>' +
          escapeCatalogHtml(book.title) +
          "</strong><small>" +
          escapeCatalogHtml(book.collection) +
          "</small></span>";
        booksNode.appendChild(link);
      });
    }

    // Anti-FOUC : tout est en place, on revele le contenu
    page.classList.add("is-ready");
  }

  var BOOK_CATALOG = BOOK_CATALOG_DEFAULT;
  var CATALOG_STOCK = {};
  /** Ruptures connues côté serveur (sans quantité exacte exposée). */
  var PRODUCTS_OUT_OF_STOCK = {};
  var SITE_CONTENT = null;
  var PEDAGOGICAL_SHEETS_AVAILABLE = [];
  var AUTHOR_PROFILES_DEFAULT = {
    renata: {
      photo: "images/portraits/renee-laure-zou.webp",
      roles: ["author", "illustrator"],
      name: { fr: "Renée-Laure Zou (Renata)", en: "Renée-Laure Zou (Renata)" },
      roleLabel: {
        fr: "Auteure · illustratrice · éditrice jeunesse · gérante des Éditions du Sucrier",
        en: "Author · illustrator · children’s publisher · managing director of Les Éditions du Sucrier",
      },
      bio: [
        {
          fr: "Après avoir été enseignante à l’Éducation nationale puis déléguée pédagogique pour Hachette Éducation, Renata entame son parcours d’auteure-illustratrice en 2011 avec le manicou Nikou : les trois premiers albums sont publiés aux Éditions Orphie. En 2018, elle ouvre Les Éditions du Sucrier, entièrement tournées vers la littérature jeunesse, tout en poursuivant des collaborations externes en relecture, correction, traduction ou création littéraire.",
          en: "After teaching in France’s national school system and working as a pedagogical delegate for Hachette Éducation, Renata began her journey as author-illustrator in 2011 with Nikou; the first three albums were released by Éditions Orphie. In 2018 she founded Les Éditions du Sucrier, wholly dedicated to books for young readers, while continuing freelance work in proofreading, editing, translation, and writing.",
        },
      ],
    },
    "w-deroche": {
      photo: "images/portraits/wilfried-deroche-illustrateur.webp",
      roles: ["illustrator"],
      name: { fr: "Wilfried Deroche", en: "Wilfried Deroche" },
      roleLabel: {
        fr: "Illustrateur · direction artistique",
        en: "Illustrator · art direction",
      },
      bio: [
        {
          fr: "Wilfried Deroche donne son trait graphique aux collections Nikou et « Les histoires du Sucrier », dont Exocette, et assure la direction artistique de l’univers visuel des ouvrages jeunesse du catalogue.",
          en: "Wilfried Deroche shapes the graphic world of the Nikou line and Les histoires du Sucrier titles such as Exocette, steering the visual art direction across the publisher’s youth catalogue.",
        },
      ],
    },
    "l-ramassamy": {
      photo: "images/portraits/author-leane-ramassamy.webp",
      roles: ["author"],
      name: { fr: "Léanne Ramassamy", en: "Léanne Ramassamy" },
      roleLabel: { fr: "Auteure · championne de boxe", en: "Author · boxing champion" },
      bio: [
        {
          fr: "Co-auteure de Nikou champion avec Wilfried Deroche, Léanne Ramassamy — également championne de boxe — entraîne les enfants vers le sport et la découverte de soi. Elle participe aux rencontres scolaires et à la médiation autour des albums jeunesse des Éditions du Sucrier.",
          en: "Co-author of Nikou champion with Wilfried Deroche, Léanne Ramassamy — also a boxing champion — encourages children to explore sport and self-confidence. She takes part in school visits and reading outreach for Les Éditions du Sucrier’s youth titles.",
        },
      ],
    },
    "patrick-petito": {
      photo: "images/portraits/patrick-petito-cultura.webp",
      roles: ["author"],
      name: { fr: "Patrick Petito", en: "Patrick Petito" },
      roleLabel: { fr: "Auteur", en: "Author" },
      bio: [
        {
          fr: "Spécialiste de la voile traditionnelle martiniquaise, Patrick Petito co-scénarise notamment Nikou patron. Il anime des séances de dédicace et des rencontres en librairie.",
          en: "A specialist in traditional Martinican sailing, Patrick Petito co-writes titles such as Nikou patron. He hosts signings and in-store events.",
        },
      ],
    },
    "ojf-junior": {
      photo: "images/portraits/jean-fritz-junior-odne.webp",
      roles: ["author"],
      name: { fr: "Jean Fritz Junior ODNÉ", en: "Jean Fritz Junior ODNÉ" },
      roleLabel: {
        fr: "Auteur · artiste polyvalent · théâtre",
        en: "Author · multidisciplinary artist · theatre",
      },
      bio: [
        {
          fr: "Jean Fritz Junior ODNÉ, Haïtien, né en 1986. C’est un artiste aux multiples talents : musicien, auteur, conteur, comédien, marionnettiste, metteur en scène, directeur artistique… Il coopère avec des troupes de théâtre aussi bien dans son pays qu’à l’étranger. Il aborde l’univers artistique en y apportant sa touche particulière.",
          en: "Jean Fritz Junior ODNÉ is Haitian, born in 1986. His practice spans music, writing, storytelling, acting, puppetry, stage direction, and artistic direction, collaborating with theatre companies in Haiti and abroad and bringing a distinctive sensibility to every project.",
        },
      ],
    },
    "jf-silva": {
      photo: "images/portraits/francisco-silva.webp",
      roles: ["illustrator"],
      name: { fr: "Jean Francisco Silva", en: "Jean Francisco Silva" },
      roleLabel: {
        fr: "Illustrateur · caricaturiste · peintre",
        en: "Illustrator · caricaturist · painter",
      },
      bio: [
        {
          fr: "Jean Francisco Silva, Haïtien, né en 1989. Peintre, caricaturiste et illustrateur, il est diplômé de l’École nationale des arts d’Haïti. Riche d’influences multiples, il vit à travers son art, ce qui le pousse à restituer le plus fidèlement possible ce qui l’entoure. Formé en caricature, bande dessinée et dessin de presse, son indéniable talent s’exprime dans ses créations qui parlent, séduisent et fascinent le public.",
          en: "Jean Francisco Silva is Haitian, born in 1989. A painter, caricaturist, and illustration graduate of Haiti’s École nationale des arts, he draws on many influences and seeks to faithfully render the world around him. Trained in caricature, comics, and press drawing, his work speaks to and captivates audiences.",
        },
      ],
    },
    "k-petevi": {
      photo: "images/portraits/author-karine-petevi.webp",
      roles: ["author"],
      name: { fr: "Karine Petevi", en: "Karine Petevi" },
      roleLabel: {
        fr: "Auteure · enseignante et formatrice FLE · Franco-chypriote",
        en: "Author · French teacher & trainer · French-Cypriot",
      },
      bio: [
        {
          fr: "Karine Petevi est de nationalité franco-chypriote. Enseignante et formatrice de français langue étrangère (FLE) à Chypre depuis une vingtaine d'années, elle intègre l'approche interculturelle dans sa méthodologie. Passionnée par les voyages, les cultures, la nature et les couleurs — et grande amoureuse des oiseaux — elle relie ces univers dans son premier album jeunesse Tice et Métice, illustré par Gecko Dalch et publié aux Éditions du Sucrier (janvier 2024).",
          en: "Karine Petevi is French-Cypriot. For nearly twenty years she has taught and trained teachers in French as a foreign language (FLE) in Cyprus, weaving intercultural approaches into her practice. Drawn to travel, cultures, nature, colour — and birds — she brings it all together in her first children’s book Tice et Métice, illustrated by Gecko Dalch and released by Les Éditions du Sucrier (January 2024).",
        },
      ],
    },
    "rolyne-pam": {
      photo: "images/portraits/author-rolyne-pam.webp",
      roles: ["author"],
      name: { fr: "Rolyne Pam", en: "Rolyne Pam" },
      roleLabel: { fr: "Auteure · enseignante", en: "Author · teacher" },
      bio: [
        {
          fr: "Avec Les comptines de Karambole, Rolyne Pam fait ses premiers pas d’écrivaine. Elle s’inspire de ses souvenirs d’enfance en Guadeloupe et des histoires transmises par ses parents. Enseignante, elle utilise la littérature de jeunesse au quotidien pour intéresser petits et grands à décrire la Caraïbe ; ce recueil de comptines et chansons quadrilingues aide les tout-petits à nommer et à s’approprier leur cadre de vie insulaire.",
          en: "With Les comptines de Karambole, Rolyne Pam steps into publishing as a writer. She draws on childhood memories in Guadeloupe and family storytelling. As a teacher, she uses children’s literature every day to invite students to talk about the Caribbean; this quadrilingual song-and-rhyme book helps toddlers name and embrace island life around them.",
        },
      ],
    },
    collectif: {
      photo: "images/site/logo-editions-sucrier.webp",
      roles: ["author", "illustrator"],
      name: { fr: "Collectif", en: "Collective" },
      roleLabel: {
        fr: "Créations collectives (affiches, stickers, déclinaisons)",
        en: "Collective productions (posters, stickers, spin-offs)",
      },
      bio: [
        {
          fr: "Les titres signés « Collectif » réunissent plusieurs intervenant·es autour du même projet : affiches, planches de stickers ou déclinaisons des univers Nikou et Lettres ou bêtes.",
          en: "Titles credited to “Collectif” bring several contributors together on the same release: posters, sticker sheets, or spin-offs tied to Nikou and Lettres ou bêtes.",
        },
      ],
    },
  };
  var AUTHOR_PROFILES = Object.assign({}, AUTHOR_PROFILES_DEFAULT);

  function cmsRowBilingual(row, frKey, enKey) {
    if (!row || typeof row !== "object") return { fr: "", en: "" };
    var fr = String(row[frKey] || "").trim();
    var en = String(row[enKey] || fr).trim();
    return { fr: fr, en: en };
  }

  function cmsPipeList(value) {
    return String(value || "")
      .split("|")
      .map(function (item) {
        return String(item || "").trim();
      })
      .filter(Boolean);
  }

  function applyCmsAuthorProfiles(content) {
    var rows = content && content.authors;
    if (!Array.isArray(rows) || rows.length === 0) return;
    AUTHOR_PROFILES = Object.assign({}, AUTHOR_PROFILES_DEFAULT);
    rows.forEach(function (row) {
      if (!row || typeof row !== "object") return;
      var slug = String(row.slug || "").trim();
      if (!slug) return;
      var roles = String(row.roles || "author")
        .split(/\s+/)
        .map(function (r) {
          return r.trim();
        })
        .filter(Boolean);
      if (!roles.length) roles = ["author"];
      var bioFr = String(row.bio_fr || "").trim();
      var bioEn = String(row.bio_en || bioFr).trim();
      AUTHOR_PROFILES[slug] = {
        photo: String(
          row.photo ||
            (AUTHOR_PROFILES_DEFAULT[slug] && AUTHOR_PROFILES_DEFAULT[slug].photo) ||
            ""
        ).trim(),
        roles: roles,
        name: cmsRowBilingual(row, "name_fr", "name_en"),
        roleLabel: cmsRowBilingual(row, "role_fr", "role_en"),
        bio: [{ fr: bioFr, en: bioEn }],
        hidden: row.hidden === true,
      };
    });
  }

  function buildHeroProfileFromCmsRow(row) {
    var id = String(row.id || "").trim();
    if (!id) return null;
    var traitsFr = cmsPipeList(row.traits_fr);
    var traitsEn = cmsPipeList(row.traits_en);
    while (traitsEn.length < traitsFr.length) {
      traitsEn.push(traitsFr[traitsEn.length] || "");
    }
    var related = String(row.related_books || "")
      .split(",")
      .map(function (bookId) {
        return String(bookId || "").trim();
      })
      .filter(Boolean);
    var base = HERO_PROFILES_DEFAULT[id] || {};
    return {
      id: id,
      name: cmsRowBilingual(row, "name_fr", "name_en"),
      tagline: cmsRowBilingual(row, "tagline_fr", "tagline_en"),
      portrait: String(row.portrait || base.portrait || "").trim(),
      cardClass: String(row.card_class || base.cardClass || "").trim(),
      imageFit: String(row.image_fit || base.imageFit || "contain").trim(),
      imagePosition: String(row.image_position || base.imagePosition || "center center").trim(),
      relatedBooks: related.length ? related : base.relatedBooks || [],
      intro: cmsRowBilingual(row, "intro_fr", "intro_en"),
      traits: { fr: traitsFr, en: traitsEn },
      schoolUse: cmsRowBilingual(row, "school_use_fr", "school_use_en"),
    };
  }

  function applyCmsHeroProfiles(content) {
    var rows = content && content.heroes;
    if (!Array.isArray(rows) || rows.length === 0) return;
    HERO_PROFILES = Object.assign({}, HERO_PROFILES_DEFAULT);
    rows.forEach(function (row) {
      var hero = buildHeroProfileFromCmsRow(row);
      if (hero && hero.id) HERO_PROFILES[hero.id] = hero;
    });
    var order = content.hero_display_order;
    if (Array.isArray(order) && order.length) {
      HERO_DISPLAY_ORDER = order
        .map(function (heroId) {
          return String(heroId || "").trim();
        })
        .filter(function (heroId) {
          return heroId && HERO_PROFILES[heroId];
        });
    }
    if (!HERO_DISPLAY_ORDER.length) {
      HERO_DISPLAY_ORDER = HERO_DISPLAY_ORDER_DEFAULT.slice();
    }
  }

  /** Codes promo actifs (chargés depuis api/content.php → promo_codes_active). */
  var PROMO_CODES = {};
  var I18N_STATE = {
    language: "fr",
    dictionary: { ui: {}, messages: {}, textMap: {}, meta: {} },
  };
  var CATALOGUE_STATE = {
    currentPage: 1,
    perPage: 12,
    sort: "editorial",
  };
  var ORIGINAL_TEXT_NODES = [];
  var HAS_CAPTURED_TEXT_NODES = false;

  function contenuGet(content, path, fallback) {
    if (!content || typeof content !== "object") return fallback || "";
    var parts = String(path || "")
      .split(".")
      .filter(Boolean);
    var node = content;
    for (var i = 0; i < parts.length; i += 1) {
      if (!node || typeof node !== "object" || !(parts[i] in node)) {
        return fallback || "";
      }
      node = node[parts[i]];
    }
    if (node === null || node === undefined || node === "") return fallback || "";
    return String(node);
  }

  function normalizeContentLink(link) {
    return String(link || "")
      .trim()
      .replace(/index\.php/gi, "index.html")
      .replace(/catalogue\.php/gi, "catalogue.html")
      .replace(/a-propos\.php/gi, "a-propos.html")
      .replace(/contact\.php/gi, "contact.html")
      .replace(/panier\.php/gi, "panier.html")
      .replace(/actualites\.php/gi, "actualites.html");
  }

  function parseAdminPrice(raw, fallback) {
    if (typeof raw === "number" && !isNaN(raw)) return raw;
    var text = String(raw || "").replace(/\s/g, "").replace(",", ".");
    var match = text.match(/[\d.]+/);
    if (!match) return typeof fallback === "number" ? fallback : 0;
    var value = parseFloat(match[0]);
    return isNaN(value) ? (typeof fallback === "number" ? fallback : 0) : value;
  }

  function slugifyAuthorName(name) {
    return String(name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Alias de slugs : les anciens identifiants courts (l-ramassamy, w-deroche, etc.)
   * sont conservés pour les URLs déjà partagées, tout en acceptant le slug long
   * généré automatiquement depuis le nom complet (ex. "Léanne Ramassamy" → "leanne-ramassamy").
   */
  var AUTHOR_SLUG_ALIASES = {
    "leanne-ramassamy": "l-ramassamy",
    "wilfried-deroche": "w-deroche",
    "w-deroche": "w-deroche",
    "renee-laure-zou": "renata",
    "renee-laure-zou-renata": "renata",
    "karine-petevi": "k-petevi",
    "jean-fritz-junior-odne": "ojf-junior",
    "jean-francisco-silva": "jf-silva",
  };

  function resolveAuthorSlug(slug) {
    var clean = String(slug || "").trim().toLowerCase();
    if (!clean) return "";
    if (AUTHOR_SLUG_ALIASES[clean]) return AUTHOR_SLUG_ALIASES[clean];
    return clean;
  }

  function parseAdminAuthors(raw) {
    return String(raw || "")
      .split(/\s*·\s*/)
      .map(function (part) {
        return String(part || "").trim();
      })
      .filter(Boolean)
      .map(function (name) {
        var rawSlug = slugifyAuthorName(name);
        var slug = resolveAuthorSlug(rawSlug) || rawSlug;
        return { name: name, slug: slug || null };
      });
  }

  function mergeAdminBookRow(base, row, id) {
    var cover = String(row.image || row.cover || base.cover || "").trim();
    var gallery = String(row.preview_images || "")
      .split(",")
      .map(function (item) {
        return String(item || "").trim();
      })
      .filter(Boolean);
    if (!gallery.length && cover) gallery = [cover];

    var merged = Object.assign({}, base, {
      title: row.title || base.title || id,
      collection: row.collection || base.collection || "",
      price: parseAdminPrice(row.price, base.price),
      cover: cover || base.cover || "",
      gallery: gallery.length ? gallery : base.gallery || (cover ? [cover] : []),
    });

    if (row.authors) {
      var parsedAuthors = parseAdminAuthors(row.authors);
      if (parsedAuthors.length) merged.authors = parsedAuthors;
    }
    if (row.description) merged.description = String(row.description);
    if (row.weight_g) {
      var weight = parseInt(String(row.weight_g), 10);
      if (!isNaN(weight) && weight > 0) merged.weightG = weight;
    }
    var pedagogicalFile = String(row.pedagogical_file || "").trim();
    if (pedagogicalFile) {
      merged.pedagogicalFile = pedagogicalFile;
    } else if (PEDAGOGICAL_SHEETS_AVAILABLE.indexOf(id) !== -1) {
      merged.pedagogicalFile = "data/pedagogical/" + id + ".pdf";
    }

    var catalogCategory = String(row.catalog_category || row.catalogCategory || "").trim();
    if (catalogCategory) merged.catalogCategory = catalogCategory;

    if (row.coming_soon === true || row.comingSoon === true) merged.comingSoon = true;
    if (row.coming_soon === false || row.comingSoon === false) merged.comingSoon = false;
    if (row.coming_soon === "1" || row.coming_soon === "on") merged.comingSoon = true;

    merged.specs = Object.assign({}, base.specs || {}, merged.specs || {});
    if (row.isbn) merged.specs.isbn = String(row.isbn).trim();
    if (row.format) merged.specs.format = String(row.format).trim();
    if (row.pages) merged.specs.pages = String(row.pages).trim();
    if (row.age_range) merged.specs.age = String(row.age_range).trim();
    if (row.languages) merged.specs.langues = String(row.languages).trim();
    if (row.publication_date) merged.specs.publicationDate = String(row.publication_date).trim();

    var ageRange = String(row.age_range || row.age_group || "").trim();
    if (ageRange) merged.ageGroup = ageRange;

    var langRaw = String(row.languages || "").trim();
    if (langRaw) {
      merged.languages = langRaw
        .split(/[,·|]/)
        .map(function (part) {
          return String(part || "").trim();
        })
        .filter(Boolean);
    }

    function applyBoolFlag(key, targetKey) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        merged[targetKey] = row[key] === true || row[key] === "1" || row[key] === 1;
      }
    }
    applyBoolFlag("hide_isbn", "hideIsbn");
    applyBoolFlag("hide_format", "hideFormat");
    applyBoolFlag("hide_pages", "hidePages");
    applyBoolFlag("hide_publication_date", "hidePublicationDate");
    applyBoolFlag("hide_languages", "hideLanguages");
    applyBoolFlag("badge_new", "badgeNew");
    applyBoolFlag("badge_bestseller", "badgeBestseller");
    applyBoolFlag("badge_award", "badgeAward");

    ["label_isbn", "label_format", "label_pages", "label_publication_date"].forEach(function (key) {
      var val = String(row[key] || "").trim();
      if (val) {
        var camel =
          key === "label_isbn"
            ? "labelIsbn"
            : key === "label_format"
              ? "labelFormat"
              : key === "label_pages"
                ? "labelPages"
                : "labelPublicationDate";
        merged[camel] = val;
      }
    });

    if (row.stock_qty !== undefined && row.stock_qty !== null && row.stock_qty !== "") {
      var stockFromRow = parseInt(String(row.stock_qty), 10);
      if (!isNaN(stockFromRow) && stockFromRow >= 0) merged.stockQty = stockFromRow;
    }

    return merged;
  }

  function applyPromoCodesFromContent(content) {
    PROMO_CODES = {};
    var list = content && content.promo_codes_active;
    if (!Array.isArray(list)) return;
    list.forEach(function (row) {
      if (!row || typeof row !== "object") return;
      var code = String(row.code || "")
        .trim()
        .toUpperCase();
      if (!code) return;
      PROMO_CODES[code] = {
        type: String(row.type || "percent"),
        value: Number(row.value) || 0,
        label: String(row.label || ""),
        label_en: String(row.label_en || ""),
      };
    });
  }

  function applyCatalogStockFromContent(content) {
    PRODUCTS_OUT_OF_STOCK = {};
    CATALOG_STOCK = {};
    // Source principale du stock: map explicite { productId: qty }.
    var stockMap = content && (content.catalog_stock || content.catalog_stock_public);
    if (stockMap && typeof stockMap === "object") {
      Object.keys(stockMap).forEach(function (productId) {
        var id = String(productId || "").trim();
        if (!id) return;
        var qty = parseInt(String(stockMap[productId]), 10);
        if (isNaN(qty) || qty < 0) qty = 0;
        CATALOG_STOCK[id] = qty;
        if (qty <= 0) PRODUCTS_OUT_OF_STOCK[id] = true;
      });
    }
    var list = content && content.products_out_of_stock;
    // Compatibilite/fallback: ancienne forme "liste des ruptures".
    if (!Array.isArray(list)) return;
    list.forEach(function (productId) {
      var id = String(productId || "").trim();
      if (!id) return;
      PRODUCTS_OUT_OF_STOCK[id] = true;
      if (!Object.prototype.hasOwnProperty.call(CATALOG_STOCK, id)) CATALOG_STOCK[id] = 0;
    });
  }

  function syncBookCatalogStockFields() {
    Object.keys(BOOK_CATALOG).forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(CATALOG_STOCK, id)) {
        BOOK_CATALOG[id].stockQty = CATALOG_STOCK[id];
      } else if (BOOK_CATALOG[id] && BOOK_CATALOG[id].stockQty !== undefined) {
        delete BOOK_CATALOG[id].stockQty;
      }
    });
  }

  function setBookOutOfStockBannerVisible(banner, visible) {
    if (!banner) return;
    if (visible) {
      banner.hidden = false;
      banner.classList.add("is-visible");
      return;
    }
    banner.hidden = true;
    banner.classList.remove("is-visible");
    banner.innerHTML = "";
  }

  function hasTrackedBookStock(bookId) {
    var book = BOOK_CATALOG[bookId];
    return !!(
      Object.prototype.hasOwnProperty.call(CATALOG_STOCK, bookId) ||
      (book && book.stockQty !== undefined && book.stockQty !== null && book.stockQty !== "")
    );
  }

  function getBookStockQty(bookId) {
    if (!hasTrackedBookStock(bookId)) return null;
    if (Object.prototype.hasOwnProperty.call(CATALOG_STOCK, bookId)) {
      return CATALOG_STOCK[bookId];
    }
    var book = BOOK_CATALOG[bookId];
    var qty = parseInt(String(book && book.stockQty !== undefined ? book.stockQty : ""), 10);
    if (isNaN(qty) || qty < 0) return 0;
    return qty;
  }

  function isBookOutOfStock(bookId) {
    if (Object.prototype.hasOwnProperty.call(PRODUCTS_OUT_OF_STOCK, bookId)) return true;
    if (!hasTrackedBookStock(bookId)) return false;
    return getBookStockQty(bookId) <= 0;
  }

  function canPurchaseBook(bookId) {
    var book = BOOK_CATALOG[bookId];
    if (!book) return false;
    if (book.comingSoon) return false;
    return !isBookOutOfStock(bookId);
  }

  function showOutOfStockToast(bookTitle) {
    var message = bookTitle
      ? t("ui.cannotAddOutOfStockNamed", "« {title} » est en rupture de stock.").replace("{title}", bookTitle)
      : t("ui.cannotAddOutOfStock", "Ce produit est en rupture de stock.");
    if (typeof window.showToast === "function") {
      window.showToast(message, { variant: "error" });
      return;
    }
    window.alert(message);
  }

  function rebuildBookCatalogFromContent(content) {
    var next = {};
    Object.keys(BOOK_CATALOG_DEFAULT).forEach(function (id) {
      next[id] = Object.assign({}, BOOK_CATALOG_DEFAULT[id]);
    });

    var rows = content && content.catalogue_books;
    if (!Array.isArray(rows)) {
      BOOK_CATALOG = next;
      return;
    }

    rows.forEach(function (row) {
      if (!row || typeof row !== "object") return;
      var id = String(row.id || "").trim();
      if (!id) return;
      if (row.hidden === true || row.catalog_visible === false) {
        delete next[id];
        return;
      }

      var base = next[id] || (BOOK_CATALOG_DEFAULT[id] ? Object.assign({}, BOOK_CATALOG_DEFAULT[id]) : {});
      next[id] = mergeAdminBookRow(base, row, id);
    });

    var removedIds = content && content.catalogue_removed_ids;
    if (Array.isArray(removedIds)) {
      removedIds.forEach(function (id) {
        var bookId = String(id || "").trim();
        if (bookId) delete next[bookId];
      });
    }

    BOOK_CATALOG = next;
    applyCatalogStockFromContent(content);
    applyPromoCodesFromContent(content);
    syncBookCatalogStockFields();
  }

  function setTextContent(selector, text) {
    if (!text) return;
    var node = document.querySelector(selector);
    if (!node) return;
    setCmsText(node, text);
  }

  /**
   * Injecte un texte FR provenant du CMS (contenu.json) tout en preservant
   * la capacite de traduction : ecrit data-fr=text pour que la passe i18n
   * (hydrateLanguageDataAttributes + applyDataAttributeLanguage) puisse
   * basculer ce noeud en anglais via le textMap du dictionnaire.
   * - Ignore les noeuds vides ou textes vides.
   * - Si le noeud possede des enfants avec data-fr/data-en, on laisse la
   *   structure i18n du HTML faire le travail (CMS n'a pas de version EN).
   */
  function setCmsText(node, text) {
    if (!node || typeof text !== "string" || !text) return;
    if (node.querySelector && node.querySelector("[data-fr][data-en]")) return;
    node.textContent = text;
    node.setAttribute("data-fr", text);
    if (I18N_STATE && I18N_STATE.dictionary && I18N_STATE.dictionary.textMap) {
      var translated = I18N_STATE.dictionary.textMap[text];
      if (translated) {
        node.setAttribute("data-en", translated);
        if (I18N_STATE.language === "en") node.textContent = translated;
      }
    }
  }

  function readingMiniCoverIsSquare(book) {
    if (bookIsSquareBoard(book)) return true;
    var fmt = (book && book.specs && book.specs.format) || "";
    return /21\s*[×x]\s*21/i.test(fmt);
  }

  function getBookAuthorsPlain(book) {
    return (book.authors || [])
      .map(function (author) {
        return author && author.name ? String(author.name).trim() : "";
      })
      .filter(Boolean)
      .join(" · ");
  }

  function truncateReadingSummary(text, maxLen) {
    var clean = String(text || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return "";
    var limit = typeof maxLen === "number" && maxLen > 0 ? maxLen : 220;
    if (clean.length <= limit) return clean;
    return clean.slice(0, limit - 1).trim() + "…";
  }

  function renderHomeReadingRecommendations() {
    var featuredRoot = document.getElementById("home-reading-featured");
    var secondaryRoot = document.getElementById("home-reading-secondary");
    if (!featuredRoot && !secondaryRoot) return;

    var picks = (SITE_CONTENT && SITE_CONTENT.reading_recommendations) || {};
    var featuredId = String(picks.featured_product_id || "nikou-champion").trim();
    var secondaryIds = Array.isArray(picks.secondary_product_ids)
      ? picks.secondary_product_ids
      : ["bebe-nikou-dit-non", "exocette", "tice-et-metice", "circuit-ferme"];

    if (featuredRoot) {
      var featuredBook = featuredId ? getLocalizedBook(featuredId) : null;
      if (!featuredBook || !featuredBook.title) {
        featuredRoot.innerHTML = "";
      } else {
        var featuredCover = toDotSlashPath(featuredBook.cover || "");
        var featuredAlt =
          t("ui.readingCoverAlt", "Couverture — {title}").replace("{title}", featuredBook.title) ||
          "Couverture — " + featuredBook.title;
        var featuredSummary = truncateReadingSummary(featuredBook.description);
        var featuredSummaryHtml = featuredSummary
          ? "<strong>" +
            escapeCatalogHtml(t("ui.readingSummary", "Résumé :")) +
            "</strong> " +
            escapeCatalogHtml(featuredSummary)
          : "";
        var featuredLabel = t("ui.readingFeaturedLabel", "Le coup de cœur de la semaine");
        var detailLabel = t("ui.readingSeeDetail", "Voir le détail");
        var detailHref = "./livre.html?id=" + encodeURIComponent(featuredId);
        var featuredSheetLabel =
          t("ui.openProductSheet", "Ouvrir la fiche produit") + " — " + featuredBook.title;
        featuredRoot.innerHTML =
          '<a class="coup-coeur-principal-link" href="' +
          escapeCatalogHtml(detailHref) +
          '" aria-label="' +
          escapeCatalogHtml(featuredSheetLabel) +
          '">' +
          '<div class="coup-coeur-cover coup-coeur-cover--photo">' +
          '<img src="' +
          escapeCatalogHtml(featuredCover) +
          '" alt="' +
          escapeCatalogHtml(featuredAlt) +
          '" class="coup-coeur-cover-img" width="600" height="760" decoding="async" loading="lazy">' +
          ("</" + "div" + ">") +
          '<div class="coup-coeur-info">' +
          '<p class="book-card-collection coup-coeur-label">' +
          escapeCatalogHtml(featuredLabel) +
          "</p>" +
          '<h3 class="book-card-titre">' +
          formatCatalogCardTitle(featuredBook.title) +
          "</h3>" +
          (featuredSummaryHtml
            ? '<p class="coup-coeur-description">' + featuredSummaryHtml + "</p>"
            : "") +
          '<div class="book-card-footer">' +
          '<span class="book-card-prix coup-coeur-prix" data-price-eur="' +
          escapeCatalogHtml(String(featuredBook.price || 0)) +
          '">' +
          formatPrice(featuredBook.price || 0) +
          "</span>" +
          '<span class="btn-primary coup-coeur-btn">' +
          escapeCatalogHtml(detailLabel) +
          "</span>" +
          ("</" + "div" + ">") +
          ("</" + "div" + ">") +
          "</a>";
      }
    }

    if (secondaryRoot) {
      var secondaryHtml = secondaryIds
        .map(function (id) {
          var productId = String(id || "").trim();
          if (!productId) return "";
          var book = getLocalizedBook(productId);
          if (!book || !book.title) return "";
          var cover = toDotSlashPath(book.cover || "");
          var squareClass = readingMiniCoverIsSquare(book) ? " coup-coeur-mini-cover--square" : "";
          var alt =
            t("ui.readingCoverAlt", "Couverture — {title}").replace("{title}", book.title) ||
            "Couverture — " + book.title;
          var authors = getBookAuthorsPlain(book);
          var detailHref = "./livre.html?id=" + encodeURIComponent(productId);
          var sheetLabel =
            t("ui.openProductSheet", "Ouvrir la fiche produit") + " — " + book.title;
          return (
            '<a class="coup-coeur-secondaire" href="' +
            escapeCatalogHtml(detailHref) +
            '" aria-label="' +
            escapeCatalogHtml(sheetLabel) +
            '">' +
            '<div class="coup-coeur-mini-cover coup-coeur-mini-cover--img' +
            squareClass +
            '">' +
            '<img src="' +
            escapeCatalogHtml(cover) +
            '" alt="' +
            escapeCatalogHtml(alt) +
            '" width="120" height="120" decoding="async" loading="lazy">' +
            "</div>" +
            '<div class="coup-coeur-mini-texte">' +
            '<p class="book-card-collection">' +
            escapeCatalogHtml(book.collection || "") +
            "</p>" +
            '<h4 class="book-card-titre">' +
            formatCatalogCardTitle(book.title) +
            "</h4>" +
            (authors ? '<p class="book-card-auteur">' + escapeCatalogHtml(authors) + "</p>" : "") +
            '<span class="book-card-prix" data-price-eur="' +
            escapeCatalogHtml(String(book.price || 0)) +
            '">' +
            formatPrice(book.price || 0) +
            "</span>" +
            "</div>" +
            "</a>"
          );
        })
        .filter(Boolean)
        .join("");
      secondaryRoot.innerHTML = secondaryHtml;
    }

    renderDisplayPrices();
  }

  function bookHasPedagogicalSheet(book, bookId) {
    if (book && book.pedagogicalFile) return true;
    return PEDAGOGICAL_SHEETS_AVAILABLE.indexOf(String(bookId || "")) !== -1;
  }

  function applySiteContent(content) {
    if (!content || typeof content !== "object") return;
    SITE_CONTENT = content;
    PEDAGOGICAL_SHEETS_AVAILABLE = Array.isArray(content.pedagogical_sheets_available)
      ? content.pedagogical_sheets_available.slice()
      : [];

    var heroTagNode = document.querySelector(".hero-tag span[data-fr]") || document.querySelector(".hero-tag span");
    var heroTag = contenuGet(content, "home_page.hero_tag", "");
    if (heroTagNode && heroTag) {
      setCmsText(heroTagNode, heroTag);
    }

    var heroTitle = contenuGet(content, "home_page.hero_title", "");
    var heroHeading = document.querySelector(".hero h1");
    if (heroHeading && heroTitle) setCmsText(heroHeading, heroTitle);

    var heroIntro = contenuGet(content, "home_page.hero_intro", "");
    if (heroIntro) setTextContent(".hero-desc", heroIntro);

    var heroMotto = contenuGet(content, "home_page.hero_motto", "");
    if (heroMotto) setTextContent(".hero-motto", heroMotto);

    var heroNikou = document.querySelector(".hero-nikou");
    var heroNikouSrc = contenuGet(content, "home_page.hero_image", "");
    if (heroNikou && heroNikouSrc) heroNikou.setAttribute("src", toDotSlashPath(heroNikouSrc));

    var heroCover = document.querySelector(".hero-book-cover");
    var heroCoverSrc = contenuGet(content, "home_page.hero_book_cover", "");
    if (heroCover && heroCoverSrc) heroCover.setAttribute("src", toDotSlashPath(heroCoverSrc));

    var heroSection = document.querySelector(".hero");
    var heroBackground = contenuGet(content, "home_page.hero_background_image", "");
    if (heroSection && heroBackground) {
      heroSection.style.backgroundImage = 'url("' + toDotSlashPath(heroBackground).replace(/"/g, "") + '")';
    }

    var primaryCta = document.querySelector(".hero-ctas .btn-primary");
    if (primaryCta) {
      var primaryText = contenuGet(content, "home_page.cta_primary_text", "");
      var primaryLink = normalizeContentLink(contenuGet(content, "home_page.cta_primary_link", ""));
      if (primaryText) {
        var primaryLabel = primaryCta.querySelector("span") || primaryCta;
        setCmsText(primaryLabel, primaryText);
      }
      if (primaryLink) primaryCta.setAttribute("href", primaryLink);
    }

    var secondaryCta = document.querySelector(".hero-ctas .btn-outline");
    if (secondaryCta) {
      var secondaryText = contenuGet(content, "home_page.cta_secondary_text", "");
      var secondaryLink = normalizeContentLink(contenuGet(content, "home_page.cta_secondary_link", ""));
      if (secondaryText) setCmsText(secondaryCta, secondaryText);
      if (secondaryLink) secondaryCta.setAttribute("href", secondaryLink);
    }

    if (document.querySelector(".contact-form")) {
      setTextContent("main.page-shell .page-hero h1", contenuGet(content, "contact_page.title", ""));
      var contactIntro = document.querySelector("main.page-shell .page-hero p");
      if (contactIntro) {
        setCmsText(contactIntro, contenuGet(content, "contact_page.intro", contactIntro.textContent));
      }
      setTextContent(".contact-content h2", contenuGet(content, "contact_page.bloc_titre", ""));
      var contactBloc = document.querySelector(".contact-content > p");
      if (contactBloc) {
        setCmsText(contactBloc, contenuGet(content, "contact_page.bloc_texte", contactBloc.textContent));
      }
      var backLink = document.querySelector(".contact-back-row .voir-tout, .contact-content .voir-tout");
      if (backLink) {
        var backText = contenuGet(content, "contact_page.retour_texte", "");
        if (backText) setCmsText(backLink, "← " + backText.replace(/^←\s*/, ""));
      }
      var addrLabel = contenuGet(content, "contact_page.adresse_label", "");
      var addrText = contenuGet(content, "contact_page.adresse_texte", "");
      var telLabel = contenuGet(content, "contact_page.telephone_label", "");
      var telText = contenuGet(content, "contact_page.telephone", "");
      var addrStrong = document.querySelector(".contact-list [data-contact-address-label]");
      var addrSpan = document.querySelector(".contact-list [data-contact-address-text]");
      var telStrong = document.querySelector(".contact-list [data-contact-phone-label]");
      var telNode = document.querySelector(".contact-list [data-contact-phone]");
      if (addrStrong && addrLabel) setCmsText(addrStrong, addrLabel);
      if (addrSpan && addrText) setCmsText(addrSpan, addrText);
      if (telStrong && telLabel) setCmsText(telStrong, telLabel);
      if (telNode && telText) setCmsText(telNode, telText);
    }

    if (document.querySelector(".catalogue-grid")) {
      var catalogueTitle = document.querySelector("main.page-shell .page-hero h1");
      if (catalogueTitle) {
        setCmsText(catalogueTitle, contenuGet(content, "catalogue_page.title", catalogueTitle.textContent));
      }
      var catalogueIntro = document.querySelector("main.page-shell .page-hero p");
      if (catalogueIntro) {
        setCmsText(catalogueIntro, contenuGet(content, "catalogue_page.intro", catalogueIntro.textContent));
      }
      if (document.querySelector("[data-catalogue-category-filters]")) {
        renderCatalogueFiltersPanel();
        if (typeof window.__sucrierRebindCatalogueFilters === "function") {
          window.__sucrierRebindCatalogueFilters();
        }
      }
    }

    if (window.location.pathname.indexOf("a-propos") !== -1) {
      var aboutHero = document.querySelector(".about-entry-hero h1");
      if (aboutHero) {
        var aboutTitle = contenuGet(content, "about_page.title", "");
        if (aboutTitle) setCmsText(aboutHero, aboutTitle);
      }
      var aboutParas = document.querySelectorAll(
        ".about-entry-hero-body > p:not(.about-rich-intro-note)"
      );
      var aboutParaKeys = [
        "paragraphe_1",
        "paragraphe_2",
        "paragraphe_3",
        "paragraphe_4",
        "paragraphe_5",
      ];
      aboutParaKeys.forEach(function (key, index) {
        if (!aboutParas[index]) return;
        setCmsText(
          aboutParas[index],
          contenuGet(content, "about_page." + key, aboutParas[index].textContent)
        );
      });
      var aboutIntro = contenuGet(content, "about_page.intro", "");
      if (aboutIntro) {
        setTextContent(".about-entry-intro p", aboutIntro);
      }
    }

    applyAuthorsChapterHero(content);
    applyAboutHousePage(content);
    renderAboutAuthorsGrid();

    if (document.querySelector(".cart-layout")) {
      var cmsCartNote = document.querySelector("[data-cms-cart-note]");
      var cmsShippingNote = document.querySelector("[data-cms-shipping-note]");
      var cartNoteText = contenuGet(content, "ecommerce.cart_note", "");
      var shippingNoteText = contenuGet(content, "ecommerce.shipping_note", "");
      if (cmsCartNote && cartNoteText) setCmsText(cmsCartNote, cartNoteText);
      if (cmsShippingNote && shippingNoteText) setCmsText(cmsShippingNote, shippingNoteText);
      var supportPhone = contenuGet(content, "ecommerce.support_phone", "");
      var supportPhoneEl = document.querySelector("[data-cms-support-phone]");
      if (supportPhoneEl && supportPhone) {
        supportPhoneEl.textContent = supportPhone;
        supportPhoneEl.setAttribute("href", "tel:" + supportPhone.replace(/\s+/g, ""));
      }
    }

    var footer = content.footer || {};
    var footerName = document.querySelector(".footer-brand-name");
    if (footerName && footer.brand_name) setCmsText(footerName, footer.brand_name);
    var footerTagline = document.querySelector(".footer-brand-tagline");
    if (footerTagline && footer.brand_tagline) setCmsText(footerTagline, footer.brand_tagline);
    var footerDesc = document.querySelector(".footer-desc");
    if (footerDesc && footer.description) setCmsText(footerDesc, footer.description);
    var footerContacts = document.querySelectorAll(".footer-contact-item");
    if (footerContacts[0] && footer.ville) {
      var locationNode = footerContacts[0];
      var locationSvg = locationNode.querySelector("svg");
      locationNode.textContent = "";
      if (locationSvg) locationNode.appendChild(locationSvg);
      locationNode.appendChild(document.createTextNode(footer.ville));
    }
    if (footerContacts[1] && footer.telephone) {
      var phoneNode = footerContacts[1];
      var phoneSvg = phoneNode.querySelector("svg");
      phoneNode.textContent = "";
      if (phoneSvg) phoneNode.appendChild(phoneSvg);
      phoneNode.appendChild(document.createTextNode(footer.telephone));
    }
    var footerBottom = document.querySelector(".footer-bottom > p");
    if (footerBottom && footer.copyright) setCmsText(footerBottom, footer.copyright);
    var legalLinks = document.querySelectorAll(".footer-links a");
    if (legalLinks[0] && footer.mentions_legales) setCmsText(legalLinks[0], footer.mentions_legales);
    if (legalLinks[1] && footer.confidentialite) setCmsText(legalLinks[1], footer.confidentialite);
    if (legalLinks[2] && footer.cgv) setCmsText(legalLinks[2], footer.cgv);

    applyPromoCodesFromContent(content);
    renderHomePromoBanner(content);
    renderHomeReadingRecommendations();
    renderNewsPage(content);

    // Re-applique la traduction maintenant que tous les textes CMS ont leur data-fr a jour.
    if (I18N_STATE && I18N_STATE.dictionary && typeof applyPageTranslations === "function") {
      try { applyPageTranslations(); } catch (e) { /* no-op */ }
    }
  }

  function renderNewsPage(content) {
    if (!content || typeof content !== "object") return;

    var pageHero = document.querySelector("main.page-shell .page-hero");
    if (pageHero && document.querySelector(".actu-grid")) {
      var heroTitle = pageHero.querySelector("h1");
      var heroIntro = pageHero.querySelector("p");
      var newsTitle = contenuGet(content, "news_page.title", "");
      var newsIntro = contenuGet(content, "news_page.intro", "");
      if (heroTitle && newsTitle) setCmsText(heroTitle, newsTitle);
      if (heroIntro && newsIntro) setCmsText(heroIntro, newsIntro);
    }

    var grid = document.querySelector(".actu-grid");
    if (!grid) return;
    var items = content.news_items;
    if (!Array.isArray(items) || !items.length) return;

    grid.innerHTML = items
      .map(function (item) {
        if (!item || typeof item !== "object") return "";
        var tag = String(item.tag || "nouveau").toLowerCase().replace(/[^a-z0-9_-]/g, "") || "nouveau";
        var tagLabel = escapeCatalogHtml(item.tag_label || item.tag || tag);
        var title = escapeCatalogHtml(item.title || "");
        var date = escapeCatalogHtml(item.date || "");
        var image = toDotSlashPath(String(item.image || "").trim());
        var link = normalizeContentLink(String(item.link || "").trim());
        var coverStyle = String(item.cover_style || "").toLowerCase();
        if (!coverStyle) {
          coverStyle = tag === "evenement" ? "event" : "book";
        }
        if (coverStyle === "evenement") coverStyle = "event";
        var frameClass = "actu-cover-frame actu-cover-frame--" + coverStyle.replace(/[^a-z]/g, "");
        var alt = title || "Actualité";
        var inner =
          (image
            ? '<div class="' +
              frameClass +
              '"><img src="' +
              escapeCatalogHtml(image) +
              '" alt="' +
              alt +
              '" class="actu-cover" width="480" height="300" decoding="async" loading="lazy"></div>'
            : '<div class="actu-cover-frame actu-cover-frame--placeholder" aria-hidden="true"></div>') +
          '<div class="actu-body">' +
          '<span class="actu-tag ' +
          escapeCatalogHtml(tag) +
          '">' +
          tagLabel +
          "</span>" +
          '<h4 class="actu-titre">' +
          title +
          "</h4>" +
          (date ? '<p class="actu-date">' + date + "</p>" : "") +
          "</div>";

        if (link) {
          return (
            '<a href="' +
            escapeCatalogHtml(link) +
            '" class="actu-card">' +
            inner +
            "</a>"
          );
        }
        return '<div class="actu-card">' + inner + "</div>";
      })
      .join("");
  }

  function applyContentPayload(data) {
    if (!data || typeof data !== "object") throw new Error("content_invalid");
    PEDAGOGICAL_SHEETS_AVAILABLE = Array.isArray(data.pedagogical_sheets_available)
      ? data.pedagogical_sheets_available.slice()
      : [];
    rebuildBookCatalogFromContent(data);
    applyCmsAuthorProfiles(data);
    applyCmsHeroProfiles(data);
    applySiteContent(data);
    return data;
  }

  function fetchContentText(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (response) {
      if (!response.ok) throw new Error("content_unavailable");
      return response.text();
    });
  }

  /** PHP en local ; JSON statique en secours (Vercel, GitHub Pages, etc.). */
  function loadSiteContent() {
    // Priorite: API PHP (retourne la version "publique" securisee du CMS).
    return fetchContentText("./api/content.php")
      .then(function (text) {
        return applyContentPayload(JSON.parse(text || "{}"));
      })
      .catch(function () {
        // Fallback statique pour environnements sans PHP.
        return Promise.all([
          fetchContentText("./data/contenu.json"),
          fetchContentText("./data/authors.json").catch(function () {
            return "{}";
          }),
          fetchContentText("./data/heroes.json").catch(function () {
            return "{}";
          }),
        ])
          .then(function (parts) {
            var data = JSON.parse(parts[0] || "{}");
            var authorsWrap = JSON.parse(parts[1] || "{}");
            var heroesWrap = JSON.parse(parts[2] || "{}");
            if (authorsWrap && typeof authorsWrap === "object") {
              data.authors_page = authorsWrap.page || {};
              data.authors = authorsWrap.authors || [];
            }
            if (heroesWrap && typeof heroesWrap === "object") {
              data.heroes = heroesWrap.heroes || [];
              data.hero_display_order = heroesWrap.display_order || [];
            }
            return applyContentPayload(data);
          })
          .catch(function () {
            BOOK_CATALOG = BOOK_CATALOG_DEFAULT;
            return null;
          });
      });
  }

  function getByPath(obj, path) {
    return String(path || "")
      .split(".")
      .reduce(function (acc, part) {
        return acc && typeof acc === "object" ? acc[part] : undefined;
      }, obj);
  }

  function t(path, fallback) {
    var value = getByPath(I18N_STATE.dictionary, path);
    if (typeof value === "string") return value;
    return typeof fallback === "string" ? fallback : path;
  }

  /** Contenu injecté par app.js (fiches livre, catalogue…) : ne pas passer par data-fr/data-en. */
  function isAppManagedI18nNode(node) {
    if (!node) return false;
    if (node.getAttribute("data-i18n-dynamic") === "true") return true;
    if (
      node.id &&
      /^(book-detail-|book-out-of-stock|catalogue-detail-|book-tech-list|related-books-grid|author-detail-|hero-detail-)/.test(
        node.id
      )
    ) {
      return true;
    }
    if (node.closest) {
      return !!node.closest(
        ".catalogue-grid, .related-books-grid, .catalogue-detail-reco-list, #book-tech-list, .cart-list, .favorites-list, .hero-books-grid, .author-books-grid, .section-coup-coeur, #home-reading-featured, #home-reading-secondary"
      );
    }
    return false;
  }

  function applyDataAttributeLanguage(lang) {
    document.querySelectorAll("[data-fr][data-en]").forEach(function (node) {
      if (isAppManagedI18nNode(node)) return;
      if (node.children && node.children.length > 0) return;
      node.textContent = lang === "en" ? node.getAttribute("data-en") : node.getAttribute("data-fr");
    });
  }

  function hydrateLanguageDataAttributes() {
    var map = (I18N_STATE.dictionary && I18N_STATE.dictionary.textMap) || {};
    var normalizedMap = {};
    var reverseMap = {};
    Object.keys(map).forEach(function (key) {
      var normalizedKey = normalizeI18nText(key);
      var translatedValue = map[key];
      normalizedMap[normalizedKey] = translatedValue;
      reverseMap[normalizeI18nText(translatedValue)] = key;
    });

    var candidates = document.querySelectorAll(
      "h1, h2, h3, h4, p, a, button, label, span, li, summary, option, strong"
    );
    candidates.forEach(function (node) {
      if (!node || !node.textContent) return;
      if (isAppManagedI18nNode(node)) return;
      if (node.children && node.children.length > 0) return;
      if (node.querySelector("svg, img, input, select, textarea")) return;
      var raw = node.textContent;
      var trimmed = normalizeI18nText(raw);
      if (!trimmed) return;

      if (!node.hasAttribute("data-fr")) {
        var frenchSource = reverseMap[trimmed] || trimmed;
        node.setAttribute("data-fr", frenchSource);
      }
      var frenchBase = normalizeI18nText(node.getAttribute("data-fr"));
      var translated = normalizedMap[frenchBase] || node.getAttribute("data-en") || trimmed;
      node.setAttribute("data-en", translated);
    });
  }

  function normalizeHeaderFavoriteLinks() {
    document.querySelectorAll('header a.icon-btn[href*="favoris"]').forEach(function (link) {
      if (link.querySelector("[data-header-favorites-count]")) return;
      var svg = link.querySelector("svg");
      var svgMarkup = svg ? svg.outerHTML : "";
      link.innerHTML =
        svgMarkup +
        '<span class="header-favorites-text">' +
        '<span class="header-favorites-label" data-fr="Favoris" data-en="Favorites">Favoris</span>' +
        '<span class="header-favorites-count-wrap">\u00a0(<span data-header-favorites-count>0</span>)</span>' +
        "</span>";
    });
  }

  function normalizeHeaderAccountLinks() {
    document
      .querySelectorAll(
        'header a.icon-btn[href*="compte.html"], header a.icon-btn[href*="espace.html"], header a.header-account-btn'
      )
      .forEach(function (link) {
        if (link.dataset.headerAccountNormalized === "1") return;
        link.dataset.headerAccountNormalized = "1";
        link.classList.add("header-account-btn");
        var svg = link.querySelector("svg");
        var svgMarkup = svg
          ? svg.outerHTML
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        link.innerHTML =
          '<span class="header-auth-status" aria-hidden="true"><span class="header-auth-dot"></span></span>' +
          svgMarkup +
          '<span class="header-auth-label" data-fr="Compte" data-en="Account">Compte</span>';
      });
  }

  function getHeaderAuthFirstName(session) {
    if (!session || !session.fullName) return "";
    var parts = String(session.fullName).trim().split(/\s+/);
    return parts[0] || "";
  }

  function updateHeaderAuthState() {
    if (!document.querySelector("header")) return;
    normalizeHeaderAccountLinks();
    var authed = isClientAuthenticated();
    var session = getClientAuthSession();
    var firstName = getHeaderAuthFirstName(session);
    var lang = getSelectedLanguage();
    var guestLabelFr = "Compte";
    var guestLabelEn = "Account";
    var authedLabelFr = firstName || "Connecté";
    var authedLabelEn = firstName || "Signed in";
    var ariaAuthed = firstName
      ? "Mon compte — connecté (" + firstName + ")"
      : "Mon compte — connecté";
    var ariaGuest = "Mon compte — non connecté";

    document.querySelectorAll("header .header-account-btn").forEach(function (link) {
      link.classList.toggle("is-header-authed", authed);
      link.classList.toggle("is-header-guest", !authed);
      link.href = authed ? "espace.html" : "compte.html";
      var label = link.querySelector(".header-auth-label");
      if (label) {
        if (authed) {
          label.textContent = lang === "en" ? authedLabelEn : authedLabelFr;
          label.setAttribute("data-fr", authedLabelFr);
          label.setAttribute("data-en", authedLabelEn);
        } else {
          label.textContent = lang === "en" ? guestLabelEn : guestLabelFr;
          label.setAttribute("data-fr", guestLabelFr);
          label.setAttribute("data-en", guestLabelEn);
        }
      }
      link.setAttribute("aria-label", authed ? ariaAuthed : ariaGuest);
      link.setAttribute("title", link.getAttribute("aria-label") || "");
    });

    document.querySelectorAll("header .header-actions-menu").forEach(function (menu) {
      menu.classList.toggle("is-header-authed", authed);
      menu.classList.toggle("is-header-guest", !authed);
      var trigger = menu.querySelector(".header-actions-trigger");
      if (trigger) {
        trigger.setAttribute(
          "aria-label",
          authed
            ? lang === "en"
              ? "Open menu — signed in"
              : "Ouvrir le menu — connecté"
            : lang === "en"
              ? "Open menu — guest"
              : "Ouvrir le menu — non connecté"
        );
      }
    });
  }

  function refreshAllLocalizedViews() {
    renderCatalogueFiltersPanel();
    renderCatalogueGrid();
    renderBookDetailPage();
    renderAuthorDetailPage();
    renderAboutAuthorsGrid();
    applyAuthorsChapterHero(SITE_CONTENT || {});
    renderHomeHeroesSection();
    renderHomeReadingRecommendations();
    renderHeroDetailPage();
    renderCartPage();
    renderFavoritesPage();
    renderDisplayPrices();
    var modal = document.getElementById("catalogue-detail-modal");
    if (modal && modal.classList.contains("is-open") && modal.dataset.activeProductId) {
      openCataloguePreviewModal(modal.dataset.activeProductId);
    }
  }

  function switchLang(lang) {
    var normalized = lang === "en" ? "en" : "fr";
    normalizeHeaderFavoriteLinks();
    setSelectedLanguage(normalized);
    I18N_STATE.language = normalized;
    document.documentElement.setAttribute("lang", normalized);
    var languageSelect = document.getElementById("language-select");
    if (languageSelect) {
      languageSelect.value = normalized;
    }
    applyPageTranslations();
    hydrateLanguageDataAttributes();
    applyDataAttributeLanguage(normalized);
    refreshAllLocalizedViews();
    updateHeaderBadges();
    updateFxRateNotice();
    syncAccountDashboardVisibility();
  }
  window.switchLang = switchLang;

  function normalizeI18nText(text) {
    return String(text || "")
      .normalize("NFC")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toDotSlashPath(path) {
    var value = String(path || "").trim();
    if (!value) return value;
    if (
      value.startsWith("./") ||
      value.startsWith("../") ||
      value.startsWith("/") ||
      value.startsWith("#") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:") ||
      value.startsWith("javascript:") ||
      value.startsWith("data:")
    ) {
      return value;
    }
    return "./" + value;
  }

  function normalizeDocumentRelativePaths() {
    document.querySelectorAll("[href]").forEach(function (node) {
      var href = node.getAttribute("href");
      if (!href) return;
      node.setAttribute("href", toDotSlashPath(href));
    });
    document.querySelectorAll("[src]").forEach(function (node) {
      var src = node.getAttribute("src");
      if (!src) return;
      node.setAttribute("src", toDotSlashPath(src));
    });
    document.querySelectorAll("form[action]").forEach(function (node) {
      var action = node.getAttribute("action");
      if (!action) return;
      node.setAttribute("action", toDotSlashPath(action));
    });
  }

  function bindCatalogImageExtensionFallback(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (!scope.querySelectorAll) return;
    scope.querySelectorAll("img[src]").forEach(function (img) {
      if (img.dataset.catalogImgFallback === "1") return;
      img.dataset.catalogImgFallback = "1";
      img.addEventListener("error", function onCatalogImgError() {
        var src = img.getAttribute("src") || "";
        if (!src || img.dataset.catalogImgAltTried === "1") return;
        img.dataset.catalogImgAltTried = "1";
        if (/\.webp(\?.*)?$/i.test(src)) {
          img.src = src.replace(/\.webp(\?.*)?$/i, ".png$1");
        } else if (/\.png(\?.*)?$/i.test(src)) {
          img.src = src.replace(/\.png(\?.*)?$/i, ".webp$1");
        }
      });
    });
  }

  function applyLazyLoadingToImages() {
    document.querySelectorAll("img").forEach(function (img) {
      if (img.getAttribute("fetchpriority") === "high") return;
      if (img.classList.contains("logo-img")) return;
      if (img.id === "book-detail-main-image") return;
      if (img.closest(".hero, .hero-image, .hero-showcase")) return;
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    });
    bindCatalogImageExtensionFallback(document);
  }

  function getOptimizedImagePath(path) {
    var value = String(path || "");
    if (!value) return value;
    var match = value.match(/^images\/([^/]+)$/i);
    if (!match) return value;
    var fileName = match[1];
    var lower = fileName.toLowerCase();
    var stem = lower.replace(/\.(png|webp|jpe?g|gif|svg)$/i, "");
    var sitePrefixes = [
      "logo-editions-sucrier",
      "logo-footer-noir",
      "home-bg-editions-sucrier",
      "home-bg-mobile",
      "maison-edition-banner",
      "a-propos-hero-droite",
      "a-propos-maison-fond",
    ];
    var portraitPrefixes = [
      "author-",
      "francisco-silva",
      "jean-fritz-junior-odne",
      "laane-ramassamy",
      "patrick-petito",
      "renee-laure-zou",
      "wilfried-deroche",
      "rolyne-pam",
    ];
    var eventPrefixes = ["stand-", "biographie-"];

    function startsWithAny(prefixes) {
      for (var i = 0; i < prefixes.length; i += 1) {
        if (stem.indexOf(prefixes[i]) === 0) return true;
      }
      return false;
    }

    if (startsWithAny(sitePrefixes)) return "images/site/" + fileName;
    if (startsWithAny(eventPrefixes)) return "images/events/" + fileName;
    if (startsWithAny(portraitPrefixes)) return "images/portraits/" + fileName;
    return "images/catalog/" + fileName;
  }

  function getLocalizedBook(bookId) {
    var baseBook = BOOK_CATALOG[bookId];
    if (!baseBook) return null;
    var localized = getByPath(I18N_STATE.dictionary, "books." + bookId) || {};
    var baseGallery = Array.isArray(baseBook.gallery) ? baseBook.gallery : [];
    return {
      id: bookId,
      title: localized.title || baseBook.title,
      collection: localized.collection || baseBook.collection,
      price: baseBook.price,
      cover: getOptimizedImagePath(baseBook.cover),
      gallery: baseGallery.map(getOptimizedImagePath),
      authors: localized.authors || baseBook.authors,
      description: localized.description || baseBook.description,
      specs: Object.assign({}, baseBook.specs || {}, localized.specs || {}),
      distributionEdition: !!baseBook.distributionEdition,
      ageGroup: baseBook.ageGroup,
      languages: baseBook.languages,
      coverFillsPortraitSlot: !!baseBook.coverFillsPortraitSlot,
      catalogueSquareNudge: !!baseBook.catalogueSquareNudge,
      catalogueLandscapeMedia: !!baseBook.catalogueLandscapeMedia,
      catalogueProductPhoto: !!baseBook.catalogueProductPhoto,
      catalogueCoverPosition: baseBook.catalogueCoverPosition || "",
      pedagogicalFile: baseBook.pedagogicalFile || "",
      comingSoon: !!baseBook.comingSoon,
      stockQty: hasTrackedBookStock(bookId) ? getBookStockQty(bookId) : null,
      hideIsbn: !!baseBook.hideIsbn,
      hideFormat: !!baseBook.hideFormat,
      hidePages: !!baseBook.hidePages,
      hidePublicationDate: !!baseBook.hidePublicationDate,
      hideLanguages: !!baseBook.hideLanguages,
      labelIsbn: baseBook.labelIsbn || "",
      labelFormat: baseBook.labelFormat || "",
      labelPages: baseBook.labelPages || "",
      labelPublicationDate: baseBook.labelPublicationDate || "",
      badgeNew: baseBook.badgeNew,
      badgeBestseller: baseBook.badgeBestseller,
      badgeAward: baseBook.badgeAward,
    };
  }

  function captureOriginalTextNodes() {
    if (HAS_CAPTURED_TEXT_NODES || !document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.tagName ? parent.tagName.toLowerCase() : "";
        if (tag === "script" || tag === "style" || tag === "noscript") return NodeFilter.FILTER_REJECT;
        var text = node.nodeValue || "";
        if (!text.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    var textNode = walker.nextNode();
    while (textNode) {
      var original = textNode.nodeValue || "";
      var trimmed = original.trim();
      if (trimmed) {
        var leading = (original.match(/^\s*/) || [""])[0];
        var trailing = (original.match(/\s*$/) || [""])[0];
        ORIGINAL_TEXT_NODES.push({
          node: textNode,
          original: trimmed,
          normalizedOriginal: normalizeI18nText(trimmed),
          leading: leading,
          trailing: trailing,
        });
      }
      textNode = walker.nextNode();
    }
    HAS_CAPTURED_TEXT_NODES = true;
  }

  function translateStaticText() {
    // La vraie traduction passe par hydrateLanguageDataAttributes + applyDataAttributeLanguage
    // (declenches ici pour couvrir aussi le chargement initial CMS / dictionnaire).
    if (!I18N_STATE || !I18N_STATE.dictionary) return;
    try {
      hydrateLanguageDataAttributes();
      applyDataAttributeLanguage(I18N_STATE.language);
    } catch (e) { /* no-op */ }
  }

  function applyPageTranslations() {
    document.documentElement.setAttribute("lang", I18N_STATE.language === "en" ? "en" : "fr");
    var siteTitle = t("meta.siteTitle", document.title);
    if (siteTitle) {
      document.title = siteTitle;
    }
    var languageSelect = document.getElementById("language-select");
    if (languageSelect) {
      Array.from(languageSelect.options).forEach(function (option) {
        if (option.value === "fr") option.textContent = I18N_STATE.language === "en" ? "French" : "Français";
        if (option.value === "en") option.textContent = I18N_STATE.language === "en" ? "English" : "Anglais";
      });
    }
    translateStaticText();
  }

  function refreshStaticTranslations() {
    ORIGINAL_TEXT_NODES = [];
    HAS_CAPTURED_TEXT_NODES = false;
    applyPageTranslations();
  }

  function loadI18nDictionary(language) {
    var normalized = language === "en" ? "en" : "fr";
    return fetch("./locales/" + normalized + ".json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed loading dictionary");
        }
        return response.json();
      })
      .then(function (dictionary) {
        I18N_STATE.language = normalized;
        I18N_STATE.dictionary = dictionary || { ui: {}, messages: {}, textMap: {}, meta: {} };
        applyPageTranslations();
      })
      .catch(function () {
        I18N_STATE.language = "fr";
        I18N_STATE.dictionary = { ui: {}, messages: {}, textMap: {}, meta: {} };
        document.documentElement.setAttribute("lang", "fr");
      });
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getCart() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []).map(function (item) {
      var catalogBook = item && item.id ? getLocalizedBook(item.id) : null;
      var parsedPrice = Number(item.price);
      var safePrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : catalogBook ? Number(catalogBook.price) || 0 : 0;
      var canonicalCover = catalogBook && catalogBook.cover ? catalogBook.cover : "";
      return {
        id: item.id,
        title: item.title || (catalogBook ? catalogBook.title : item.id),
        price: safePrice,
        // Toujours privilegier la couverture source catalogue pour eviter d'utiliser
        // une ancienne vignette potentiellement moins nette depuis le localStorage.
        image: getOptimizedImagePath(canonicalCover || item.image || ""),
        qty: Math.max(1, Number(item.qty) || 1),
      };
    });
  }

  function setCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }

  function createCheckoutSession(cart, shippingMode, shippingNote, customer, shippingAddress, postalZone, customerMode) {
    return fetch("./api/create-checkout-session.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cart.map(function (item) {
          return { id: item.id, qty: item.qty };
        }),
        shipping_mode: shippingMode,
        shipping_note: shippingNote,
        promo_code: getPromoCode() || "",
        customer: customer || {},
        shipping_address: shippingAddress || {},
        postal_zone: postalZone || "dom_martinique_near",
        customer_mode: customerMode || "guest",
      }),
    }).then(function (response) {
      return response.text().then(function (rawBody) {
        var data = null;
        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch (e) {
          data = null;
        }

        var isHtmlResponse = rawBody && rawBody.trim().startsWith("<");
        var isPhpSourceResponse = rawBody && rawBody.indexOf("<?php") !== -1;

        if (!response.ok) {
          var serverMessage = (data && data.error) || "";
          if (!serverMessage && (isHtmlResponse || isPhpSourceResponse)) {
            serverMessage = t(
              "messages.serverHtmlResponse",
              "Le serveur ne traite pas PHP correctement. Lancez le site sur un hébergement PHP (ou backend API) pour créer la session de paiement."
            );
          }
          throw new Error(serverMessage || t("messages.createCheckoutSessionError", "Impossible de créer la session de paiement."));
        }

        if (!data) {
          if (isPhpSourceResponse) {
            throw new Error(
              t(
                "messages.serverReturnedPhpSource",
                "Le serveur renvoie le code PHP brut. L'API paiement nécessite un runtime PHP côté serveur."
              )
            );
          }
          throw new Error(
            t(
              "messages.serverReturnedHtml",
              "Le serveur a renvoyé une page HTML au lieu de JSON. Lancez le site avec un serveur PHP (ex: XAMPP/WAMP) pour activer l'API checkout."
            )
          );
        }

        return data;
      });
    });
  }

  function postApiJson(url, payload, fallbackErrorMessage) {
    return fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    }).then(function (response) {
      return response.text().then(function (rawBody) {
        var data = null;
        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch (e) {
          data = null;
        }

        var isHtmlResponse = rawBody && rawBody.trim().startsWith("<");
        var isPhpSourceResponse = rawBody && rawBody.indexOf("<?php") !== -1;

        if (!response.ok) {
          var serverMessage = (data && data.error) || "";
          if (!serverMessage && (isHtmlResponse || isPhpSourceResponse)) {
            serverMessage = t(
              "messages.authPhpServerRequired",
              "Le serveur a renvoyé du HTML au lieu de JSON. Lancez le site avec PHP (XAMPP/WAMP) pour activer la connexion et l'inscription."
            );
          }
          var apiError = new Error(serverMessage || fallbackErrorMessage);
          if (data && data.code) apiError.code = String(data.code);
          throw apiError;
        }

        if (!data) {
          if (isHtmlResponse || isPhpSourceResponse) {
            throw new Error(
              t(
                "messages.authPhpServerRequired",
                "Le serveur a renvoyé du HTML au lieu de JSON. Lancez le site avec PHP (XAMPP/WAMP) pour activer la connexion et l'inscription."
              )
            );
          }
          throw new Error(fallbackErrorMessage);
        }

        return data;
      });
    });
  }

  function verifySumupCheckoutStatus(checkoutRef) {
    if (!checkoutRef) {
      return Promise.resolve({ ok: false, paid: false, status: "missing_reference", error: "Reference de paiement manquante." });
    }
    return fetch("./api/sumup-checkout-status.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkout_ref: checkoutRef }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return data || {};
        });
      })
      .catch(function () {
        return { ok: false, paid: false, status: "network_error", error: "Erreur réseau de vérification paiement." };
      });
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

  function getShippingMode() {
    var mode = String(localStorage.getItem(STORAGE_KEYS.shippingMode) || "").trim();
    if (mode === "pickup_siege" || mode === "local_personal" || mode === "postal") {
      return mode;
    }
    return "";
  }

  function setShippingMode(mode) {
    var normalized = String(mode || "").trim();
    if (normalized === "pickup_siege" || normalized === "local_personal" || normalized === "postal") {
      localStorage.setItem(STORAGE_KEYS.shippingMode, normalized);
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.shippingMode);
  }

  function normalizeCountryCode(countryCode) {
    var code = String(countryCode || "").trim().toUpperCase();
    if (!code) return "MQ";
    return code === "OTHER" ? "OTHER" : code.slice(0, 2);
  }

  function getShippingPostalCountry() {
    return normalizeCountryCode(localStorage.getItem(STORAGE_KEYS.shippingPostalCountry) || "MQ");
  }

  function setShippingPostalCountry(countryCode) {
    localStorage.setItem(STORAGE_KEYS.shippingPostalCountry, normalizeCountryCode(countryCode));
  }

  function normalizePostalZoneKey(zoneKey) {
    var key = String(zoneKey || "").trim();
    if (SHIPPING_POSTAL_ZONE_ALIASES[key]) return SHIPPING_POSTAL_ZONE_ALIASES[key];
    return key;
  }

  function resolvePostalZoneFromCountry(countryCode) {
    var code = normalizeCountryCode(countryCode);
    if (code === "OTHER") return "dom_international";
    return SHIPPING_COUNTRY_ZONE_MAP[code] || "dom_international";
  }

  function getShippingNote() {
    return String(localStorage.getItem(STORAGE_KEYS.shippingNote) || "").trim();
  }

  function setShippingNote(note) {
    var normalized = String(note || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) {
      localStorage.removeItem(STORAGE_KEYS.shippingNote);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.shippingNote, normalized.slice(0, 500));
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
    if (currency !== "EUR" && !FX_STATE.ready) return;
    localStorage.setItem(STORAGE_KEYS.currency, currency);
  }

  function isOfficialFxPayload(data) {
    if (!data || data.ok !== true || data.source !== "ecb" || !data.rates) return false;
    var usd = Number(data.rates.USD);
    var cad = Number(data.rates.CAD);
    return Number.isFinite(usd) && usd > 0 && Number.isFinite(cad) && cad > 0;
  }

  function markFxReady(data) {
    if (!isOfficialFxPayload(data)) return false;
    CURRENCY_CONFIG.USD.rate = Number(data.rates.USD);
    CURRENCY_CONFIG.CAD.rate = Number(data.rates.CAD);
    FX_STATE.ready = true;
    FX_STATE.source = "ecb";
    FX_STATE.rateDate = String(data.rate_date || "");
    FX_STATE.stale = !!data.stale;
    return true;
  }

  function resetFxState() {
    FX_STATE.ready = false;
    FX_STATE.source = "";
    FX_STATE.rateDate = "";
    FX_STATE.stale = false;
    CURRENCY_CONFIG.USD.rate = 1;
    CURRENCY_CONFIG.CAD.rate = 1;
  }

  function canDisplayConvertedPrices() {
    return FX_STATE.ready;
  }

  function getCachedExchangeRates() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.fxRatesCache);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (parsed.source !== "ecb") return null;
      if (!parsed.rates || typeof parsed.rates !== "object") return null;
      if (typeof parsed.cachedAt !== "number") return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function setCachedExchangeRates(data) {
    if (!isOfficialFxPayload(data)) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.fxRatesCache,
        JSON.stringify({
          source: "ecb",
          cachedAt: Date.now(),
          rateDate: String(data.rate_date || ""),
          stale: !!data.stale,
          rates: {
            USD: Number(data.rates.USD),
            CAD: Number(data.rates.CAD),
          },
        })
      );
    } catch (e) {
      // Ignore storage errors.
    }
  }

  function syncCurrencySelectorState() {
    ["currency-select", "drawerCurrency"].forEach(function (id) {
      var select = document.getElementById(id);
      if (!select) return;
      ["USD", "CAD"].forEach(function (code) {
        var option = select.querySelector('option[value="' + code + '"]');
        if (option) option.disabled = !FX_STATE.ready;
      });
      if (!FX_STATE.ready && select.value !== "EUR") {
        select.value = "EUR";
        setSelectedCurrency("EUR");
      }
    });
  }

  function updateFxRateNotice() {
    var host =
      document.querySelector(".header-tools") ||
      document.querySelector(".header-actions-panel .header-tools") ||
      document.querySelector(".mobile-drawer__prefs");
    if (!host) return;

    var notice = document.getElementById("fx-rate-notice");
    if (!FX_STATE.ready || getSelectedCurrency() === "EUR") {
      if (notice) notice.remove();
      return;
    }

    if (!notice) {
      notice = document.createElement("p");
      notice.id = "fx-rate-notice";
      notice.className = "fx-rate-notice";
      notice.setAttribute("role", "note");
      host.appendChild(notice);
    }

    var dateLabel = FX_STATE.rateDate || "";
    if (dateLabel && /^\d{4}-\d{2}-\d{2}$/.test(dateLabel)) {
      var parts = dateLabel.split("-");
      dateLabel = parts[2] + "/" + parts[1] + "/" + parts[0];
    }
    var staleSuffix = FX_STATE.stale
      ? I18N_STATE.language === "en"
        ? " (last available ECB rate)"
        : " (dernier taux BCE disponible)"
      : "";
    notice.textContent =
      I18N_STATE.language === "en"
        ? "Indicative prices converted from EUR using ECB reference rates" +
          (dateLabel ? " of " + dateLabel : "") +
          staleSuffix +
          ". Checkout is charged in euros."
        : "Prix indicatifs convertis depuis l'euro selon les taux de référence de la BCE" +
          (dateLabel ? " du " + dateLabel : "") +
          staleSuffix +
          ". Le paiement est effectué en euros.";
  }

  function refreshExchangeRates() {
    var cacheTtlMs = 12 * 60 * 60 * 1000;
    var cached = getCachedExchangeRates();
    if (cached && Date.now() - cached.cachedAt < cacheTtlMs) {
      if (
        markFxReady({
          ok: true,
          source: "ecb",
          rates: cached.rates,
          rate_date: cached.rateDate || "",
          stale: !!cached.stale,
        })
      ) {
        syncCurrencySelectorState();
        updateFxRateNotice();
        return Promise.resolve({ ok: true, cached: true });
      }
    }

    return fetch("./api/exchange-rates.php", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { httpOk: response.ok, data: data || {} };
        });
      })
      .then(function (result) {
        if (!isOfficialFxPayload(result.data)) {
          throw new Error("exchange_rates_unavailable");
        }
        markFxReady(result.data);
        setCachedExchangeRates(result.data);
        syncCurrencySelectorState();
        updateFxRateNotice();
        return { ok: true, cached: false, stale: !!result.data.stale };
      })
      .catch(function () {
        resetFxState();
        if (getSelectedCurrency() !== "EUR") {
          setSelectedCurrency("EUR");
        }
        syncCurrencySelectorState();
        updateFxRateNotice();
        return { ok: false };
      });
  }

  function getSelectedLanguage() {
    var saved = localStorage.getItem(STORAGE_KEYS.language);
    if (saved !== "en" && saved !== "fr") {
      var cookieMatch = document.cookie.match(/(?:^|;\s*)sucrier_language=(en|fr)(?:;|$)/);
      if (cookieMatch) saved = cookieMatch[1];
    }
    return saved === "en" ? "en" : "fr";
  }

  function setSelectedLanguage(language) {
    var normalized = language === "en" ? "en" : "fr";
    localStorage.setItem(STORAGE_KEYS.language, normalized);
    document.cookie = "sucrier_language=" + normalized + "; path=/; max-age=31536000; SameSite=Lax";
  }

  function getCookieConsentChoice() {
    var choice = localStorage.getItem(STORAGE_KEYS.cookieConsent);
    if (choice === "accepted" || choice === "rejected") return choice;
    return "";
  }

  function setCookieConsentChoice(choice) {
    if (choice !== "accepted" && choice !== "rejected") return;
    localStorage.setItem(STORAGE_KEYS.cookieConsent, choice);
    document.cookie = "sucrier_cookie_consent=" + choice + "; path=/; max-age=31536000; SameSite=Lax";
  }

  function hasOptionalCookieConsent() {
    return getCookieConsentChoice() === "accepted";
  }

  function getSelectedSegment() {
    return localStorage.getItem(STORAGE_KEYS.segment) === "professionnel" ? "professionnel" : "particulier";
  }

  function setSelectedSegment(segment) {
    var normalized = segment === "professionnel" ? "professionnel" : "particulier";
    localStorage.setItem(STORAGE_KEYS.segment, normalized);
  }

  function trackAuthEvent(eventName, payload) {
    if (!hasOptionalCookieConsent()) return;
    var events = safeParse(localStorage.getItem(STORAGE_KEYS.authEvents), []);
    events.push({
      event: eventName,
      segment: getSelectedSegment(),
      timestamp: new Date().toISOString(),
      payload: payload || {},
    });
    localStorage.setItem(STORAGE_KEYS.authEvents, JSON.stringify(events.slice(-100)));
  }

  function setUserSession(sessionData) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(sessionData || {}));
    updateHeaderAuthState();
  }

  function getClientAuthSession() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.session), {});
  }

  function isClientAuthenticated() {
    var s = getClientAuthSession();
    return !!(s && s.authenticated && s.email);
  }

  /** Segment effectif pour les droits : toujours « particulier » si non connecté. */
  function getEffectiveUserSegment() {
    if (!isClientAuthenticated()) return "particulier";
    var s = getClientAuthSession();
    return s.segment === "professionnel" ? "professionnel" : "particulier";
  }

  function accountSegmentFromData(data) {
    return data && data.segment === "professionnel" ? "professionnel" : "particulier";
  }

  function canLoginWithSelectedSegment(accountSegment) {
    var requested = getSelectedSegment();
    var account = accountSegment === "professionnel" ? "professionnel" : "particulier";
    return !(requested === "professionnel" && account !== "professionnel");
  }

  function getLoginSegmentMismatchMessage() {
    return t(
      "messages.accountProLoginDenied",
      "Ce compte est enregistré en tant que particulier. Pour un accès professionnel, créez un compte professionnel ou connectez-vous via le parcours particulier."
    );
  }

  function closeAuthAlertModal() {
    var modal = document.getElementById("sucrier-auth-alert-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function ensureAuthAlertModal() {
    var modal = document.getElementById("sucrier-auth-alert-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "sucrier-auth-alert-modal";
    modal.className = "sucrier-auth-alert-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      '<div class="sucrier-auth-alert-dialog" role="document">' +
      '<button type="button" class="sucrier-auth-alert-close" aria-label="' +
      escapeCatalogHtml(t("ui.authAlertClose", "Fermer")) +
      '"><span aria-hidden="true">×</span></button>' +
      '<div class="sucrier-auth-alert-icon" aria-hidden="true"></div>' +
      '<p class="sucrier-auth-alert-eyebrow" data-auth-alert-eyebrow></p>' +
      '<h2 class="sucrier-auth-alert-title" id="sucrier-auth-alert-title" data-auth-alert-title></h2>' +
      '<p class="sucrier-auth-alert-lead" data-auth-alert-lead></p>' +
      '<p class="sucrier-auth-alert-message" data-auth-alert-message></p>' +
      '<div class="sucrier-auth-alert-actions" data-auth-alert-actions></div>' +
      "</div>";

    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeAuthAlertModal();
    });
    var closeBtn = modal.querySelector(".sucrier-auth-alert-close");
    if (closeBtn) closeBtn.addEventListener("click", closeAuthAlertModal);
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!modal.classList.contains("is-open")) return;
      closeAuthAlertModal();
    });

    return modal;
  }

  function renderAuthAlertActions(modal, config) {
    var actionsRoot = modal.querySelector("[data-auth-alert-actions]");
    if (!actionsRoot) return;
    actionsRoot.innerHTML = "";

    if (config.primaryLabel) {
      var primaryBtn = document.createElement("button");
      primaryBtn.type = "button";
      primaryBtn.className = "btn-primary sucrier-auth-alert-btn-primary";
      primaryBtn.textContent = config.primaryLabel;
      primaryBtn.addEventListener("click", function () {
        if (typeof config.primaryAction === "function") config.primaryAction();
        else closeAuthAlertModal();
      });
      actionsRoot.appendChild(primaryBtn);
    }

    if (config.secondaryHref) {
      var secondaryLink = document.createElement("a");
      secondaryLink.className = "btn-outline sucrier-auth-alert-btn-secondary";
      secondaryLink.href = config.secondaryHref;
      secondaryLink.textContent = config.secondaryLabel || "";
      secondaryLink.addEventListener("click", function () {
        closeAuthAlertModal();
      });
      actionsRoot.appendChild(secondaryLink);
    } else if (config.secondaryLabel) {
      var secondaryBtn = document.createElement("button");
      secondaryBtn.type = "button";
      secondaryBtn.className = "btn-outline sucrier-auth-alert-btn-secondary";
      secondaryBtn.textContent = config.secondaryLabel;
      secondaryBtn.addEventListener("click", function () {
        if (typeof config.secondaryAction === "function") config.secondaryAction();
        else closeAuthAlertModal();
      });
      actionsRoot.appendChild(secondaryBtn);
    }
  }

  function showAuthAlertModal(config) {
    var modal = ensureAuthAlertModal();
    var cfg = config || {};
    modal.classList.toggle("sucrier-auth-alert-modal--warning", cfg.variant !== "info");

    var eyebrow = modal.querySelector("[data-auth-alert-eyebrow]");
    var title = modal.querySelector("[data-auth-alert-title]");
    var lead = modal.querySelector("[data-auth-alert-lead]");
    var message = modal.querySelector("[data-auth-alert-message]");

    if (eyebrow) {
      eyebrow.textContent = cfg.eyebrow || "";
      eyebrow.hidden = !cfg.eyebrow;
    }
    if (title) title.textContent = cfg.title || t("ui.authAlertDefaultTitle", "Information");
    if (lead) {
      lead.textContent = cfg.lead || "";
      lead.hidden = !cfg.lead;
    }
    if (message) {
      message.textContent = cfg.message || "";
      message.hidden = !cfg.message;
    }

    renderAuthAlertActions(modal, cfg);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var focusTarget = modal.querySelector(".sucrier-auth-alert-btn-primary") || modal.querySelector(".sucrier-auth-alert-close");
    if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
  }

  function switchAccountPageToParticulierSegment() {
    setSelectedSegment("particulier");
    trackAuthEvent("segment_selected", { source: "auth_alert_modal", segment: "particulier" });
    var particulierTab = document.querySelector('.account-switch-btn[data-segment-select="particulier"]');
    if (particulierTab) particulierTab.click();
    closeAuthAlertModal();
    var authBox = document.querySelector(".account-auth-box");
    if (authBox) authBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showLoginSegmentMismatchModal() {
    var authFeedback = document.querySelector("[data-auth-feedback]");
    if (authFeedback) authFeedback.textContent = "";

    showAuthAlertModal({
      variant: "warning",
      eyebrow: t("ui.authAlertSegmentEyebrow", "Parcours professionnel"),
      title: t("ui.authAlertSegmentTitle", "Connexion impossible avec ce compte"),
      lead: t(
        "ui.authAlertSegmentLead",
        "Vous avez choisi « Professionnel », mais ce compte Google ou email est enregistré en tant que particulier."
      ),
      message: getLoginSegmentMismatchMessage(),
      primaryLabel: t("ui.authAlertSwitchPersonal", "Compte particulier"),
      primaryAction: switchAccountPageToParticulierSegment,
      secondaryLabel: t("ui.authAlertCreatePro", "Créer un compte professionnel"),
      secondaryHref: "./inscription.html?segment=professionnel",
    });
  }

  function isLoginSegmentMismatchError(error) {
    if (!error) return false;
    if (error.code === "segment_mismatch") return true;
    var msg = String(error.message || "").toLowerCase();
    return msg.indexOf("particulier") !== -1 && msg.indexOf("professionnel") !== -1;
  }

  function persistAuthFromLoginResponse(data) {
    if (!data || !data.ok) return false;
    var seg = accountSegmentFromData(data);
    if (!canLoginWithSelectedSegment(seg)) {
      return false;
    }
    setUserSession({
      email: data.email || "",
      segment: seg,
      authenticated: true,
    });
    setSelectedSegment(seg);
    return true;
  }

  function clearClientAuthSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
    updateHeaderAuthState();
  }

  function refreshClientAuthSession() {
    return fetch("./api/auth-session.php", { credentials: "same-origin" })
      .then(function (response) {
        return response.text();
      })
      .then(function (rawBody) {
        var data = null;
        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch (e) {
          data = null;
        }
        var isHtml = rawBody && String(rawBody).trim().startsWith("<");
        if (!data || isHtml) {
          return null;
        }
        if (data.authenticated && data.user) {
          var seg = data.user.segment === "professionnel" ? "professionnel" : "particulier";
          setUserSession({
            email: data.user.email || "",
            segment: seg,
            fullName: data.user.fullName || "",
            authenticated: true,
          });
          setSelectedSegment(seg);
        } else if (data && data.authenticated === false) {
          clearClientAuthSession();
        }
        updateHeaderAuthState();
        return data;
      })
      .catch(function () {
        updateHeaderAuthState();
        return null;
      });
  }

  function getOrderHistory() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.orderHistory), []);
  }

  function appendVerifiedOrderToHistory(cart, checkoutRef) {
    if (!cart || cart.length === 0) return;
    var totals = computeCartTotals(
      cart,
      getPromoCode(),
      getShippingMode(),
      resolvePostalZoneFromCountry(getShippingPostalCountry())
    );
    var rec = {
      id: "local-" + String(Date.now()),
      date: new Date().toISOString(),
      checkoutRef: checkoutRef || "",
      items: cart.map(function (i) {
        return { id: i.id, title: i.title, qty: i.qty, priceEur: i.price };
      }),
      totalEur: totals.total,
    };
    var list = getOrderHistory();
    list.unshift(rec);
    localStorage.setItem(STORAGE_KEYS.orderHistory, JSON.stringify(list.slice(0, 40)));
  }

  function getShippingAddresses() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.shippingAddresses), []);
  }

  function saveShippingAddresses(list) {
    localStorage.setItem(STORAGE_KEYS.shippingAddresses, JSON.stringify(Array.isArray(list) ? list.slice(0, 12) : []));
  }

  function normalizeWhitespace(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeAddressPayload(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    return {
      label: normalizeWhitespace(source.label),
      line1: normalizeWhitespace(source.line1),
      line2: normalizeWhitespace(source.line2),
      postal: normalizeWhitespace(source.postal),
      city: normalizeWhitespace(source.city),
      country: normalizeCountryCode(source.country || "MQ"),
    };
  }

  function normalizeCustomerPayload(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    return {
      firstName: normalizeWhitespace(source.firstName),
      lastName: normalizeWhitespace(source.lastName),
      email: normalizeEmail(source.email),
      phone: normalizeWhitespace(source.phone),
    };
  }

  function validateShippingAddress(address) {
    var a = normalizeAddressPayload(address);
    if (!a.label) return t("messages.deliveryLabelRequired", "Renseignez un libellé pour cette adresse.");
    if (!a.line1) return t("messages.deliveryAddressRequired", "Renseignez l'adresse de livraison.");
    var needsFrenchPostalFormat = a.country === "MQ" || a.country === "GP" || a.country === "GF" || a.country === "RE" || a.country === "FR";
    if (needsFrenchPostalFormat) {
      if (!/^\d{5}$/.test(a.postal)) return t("messages.deliveryPostalInvalid", "Le code postal doit contenir 5 chiffres.");
    } else if (!a.postal) {
      return t("messages.deliveryPostalRequired", "Renseignez le code postal.");
    }
    if (!a.city) return t("messages.deliveryCityRequired", "Renseignez la ville.");
    if (!a.country) return t("messages.deliveryCountryRequired", "Renseignez le pays de destination.");
    return "";
  }

  function validateCheckoutCustomer(customer) {
    var c = normalizeCustomerPayload(customer);
    if (!c.lastName) return t("messages.deliveryLastNameRequired", "Renseignez votre nom.");
    if (!c.firstName) return t("messages.deliveryFirstNameRequired", "Renseignez votre prénom.");
    if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
      return t("messages.deliveryEmailInvalid", "Renseignez un email valide.");
    }
    var phoneDigits = c.phone.replace(/[^\d+]/g, "");
    if (phoneDigits.length < 8) return t("messages.deliveryPhoneInvalid", "Renseignez un numéro de téléphone valide.");
    return "";
  }

  function dismissCheckoutHintPopover() {
    document.querySelectorAll(".checkout-hint-popover").forEach(function (node) {
      if (node.parentNode) node.parentNode.removeChild(node);
    });
  }

  /**
   * @param {object} ctx
   * @returns {Array<{message:string, element:HTMLElement|null}>}
   */
  function collectCheckoutValidationIssues(ctx) {
    var issues = [];
    var elements = (ctx && ctx.elements) || {};

    function add(message, element) {
      issues.push({ message: message, element: element || null });
    }

    var shippingMode = ctx ? ctx.shippingMode : "";
    var shippingNote = ctx ? ctx.shippingNote : "";
    var isAuthed = !!(ctx && ctx.isAuthed);
    var identityChoice = ctx ? String(ctx.identityChoice || "") : "";
    var savedChoice = ctx ? String(ctx.savedChoice || "") : "";
    var useManualAddress = !!(ctx && ctx.useManualAddress);
    var postalZone = ctx ? ctx.postalZone : "";

    if (!shippingMode) {
      add(t("ui.deliveryModeRequired", "Choisissez un mode de livraison avant le paiement."), elements.deliveryMode);
      return issues;
    }

    if (shippingMode === "postal" && !postalZone) {
      add(t("messages.postalDestinationRequired", "Choisissez le pays de destination postale."), elements.postalCountry);
    }

    if (!isAuthed && shippingMode !== "pickup_siege" && !identityChoice) {
      add(
        t("messages.checkoutIdentityChoiceRequired", "Choisissez si vous continuez avec ou sans compte."),
        elements.identityChoice
      );
    }

    if (!isAuthed && identityChoice === "create_account") {
      add(
        t("messages.checkoutCreateAccountFirst", "Créez votre compte puis ajoutez votre adresse dans votre espace."),
        elements.identityChoice
      );
    }

    if (isAuthed && shippingMode !== "pickup_siege" && !useManualAddress && savedChoice === "") {
      add(
        t("messages.checkoutSavedAddressRequired", "Sélectionnez une adresse enregistrée ou saisissez une autre adresse."),
        elements.savedAddress
      );
    }

    if ((shippingMode === "local_personal" || shippingMode === "pickup_siege") && !shippingNote) {
      add(
        shippingMode === "pickup_siege"
          ? t("messages.pickupMessageRequired", "Le message d'organisation du retrait est obligatoire.")
          : t("ui.deliveryNoteRequired", "Ajoutez vos précisions pour la remise ou la livraison locale."),
        elements.deliveryNote
      );
    }

    if (shippingMode !== "pickup_siege" && (!isAuthed || useManualAddress)) {
      var customerError = validateCheckoutCustomer(ctx.customerPayload || {});
      if (customerError) {
        add(customerError, elements.contactRoot);
      }
    }

    if (shippingMode !== "pickup_siege") {
      var addressError = validateShippingAddress(ctx.addressPayload || {});
      if (addressError) {
        add(addressError, elements.addressRoot);
      }
    }

    return issues;
  }

  function focusCheckoutValidationIssue(issue) {
    if (!issue || !issue.element) return;
    var target = issue.element;
    if (target.hidden) {
      target = target.querySelector("input, select, textarea") || target;
    }
    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (typeof target.focus === "function") {
      try {
        target.focus({ preventScroll: true });
      } catch (e) {
        target.focus();
      }
    }
  }

  function showCheckoutValidationHint(issues, deliveryFeedbackNode, checkoutButtonNode) {
    if (!issues || !issues.length) return;
    dismissCheckoutHintPopover();

    if (deliveryFeedbackNode) {
      deliveryFeedbackNode.textContent = issues[0].message;
      deliveryFeedbackNode.classList.add("is-checkout-error");
    }

    var pop = document.createElement("div");
    pop.className = "checkout-hint-popover";
    pop.setAttribute("role", "alertdialog");
    pop.setAttribute("aria-modal", "false");
    pop.setAttribute("aria-labelledby", "checkout-hint-title");

    var title = document.createElement("p");
    title.id = "checkout-hint-title";
    title.className = "checkout-hint-popover__title";
    title.textContent = t(
      "ui.checkoutHintTitle",
      issues.length > 1 ? "Il manque quelques informations" : "Impossible de payer pour l'instant"
    );

    var list = document.createElement("ul");
    list.className = "checkout-hint-popover__list";
    issues.forEach(function (issue) {
      var li = document.createElement("li");
      li.textContent = issue.message;
      list.appendChild(li);
    });

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "checkout-hint-popover__close";
    closeBtn.setAttribute("aria-label", t("ui.close", "Fermer"));
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", dismissCheckoutHintPopover);

    pop.appendChild(closeBtn);
    pop.appendChild(title);
    pop.appendChild(list);

    var anchor = checkoutButtonNode ? checkoutButtonNode.parentElement : null;
    if (anchor) {
      anchor.insertBefore(pop, checkoutButtonNode);
    } else {
      document.body.appendChild(pop);
    }

    requestAnimationFrame(function () {
      pop.classList.add("is-visible");
    });

    focusCheckoutValidationIssue(issues[0]);

    if (typeof window.showToast === "function") {
      window.showToast(
        t("ui.checkoutHintToast", "Complétez les champs indiqués pour continuer."),
        { type: "info", duration: 4200, replace: true }
      );
    }
  }

  function makeAddressSummaryLabel(address) {
    var a = normalizeAddressPayload(address);
    var head = a.label || t("ui.accountAddressDefaultLabel", "Adresse");
    var tail = [a.line1, a.postal, a.city, a.country].filter(Boolean).join(", ");
    return tail ? head + " — " + tail : head;
  }

  function attachAddressAutocomplete(inputEl, datalistEl, onAddressResolved) {
    if (!inputEl || !datalistEl || inputEl.dataset.addressAutocompleteBound === "1") return;
    inputEl.dataset.addressAutocompleteBound = "1";
    var suggestionMap = {};
    var timer = 0;

    function clearSuggestions() {
      datalistEl.innerHTML = "";
      suggestionMap = {};
    }

    function renderSuggestions(items) {
      suggestionMap = {};
      datalistEl.innerHTML = "";
      items.forEach(function (item) {
        if (!item || !item.label) return;
        suggestionMap[item.label] = item;
        var option = document.createElement("option");
        option.value = item.label;
        datalistEl.appendChild(option);
      });
    }

    inputEl.addEventListener("input", function () {
      var query = normalizeWhitespace(inputEl.value);
      if (timer) clearTimeout(timer);
      if (query.length < 4) {
        clearSuggestions();
        return;
      }
      timer = setTimeout(function () {
        fetch("https://api-adresse.data.gouv.fr/search/?q=" + encodeURIComponent(query) + "&limit=6&autocomplete=1")
          .then(function (response) {
            if (!response.ok) return null;
            return response.json();
          })
          .then(function (data) {
            if (!data || !Array.isArray(data.features)) return;
            var rows = data.features
              .map(function (feature) {
                var props = feature && feature.properties ? feature.properties : {};
                return {
                  label: normalizeWhitespace(props.label || ""),
                  line1: normalizeWhitespace((props.housenumber ? props.housenumber + " " : "") + (props.street || props.name || "")),
                  postal: normalizeWhitespace(props.postcode || ""),
                  city: normalizeWhitespace(props.city || props.name || ""),
                };
              })
              .filter(function (item) {
                return item.label && item.line1 && item.city;
              });
            renderSuggestions(rows);
          })
          .catch(function () {
            clearSuggestions();
          });
      }, 260);
    });

    inputEl.addEventListener("change", function () {
      var picked = suggestionMap[normalizeWhitespace(inputEl.value)];
      if (!picked || typeof onAddressResolved !== "function") return;
      onAddressResolved(picked);
    });
  }

  function getProResourceDownloads() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.proResourceDownloads), []);
  }

  function logProResourceDownload(bookId, label) {
    var list = getProResourceDownloads();
    list.unshift({
      date: new Date().toISOString(),
      bookId: bookId || "",
      label: label || "Ressource",
    });
    localStorage.setItem(STORAGE_KEYS.proResourceDownloads, JSON.stringify(list.slice(0, 60)));
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function getAccounts() {
    var accounts = safeParse(localStorage.getItem(STORAGE_KEYS.accounts), []);
    return Array.isArray(accounts) ? accounts : [];
  }

  function setAccounts(accounts) {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(Array.isArray(accounts) ? accounts : []));
  }

  function findAccountByEmail(email) {
    var normalized = normalizeEmail(email);
    return getAccounts().find(function (account) {
      return normalizeEmail(account && account.email) === normalized;
    });
  }

  function upsertAccount(account) {
    var normalized = normalizeEmail(account && account.email);
    if (!normalized) return null;
    var accounts = getAccounts();
    var index = accounts.findIndex(function (item) {
      return normalizeEmail(item && item.email) === normalized;
    });
    if (index >= 0) {
      accounts[index] = Object.assign({}, accounts[index], account, { email: normalized });
    } else {
      accounts.push(Object.assign({}, account, { email: normalized }));
    }
    setAccounts(accounts);
    return findAccountByEmail(normalized);
  }

  function sha256Sync(input) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = "length";
    var i;
    var j;
    var result = "";
    var words = [];
    var asciiBitLength = input[lengthProperty] * 8;

    var hash = (sha256Sync.h = sha256Sync.h || []);
    var k = (sha256Sync.k = sha256Sync.k || []);
    var primeCounter = k[lengthProperty];

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate += 1) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    input += "\x80";
    while ((input[lengthProperty] % 64) - 56) input += "\x00";
    for (i = 0; i < input[lengthProperty]; i += 1) {
      j = input.charCodeAt(i);
      if (j >> 8) return "";
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty]; ) {
      var w = words.slice(j, (j += 16));
      var oldHash = hash.slice(0);
      for (i = 0; i < 64; i += 1) {
        var w15 = w[i - 15];
        var w2 = w[i - 2];
        var a = hash[0];
        var e = hash[4];
        var temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }

      for (i = 0; i < 8; i += 1) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i += 1) {
      for (j = 3; j + 1; j -= 1) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? 0 : "") + b.toString(16);
      }
    }
    return result;
  }

  function convertFromEUR(valueInEUR, currency) {
    var cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR;
    return valueInEUR * cfg.rate;
  }

  function formatPrice(valueInEUR) {
    var currency = getSelectedCurrency();
    if (currency !== "EUR" && !canDisplayConvertedPrices()) {
      currency = "EUR";
    }
    var converted = convertFromEUR(valueInEUR, currency);
    var locale = I18N_STATE.language === "en" ? "en-US" : "fr-FR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: (CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR).code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }

  function getDisplayPriceNodes() {
    return document.querySelectorAll(
      ".book-card-prix, .catalogue-meta > span[data-price-eur], .cart-item-price, .related-book-price, .book-detail-price"
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
    I18N_STATE.language = language === "en" ? "en" : "fr";
    applyPageTranslations();
  }

  function bindPreferenceControls() {
    var currencySelect = document.getElementById("currency-select");
    var languageSelect = document.getElementById("language-select");

    if (currencySelect) {
      syncCurrencySelectorState();
      currencySelect.value = getSelectedCurrency();
      currencySelect.addEventListener("change", function () {
        setSelectedCurrency(currencySelect.value);
        renderCartPage();
        renderDisplayPrices();
        updateFxRateNotice();
      });
    }

    if (languageSelect) {
      languageSelect.value = getSelectedLanguage();
      languageSelect.addEventListener("change", function () {
        loadI18nDictionary(languageSelect.value).then(function () {
          switchLang(languageSelect.value);
          if (typeof window.__sucrierRebindCatalogueFilters === "function") {
            window.__sucrierRebindCatalogueFilters();
          }
        });
      });
    }
  }

  function updateHeaderBadges() {
    var cart = getCart();
    var favorites = getFavorites();

    normalizeHeaderFavoriteLinks();
    updateHeaderAuthState();

    document.querySelectorAll(".panier-badge").forEach(function (badge) {
      badge.textContent = String(cart.length);
    });

    document.querySelectorAll("[data-header-favorites-count]").forEach(function (node) {
      node.textContent = String(favorites.length);
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

  function refreshWishlistButtonStates() {
    var favorites = getFavorites();
    document.querySelectorAll(".wishlist-btn[data-product-id]").forEach(function (button) {
      var productId = button.getAttribute("data-product-id");
      var active = favorites.includes(productId);
      button.classList.toggle("is-favorite", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function bindWishlistButtons() {
    if (!document.documentElement.dataset.wishlistDelegationBound) {
      document.documentElement.dataset.wishlistDelegationBound = "1";
      document.addEventListener("click", function (event) {
        var button = event.target.closest(".wishlist-btn[data-product-id]");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        var productId = button.getAttribute("data-product-id");
        if (!productId) return;
        toggleFavorite(productId, button);
      });
    }
    refreshWishlistButtonStates();
  }

  function getBookDetailAddQty() {
    var input = document.getElementById("book-detail-qty");
    if (!input) return 1;
    var n = parseInt(String(input.value || "1"), 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(99, n);
  }

  function addToCartFromButton(button) {
    var card = button.closest("[data-product-id]");
    var productId =
      (card && card.getAttribute("data-product-id")) || button.getAttribute("data-product-id");
    if (!productId) return;
    if (!canPurchaseBook(productId)) {
      var blockedTitleEl = card
        ? card.querySelector(".book-card-titre, h3, h2, h4")
        : document.getElementById("book-detail-title");
      var blockedTitle = blockedTitleEl ? blockedTitleEl.textContent.trim() : "";
      showOutOfStockToast(blockedTitle);
      return;
    }
    var titleEl = card
      ? card.querySelector(".book-card-titre, h3, h2, h4")
      : document.getElementById("book-detail-title");
    var priceEl = card
      ? card.querySelector(".book-card-prix, .catalogue-meta span[data-price-eur], .related-book-price")
      : document.getElementById("book-detail-price");
    var imageEl = card ? card.querySelector("img") : document.getElementById("book-detail-main-image");
    var priceInEUR =
      priceEl && priceEl.dataset.priceEur
        ? parseFloat(priceEl.dataset.priceEur)
        : parsePrice(priceEl ? priceEl.textContent : "0");
    var addQty = button.id === "book-detail-add-to-cart" ? getBookDetailAddQty() : 1;
    var item = {
      id: productId,
      title: titleEl ? titleEl.textContent.trim() : productId,
      price: Number.isFinite(priceInEUR) ? priceInEUR : 0,
      image: imageEl ? imageEl.getAttribute("src") : "",
      qty: addQty,
    };

    var cart = getCart();
    var existing = cart.find(function (cartItem) {
      return cartItem.id === item.id;
    });
    if (existing) {
      existing.qty += addQty;
    } else {
      cart.push(item);
    }
    setCart(cart);
    updateHeaderBadges();
    button.classList.remove("is-added-feedback");
    void button.offsetWidth;
    button.classList.add("is-added-feedback");
    setTimeout(function () {
      button.classList.remove("is-added-feedback");
    }, 550);
    showCartAddedToast(item.title, addQty);
    if (typeof window.sucrierTrack === "function") {
      window.sucrierTrack("add_to_cart", { product_id: productId, qty: addQty });
    }
  }

  function addBookToCartById(productId) {
    if (!canPurchaseBook(productId)) {
      var blockedBook = getLocalizedBook(productId);
      showOutOfStockToast(blockedBook ? blockedBook.title : "");
      return;
    }
    var book = getLocalizedBook(productId);
    if (!book) return;
    var cart = getCart();
    var existing = cart.find(function (item) {
      return item.id === productId;
    });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: productId,
        title: book.title,
        price: Number(book.price) || 0,
        image: book.cover,
        qty: 1,
      });
    }
    setCart(cart);
    updateHeaderBadges();
  }

  function bindAddToCartButtons() {
    if (document.documentElement.dataset.cartButtonsDelegationBound) return;
    document.documentElement.dataset.cartButtonsDelegationBound = "1";

    document.addEventListener("click", function (event) {
      var addBtn = event.target.closest(".add-to-cart-btn");
      if (!addBtn || addBtn.closest("[data-fav-action]")) return;
      event.preventDefault();
      event.stopPropagation();
      addToCartFromButton(addBtn);
    });
  }

  function showCartAddedToast(bookTitle, qty) {
    var message = bookTitle
      ? t("ui.addedToCartNamed", "« {title} » ajouté au panier ✓").replace("{title}", bookTitle) +
        (qty > 1 ? " (×" + qty + ")" : "")
      : t("ui.addedToCartFeedback", "Ajouté au panier ✓");

    document.querySelectorAll(".cart-feedback-toast").forEach(function (el) {
      el.parentNode.removeChild(el);
    });

    if (typeof window.showToast === "function") {
      window.showToast(message, {
        type: "success",
        actionLabel: t("ui.viewCart", "Voir le panier"),
        actionHref: "./panier.html",
        duration: 3800,
        replace: true,
      });
    }
  }

  function inferAgeGroup(book) {
    if (book && typeof book.ageGroup === "string" && book.ageGroup.trim() !== "") {
      return book.ageGroup.trim();
    }
    var collection = (book.collection || "").toLowerCase();
    var title = (book.title || "").toLowerCase();
    if (collection.includes("bébé") || collection.includes("bebe")) return "1-3";
    if (collection.includes("bebe") || title.includes("bébé") || title.includes("bebe")) return "3-5";
    if (collection.includes("bulles")) return "9+";
    if (collection.includes("cahiers") || collection.includes("comptines") || collection.includes("abécédaire")) return "6-8";
    if (collection.includes("papeterie") || collection.includes("produits")) return "6-8";
    if (collection.includes("plumes aventureuses")) return "6-8";
    return "6-8";
  }

  /** Thèmes catalogue par livre (plusieurs valeurs possibles pour les filtres). */
  var BOOK_THEME_OVERRIDES = {
    "nikou-patron": ["apprentissage", "aventure", "famille"],
    "le-cahier-de-nikou": ["apprentissage"],
    "coloriages-nikou-v1": ["apprentissage"],
    "bebe-nikou-dit-non": ["famille"],
    "bebe-nikou-a-faim": ["famille"],
    "circuit-ferme": ["famille", "caraibe"],
  };

  function inferTheme(book) {
    var collection = (book.collection || "").toLowerCase();
    var title = (book.title || "").toLowerCase();
    var description = (book.description || "").toLowerCase();
    if (title.includes("tice") && (title.includes("métice") || title.includes("metice"))) return "famille";
    if (title.includes("comptine")) return "apprentissage";
    if (collection.includes("nikou") && !collection.includes("bébé") && !collection.includes("bebe")) return "apprentissage";
    if (description.includes("famille") || description.includes("émotion") || description.includes("emotion")) return "famille";
    if (collection.includes("cahiers") || collection.includes("abécédaire") || collection.includes("abécédaire") || collection.includes("comptines")) return "apprentissage";
    return "caraibe";
  }

  function getBookThemes(book, productId) {
    if (productId && BOOK_THEME_OVERRIDES[productId]) {
      return BOOK_THEME_OVERRIDES[productId].slice();
    }
    if (book && Array.isArray(book.themes) && book.themes.length > 0) {
      return book.themes.slice();
    }
    return [inferTheme(book)];
  }

  function getCatalogFilterGroups() {
    var rows = SITE_CONTENT && SITE_CONTENT.catalogue_filter_groups;
    if (!Array.isArray(rows) || !rows.length) return CATALOG_FILTER_GROUPS_DEFAULT.slice();
    return rows
      .map(function (row) {
        if (!row || typeof row !== "object") return null;
        var id = String(row.id || "").trim();
        if (!id) return null;
        return {
          id: id,
          label_fr: String(row.label_fr || row.label || id),
          label_en: String(row.label_en || row.label_fr || row.label || id),
          parent: String(row.parent || "").trim(),
          is_group: row.is_group === true || row.is_group === "1",
        };
      })
      .filter(Boolean);
  }

  function getCatalogFilterLabel(group) {
    if (!group) return "";
    return I18N_STATE.language === "en"
      ? group.label_en || group.label_fr || group.id
      : group.label_fr || group.label_en || group.id;
  }

  function inferCatalogCategory(book, productId) {
    if (productId && CATALOG_CATEGORY_DEFAULTS[productId]) {
      return CATALOG_CATEGORY_DEFAULTS[productId];
    }
    var title = (book.title || "").toLowerCase();
    var collection = (book.collection || "").toLowerCase();
    if (collection.includes("bebe nikou") || collection.includes("bébé nikou")) return "bebe-nikou";
    if (title.includes("poster") || title.includes("affiche")) return "posters";
    if (title.includes("cahier") || title.includes("coloriage")) return "cahiers";
    if (title.includes("bon") && title.includes("point")) return "bons-points";
    if (title.includes("sous-main") || title.includes("sous main")) return "sous-mains";
    if (
      title.includes("sticker") ||
      title.includes("planche") ||
      title.includes("peluche") ||
      title.includes("clé usb") ||
      title.includes("cle usb") ||
      title.includes("jeu")
    ) {
      return "autres";
    }
    return "albums";
  }

  function getBookCatalogCategory(book, productId) {
    if (book && book.catalogCategory) return String(book.catalogCategory).trim();
    if (book && book.catalog_category) return String(book.catalog_category).trim();
    return inferCatalogCategory(book, productId);
  }

  /** Albums et cartonnés : afficher niveau / durée de lecture. Autres rayons = produits dérivés. */
  function isStoryBookProduct(book, productId) {
    var cat = getBookCatalogCategory(book, productId);
    return cat === "albums" || cat === "bebe-nikou";
  }

  /** Extrait un nombre de pages fiable depuis la fiche technique (ex. « 44 pages »). */
  function parseStoryBookPageCount(pagesRaw) {
    var text = String(pagesRaw || "").trim();
    if (!text) return null;
    var match = text.match(/(\d{1,3})\s*page/i);
    if (!match) return null;
    var count = parseInt(match[1], 10);
    if (!count || count < 4 || count > 200) return null;
    return count;
  }

  /**
   * Durée indicative lecture accompagnée, dérivée du nombre de pages.
   * Retourne une chaîne vide si l’info n’est pas assez fiable (pas de chiffre exploitable).
   */
  function getEstimatedReadingTimeLabel(book) {
    if (!book) return "";
    var manual =
      (book.readingDuration && String(book.readingDuration).trim()) ||
      (book.reading_duration && String(book.reading_duration).trim()) ||
      "";
    if (manual) return manual;

    var pageCount = parseStoryBookPageCount((book.specs && book.specs.pages) || "");
    if (!pageCount) return "";

    var minMinutes = Math.max(5, Math.round(pageCount * 0.22));
    var maxMinutes = Math.max(minMinutes + 4, Math.round(pageCount * 0.38));
    return t("ui.readingTimeRange", "Environ {min}–{max} min")
      .replace("{min}", String(minMinutes))
      .replace("{max}", String(maxMinutes));
  }

  function renderCatalogueFiltersPanel() {
    var mount = document.querySelector("[data-catalogue-category-filters]");
    if (!mount) return;

    var groups = getCatalogFilterGroups();
    var topLevel = groups.filter(function (g) {
      return !g.parent;
    });
    var childrenByParent = {};
    groups.forEach(function (g) {
      if (!g.parent) return;
      if (!childrenByParent[g.parent]) childrenByParent[g.parent] = [];
      childrenByParent[g.parent].push(g);
    });

    var html = '<div class="filter-group filter-group--rayons"><h3>';
    html +=
      escapeCatalogHtml(
        t("ui.catalogueFilterRayons", I18N_STATE.language === "en" ? "Browse" : "Rayons")
      ) + "</h3>";

    topLevel.forEach(function (group) {
      var children = childrenByParent[group.id] || [];
      if (group.is_group && children.length) {
        html +=
          '<details class="filter-subgroup-details" open><summary class="filter-subgroup-summary">' +
          escapeCatalogHtml(getCatalogFilterLabel(group)) +
          '</summary><div class="filter-subgroup">';
        children.forEach(function (child) {
          html +=
            '<label><input type="checkbox" name="filter-category" value="' +
            escapeCatalogHtml(child.id) +
            '"> ' +
            escapeCatalogHtml(getCatalogFilterLabel(child)) +
            "</label>";
        });
        html += "</div></details>";
        return;
      }
      if (group.is_group) return;
      html +=
        '<label><input type="checkbox" name="filter-category" value="' +
        escapeCatalogHtml(group.id) +
        '"> ' +
        escapeCatalogHtml(getCatalogFilterLabel(group)) +
        "</label>";
    });

    html += "</div>";
    mount.innerHTML = html;
  }

  function getBookLanguages(book) {
    if (book && book.hideLanguages) {
      return "";
    }
    if (book && Array.isArray(book.languages) && book.languages.length > 0) {
      return book.languages.join(" · ");
    }
    var collection = (book.collection || "").toLowerCase();
    var title = (book.title || "").toLowerCase();
    if (
      collection.includes("histoires du sucrier") ||
      collection.includes("plumes") ||
      collection.includes("comptines") ||
      title.includes("comptine")
    ) {
      return I18N_STATE.language === "en"
        ? "French · Martinican Creole · Spanish · English"
        : "Français · Créole martiniquais · Espagnol · Anglais";
    }
    if (collection.includes("nikou")) {
      return I18N_STATE.language === "en" ? "French · Creole" : "Français · Créole";
    }
    return I18N_STATE.language === "en" ? "French" : "Français";
  }

  function getBookThemeLabel(book, productId) {
    var themes = getBookThemes(book, productId);
    if (I18N_STATE.language === "en") {
      var mapEn = {
        aventure: "Adventure",
        famille: "Family & emotions",
        apprentissage: "Learning",
        caraibe: "Caribbean culture",
      };
      return themes
        .map(function (theme) {
          return mapEn[theme] || "Children's books";
        })
        .join(" · ");
    }
    var mapFr = {
      aventure: "Aventure",
      famille: "Famille & émotions",
      apprentissage: "Apprentissages",
      caraibe: "Culture caraïbe",
    };
    return themes
      .map(function (theme) {
        return mapFr[theme] || "Jeunesse";
      })
      .join(" · ");
  }

  function getBookAgeLabel(book) {
    var age = inferAgeGroup(book);
    if (I18N_STATE.language === "en") {
      var mapEn = {
        "1-3": "Ages 1 to 3",
        "2-6": "Ages 2 to 6",
        "3-5": "Ages 3 to 5",
        "3-6": "Ages 3 to 6",
        "6-8": "Ages 6 to 8",
        "9+": "Ages 9+",
      };
      return mapEn[age] || "Ages 6 to 8";
    }
    var mapFr = {
      "1-3": "1 à 3 ans",
      "2-6": "2 à 6 ans",
      "3-5": "3 à 5 ans",
      "3-6": "3 à 6 ans",
      "6-8": "6 à 8 ans",
      "9+": "9 ans et +",
    };
    return mapFr[age] || "6 à 8 ans";
  }

  function escapeCatalogHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Espaces insécables / césures : évite « tome » et le chiffre séparés, plages d'âge, etc. */
  function formatCatalogCardTitle(raw) {
    var s = escapeCatalogHtml(raw);
    s = s.replace(/\btome\s+(\d+)/gi, "tome\u00a0$1");
    s = s.replace(/\bvolume\s+(\d+)/gi, "volume\u00a0$1");
    s = s.replace(/\bvol\.\s*(\d+)/gi, "vol.\u00a0$1");
    s = s.replace(/(\d+)\s*[–—\-]\s*(\d+)\s+ans\b/gi, "$1\u2011$2\u00a0ans");
    s = s.replace(/\b(\d+)\s+ans\b/gi, "$1\u00a0ans");
    return s;
  }

  function coverImagePathKey(path) {
    if (!path) return "";
    try {
      return new URL(path, window.location.href).pathname.replace(/^.*\//, "");
    } catch (e) {
      return String(path).replace(/^.*\//, "");
    }
  }

  /** Album tout-carton 15×15 cm (couverture carrée : fiche livre en cadre 1:1). */
  function bookIsSquareBoard(book) {
    var fmt = (book && book.specs && book.specs.format) || "";
    return /15\s*[×x]\s*15/i.test(fmt);
  }

  /** Planche A4 portrait (stickers, feuilles) : ratio ISO, pas le cadre album 3/4. */
  function bookIsA4PortraitSheet(book) {
    if (!book || !book.specs) return false;
    if (book.catalogueLandscapeMedia || book.catalogueSquareNudge || book.catalogueProductPhoto) {
      return false;
    }
    var fmt = String(book.specs.format || "").trim();
    var pages = String(book.specs.pages || "").trim();
    if (!/\bA4\b/i.test(fmt)) return false;
    if (/planche/i.test(pages)) return true;
    return /^A4$/i.test(fmt);
  }

  /** Cadre 3/4 rempli (object-fit: cover) — réservé aux visuels très paysage, jamais aux carrés. */
  function bookUsesCataloguePortraitCoverFit(book) {
    return !!(book && book.coverFillsPortraitSlot);
  }

  function syncCoverPortraitSlotClass(img, book, activeSrc) {
    if (!img || !book) return;
    var coverPath = book.cover;
    var coverMatch =
      !!coverPath && !!activeSrc && coverImagePathKey(activeSrc) === coverImagePathKey(coverPath);
    var fill = !!(book.coverFillsPortraitSlot && coverMatch);
    img.classList.toggle("cover-fills-portrait-slot", fill);
    img.classList.toggle(
      "cover-frame-nudge-left",
      coverMatch && book.catalogueCoverPosition === "left"
    );
    img.classList.toggle(
      "cover-frame-nudge-top",
      coverMatch && book.catalogueCoverPosition === "top"
    );
  }

  function syncCatalogueDetailMainFrameClass(frame, book, activeSrc) {
    if (!frame || !book) return;
    var coverPath = book.cover;
    var on =
      bookUsesCataloguePortraitCoverFit(book) &&
      !!coverPath &&
      !!activeSrc &&
      coverImagePathKey(activeSrc) === coverImagePathKey(coverPath);
    frame.classList.toggle("catalogue-detail-main-frame--fill-slot", on);
    frame.classList.toggle("catalogue-detail-main-frame--a4-portrait", bookIsA4PortraitSheet(book));
  }

  function syncBookDetailMainFrameClass(frame, book) {
    if (!frame || !book) return;
    frame.classList.toggle("book-detail-main-frame--square-board", bookIsSquareBoard(book));
    frame.classList.toggle("book-detail-main-frame--a4-portrait", bookIsA4PortraitSheet(book));
  }

  function markCataloguePageReady() {
    var layout = document.querySelector(".catalogue-layout");
    if (layout) layout.classList.add("catalogue-layout--ready");
    var grid = document.querySelector(".catalogue-grid");
    if (grid) grid.removeAttribute("aria-busy");
  }

  function renderCatalogueGrid() {
    var grid = document.querySelector(".catalogue-grid");
    if (!grid) return;

    var skeleton = grid.querySelector(".catalogue-skeleton-grid");
    if (skeleton) skeleton.remove();

    var html = sortCatalogProductIds(getCatalogProductIds())
      .map(function (id) {
        var book = getLocalizedBook(id);
        var authors = book.authors
          .map(function (author) {
            return escapeCatalogHtml(author.name);
          })
          .join(" · ");
        var previewImages = (book.gallery && book.gallery.length ? book.gallery : [book.cover]).join(",");
        var distClass = book.distributionEdition ? " catalogue-card--distributed" : "";
        var squareNudgeMedia =
          bookIsSquareBoard(book) || book.catalogueSquareNudge ? " catalogue-card-media--square-nudge" : "";
        var landscapeMedia = book.catalogueLandscapeMedia ? " catalogue-card-media--landscape" : "";
        var productPhotoMedia = book.catalogueProductPhoto ? " catalogue-card-media--product-photo" : "";
        var a4PortraitMedia = bookIsA4PortraitSheet(book) ? " catalogue-card-media--a4-portrait" : "";
        var distBadge =
          book.distributionEdition
            ? '<p class="catalogue-card-distribution-badge">' +
              escapeCatalogHtml(t("ui.catalogueDistributionBadge", "Diffusion Belbalan")) +
              "</p>"
            : "";
        var soonBadge = book.comingSoon
          ? '<p class="catalogue-card-soon-badge">' +
            escapeCatalogHtml(t("ui.catalogueComingSoon", "À paraître")) +
            "</p>"
          : "";
        var outOfStock = isBookOutOfStock(id);
        var stockBadge = outOfStock
          ? '<p class="catalogue-card-stock-badge catalogue-card-stock-badge--out">' +
            escapeCatalogHtml(t("ui.catalogueOutOfStock", "Rupture de stock")) +
            "</p>"
          : "";
        var marketingBadges = getBookMarketingBadges(id, book);
        var ribbonHtml = marketingBadges.length
          ? '<div class="catalogue-card-ribbon">' +
            marketingBadges
              .map(function (badge) {
                return (
                  '<span class="ribbon--' +
                  badge.key +
                  '">' +
                  escapeCatalogHtml(badge.label) +
                  "</span>"
                );
              })
              .join("") +
            "</div>"
          : "";
        var priceLabel =
          book.comingSoon && (!book.price || book.price <= 0)
            ? t("ui.catalogueComingSoon", "À paraître")
            : formatPrice(book.price);
        var cartActions = book.comingSoon
          ? '<span class="catalogue-card-soon-note">' +
            escapeCatalogHtml(t("ui.catalogueSoonContact", "Bientôt disponible — nous contacter")) +
            "</span>"
          : outOfStock
            ? '<span class="catalogue-card-out-of-stock-note">' +
              escapeCatalogHtml(t("ui.catalogueOutOfStockShort", "Indisponible")) +
              "</span>"
            : '<button type="button" class="add-to-cart-btn">' +
              t("ui.addToCart", "Ajouter au panier") +
              "</button>";
        return (
          '<article class="catalogue-card' +
          distClass +
          (outOfStock ? " catalogue-card--out-of-stock" : "") +
          '" data-product-id="' +
          id +
          '" data-collection="' +
          book.collection +
          '" data-age-group="' +
          inferAgeGroup(book) +
          '" data-themes="' +
          getBookThemes(book, id).join(" ") +
          '" data-catalog-category="' +
          escapeCatalogHtml(getBookCatalogCategory(book, id)) +
          '" data-preview-images="' +
          previewImages +
          '">' +
          '<div class="catalogue-card-media' +
          squareNudgeMedia +
          landscapeMedia +
          productPhotoMedia +
          a4PortraitMedia +
          '"><img src="' +
          book.cover +
          '" alt="' +
          escapeCatalogHtml(book.title) +
          '" loading="lazy" decoding="async" class="catalogue-card-image' +
          (bookUsesCataloguePortraitCoverFit(book) ? " cover-fills-portrait-slot" : "") +
          (book.catalogueCoverPosition === "left" ? " cover-frame-nudge-left" : "") +
          (book.catalogueCoverPosition === "top" && !bookIsA4PortraitSheet(book)
            ? " cover-frame-nudge-top"
            : "") +
          '">' +
          ribbonHtml +
          '<span class="catalogue-preview-tag">' +
          (I18N_STATE.language === "en" ? "Preview" : "Aperçu") +
          '</span><button type="button" class="wishlist-btn" data-product-id="' +
          id +
          '" aria-label="' +
          (I18N_STATE.language === "en" ? "Add " : "Ajouter ") +
          escapeCatalogHtml(book.title) +
          (I18N_STATE.language === "en" ? " to favorites" : " aux favoris") +
          '"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button></div>' +
          '<div class="catalogue-card-body"><div class="catalogue-card-text"><h3>' +
          formatCatalogCardTitle(book.title) +
          "</h3>" +
          distBadge +
          soonBadge +
          stockBadge +
          "<p>" +
          authors +
          '</p></div><div class="catalogue-meta"><span data-price-eur="' +
          String(book.price || 0) +
          '">' +
          priceLabel +
          '</span><div class="catalogue-actions">' +
          cartActions +
          "</div></div></div></article>"
        );
      })
      .join("");

    grid.innerHTML = html;
    grid.classList.add("is-ready");
    grid.removeAttribute("aria-busy");
    CATALOGUE_STATE.currentPage = 1;
    grid.querySelectorAll(".catalogue-card").forEach(function (card) {
      setupCardPreview(card);
    });
    bindCatalogImageExtensionFallback(grid);
    refreshWishlistButtonStates();
    markCataloguePageReady();
    bindCatalogueSort();
    bindCatalogueAgeChips();
  }

  function getCataloguePageSize() {
    return window.matchMedia("(max-width: 767px)").matches ? 9 : 12;
  }

  /** @returns {{ type: "page", value: number } | { type: "ellipsis" }}[] */
  function buildCataloguePaginationItems(current, total) {
    var items = [];
    if (total <= 1) return items;
    if (total <= 7) {
      for (var i = 1; i <= total; i++) items.push({ type: "page", value: i });
      return items;
    }
    var left = Math.max(2, current - 1);
    var right = Math.min(total - 1, current + 1);
    items.push({ type: "page", value: 1 });
    if (left > 2) items.push({ type: "ellipsis" });
    for (var j = left; j <= right; j++) items.push({ type: "page", value: j });
    if (right < total - 1) items.push({ type: "ellipsis" });
    items.push({ type: "page", value: total });
    return items;
  }

  function renderCataloguePaginationMarkup(current, total) {
    var isEn = I18N_STATE.language === "en";
    var compactNav = false;
    try {
      compactNav = window.matchMedia("(max-width: 520px)").matches;
    } catch (e) {
      compactNav = window.innerWidth <= 520;
    }
    var prevLabel = compactNav ? "\u2039" : isEn ? "\u2039 Previous" : "\u2039 Précédent";
    var nextLabel = compactNav ? "\u203a" : isEn ? "Next \u203a" : "Suivant \u203a";
    var prevAria = compactNav
      ? ' aria-label="' + escapeCatalogHtml(isEn ? "Previous page" : "Page précédente") + '"'
      : "";
    var nextAria = compactNav
      ? ' aria-label="' + escapeCatalogHtml(isEn ? "Next page" : "Page suivante") + '"'
      : "";
    var ariaNav = isEn ? "Catalog pagination" : "Pagination du catalogue";
    var parts = buildCataloguePaginationItems(current, total).map(function (item) {
      if (item.type === "ellipsis") {
        return '<span class="catalogue-page-ellipsis" aria-hidden="true">\u2026</span>';
      }
      var n = item.value;
      var isHere = n === current;
      return (
        '<button type="button" class="catalogue-page-num' +
        (isHere ? " is-current" : "") +
        '" data-page-num="' +
        n +
        '"' +
        (isHere ? ' aria-current="page"' : "") +
        ">" +
        n +
        "</button>"
      );
    });
    return (
      '<nav class="catalogue-pagination-bar" aria-label="' +
      escapeCatalogHtml(ariaNav) +
      '">' +
      '<button type="button" class="catalogue-page-nav catalogue-page-nav--prev" data-page-action="prev" ' +
      (current === 1 ? "disabled" : "") +
      prevAria +
      ">" +
      prevLabel +
      "</button>" +
      '<div class="catalogue-page-numbers" role="group">' +
      parts.join("") +
      "</div>" +
      '<button type="button" class="catalogue-page-nav catalogue-page-nav--next" data-page-action="next" ' +
      (current === total ? "disabled" : "") +
      nextAria +
      ">" +
      nextLabel +
      "</button>" +
      "</nav>"
    );
  }

  function updateCataloguePagination(grid, filteredCards, visibleCount) {
    var paginationNode = document.querySelector("[data-catalogue-pagination]");
    if (!paginationNode) return;

    CATALOGUE_STATE.perPage = getCataloguePageSize();
    var perPage = CATALOGUE_STATE.perPage;
    var totalPages = Math.max(1, Math.ceil(visibleCount / perPage));
    if (CATALOGUE_STATE.currentPage > totalPages) {
      CATALOGUE_STATE.currentPage = totalPages;
    }
    if (CATALOGUE_STATE.currentPage < 1) {
      CATALOGUE_STATE.currentPage = 1;
    }

    grid.querySelectorAll(".catalogue-card").forEach(function (card) {
      card.style.display = "none";
    });

    var startIndex = (CATALOGUE_STATE.currentPage - 1) * perPage;
    var endIndex = startIndex + perPage;
    filteredCards.slice(startIndex, endIndex).forEach(function (card) {
      card.style.display = "";
    });

    if (visibleCount <= perPage) {
      paginationNode.innerHTML = "";
      paginationNode.style.display = "none";
      return;
    }

    paginationNode.style.display = "flex";
    paginationNode.innerHTML = renderCataloguePaginationMarkup(CATALOGUE_STATE.currentPage, totalPages);

    paginationNode.querySelectorAll("[data-page-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-page-action");
        if (action === "prev" && CATALOGUE_STATE.currentPage > 1) {
          CATALOGUE_STATE.currentPage -= 1;
        }
        if (action === "next" && CATALOGUE_STATE.currentPage < totalPages) {
          CATALOGUE_STATE.currentPage += 1;
        }
        updateCataloguePagination(grid, filteredCards, visibleCount);
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    paginationNode.querySelectorAll("[data-page-num]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = parseInt(btn.getAttribute("data-page-num"), 10);
        if (!isNaN(n) && n >= 1 && n <= totalPages && n !== CATALOGUE_STATE.currentPage) {
          CATALOGUE_STATE.currentPage = n;
          updateCataloguePagination(grid, filteredCards, visibleCount);
          grid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function computeCartTotals(cart, promoCode, shippingMode, postalZone) {
    var subtotal = cart.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
    var shipping = subtotal === 0 ? 0 : computeShippingForMode(cart, shippingMode, postalZone);
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
    var tax = 0;
    var total = Math.max(0, subtotal + shipping - discount);
    return {
      subtotal: subtotal,
      shipping: shipping,
      discount: discount,
      tax: tax,
      total: total,
      promo: promo || null,
    };
  }

  function parseWeightToGrams(rawWeight) {
    if (!rawWeight) return 0;
    var normalized = String(rawWeight).toLowerCase().replace(",", ".").trim();
    var match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
    if (!match) return 0;
    var value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return match[2] === "kg" ? Math.round(value * 1000) : Math.round(value);
  }

  function getProductWeightGrams(productId) {
    var book = getLocalizedBook(productId);
    if (!book) return DEFAULT_BOOK_WEIGHT_G;
    var explicitWeight = parseWeightToGrams(book.weightGrams || "");
    if (explicitWeight > 0) return explicitWeight;
    var specWeight = parseWeightToGrams(book.specs && book.specs.poids ? book.specs.poids : "");
    if (specWeight > 0) return specWeight;
    return DEFAULT_BOOK_WEIGHT_G;
  }

  function formatWeight(grams) {
    var safe = Math.max(0, Math.round(Number(grams) || 0));
    if (safe >= 1000) {
      return (safe / 1000).toFixed(safe % 1000 === 0 ? 0 : 2).replace(".", ",") + " kg";
    }
    return safe + " g";
  }

  function computeCartWeightGrams(cart) {
    return cart.reduce(function (sum, item) {
      if (!item || !item.id || !item.qty) return sum;
      return sum + getProductWeightGrams(item.id) * item.qty;
    }, 0);
  }

  function getShippingPostalTiersForZone(zone) {
    var normalizedZone = normalizePostalZoneKey(zone);
    if (!SHIPPING_POSTAL_ZONE_TIERS[normalizedZone]) {
      normalizedZone = "dom_martinique_near";
    }
    var fallbackTiers = SHIPPING_POSTAL_ZONE_TIERS[normalizedZone];
    var contentRates = SITE_CONTENT && SITE_CONTENT.ecommerce && SITE_CONTENT.ecommerce.postal_rates;
    var candidate = contentRates && contentRates[normalizedZone];
    if (!candidate && contentRates && contentRates[zone]) {
      candidate = contentRates[zone];
    }
    if (!Array.isArray(candidate) || candidate.length === 0) return fallbackTiers;
    var sanitized = candidate
      .map(function (row) {
        if (!row || typeof row !== "object") return null;
        var maxWeightG = parseInt(String(row.max_weight_g || ""), 10);
        var amountEur = Number(String(row.amount_eur || "").replace(",", "."));
        if (!Number.isFinite(maxWeightG) || maxWeightG <= 0 || !Number.isFinite(amountEur) || amountEur < 0) return null;
        return { maxWeightG: maxWeightG, amountEur: Math.round(amountEur * 100) / 100 };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return a.maxWeightG - b.maxWeightG;
      });
    return sanitized.length > 0 ? sanitized : fallbackTiers;
  }

  function computeShippingByWeight(cart, postalZone) {
    var totalWeight = computeCartWeightGrams(cart);
    if (totalWeight <= 0) return 0;
    var tiers = getShippingPostalTiersForZone(postalZone);
    for (var i = 0; i < tiers.length; i += 1) {
      if (totalWeight <= tiers[i].maxWeightG) {
        return tiers[i].amountEur;
      }
    }
    return tiers[tiers.length - 1].amountEur;
  }

  function computeShippingForMode(cart, shippingMode, postalZone) {
    if (shippingMode === "pickup_siege") return 0;
    if (shippingMode === "local_personal") return SHIPPING_LOCAL_PERSONAL_EUR;
    if (shippingMode === "postal") return computeShippingByWeight(cart, postalZone);
    return 0;
  }

  function getPromoLabel(promo) {
    if (!promo) return "";
    if (promo.labelKey) {
      return t(promo.labelKey, promo.defaultLabel || "");
    }
    var lang = I18N_STATE && I18N_STATE.lang === "en";
    if (lang && promo.label_en) return promo.label_en;
    if (promo.label) return promo.label;
    if (promo.type === "shipping") {
      return t("ui.promoAppliedShipping", "Livraison offerte appliquee.");
    }
    if (promo.type === "percent" && promo.value > 0) {
      return t("ui.promoAppliedPercent", "Remise de {value}% appliquee.").replace("{value}", String(promo.value));
    }
    return t("ui.promoAppliedGeneric", "Code promo applique.");
  }

  function renderHomePromoBanner(content) {
    var host = document.getElementById("home-promo-banner");
    if (!host) return;
    var promo = content && content.home_promo;
    if (!promo || !promo.code) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }
    var langEn = I18N_STATE && I18N_STATE.lang === "en";
    var message = langEn && promo.message_en ? promo.message_en : promo.message || "";
    var code = escapeCatalogHtml(String(promo.code || "").toUpperCase());
    var cartHref = "./panier.html?promo=" + encodeURIComponent(String(promo.code || "").toUpperCase());
    host.hidden = false;
    host.innerHTML =
      '<div class="home-promo-banner__inner">' +
      '<p class="home-promo-banner__text">' +
      escapeCatalogHtml(message) +
      "</p>" +
      '<p class="home-promo-banner__code-wrap">' +
      '<span class="home-promo-banner__label" data-fr="Code :" data-en="Code:">Code :</span> ' +
      '<strong class="home-promo-banner__code" data-promo-code="' +
      code +
      '">' +
      code +
      "</strong></p>" +
      '<a class="home-promo-banner__cta btn-outline" href="' +
      escapeCatalogHtml(cartHref) +
      '" data-fr="Utiliser au panier" data-en="Use at checkout">Utiliser au panier</a>' +
      "</div>";
    if (I18N_STATE && I18N_STATE.dictionary && typeof applyPageTranslations === "function") {
      try {
        applyPageTranslations();
      } catch (e) {
        /* no-op */
      }
    }
  }

  function updateCartItemQuantity(index, delta) {
    var cart = getCart();
    var target = cart[index];
    if (!target) return;
    if (delta > 0 && target.id && hasTrackedBookStock(target.id)) {
      var availableQty = getBookStockQty(target.id);
      if (availableQty <= target.qty) {
        showOutOfStockToast(target.title || "");
        return;
      }
    }
    target.qty += delta;
    if (target.qty <= 0) {
      cart.splice(index, 1);
    }
    setCart(cart);
    renderCartPage();
    renderDisplayPrices();
  }

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
    var previewTrigger = card.querySelector(".catalogue-preview-tag");
    var images = getPreviewImages(card);
    if (!image || !previewTrigger || images.length <= 1) return;
    var productId = card.getAttribute("data-product-id");
    var book = productId ? getLocalizedBook(productId) : null;
    var timer = null;
    var current = 0;
    var initial = images[0];

    function startPreview() {
      if (timer) return;
      timer = setInterval(function () {
        current = (current + 1) % images.length;
        image.src = images[current];
        if (book) syncCoverPortraitSlotClass(image, book, images[current]);
      }, 1100);
    }

    function stopPreview() {
      if (timer) clearInterval(timer);
      timer = null;
      current = 0;
      image.src = initial;
      if (book) syncCoverPortraitSlotClass(image, book, initial);
    }

    previewTrigger.addEventListener("mouseenter", startPreview);
    previewTrigger.addEventListener("mouseleave", stopPreview);
    previewTrigger.addEventListener("focus", startPreview);
    previewTrigger.addEventListener("blur", stopPreview);
  }

  function closeCataloguePreviewModal() {
    var modal = document.getElementById("catalogue-detail-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    delete modal.dataset.activeProductId;
    document.body.style.overflow = "";
  }

  function openCataloguePreviewModal(productId) {
    var modal = document.getElementById("catalogue-detail-modal");
    if (!modal || !productId || !BOOK_CATALOG[productId]) return;
    var book = getLocalizedBook(productId);
    if (!book) return;

    var dialog = modal.querySelector(".catalogue-detail-dialog");
    if (dialog) {
      dialog.classList.toggle("catalogue-detail-dialog--distribution", !!book.distributionEdition);
    }

    var mainImg = document.getElementById("catalogue-detail-main-image");
    var thumbs = document.getElementById("catalogue-detail-thumbs");
    var collection = document.getElementById("catalogue-detail-collection");
    var title = document.getElementById("catalogue-detail-title");
    var authors = document.getElementById("catalogue-detail-authors");
    var price = document.getElementById("catalogue-detail-price");
    var desc = document.getElementById("catalogue-detail-description");
    var specs = document.getElementById("catalogue-detail-specs");
    var recos = document.getElementById("catalogue-detail-reco-list");
    var fullLink = document.getElementById("catalogue-detail-full-link");

    if (collection) collection.textContent = book.collection || "";
    if (title) title.textContent = book.title || "";
    if (authors) authors.innerHTML = getContributorsLabel(book);
    if (price) {
      price.dataset.priceEur = String(book.price || 0);
      price.textContent = formatPrice(book.price || 0);
    }
    if (desc) desc.textContent = book.description || "";

    var mainFrame = document.getElementById("catalogue-detail-main-frame");

    if (mainImg) {
      mainImg.src = book.cover || "";
      mainImg.alt = (t("ui.bookCoverAltPrefix", "Couverture —") + " " + (book.title || "")).trim();
      syncCoverPortraitSlotClass(mainImg, book, book.cover || "");
    }
    if (mainFrame) {
      syncCatalogueDetailMainFrameClass(mainFrame, book, book.cover || "");
    }

    if (thumbs) {
      thumbs.innerHTML = "";
      var gallery = book.gallery && book.gallery.length ? book.gallery : [book.cover];
      gallery.forEach(function (src, index) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "catalogue-detail-thumb" + (index === 0 ? " is-active" : "");
        btn.innerHTML = '<img src="' + src + '" alt="">';
        btn.addEventListener("click", function () {
          if (mainImg) {
            mainImg.src = src;
            syncCoverPortraitSlotClass(mainImg, book, src);
          }
          if (mainFrame) {
            syncCatalogueDetailMainFrameClass(mainFrame, book, src);
          }
          thumbs.querySelectorAll(".catalogue-detail-thumb").forEach(function (thumbEl, thumbIndex) {
            thumbEl.classList.toggle("is-active", thumbIndex === index);
          });
        });
        thumbs.appendChild(btn);
      });
    }

    if (specs) {
      specs.innerHTML = buildProductTechListHtml(book, productId);
    }

    if (recos) {
      var related = Object.keys(BOOK_CATALOG)
        .filter(function (id) {
          return id !== productId && isBookEligibleForRecommendations(id);
        })
        .sort(function (a, b) {
          var bookA = getLocalizedBook(a);
          var bookB = getLocalizedBook(b);
          var scoreA = 0;
          var scoreB = 0;
          if (bookA.collection === book.collection) scoreA += 2;
          if (bookB.collection === book.collection) scoreB += 2;
          var hasCommonA = (bookA.authors || []).some(function (authorA) {
            return (book.authors || []).some(function (authorCurrent) {
              return authorCurrent.slug && authorCurrent.slug === authorA.slug;
            });
          });
          var hasCommonB = (bookB.authors || []).some(function (authorB) {
            return (book.authors || []).some(function (authorCurrent) {
              return authorCurrent.slug && authorCurrent.slug === authorB.slug;
            });
          });
          if (hasCommonA) scoreA += 1;
          if (hasCommonB) scoreB += 1;
          return scoreB - scoreA;
        })
        .slice(0, 3);

      recos.innerHTML = related
        .map(function (id) {
          var rel = getLocalizedBook(id);
          return (
            '<div class="catalogue-detail-reco-item" role="button" tabindex="0" data-preview-reco-id="' +
            escapeCatalogHtml(id) +
            '"><img src="' +
            rel.cover +
            '" alt=""><div><h4>' +
            escapeCatalogHtml(rel.title) +
            "</h4></div></div>"
          );
        })
        .join("");

      recos.querySelectorAll("[data-preview-reco-id]").forEach(function (node) {
        function goReco() {
          var rid = node.getAttribute("data-preview-reco-id");
          if (rid) openCataloguePreviewModal(rid);
        }
        node.addEventListener("click", goReco);
        node.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goReco();
          }
        });
      });
    }

    if (fullLink) {
      fullLink.href = "./livre.html?id=" + encodeURIComponent(productId);
      fullLink.textContent = t("ui.cataloguePreviewFullLink", "Voir la fiche complète");
      fullLink.setAttribute("data-fr", "Voir la fiche complète");
      fullLink.setAttribute("data-en", "View full details");
    }

    modal.dataset.activeProductId = productId;
    applyDataAttributeLanguage(I18N_STATE.language);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderDisplayPrices();
  }

  function initCatalogueQuickPreviewModal() {
    var modal = document.getElementById("catalogue-detail-modal");
    if (!modal || modal.dataset.previewModalBound) return;
    modal.dataset.previewModalBound = "1";

    var closeBtn = modal.querySelector(".catalogue-detail-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeCataloguePreviewModal);
    }
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeCataloguePreviewModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!modal.classList.contains("is-open")) return;
      closeCataloguePreviewModal();
    });
  }

  function initCatalogueCardInteractions() {
    var grid = document.querySelector(".catalogue-grid");
    if (!grid) return;

    if (!grid.dataset.catalogueClickDelegation) {
      grid.dataset.catalogueClickDelegation = "1";
      grid.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        var previewTag = event.target.closest(".catalogue-preview-tag");
        if (previewTag && grid.contains(previewTag)) {
          event.preventDefault();
          event.stopPropagation();
          var cardForPreview = previewTag.closest(".catalogue-card");
          var previewId = cardForPreview && cardForPreview.getAttribute("data-product-id");
          if (previewId) openCataloguePreviewModal(previewId);
          return;
        }
        var card = event.target.closest(".catalogue-card");
        if (!card || !grid.contains(card)) return;
        var productId = card.getAttribute("data-product-id");
        if (!productId) return;
        window.location.href = "./livre.html?id=" + encodeURIComponent(productId);
      });
    }
  }

  function getContributorsLabel(book) {
    var distributed = !!book.distributionEdition;
    var prefix = t(
      distributed ? "ui.bookContributorsDistributed" : "ui.bookContributors",
      distributed
        ? "Crédits (collection Belbalan · diffusée par les Éditions du Sucrier) :"
        : "Auteur(s) / Illustrateur(s) :"
    );
    var contributors = (book.authors || [])
      .map(function (author) {
        var name = escapeCatalogHtml(author.name || "");
        if (author.slug) {
          return '<a href="./auteur.html?slug=' + author.slug + '">' + name + "</a>";
        }
        return '<span class="book-contributor-text">' + name + "</span>";
      })
      .join(" · ");
    return prefix + " " + contributors;
  }

  function getTechnicalSpecs(book, productId) {
    var specs = (book && book.specs) || {};
    var isbn = "";
    if (!book.hideIsbn && specs.isbn) {
      isbn = String(specs.isbn).trim();
    }
    var format = "";
    if (!book.hideFormat && specs.format) {
      format = String(specs.format).trim();
    }
    var pages = "";
    if (!book.hidePages && specs.pages) {
      pages = String(specs.pages).trim();
    }
    return {
      isbn: isbn,
      format: format,
      pages: pages,
      publicationDate:
        book.hidePublicationDate || !specs.publicationDate ? "" : String(specs.publicationDate).trim(),
    };
  }

  function buildProductTechListHtml(book, productId) {
    var ts = getTechnicalSpecs(book, productId);
    var rows = [];
    var trackedStock = hasTrackedBookStock(productId);
    var stockQty = trackedStock ? getBookStockQty(productId) : null;
    if (ts.isbn) {
      rows.push(
        "<li><strong>" +
          escapeCatalogHtml(book.labelIsbn || t("ui.bookIsbn", "ISBN :")) +
          "</strong> " +
          escapeCatalogHtml(ts.isbn) +
          "</li>"
      );
    }
    if (ts.format) {
      rows.push(
        "<li><strong>" +
          escapeCatalogHtml(book.labelFormat || t("ui.bookFormat", "Format :")) +
          "</strong> " +
          escapeCatalogHtml(ts.format) +
          "</li>"
      );
    }
    if (ts.pages) {
      rows.push(
        "<li><strong>" +
          escapeCatalogHtml(book.labelPages || t("ui.bookPages", "Nombre de pages :")) +
          "</strong> " +
          escapeCatalogHtml(ts.pages) +
          "</li>"
      );
    }
    if (ts.publicationDate) {
      rows.push(
        "<li><strong>" +
          escapeCatalogHtml(book.labelPublicationDate || t("ui.bookPublicationDate", "Date de parution :")) +
          "</strong> " +
          escapeCatalogHtml(ts.publicationDate) +
          "</li>"
      );
    }
    if (trackedStock && stockQty > 0) {
      rows.push(
        "<li><strong>" +
          escapeCatalogHtml(t("ui.bookStock", "Stock :")) +
          "</strong> " +
          escapeCatalogHtml(
            String(stockQty) +
              " " +
              (stockQty > 1
                ? t("ui.bookStockUnitsPlural", "exemplaires")
                : t("ui.bookStockUnitsSingle", "exemplaire"))
          ) +
          "</li>"
      );
    }
    return rows.join("");
  }

  function renderBookDetailPage() {
    var titleNode = document.getElementById("book-detail-title");
    if (!titleNode) return;

    var params = new URLSearchParams(window.location.search);
    var requestedId = params.get("id");
    var bookId = BOOK_CATALOG[requestedId] ? requestedId : Object.keys(BOOK_CATALOG)[0];
    var book = getLocalizedBook(bookId);
    if (!book) return;

    var collectionNode = document.getElementById("book-detail-collection");
    var contributorsNode = document.getElementById("book-detail-contributors");
    var descriptionNode = document.getElementById("book-detail-description");
    var priceNode = document.getElementById("book-detail-price");
    var addBtn = document.getElementById("book-detail-add-to-cart");
    var availabilityNode = document.getElementById("book-detail-availability");
    var outOfStockBanner = document.getElementById("book-out-of-stock-banner");
    var mainImage = document.getElementById("book-detail-main-image");
    var thumbList = document.getElementById("book-detail-thumb-list");
    var techList = document.getElementById("book-tech-list");
    var relatedGrid = document.getElementById("related-books-grid");
    var ageNode = document.getElementById("book-detail-age");
    var themeNode = document.getElementById("book-detail-theme");
    var languagesNode = document.getElementById("book-detail-languages");

    document.title = book.title + " — " + t("meta.siteTitle", "Les Éditions du Sucrier");
    var pageHeroTitle = document.querySelector(".book-detail-page .page-hero h1");
    if (pageHeroTitle) {
      setCmsText(pageHeroTitle, t("ui.productSheetTitle", "Fiche produit"));
    }
    var storyBook = isStoryBookProduct(book, bookId);
    var mainBookPage = document.querySelector(".book-detail-page");
    if (mainBookPage) {
      mainBookPage.classList.toggle("book-detail-page--distribution", !!book.distributionEdition);
      mainBookPage.classList.toggle("book-detail-page--out-of-stock", isBookOutOfStock(bookId));
      mainBookPage.classList.toggle("book-detail-page--a4-portrait", bookIsA4PortraitSheet(book));
    }
    var mainFrame = document.querySelector(".book-detail-main-frame");
    if (mainFrame) syncBookDetailMainFrameClass(mainFrame, book);
    if (collectionNode) collectionNode.textContent = book.collection;
    titleNode.textContent = book.title;
    if (contributorsNode) contributorsNode.innerHTML = getContributorsLabel(book);
    if (descriptionNode) descriptionNode.textContent = book.description;
    var descriptionTab = document.getElementById("book-detail-description-tab");
    if (descriptionTab) descriptionTab.textContent = book.description;
    var readingLevelCard = document.getElementById("book-detail-reading-level-card");
    var readingTimeCard = document.getElementById("book-detail-reading-time-card");
    var readingTimeLabel = storyBook ? getEstimatedReadingTimeLabel(book) : "";
    if (readingLevelCard) readingLevelCard.hidden = !storyBook;
    if (readingTimeCard) readingTimeCard.hidden = !readingTimeLabel;
    var readingLevel = document.getElementById("book-detail-reading-level");
    if (readingLevel && storyBook) {
      readingLevel.textContent =
        book.ageGroup === "9+"
          ? t("ui.readingLevelChapter", "Roman / BD · lecture autonome ou accompagnée")
          : book.ageGroup === "6-8"
            ? t("ui.readingLevelAlbum", "Album illustré · lecture accompagnée")
            : t("ui.readingLevelBoard", "Album cartonné · lecture partagée");
    }
    var readingTime = document.getElementById("book-detail-reading-time");
    if (readingTime) {
      readingTime.textContent = readingTimeLabel;
    }

    if (priceNode) {
      priceNode.dataset.priceEur = String(book.price || 0);
      priceNode.textContent = formatPrice(book.price || 0);
    }
    if (ageNode) ageNode.textContent = getBookAgeLabel(book);
    if (themeNode) themeNode.textContent = getBookThemeLabel(book, bookId);
    var languagesCard = languagesNode && languagesNode.closest(".book-detail-info-card");
    if (languagesCard) languagesCard.hidden = !!book.hideLanguages;
    if (languagesNode && !book.hideLanguages) languagesNode.textContent = getBookLanguages(book);

    // Etat calculé a partir du stock backoffice (ou absence de suivi).
    var outOfStock = isBookOutOfStock(bookId);
    if (availabilityNode) {
      if (outOfStock) {
        availabilityNode.textContent = t("ui.bookOutOfStockAvailability", "Rupture de stock");
        availabilityNode.classList.add("book-detail-availability--out");
      } else if (hasTrackedBookStock(bookId) && getBookStockQty(bookId) > 0) {
        var stockQtyLabel = getBookStockQty(bookId);
        availabilityNode.textContent =
          (I18N_STATE.language === "en"
            ? "In stock (" +
              String(stockQtyLabel) +
              " " +
              (stockQtyLabel > 1 ? "left" : "left") +
              ") · Ships within 48h"
            : "En stock (" +
              String(stockQtyLabel) +
              " " +
              (stockQtyLabel > 1 ? "restants" : "restant") +
              ") · Expédition sous 48h");
        availabilityNode.classList.remove("book-detail-availability--out");
      } else {
        availabilityNode.textContent = t("ui.bookInStock", "En stock · Expédition sous 48h");
        availabilityNode.classList.remove("book-detail-availability--out");
      }
    }
    if (outOfStockBanner) {
      if (outOfStock) {
        setBookOutOfStockBannerVisible(outOfStockBanner, true);
        outOfStockBanner.innerHTML =
          '<p class="book-out-of-stock-banner__title">' +
          escapeCatalogHtml(t("ui.bookOutOfStockTitle", "Rupture de stock")) +
          '</p><p class="book-out-of-stock-banner__text">' +
          escapeCatalogHtml(
            t(
              "ui.bookOutOfStockBody",
              "Ce produit n’est plus disponible à la vente pour le moment. Contactez-nous si vous souhaitez être prévenu(e) de son retour."
            )
          ) +
          '</p><p class="book-out-of-stock-banner__actions"><a class="btn-outline" href="./contact.html">' +
          escapeCatalogHtml(t("ui.bookOutOfStockContact", "Nous contacter")) +
          "</a></p>";
      } else {
        setBookOutOfStockBannerVisible(outOfStockBanner, false);
      }
    }
    if (addBtn) {
      addBtn.setAttribute("data-product-id", bookId);
      addBtn.disabled = !canPurchaseBook(bookId);
      addBtn.classList.toggle("is-disabled", !canPurchaseBook(bookId));
      addBtn.textContent = outOfStock
        ? t("ui.bookOutOfStockBtn", "Indisponible")
        : t("ui.addToCart", "Ajouter au panier");
    }

    if (mainImage) {
      mainImage.src = book.cover;
      mainImage.alt = t("ui.bookCoverAltPrefix", "Couverture —") + " " + book.title;
      mainImage.setAttribute("fetchpriority", "high");
      mainImage.removeAttribute("loading");
      syncCoverPortraitSlotClass(mainImage, book, book.cover);
    }

    if (thumbList) {
      thumbList.innerHTML = "";
      (book.gallery || [book.cover]).forEach(function (src, index) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "book-detail-thumb" + (index === 0 ? " is-active" : "");
        var thumbImgAttrs =
          index === 0
            ? ' decoding="async"'
            : ' loading="lazy" decoding="async"';
        btn.innerHTML = '<img src="' + src + '" alt=""' + thumbImgAttrs + ">";
        btn.addEventListener("click", function () {
          if (mainImage) {
            mainImage.src = src;
            syncCoverPortraitSlotClass(mainImage, book, src);
          }
          thumbList.querySelectorAll(".book-detail-thumb").forEach(function (thumb, thumbIndex) {
            thumb.classList.toggle("is-active", thumbIndex === index);
          });
        });
        thumbList.appendChild(btn);
      });
      bindCatalogImageExtensionFallback(thumbList);
    }
    if (mainImage) bindCatalogImageExtensionFallback(mainImage.parentElement || mainImage);

    if (techList) {
      techList.innerHTML = buildProductTechListHtml(book, bookId);
    }

    if (relatedGrid) {
      var related = Object.keys(BOOK_CATALOG)
        .filter(function (id) {
          return id !== bookId && isBookEligibleForRecommendations(id);
        })
        .sort(function (a, b) {
          var bookA = getLocalizedBook(a);
          var bookB = getLocalizedBook(b);
          var scoreA = 0;
          var scoreB = 0;
          if (bookA.collection === book.collection) scoreA += 2;
          if (bookB.collection === book.collection) scoreB += 2;
          var hasCommonA = (bookA.authors || []).some(function (authorA) {
            return (book.authors || []).some(function (authorCurrent) {
              return authorCurrent.slug && authorCurrent.slug === authorA.slug;
            });
          });
          var hasCommonB = (bookB.authors || []).some(function (authorB) {
            return (book.authors || []).some(function (authorCurrent) {
              return authorCurrent.slug && authorCurrent.slug === authorB.slug;
            });
          });
          if (hasCommonA) scoreA += 1;
          if (hasCommonB) scoreB += 1;
          return scoreB - scoreA;
        })
        .slice(0, 6);

      relatedGrid.innerHTML = related
        .map(function (id) {
          var rel = getLocalizedBook(id);
          var names = (rel.authors || [])
            .map(function (author) {
              return author.name;
            })
            .join(" · ");
          return (
            '<article class="related-book-card" data-product-id="' +
            id +
            '"><a class="related-book-link" href="./livre.html?id=' +
            encodeURIComponent(id) +
            '"><img src="' +
            rel.cover +
            '" alt="' +
            t("ui.bookCoverAltPrefix", "Couverture —") +
            " " +
            rel.title +
            '"></a><div class="related-book-body"><h4><a class="related-book-link" href="./livre.html?id=' +
            encodeURIComponent(id) +
            '">' +
            rel.title +
            '</a></h4><p>' +
            names +
            '</p><div class="related-book-footer"><span class="related-book-price" data-price-eur="' +
            String(rel.price || 0) +
            '">' +
            formatPrice(rel.price || 0) +
            '</span>' +
            (isBookOutOfStock(id)
              ? '<span class="related-book-out-of-stock">' +
                escapeCatalogHtml(t("ui.catalogueOutOfStockShort", "Indisponible")) +
                "</span>"
              : '<button type="button" class="add-to-cart-btn">' +
                t("ui.add", "Ajouter") +
                "</button>") +
            "</div></div></article>"
          );
        })
        .join("");
    }

    var teacherBox = document.getElementById("book-teacher-resources");
    if (teacherBox) {
      var isPro = getEffectiveUserSegment() === "professionnel";
      teacherBox.hidden = !isPro;
      if (!isPro) {
        teacherBox.innerHTML = "";
      } else {
        var hasSheet = bookHasPedagogicalSheet(book, bookId);
        var sheetNote = hasSheet
          ? t(
              "ui.teacherResourcesIntro",
              "Téléchargez la fiche « Pourquoi utiliser nos publications à l'école » pour cet ouvrage (PDF). Chaque téléchargement est enregistré dans votre espace compte."
            )
          : t(
              "ui.teacherSheetUnavailable",
              "La fiche pédagogique de cet ouvrage est en cours de production. Elle sera prochainement disponible au téléchargement depuis cette page."
            );
        teacherBox.innerHTML =
          '<section class="teacher-resource teacher-resource-unlocked' +
          (hasSheet ? "" : " teacher-resource--pending") +
          '">' +
          "<h3>" +
          t("ui.teacherResourcesHeading", "Ressources pédagogiques (compte professionnel)") +
          "</h3>" +
          '<p class="teacher-resource-copy">' +
          escapeCatalogHtml(sheetNote) +
          "</p>" +
          '<p class="teacher-resource-actions">' +
          (hasSheet
            ? '<button type="button" class="btn-primary" data-pro-sheet-download data-book-id="' +
              escapeCatalogHtml(bookId) +
              '">' +
              t("ui.teacherDownloadSheetBtn", "Télécharger la fiche PDF") +
              "</button> "
            : '<button type="button" class="btn-primary" disabled aria-disabled="true">' +
              t("ui.teacherSheetUnavailableBtn", "Fiche bientôt disponible") +
              "</button> ") +
          '<a href="./contact.html" class="btn-outline">' +
          t("ui.teacherQuoteLink", "Demander un devis / commande groupée") +
          "</a></p></section>";
        var dlBtn = teacherBox.querySelector("[data-pro-sheet-download]");
        if (dlBtn) {
          dlBtn.addEventListener("click", function () {
            var label = t("ui.teacherDownloadSheetLabel", "Fiche pédagogique — ") + (book.title || "");
            logProResourceDownload(bookId, label);
            window.location.href =
              "./api/pedagogical-download.php?book=" + encodeURIComponent(bookId);
          });
        }
      }
    }

    initBookDetailEnhancements(bookId);

    // Revele le contenu apres injection (anti-FOUC)
    var bookPageRoot = document.querySelector(".book-detail-page");
    if (bookPageRoot) bookPageRoot.classList.add("is-ready");
  }

  function getBookIdsForAuthorSlug(slug) {
    if (!slug) return [];
    return Object.keys(BOOK_CATALOG).filter(function (id) {
      return (BOOK_CATALOG[id].authors || []).some(function (author) {
        return author.slug === slug;
      });
    });
  }

  function renderAuthorDetailPage() {
    var nameEl = document.getElementById("author-detail-name");
    if (!nameEl) return;

    var lang = I18N_STATE.language === "en" ? "en" : "fr";
    var params = new URLSearchParams(window.location.search);
    var rawSlug = params.get("slug");
    var slug = resolveAuthorSlug(rawSlug || "");
    var loadedBlocks = Array.from(document.querySelectorAll("[data-author-detail-loaded]"));
    var missingBlocks = Array.from(document.querySelectorAll("[data-author-detail-missing]"));
    var profile = slug ? AUTHOR_PROFILES[slug] : null;

    if (!profile) {
      document.title =
        (lang === "en" ? "Author not found" : "Auteur introuvable") +
        " — " +
        t("meta.siteTitle", "Les Éditions du Sucrier");
      loadedBlocks.forEach(function (el) {
        el.hidden = true;
      });
      missingBlocks.forEach(function (el) {
        el.hidden = false;
      });
      return;
    }

    loadedBlocks.forEach(function (el) {
      el.hidden = false;
    });
    missingBlocks.forEach(function (el) {
      el.hidden = true;
    });

    document.title =
      profile.name[lang] + " — " + t("meta.siteTitle", "Les Éditions du Sucrier");

    var kickerEl = document.getElementById("author-detail-kicker");
    var roleEl = document.getElementById("author-detail-role");
    var photoEl = document.getElementById("author-detail-photo");
    var bioEl = document.getElementById("author-detail-bio");
    var booksGrid = document.getElementById("author-books-grid");
    var booksHeading = document.getElementById("author-books-heading");

    if (kickerEl) kickerEl.textContent = t("ui.authorPageKicker", "Fiche auteur");
    nameEl.textContent = profile.name[lang];
    if (roleEl) roleEl.textContent = profile.roleLabel[lang];

    if (photoEl) {
      photoEl.src = getOptimizedImagePath(profile.photo);
      photoEl.alt = profile.name[lang];
    }

    if (bioEl) {
      bioEl.innerHTML = "";
      (profile.bio || []).forEach(function (para) {
        var text = (para && (para[lang] || para.fr)) || "";
        var p = document.createElement("p");
        p.textContent = text;
        bioEl.appendChild(p);
      });
    }

    if (booksHeading) {
      booksHeading.textContent = t("ui.authorBooksHeading", "Ouvrages au catalogue");
    }

    if (booksGrid) {
      var ids = getBookIdsForAuthorSlug(slug);
      if (ids.length === 0) {
        booksGrid.innerHTML =
          '<p class="author-books-empty">' +
          t(
            "ui.authorNoBooksYet",
            "Aucun ouvrage référencé pour le moment dans le catalogue en ligne."
          ) +
          "</p>";
      } else {
        booksGrid.innerHTML = ids
          .map(function (id) {
            var book = getLocalizedBook(id);
            var names = (book.authors || [])
              .map(function (author) {
                return author.name;
              })
              .join(" · ");
            return (
              '<article class="related-book-card" data-product-id="' +
              id +
              '"><a class="related-book-link" href="./livre.html?id=' +
              encodeURIComponent(id) +
              '"><img src="' +
              book.cover +
              '" alt="' +
              t("ui.bookCoverAltPrefix", "Couverture —") +
              " " +
              book.title +
              '"></a><div class="related-book-body"><h4><a class="related-book-link" href="./livre.html?id=' +
              encodeURIComponent(id) +
              '">' +
              book.title +
              '</a></h4><p>' +
              names +
              '</p><div class="related-book-footer"><span class="related-book-price book-card-prix" data-price-eur="' +
              String(book.price || 0) +
              '">' +
              formatPrice(book.price || 0) +
              '</span><button type="button" class="add-to-cart-btn">' +
              t("ui.add", "Ajouter") +
              "</button></div></div></article>"
            );
          })
          .join("");
      }
    }

    primeDisplayPrices();
    renderDisplayPrices();
  }

  function renderAboutAuthorsGrid() {
    var grid = document.querySelector("[data-authors-grid]");
    if (!grid) return;
    var lang = I18N_STATE.language === "en" ? "en" : "fr";
    var rows = (SITE_CONTENT && SITE_CONTENT.authors) || [];
    if (!Array.isArray(rows) || !rows.length) return;

    grid.innerHTML = rows
      .filter(function (row) {
        return row && row.hidden !== true && String(row.slug || "").trim();
      })
      .map(function (row) {
        var slug = String(row.slug || "").trim();
        var profile = AUTHOR_PROFILES[slug] || {};
        var name = profile.name
          ? profile.name[lang] || profile.name.fr
          : String(row["name_" + lang] || row.name_fr || "");
        var role = profile.roleLabel
          ? profile.roleLabel[lang] || profile.roleLabel.fr
          : String(row["role_" + lang] || row.role_fr || "");
        var photo = getOptimizedImagePath(
          String(row.photo || profile.photo || "").trim()
        );
        var roles = (profile.roles || String(row.roles || "author").split(/\s+/))
          .join(" ")
          .trim();
        var cardClass = "about-person-card";
        if (roles.indexOf("author") !== -1) cardClass += " about-person-card--author";
        if (roles.indexOf("illustrator") !== -1 && roles.indexOf("author") === -1) {
          cardClass += " about-person-card--illustrator";
        }
        return (
          '<article class="' +
          cardClass +
          '" data-about-roles="' +
          escapeCatalogHtml(roles || "author") +
          '">' +
          '<a class="about-person-link" href="auteur.html?slug=' +
          encodeURIComponent(slug) +
          '">' +
          '<div class="about-person-photo"><img src="' +
          escapeCatalogHtml(photo) +
          '" alt="' +
          escapeCatalogHtml(name) +
          '" loading="lazy" width="440" height="528" decoding="async"></div>' +
          "</a>" +
          '<h2><a class="about-person-link-title" href="auteur.html?slug=' +
          encodeURIComponent(slug) +
          '">' +
          escapeCatalogHtml(name) +
          "</a></h2>" +
          '<p class="about-person-role">' +
          escapeCatalogHtml(role) +
          "</p></article>"
        );
      })
      .join("");
  }

  function applyAuthorsChapterHero(content) {
    if (!document.querySelector("[data-authors-chapter-hero]")) return;
    var page = (content && content.authors_page) || {};
    var lang = I18N_STATE.language === "en" ? "en" : "fr";
    var kicker = document.querySelector("[data-authors-chapter-kicker]");
    var title = document.querySelector("[data-authors-chapter-title]");
    var lead = document.querySelector("[data-authors-chapter-lead]");
    if (kicker) {
      var kickerText = lang === "en" ? page.kicker_en || page.kicker_fr : page.kicker_fr;
      if (kickerText) setCmsText(kicker, kickerText);
    }
    if (title) {
      var titleText = lang === "en" ? page.title_en || page.title_fr : page.title_fr;
      if (titleText) setCmsText(title, titleText);
    }
    if (lead) {
      var leadText = lang === "en" ? page.lead_en || page.lead_fr : page.lead_fr;
      if (leadText) setCmsText(lead, leadText);
    }
  }

  function applyAboutHousePage(content) {
    if (!document.querySelector(".about-maison-page")) return;
    var page = (content && content.about_house_page) || {};
    setTextContent(".about-chapter-hero__kicker", contenuGet(page, "chapter_kicker", ""));
    setTextContent("#maison-chapter-title", contenuGet(page, "chapter_title", ""));
    setTextContent(".about-chapter-hero__lead", contenuGet(page, "chapter_lead", ""));
    setTextContent(".maison-hero__motto p", contenuGet(page, "motto", ""));
    setTextContent(".maison-story__main h2", contenuGet(page, "story_title", ""));
    setTextContent(".maison-story__main p:nth-of-type(1)", contenuGet(page, "story_p1", ""));
    setTextContent(".maison-story__main p:nth-of-type(2)", contenuGet(page, "story_p2", ""));
    setTextContent(".maison-story__main p:nth-of-type(3)", contenuGet(page, "story_p3", ""));
    setTextContent("#maison-pillars-title", contenuGet(page, "pillars_title", ""));
    setTextContent(".maison-section-head--stack p", contenuGet(page, "pillars_intro", ""));
    setTextContent(".maison-pillars__grid article:nth-of-type(1) h3", contenuGet(page, "pillar_1_title", ""));
    setTextContent(".maison-pillars__grid article:nth-of-type(1) p", contenuGet(page, "pillar_1_text", ""));
    setTextContent(".maison-pillars__grid article:nth-of-type(2) h3", contenuGet(page, "pillar_2_title", ""));
    setTextContent(".maison-pillars__grid article:nth-of-type(2) p", contenuGet(page, "pillar_2_text", ""));
    setTextContent(".maison-pillars__grid article:nth-of-type(3) h3", contenuGet(page, "pillar_3_title", ""));
    setTextContent(".maison-pillars__grid article:nth-of-type(3) p", contenuGet(page, "pillar_3_text", ""));
    setTextContent(".maison-recognition p", contenuGet(page, "recognition_text", ""));
  }

  function initAboutPeopleFilters() {
    var row = document.querySelector(".about-filters-row");
    var grid = document.querySelector(".about-people-grid, [data-authors-grid]");
    if (!row || !grid) return;

    var pills = Array.from(row.querySelectorAll("[data-about-filter]"));
    var cards = Array.from(grid.querySelectorAll(".about-person-card"));
    if (pills.length === 0 || cards.length === 0) return;

    function getCardRoles(card) {
      var explicit = (card.getAttribute("data-about-roles") || "").trim();
      if (explicit) return explicit.split(/\s+/).filter(Boolean);
      var roles = [];
      if (card.classList.contains("about-person-card--author")) roles.push("author");
      if (card.classList.contains("about-person-card--illustrator")) roles.push("illustrator");
      return roles;
    }

    function applyAboutFilter(filterKey) {
      pills.forEach(function (pill) {
        var key = pill.getAttribute("data-about-filter") || "all";
        var active = key === filterKey;
        pill.classList.toggle("is-active", active);
        pill.setAttribute("aria-pressed", active ? "true" : "false");
      });
      cards.forEach(function (card) {
        var roles = getCardRoles(card);
        var show = false;
        if (filterKey === "all") show = true;
        else if (filterKey === "author") show = roles.indexOf("author") !== -1;
        else if (filterKey === "illustrator") show = roles.indexOf("illustrator") !== -1;
        card.classList.toggle("is-filtered-out", !show);
      });
    }

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        applyAboutFilter(pill.getAttribute("data-about-filter") || "all");
      });
    });

    applyAboutFilter("all");
  }

  function recordRecentlyViewed(bookId) {
    if (!bookId) return;
    try {
      var list = safeParse(localStorage.getItem(STORAGE_KEYS.recentlyViewed), []);
      if (!Array.isArray(list)) list = [];
      list = list.filter(function (id) {
        return id !== bookId;
      });
      list.unshift(bookId);
      localStorage.setItem(STORAGE_KEYS.recentlyViewed, JSON.stringify(list.slice(0, 12)));
    } catch (e) {
      /* no-op */
    }
  }

  function getRecentlyViewedIds() {
    try {
      var list = safeParse(localStorage.getItem(STORAGE_KEYS.recentlyViewed), []);
      if (!Array.isArray(list)) return [];
      return list.filter(function (id) {
        return BOOK_CATALOG[id] && !BOOK_CATALOG[id].catalogHidden;
      });
    } catch (e) {
      return [];
    }
  }

  function isRecentlyViewedSectionHidden() {
    try {
      return localStorage.getItem(STORAGE_KEYS.recentlyViewedHidden) === "1";
    } catch (e) {
      return false;
    }
  }

  function setRecentlyViewedSectionHidden(hidden) {
    try {
      if (hidden) {
        localStorage.setItem(STORAGE_KEYS.recentlyViewedHidden, "1");
      } else {
        localStorage.removeItem(STORAGE_KEYS.recentlyViewedHidden);
      }
    } catch (e) {
      /* no-op */
    }
  }

  var RECENTLY_VIEWED_HOST_SELECTORS = [
    "#home-recently-viewed",
    "#catalogue-recently-viewed",
    "[data-account-recently-viewed]",
  ];

  function refreshAllRecentlyViewedSections() {
    RECENTLY_VIEWED_HOST_SELECTORS.forEach(function (selector) {
      renderRecentlyViewedSection(selector);
    });
  }

  function bindRecentlyViewedHostActions(host) {
    if (!host || host.dataset.recentlyViewedBound) return;
    host.dataset.recentlyViewedBound = "1";
    host.addEventListener("click", function (event) {
      if (event.target.closest("[data-recently-viewed-hide]")) {
        event.preventDefault();
        setRecentlyViewedSectionHidden(true);
        refreshAllRecentlyViewedSections();
        return;
      }
      if (event.target.closest("[data-recently-viewed-restore]")) {
        event.preventDefault();
        setRecentlyViewedSectionHidden(false);
        refreshAllRecentlyViewedSections();
      }
    });
  }

  function renderRecentlyViewedSection(hostSelector) {
    var host = document.querySelector(hostSelector);
    if (!host) return;
    bindRecentlyViewedHostActions(host);

    var ids = getRecentlyViewedIds().slice(0, 8);
    if (ids.length === 0) {
      host.innerHTML = "";
      host.hidden = true;
      return;
    }

    if (isRecentlyViewedSectionHidden()) {
      host.hidden = false;
      host.innerHTML =
        '<p class="recently-viewed-restore">' +
        '<button type="button" class="recently-viewed-restore-btn" data-recently-viewed-restore>' +
        escapeCatalogHtml(t("ui.recentlyViewedRestore", "Afficher les récemment consultés")) +
        "</button></p>";
      return;
    }

    host.hidden = false;
    var hideLabel = t("ui.recentlyViewedHide", "Masquer");
    var hideAria = t(
      "ui.recentlyViewedHideAria",
      "Masquer la section Récemment consultés"
    );
    host.innerHTML =
      '<section class="recently-viewed-section" aria-label="' +
      escapeCatalogHtml(t("ui.recentlyViewed", "Récemment consultés")) +
      '"><div class="recently-viewed-header">' +
      '<h2 class="section-titre">' +
      escapeCatalogHtml(t("ui.recentlyViewed", "Récemment consultés")) +
      '</h2><button type="button" class="recently-viewed-hide-btn" data-recently-viewed-hide aria-label="' +
      escapeCatalogHtml(hideAria) +
      '"><span class="recently-viewed-hide-btn__icon" aria-hidden="true">×</span><span>' +
      escapeCatalogHtml(hideLabel) +
      "</span></button></div>" +
      '<div class="recently-viewed-row">' +
      ids
        .map(function (id) {
          var book = getLocalizedBook(id);
          if (!book) return "";
          return (
            '<a class="recently-viewed-card" href="./livre.html?id=' +
            encodeURIComponent(id) +
            '"><img src="' +
            escapeCatalogHtml(book.cover) +
            '" alt="" loading="lazy" decoding="async" width="140" height="186"><span>' +
            escapeCatalogHtml(book.title) +
            "</span></a>"
          );
        })
        .join("") +
      "</div></section>";
  }

  function renderHomeTrustSection() {
    if (document.querySelector(".home-trust-band")) return;
    var stats = document.querySelector(".stats-band");
    if (!stats) return;

    var logos = [
      { src: "images/partners/ctm.png", alt: "CTM" },
      { src: "images/partners/labo-des-histoires.png", alt: "Le Labo des histoires" },
      { src: "images/partners/expertes-france.png", alt: "Expertes France" },
      { src: "images/partners/filibo.png", alt: "RÉZO Fil'bo" },
      { src: "images/partners/parc-naturel-marin.png", alt: "Parc naturel marin" },
    ];

    var section = document.createElement("section");
    section.className = "home-trust-band reveal-on-scroll";
    section.innerHTML =
      '<div class="home-trust-band__inner">' +
      "<h2>" +
      escapeCatalogHtml(t("ui.homeTrustTitle", "Ils nous font confiance")) +
      "</h2>" +
      '<p class="home-trust-band__lead">' +
      escapeCatalogHtml(
        t(
          "ui.homeTrustLead",
          "Partenaires institutionnels, réseaux éducatifs et familles qui partagent nos albums."
        )
      ) +
      "</p>" +
      '<div class="home-trust-badges">' +
      '<span class="home-trust-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6z"/></svg>' +
      escapeCatalogHtml(t("ui.badgeSecurePay", "Paiement sécurisé")) +
      "</span>" +
      '<span class="home-trust-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11h18v10H3zM7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
      escapeCatalogHtml(t("ui.badgeOverseas", "Livraison Outremer")) +
      "</span>" +
      '<span class="home-trust-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>' +
      escapeCatalogHtml(t("ui.badgeMartinique", "Made in Martinique")) +
      "</span>" +
      "</div>" +
      '<div class="home-trust-logos">' +
      logos
        .map(function (logo) {
          return (
            '<img src="' +
            escapeCatalogHtml(logo.src) +
            '" alt="' +
            escapeCatalogHtml(logo.alt) +
            '" loading="lazy" decoding="async" width="120" height="42">'
          );
        })
        .join("") +
      "</div>" +
      '<div class="home-trust-testimonials">' +
      '<blockquote class="home-trust-quote"><p>' +
      escapeCatalogHtml(
        t(
          "ui.testimonial1",
          "« Les albums Nikou sont devenus nos livres de référence en maternelle : ludiques, inclusifs et parfaits pour l'éveil aux langues. »"
        )
      ) +
      '</p><cite>' +
      escapeCatalogHtml(t("ui.testimonial1Author", "Enseignante maternelle · Martinique")) +
      "</cite></blockquote>" +
      '<blockquote class="home-trust-quote"><p>' +
      escapeCatalogHtml(
        t(
          "ui.testimonial2",
          "« Exocette permet d'aborder le handicap et l'environnement avec tendresse — nos élèves adorent les illustrations. »"
        )
      ) +
      '</p><cite>' +
      escapeCatalogHtml(t("ui.testimonial2Author", "Documentaliste scolaire")) +
      "</cite></blockquote>" +
      '<blockquote class="home-trust-quote"><p>' +
      escapeCatalogHtml(
        t(
          "ui.testimonial3",
          "« Enfin des histoires qui ressemblent à nos enfants martiniquais, en plusieurs langues selon les ouvrages. »"
        )
      ) +
      '</p><cite>' +
      escapeCatalogHtml(t("ui.testimonial3Author", "Parent lecteur")) +
      "</cite></blockquote>" +
      "</div>" +
      '<p style="text-align:center;margin-top:1rem"><a href="./a-propos-partenaires.html" class="voir-tout">' +
      escapeCatalogHtml(t("ui.allPartners", "Tous nos partenaires →")) +
      "</a></p></div>";
    stats.insertAdjacentElement("afterend", section);
  }

  function bindCatalogueSort() {
    var select = document.querySelector("[data-catalogue-sort]");
    if (!select || select.dataset.bound === "1") return;
    select.dataset.bound = "1";
    select.value = getCatalogSortMode();
    select.addEventListener("change", function () {
      CATALOGUE_STATE.sort = select.value || "editorial";
      CATALOGUE_STATE.currentPage = 1;
      renderCatalogueGrid();
      if (typeof window.__sucrierApplyCatalogueFilters === "function") {
        window.__sucrierApplyCatalogueFilters(false);
      }
    });
  }

  function bindCatalogueAgeChips() {
    var chipsHost = document.querySelector("[data-catalogue-age-chips]");
    if (!chipsHost || chipsHost.dataset.bound === "1") return;
    chipsHost.dataset.bound = "1";
    var chips = chipsHost.querySelectorAll(".catalogue-age-chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var age = chip.getAttribute("data-age-filter");
        if (!age) return;
        var input = document.querySelector('input[name="filter-age"][value="' + age + '"]');
        if (!input) return;
        var willActivate = !chip.classList.contains("is-active");
        chips.forEach(function (c) {
          c.classList.remove("is-active");
        });
        document.querySelectorAll('input[name="filter-age"]').forEach(function (el) {
          el.checked = false;
        });
        if (willActivate) {
          input.checked = true;
          chip.classList.add("is-active");
        }
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  function initBookDetailEnhancements(bookId) {
    recordRecentlyViewed(bookId);
    var titleNode = document.getElementById("book-detail-title");
    if (titleNode) titleNode.setAttribute("data-book-title", "1");

    var wishlistBtn = document.getElementById("book-detail-wishlist");
    if (wishlistBtn) {
      wishlistBtn.setAttribute("data-product-id", bookId);
      refreshWishlistButtonStates();
    }

    var qtyInput = document.getElementById("book-detail-qty");
    var minus = document.getElementById("book-detail-qty-minus");
    var plus = document.getElementById("book-detail-qty-plus");
    if (qtyInput && minus && plus && qtyInput.dataset.qtyBound !== "1") {
      qtyInput.dataset.qtyBound = "1";
      function setBookDetailQty(next) {
        var v = Math.min(99, Math.max(1, next));
        qtyInput.value = String(v);
      }
      minus.addEventListener("click", function () {
        setBookDetailQty((parseInt(qtyInput.value, 10) || 1) - 1);
      });
      plus.addEventListener("click", function () {
        setBookDetailQty((parseInt(qtyInput.value, 10) || 1) + 1);
      });
      qtyInput.addEventListener("blur", function () {
        setBookDetailQty(parseInt(qtyInput.value, 10) || 1);
      });
      qtyInput.addEventListener("change", function () {
        setBookDetailQty(parseInt(qtyInput.value, 10) || 1);
      });
      qtyInput.addEventListener(
        "wheel",
        function (event) {
          event.preventDefault();
        },
        { passive: false }
      );
    }

    var tabs = document.querySelectorAll("[data-book-tab]");
    var panels = document.querySelectorAll("[data-book-tab-panel]");
    if (tabs.length && panels.length) {
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var key = tab.getAttribute("data-book-tab");
          tabs.forEach(function (t) {
            var on = t.getAttribute("data-book-tab") === key;
            t.classList.toggle("is-active", on);
            t.setAttribute("aria-selected", on ? "true" : "false");
          });
          panels.forEach(function (panel) {
            var on = panel.getAttribute("data-book-tab-panel") === key;
            panel.classList.toggle("is-active", on);
            if (on) panel.removeAttribute("hidden");
            else panel.setAttribute("hidden", "");
          });
        });
      });
    }
  }

  function bindCatalogueFilters() {
    var grid = document.querySelector(".catalogue-grid");
    var resultNode = document.querySelector("[data-filter-results]");
    var resetBtn = document.querySelector('[data-action="reset-filters"]');
    var searchInput = document.querySelector("[data-catalogue-search-input]");
    var searchSuggestions = document.querySelector("[data-catalogue-search-suggestions]");
    if (!grid) return;
    var ageInputs = Array.from(document.querySelectorAll('input[name="filter-age"]'));
    var themeInputs = Array.from(document.querySelectorAll('input[name="filter-theme"]'));
    var searchQuery = "";

    function normalizeFilterText(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    }

    function getCategoryInputs() {
      return Array.from(document.querySelectorAll('input[name="filter-category"]'));
    }

    function getBookSearchHaystack(productId) {
      var book = BOOK_CATALOG[productId] || {};
      var parts = [
        book.title || "",
        book.collection || "",
        (book.authors || [])
          .map(function (author) {
            return author.name || "";
          })
          .join(" "),
        String(productId || "").replace(/-/g, " "),
      ];
      return normalizeFilterText(parts.join(" "));
    }

    function matchesAgeSelection(card, selectedAges) {
      if (selectedAges.length === 0) return true;

      var age = card.getAttribute("data-age-group") || "";
      var productId = card.getAttribute("data-product-id") || "";
      var book = BOOK_CATALOG[productId] || {};
      var normalizedCollection = normalizeFilterText(book.collection || card.getAttribute("data-collection") || "");
      var normalizedTitle = normalizeFilterText(book.title || "");

      var isBebeNikou = normalizedCollection.indexOf("bebe nikou") !== -1;
      var isNikou = normalizedCollection.indexOf("nikou") !== -1 && !isBebeNikou;
      var isKaramboleComptines =
        productId.indexOf("comptines-karambole") !== -1 ||
        (normalizedTitle.indexOf("comptines") !== -1 && normalizedTitle.indexOf("karambole") !== -1);

      return selectedAges.some(function (selectedAge) {
        if (selectedAge === "0-3") return isBebeNikou;
        if (selectedAge === "3-5") return isNikou || isKaramboleComptines;
        return selectedAge === age;
      });
    }

    function matchesCategorySelection(card, selectedCategories) {
      if (selectedCategories.length === 0) return true;
      var cardCategory = card.getAttribute("data-catalog-category") || "";
      return selectedCategories.indexOf(cardCategory) !== -1;
    }

    function matchesSearchSelection(card) {
      if (!searchQuery) return true;
      var productId = card.getAttribute("data-product-id") || "";
      return getBookSearchHaystack(productId).indexOf(searchQuery) !== -1;
    }

    function updateSearchSuggestions() {
      if (!searchInput || !searchSuggestions) return;
      var q = normalizeFilterText(searchInput.value);
      if (q.length < 2) {
        searchSuggestions.hidden = true;
        searchSuggestions.innerHTML = "";
        return;
      }

      var matches = Object.keys(BOOK_CATALOG)
        .filter(function (id) {
          return getBookSearchHaystack(id).indexOf(q) !== -1;
        })
        .slice(0, 8);

      if (!matches.length) {
        searchSuggestions.hidden = true;
        searchSuggestions.innerHTML = "";
        return;
      }

      searchSuggestions.innerHTML = matches
        .map(function (id) {
          var book = getLocalizedBook(id);
          return (
            '<li><button type="button" class="catalogue-search-suggestion" data-product-id="' +
            escapeCatalogHtml(id) +
            '"><span class="catalogue-search-suggestion-title">' +
            escapeCatalogHtml(book.title) +
            '</span><span class="catalogue-search-suggestion-meta">' +
            escapeCatalogHtml(book.collection || "") +
            "</span></button></li>"
          );
        })
        .join("");
      searchSuggestions.hidden = false;

      searchSuggestions.querySelectorAll(".catalogue-search-suggestion").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-product-id") || "";
          var book = BOOK_CATALOG[id];
          if (book && searchInput) searchInput.value = book.title;
          searchQuery = normalizeFilterText(searchInput ? searchInput.value : "");
          searchSuggestions.hidden = true;
          applyFilters(true);
        });
      });
    }

    function applyFilters(resetPage) {
      var selectedAges = ageInputs
        .filter(function (input) {
          return input.checked;
        })
        .map(function (input) {
          return input.value;
        });
      var selectedThemes = themeInputs
        .filter(function (input) {
          return input.checked;
        })
        .map(function (input) {
          return input.value;
        });
      var selectedCategories = getCategoryInputs()
        .filter(function (input) {
          return input.checked;
        })
        .map(function (input) {
          return input.value;
        });
      var filteredCards = [];
      grid.querySelectorAll(".catalogue-card").forEach(function (card) {
        var themesAttr = card.getAttribute("data-themes") || card.getAttribute("data-theme") || "";
        var cardThemes = themesAttr.split(/\s+/).filter(Boolean);
        var ageMatch = matchesAgeSelection(card, selectedAges);
        var themeMatch =
          selectedThemes.length === 0 ||
          selectedThemes.some(function (selectedTheme) {
            return cardThemes.includes(selectedTheme);
          });
        var categoryMatch = matchesCategorySelection(card, selectedCategories);
        var searchMatch = matchesSearchSelection(card);
        var show = ageMatch && themeMatch && categoryMatch && searchMatch;
        if (show) filteredCards.push(card);
      });

      var visible = filteredCards.length;
      if (resetPage) CATALOGUE_STATE.currentPage = 1;
      updateCataloguePagination(grid, filteredCards, visible);

      if (resultNode) {
        if (I18N_STATE.language === "en") {
          resultNode.textContent = visible + " product" + (visible > 1 ? "s" : "") + " shown";
        } else {
          resultNode.textContent = visible + " produit" + (visible > 1 ? "s" : "") + " affiche" + (visible > 1 ? "s" : "");
        }
      }
    }

    function bindFilterInputs() {
      var categoryInputs = getCategoryInputs();
      var allInputs = ageInputs.concat(themeInputs).concat(categoryInputs);
      allInputs.forEach(function (input) {
        input.removeEventListener("change", applyFilters);
        input.addEventListener("change", applyFilters);
      });
    }

    bindFilterInputs();

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        searchQuery = normalizeFilterText(searchInput.value);
        updateSearchSuggestions();
        applyFilters(true);
      });
      searchInput.addEventListener("focus", updateSearchSuggestions);
      searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && searchSuggestions) {
          searchSuggestions.hidden = true;
        }
      });
    }

    document.addEventListener("click", function (event) {
      if (!searchSuggestions || !searchInput) return;
      if (searchSuggestions.contains(event.target) || searchInput.contains(event.target)) return;
      searchSuggestions.hidden = true;
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        ageInputs.concat(themeInputs).concat(getCategoryInputs()).forEach(function (input) {
          input.checked = false;
        });
        if (searchInput) searchInput.value = "";
        searchQuery = "";
        if (searchSuggestions) {
          searchSuggestions.hidden = true;
          searchSuggestions.innerHTML = "";
        }
        applyFilters(true);
      });
    }

    var params = new URLSearchParams(window.location.search);
    if (params.get("persona") === "parent") {
      var parentPresetAge = document.querySelector('input[name="filter-age"][value="3-5"]');
      var parentPresetTheme = document.querySelector('input[name="filter-theme"][value="apprentissage"]');
      if (parentPresetAge) parentPresetAge.checked = true;
      if (parentPresetTheme) parentPresetTheme.checked = true;
    }

    var presetCategory = params.get("cat") || params.get("category");
    if (presetCategory) {
      var presetInput = document.querySelector(
        'input[name="filter-category"][value="' + presetCategory + '"]'
      );
      if (presetInput) presetInput.checked = true;
    }

    var presetQuery = params.get("q") || "";
    if (presetQuery && searchInput) {
      searchInput.value = presetQuery;
      searchQuery = normalizeFilterText(presetQuery);
    }

    applyFilters(true);

    window.__sucrierApplyCatalogueFilters = function (resetPage) {
      applyFilters(resetPage !== false);
    };

    return bindFilterInputs;
  }

  function restoreDesktopHeaderIcons(header) {
    if (!header) return;
    var menu = header.querySelector(".header-actions-menu");
    if (!menu) return;
    var panel = menu.querySelector(".header-actions-panel");
    if (!panel) {
      menu.parentNode && menu.parentNode.removeChild(menu);
      return;
    }
    var icons = header.querySelector(".header-icons");
    if (!icons) {
      icons = document.createElement("div");
      icons.className = "header-icons";
      icons.setAttribute("aria-label", "Outils du site");
      header.appendChild(icons);
    }
    Array.from(panel.children).forEach(function (child) {
      if (child.classList && child.classList.contains("header-about-block")) return;
      icons.appendChild(child);
    });
    menu.parentNode && menu.parentNode.removeChild(menu);
    updateHeaderAuthState();
  }

  function initHeaderDropdownMenu() {
    var header = document.querySelector("header");
    if (!header || header.classList.contains("partners-hero")) return;
    var mobileMq = window.matchMedia("(max-width: 767px)");

    function applyHeaderLayout() {
      if (!mobileMq.matches) {
        restoreDesktopHeaderIcons(header);
        return;
      }
      var headerIcons = header.querySelector(".header-icons");
      if (!headerIcons || header.querySelector(".header-actions-menu")) return;

      var menu = document.createElement("details");
      menu.className = "header-actions-menu";
      menu.innerHTML =
        '<summary class="header-actions-trigger" aria-label="Ouvrir les options">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
        "</summary>" +
        '<div class="header-actions-panel"></div>';

      var panel = menu.querySelector(".header-actions-panel");
      Array.from(headerIcons.children).forEach(function (child) {
        panel.appendChild(child);
      });

      var aboutMobileBlock = document.createElement("div");
      aboutMobileBlock.className = "header-about-block";
      aboutMobileBlock.innerHTML =
        '<a href="./a-propos.html" class="header-about-main-link" data-fr="À propos" data-en="About">À propos</a>' +
        '<details class="header-about-menu">' +
        '<summary class="header-about-trigger">' +
        '<span class="sr-only" data-fr="Autres rubriques À propos" data-en="Other About sections">Autres rubriques À propos</span>' +
        "</summary>" +
        '<div class="header-about-links">' +
        '<a href="./a-propos-maison.html" data-fr="La Maison" data-en="The House">La Maison</a>' +
        '<a href="./a-propos-auteurs.html" data-fr="Les Auteurs / Illustrateurs" data-en="Authors / Illustrators">Les Auteurs / Illustrateurs</a>' +
        '<a href="./a-propos-partenaires.html" data-fr="Les Partenaires" data-en="Partners">Les Partenaires</a>' +
        "</div></details>";
      panel.insertBefore(aboutMobileBlock, panel.firstChild);

      headerIcons.remove();
      header.appendChild(menu);

      panel.querySelectorAll("a, button").forEach(function (node) {
        node.addEventListener("click", function () {
          menu.removeAttribute("open");
        });
      });

      panel.querySelectorAll("select").forEach(function (node) {
        node.addEventListener("change", function () {
          setTimeout(function () {
            menu.removeAttribute("open");
          }, 80);
        });
      });

      updateHeaderAuthState();
    }

    applyHeaderLayout();
    if (typeof mobileMq.addEventListener === "function") {
      mobileMq.addEventListener("change", applyHeaderLayout);
    } else if (typeof mobileMq.addListener === "function") {
      mobileMq.addListener(applyHeaderLayout);
    }
  }

  function initAboutNavDropdown() {
    var header = document.querySelector("header");
    if (!header) return;
    var navList = header.querySelector("nav ul");
    if (!navList) return;
    if (navList.querySelector(".nav-about-item")) return;

    var aboutLink = Array.from(navList.querySelectorAll("a")).find(function (link) {
      var href = String(link.getAttribute("href") || "").toLowerCase();
      return href === "a-propos.html" || href === "./a-propos.html" || href.endsWith("/a-propos.html");
    });
    if (!aboutLink) return;
    var aboutItem = aboutLink.closest("li");
    if (!aboutItem) return;

    aboutItem.className = "nav-about-item";
    aboutItem.innerHTML = "";

    var root = document.createElement("a");
    root.className = "nav-about-root";
    root.href = "./a-propos.html";
    root.setAttribute("data-fr", "À propos");
    root.setAttribute("data-en", "About");
    root.textContent = "À propos";

    var menu = document.createElement("details");
    menu.className = "nav-about-menu";

    var summary = document.createElement("summary");
    summary.className = "nav-about-trigger";
    summary.setAttribute(
      "aria-label",
      "Afficher ou masquer les sous-pages À propos"
    );
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.setAttribute("data-fr", "Rubriques : La Maison, Auteurs, Partenaires");
    sr.setAttribute("data-en", "Sections: The House, Authors, Partners");
    sr.textContent = "Rubriques : La Maison, Auteurs, Partenaires";
    summary.appendChild(sr);

    var ul = document.createElement("ul");
    ul.className = "nav-about-submenu";
    ul.innerHTML =
      '<li class="nav-about-submenu-lead" aria-hidden="true">' +
      '<span data-fr="Découvrir" data-en="Discover">Découvrir</span></li>' +
      '<li><a class="nav-about-link" href="./a-propos-maison.html">' +
      '<span class="nav-about-link__title" data-fr="La Maison" data-en="The House">La Maison</span>' +
      '<span class="nav-about-link__desc" data-fr="Notre histoire & nos valeurs" data-en="Our story & values">Notre histoire & nos valeurs</span>' +
      "</a></li>" +
      '<li><a class="nav-about-link" href="./a-propos-auteurs.html">' +
      '<span class="nav-about-link__title" data-fr="Les Auteurs / Illustrateurs" data-en="Authors / Illustrators">Les Auteurs / Illustrateurs</span>' +
      '<span class="nav-about-link__desc" data-fr="Les talents de la maison" data-en="Our creative team">Les talents de la maison</span>' +
      "</a></li>" +
      '<li><a class="nav-about-link" href="./a-propos-partenaires.html">' +
      '<span class="nav-about-link__title" data-fr="Les Partenaires" data-en="Partners">Les Partenaires</span>' +
      '<span class="nav-about-link__desc" data-fr="Librairies & diffuseurs" data-en="Bookshops & distributors">Librairies & diffuseurs</span>' +
      "</a></li>";

    menu.appendChild(summary);
    menu.appendChild(ul);
    aboutItem.appendChild(root);
    aboutItem.appendChild(menu);

    menu.addEventListener("toggle", function () {
      summary.setAttribute("aria-expanded", menu.open ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!menu.open) return;
      if (menu.contains(event.target)) return;
      menu.removeAttribute("open");
    });
  }

  function renderAccountDashboardLists(dashboardRoot) {
    if (!dashboardRoot) return;
    var emailEl = dashboardRoot.querySelector("[data-account-session-email]");
    var segEl = dashboardRoot.querySelector("[data-account-session-segment]");
    var ordersEl = dashboardRoot.querySelector("[data-account-orders]");
    var addrList = dashboardRoot.querySelector("[data-account-address-list]");
    var dlList = dashboardRoot.querySelector("[data-account-download-list]");
    var proBlocks = dashboardRoot.querySelector("[data-account-pro-only]");
    if (!isClientAuthenticated()) {
      if (emailEl) emailEl.textContent = "";
      if (segEl) segEl.textContent = "";
      if (ordersEl) ordersEl.innerHTML = "";
      if (addrList) addrList.innerHTML = "";
      if (dlList) dlList.innerHTML = "";
      if (proBlocks) proBlocks.hidden = true;
      var addrFormClear = dashboardRoot.querySelector("[data-account-address-form]");
      if (addrFormClear) addrFormClear.reset();
      return;
    }
    var s = getClientAuthSession();
    if (emailEl) emailEl.textContent = s.email || "";
    if (segEl) {
      segEl.textContent =
        getEffectiveUserSegment() === "professionnel"
          ? t("ui.accountSegmentBadgePro", "Compte professionnel")
          : t("ui.accountSegmentBadgePerso", "Compte particulier");
    }
    if (proBlocks) {
      proBlocks.hidden = getEffectiveUserSegment() !== "professionnel";
    }
    if (ordersEl) {
      var orders = getOrderHistory();
      if (orders.length === 0) {
        ordersEl.innerHTML =
          "<p class=\"account-dashboard-empty\">" +
          t(
            "messages.accountOrdersEmpty",
            "Aucune commande enregistrée sur cet appareil. Après un paiement validé, votre panier apparaît ici comme trace locale."
          ) +
          "</p>";
      } else {
        ordersEl.innerHTML = orders
          .map(function (o) {
            var d = o.date ? new Date(o.date) : new Date();
            var label = d.toLocaleDateString(I18N_STATE.language === "en" ? "en-GB" : "fr-FR");
            var lines = (o.items || [])
              .map(function (it) {
                return escapeCatalogHtml(it.title) + " × " + String(it.qty || 1);
              })
              .join("<br>");
            return (
              "<article class=\"account-dash-card\"><h4>" +
              t("ui.accountOrderOn", "Commande du ") +
              label +
              "</h4><p class=\"account-order-lines\">" +
              lines +
              "</p><p class=\"account-order-total\"><strong>" +
              t("ui.accountOrderTotal", "Total TTC (estimé) :") +
              "</strong> " +
              formatPrice(Number(o.totalEur) || 0) +
              "</p></article>"
            );
          })
          .join("");
      }
    }
    if (addrList) {
      var addrs = getShippingAddresses();
      if (addrs.length === 0) {
        addrList.innerHTML =
          "<li class=\"account-dashboard-empty\">" +
          t("messages.accountAddressesEmpty", "Aucune adresse enregistrée. Ajoutez-en une ci-dessous (stockage local sur cet appareil).") +
          "</li>";
      } else {
        addrList.innerHTML = addrs
          .map(function (a, idx) {
            return (
              "<li><div><strong>" +
              escapeCatalogHtml(a.label || t("ui.accountAddressDefaultLabel", "Adresse")) +
              "</strong><br>" +
              escapeCatalogHtml(a.line1 || "") +
              (a.line2 ? "<br>" + escapeCatalogHtml(a.line2) : "") +
              "<br>" +
              escapeCatalogHtml(a.postal || "") +
              " " +
              escapeCatalogHtml(a.city || "") +
              (a.country ? " (" + escapeCatalogHtml(a.country) + ")" : "") +
              "</div><button type=\"button\" class=\"btn-outline\" data-remove-address=\"" +
              String(idx) +
              "\">" +
              t("ui.remove", "Retirer") +
              "</button></li>"
            );
          })
          .join("");
      }
    }
    if (dlList) {
      var downs = getProResourceDownloads();
      if (downs.length === 0) {
        dlList.innerHTML =
          "<li class=\"account-dashboard-empty\">" +
          t("messages.accountDownloadsEmpty", "Aucun téléchargement enregistré. Les fiches pédagogiques téléchargées depuis une fiche produit apparaissent ici.") +
          "</li>";
      } else {
        dlList.innerHTML = downs
          .map(function (x) {
            var d2 = x.date ? new Date(x.date) : new Date();
            var lab = d2.toLocaleString(I18N_STATE.language === "en" ? "en-GB" : "fr-FR");
            return (
              "<li><strong>" +
              escapeCatalogHtml(x.label || "") +
              "</strong> — " +
              lab +
              (x.bookId ? " <span class=\"account-dl-book\">(" + escapeCatalogHtml(x.bookId) + ")</span>" : "") +
              "</li>"
            );
          })
          .join("");
      }
    }
  }

  function syncAccountDashboardVisibility() {
    var authed = isClientAuthenticated();
    var guestRoot = document.querySelector("[data-account-guest-root]");
    var connectedCta = document.querySelector("[data-account-connected-cta]");
    var espaceGate = document.querySelector("[data-account-espace-guest]");
    var heroLine = document.querySelector("[data-account-hero-line]");
    var espaceHero = document.querySelector("[data-account-espace-hero]");

    if (guestRoot) guestRoot.hidden = authed;
    if (connectedCta) connectedCta.hidden = !authed;
    if (espaceGate) espaceGate.hidden = authed;

    document.querySelectorAll("[data-account-dashboard]").forEach(function (dashboardRoot) {
      dashboardRoot.hidden = !authed;
      renderAccountDashboardLists(dashboardRoot);
    });

    if (heroLine) {
      if (connectedCta) {
        heroLine.textContent = authed
          ? t(
              "messages.accountCompteHeroAuthed",
              "Vous êtes connecté — votre tableau de bord est sur la page dédiée « Votre espace »."
            )
          : t("messages.accountDashboardHeroGuest", "Choisissez votre profil pour une expérience adaptée.");
      } else {
        heroLine.textContent = authed
          ? t("messages.accountDashboardHeroAuthed", "Gérez vos commandes, adresses et ressources selon votre type de compte.")
          : t("messages.accountDashboardHeroGuest", "Choisissez votre profil pour une expérience adaptée.");
      }
    }

    if (espaceHero) {
      if (!authed) {
        espaceHero.textContent = t(
          "messages.accountEspaceHeroGuest",
          "Connectez-vous pour retrouver vos commandes, adresses et ressources."
        );
      } else {
        espaceHero.textContent = t(
          "messages.accountEspaceHeroAuthedLead",
          "Vos commandes, adresses et favoris sont regroupés dans les blocs ci-dessous."
        );
      }
    }
  }

  function bindAccountDashboardInteractions(dashboardRoot, onLogoutExtra) {
    if (!dashboardRoot || dashboardRoot.dataset.accountDashDelegation) return;
    dashboardRoot.dataset.accountDashDelegation = "1";
    dashboardRoot.addEventListener("click", function (ev) {
      var rm = ev.target && ev.target.closest ? ev.target.closest("[data-remove-address]") : null;
      if (rm) {
        var idx = parseInt(rm.getAttribute("data-remove-address") || "-1", 10);
        var list = getShippingAddresses();
        if (!isNaN(idx) && idx >= 0 && idx < list.length) {
          list.splice(idx, 1);
          saveShippingAddresses(list);
          syncAccountDashboardVisibility();
        }
      }
      if (ev.target && ev.target.closest && ev.target.closest('[data-action="logout"]')) {
        ev.preventDefault();
        fetch("./api/auth-logout.php", { method: "POST", credentials: "same-origin" })
          .then(function () {
            return {};
          })
          .catch(function () {
            return {};
          })
          .finally(function () {
            clearClientAuthSession();
            syncAccountDashboardVisibility();
            if (typeof onLogoutExtra === "function") onLogoutExtra();
          });
      }
    });
    var addrForm = dashboardRoot.querySelector("[data-account-address-form]");
    if (addrForm) {
      var addrLine1Input = addrForm.querySelector('input[name="addr_line1"]');
      var addrPostalInput = addrForm.querySelector('input[name="addr_postal"]');
      var addrCityInput = addrForm.querySelector('input[name="addr_city"]');
      var addrSuggestions = addrForm.querySelector("#account-address-suggestions");
      var addrFeedback = addrForm.querySelector("[data-account-address-feedback]");
      attachAddressAutocomplete(addrLine1Input, addrSuggestions, function (picked) {
        if (addrLine1Input && picked.line1) addrLine1Input.value = picked.line1;
        if (addrPostalInput && picked.postal) addrPostalInput.value = picked.postal;
        if (addrCityInput && picked.city) addrCityInput.value = picked.city;
      });
      addrForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var address = normalizeAddressPayload({
          label: (addrForm.querySelector('input[name="addr_label"]') || {}).value || "",
          line1: (addrForm.querySelector('input[name="addr_line1"]') || {}).value || "",
          line2: (addrForm.querySelector('input[name="addr_line2"]') || {}).value || "",
          postal: (addrForm.querySelector('input[name="addr_postal"]') || {}).value || "",
          city: (addrForm.querySelector('input[name="addr_city"]') || {}).value || "",
          country: (addrForm.querySelector('select[name="addr_country"]') || {}).value || "MQ",
        });
        var addressError = validateShippingAddress(address);
        if (addressError) {
          if (addrFeedback) addrFeedback.textContent = addressError;
          return;
        }
        var list = getShippingAddresses();
        list.push(address);
        saveShippingAddresses(list);
        addrForm.reset();
        if (addrFeedback) addrFeedback.textContent = t("messages.accountAddressSaved", "Adresse enregistrée.");
        syncAccountDashboardVisibility();
      });
    }
  }

  function initEspacePage() {
    if (!document.querySelector("[data-account-espace-page]")) return;
    var dashboardRoot = document.querySelector("[data-account-dashboard]");
    bindAccountDashboardInteractions(dashboardRoot, null);
    syncAccountDashboardVisibility();
    renderRecentlyViewedSection("[data-account-recently-viewed]");
  }

  function initAccountPage() {
    if (!document.querySelector(".account-page")) return;
    if (document.querySelector("[data-account-espace-page]")) return;

    var switchButtons = Array.from(document.querySelectorAll("[data-segment-select]"));
    var cards = Array.from(document.querySelectorAll("[data-segment-card]"));
    var messageNode = document.querySelector("[data-segment-message]");
    var accountForm = document.querySelector(".account-form:not([data-register-form])");
    var createAccountBtn = document.querySelector('[data-action="create-account"]');
    var googleBtn = document.querySelector('[data-auth-provider="google"]');
    var authFeedback = document.querySelector("[data-auth-feedback]");
    var googleTokenClient = null;

    function renderSegment(segment) {
      switchButtons.forEach(function (btn) {
        var active = btn.getAttribute("data-segment-select") === segment;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      cards.forEach(function (card) {
        card.classList.toggle("is-active", card.getAttribute("data-segment-card") === segment);
      });
      if (messageNode) {
        messageNode.textContent =
          segment === "professionnel"
            ? t(
                "messages.accountProfessionalSegment",
                "Parcours professionnel : fiches pédagogiques, devis / commandes groupées et suivi des téléchargements — en plus de tout l'espace particulier (commandes, adresses, favoris)."
              )
            : t(
                "messages.accountPersonalSegment",
                "Parcours particulier : historique de commandes, adresses de livraison, favoris et recommandations lecture."
              );
      }
    }

    if (switchButtons.length > 0 && cards.length > 0) {
      switchButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var segment = btn.getAttribute("data-segment-select");
          setSelectedSegment(segment);
          trackAuthEvent("segment_selected", { source: "switch_button", segment: segment });
          renderSegment(getSelectedSegment());
          if (btn.closest(".account-actions")) {
            var authBox = document.querySelector(".account-auth-box");
            if (authBox) {
              authBox.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });
      });
    }

    if (accountForm) {
      accountForm.addEventListener("submit", function (event) {
        event.preventDefault();
        trackAuthEvent("login_email_submitted", { provider: "password" });
        var emailInput = accountForm.querySelector('input[type="email"]');
        var passwordInput = accountForm.querySelector('input[type="password"]');
        var email = normalizeEmail(emailInput ? emailInput.value : "");
        var password = String(passwordInput ? passwordInput.value : "");
        if (!email || !password) {
          if (authFeedback) authFeedback.textContent = t("messages.accountEmailPasswordRequired", "Veuillez renseigner email et mot de passe.");
          return;
        }
        postApiJson(
          "./api/auth-login.php",
          {
            provider: "password",
            email: email,
            password: password,
            segment: getSelectedSegment(),
          },
          t("messages.accountLoginFailed", "Connexion impossible.")
        )
          .then(function (data) {
            if (!persistAuthFromLoginResponse(data)) {
              showLoginSegmentMismatchModal();
              return;
            }
            if (authFeedback) authFeedback.textContent = t("messages.accountLoginSuccess", "Connexion réussie. Bienvenue dans votre espace.");
            syncAccountDashboardVisibility();
          })
          .catch(function (error) {
            if (isLoginSegmentMismatchError(error)) {
              showLoginSegmentMismatchModal();
              return;
            }
            if (authFeedback) authFeedback.textContent = error.message || t("messages.accountLoginNetworkError", "Erreur réseau pendant la connexion.");
          });
      });
    }

    if (createAccountBtn) {
      createAccountBtn.addEventListener("click", function () {
        trackAuthEvent("create_account_clicked", { source: "account_page" });
        window.location.href = "./inscription.html?segment=" + encodeURIComponent(getSelectedSegment());
      });
    }

    if (googleBtn) {
      var clientId = String(window.SUCRIER_GOOGLE_CLIENT_ID || "").trim();
      if (!clientId) {
        googleBtn.disabled = true;
        if (authFeedback) {
          authFeedback.textContent = t(
            "messages.googleUnavailable",
            "Connexion Google indisponible: renseignez window.SUCRIER_GOOGLE_CLIENT_ID dans google-auth-config.js."
          );
        }
      } else if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) {
        googleBtn.disabled = true;
        if (authFeedback) {
          authFeedback.textContent = t("messages.googleSdkMissing", "SDK Google non chargé. Rechargez la page pour réessayer.");
        }
      } else {
        googleTokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: function (tokenResponse) {
            if (!tokenResponse || tokenResponse.error || !tokenResponse.access_token) {
              trackAuthEvent("google_login_error", { reason: tokenResponse && tokenResponse.error ? tokenResponse.error : "unknown" });
              if (authFeedback) authFeedback.textContent = t("messages.googleLoginFailed", "Échec de connexion Google. Réessayez.");
              return;
            }
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: {
                Authorization: "Bearer " + tokenResponse.access_token,
              },
            })
              .then(function (response) {
                return response.json();
              })
              .then(function (profile) {
                postApiJson(
                  "./api/auth-login.php",
                  {
                    provider: "google",
                    accessToken: tokenResponse.access_token,
                    segment: getSelectedSegment(),
                  },
                  t("messages.googleLoginDenied", "Connexion Google refusée.")
                )
                  .then(function (data) {
                    if (!persistAuthFromLoginResponse(data)) {
                      showLoginSegmentMismatchModal();
                      return;
                    }
                    trackAuthEvent("google_login_success", { email: profile.email || "" });
                    if (authFeedback) {
                      authFeedback.textContent = t("messages.googleConnected", "Connecté avec Google") + (profile.name ? " : " + profile.name : "") + ".";
                    }
                    syncAccountDashboardVisibility();
                  })
                  .catch(function (error) {
                    if (isLoginSegmentMismatchError(error)) {
                      showLoginSegmentMismatchModal();
                      return;
                    }
                    var msg = error && error.message ? error.message : "";
                    if (/indisponible|Service temporairement/i.test(msg)) {
                      msg =
                        t(
                          "messages.googleLoginServerDb",
                          "Connexion Google bloquée côté serveur (base PostgreSQL ou PHP). Ouvrez /api/health.php pour le diagnostic."
                        ) + (msg ? " (" + msg + ")" : "");
                    }
                    if (authFeedback) authFeedback.textContent = msg || t("messages.googleLoginNetworkError", "Erreur réseau pendant la connexion Google.");
                  });
              })
              .catch(function () {
                trackAuthEvent("google_profile_fetch_error", {});
                if (authFeedback) {
                  authFeedback.textContent = t(
                    "messages.googleProfileUnavailable",
                    "Connexion Google réussie, mais profil indisponible."
                  );
                }
              });
          },
        });

        googleBtn.addEventListener("click", function () {
          trackAuthEvent("continue_with_google_clicked", { source: "account_page" });
          if (!googleTokenClient) return;
          googleTokenClient.requestAccessToken({ prompt: "select_account" });
        });
      }
    }

    var params = new URLSearchParams(window.location.search);
    var segmentFromUrl = params.get("segment");
    if (segmentFromUrl === "professionnel" || segmentFromUrl === "particulier") {
      setSelectedSegment(segmentFromUrl);
      trackAuthEvent("segment_selected", { source: "url_param", segment: segmentFromUrl });
    }
    if (params.get("registered") === "1" && authFeedback) {
      authFeedback.textContent = t("messages.accountRegisteredSuccess", "Compte créé avec succès. Vous pouvez vous connecter.");
    }
    if (switchButtons.length > 0 && cards.length > 0) {
      renderSegment(getSelectedSegment());
    }
    syncAccountDashboardVisibility();
  }

  function initRegistrationPage() {
    var form = document.querySelector("[data-register-form]");
    if (!form) return;
    var feedback = document.querySelector("[data-register-feedback]");
    var googleBtn = document.querySelector('[data-register-provider="google"]');
    var clientId = String(window.SUCRIER_GOOGLE_CLIENT_ID || "").trim();
    var tokenClient = null;

    function setFeedback(message) {
      if (feedback) feedback.textContent = message;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = normalizeEmail((form.querySelector('input[name="email"]') || {}).value);
      var password = String((form.querySelector('input[name="password"]') || {}).value || "");
      var confirmPassword = String((form.querySelector('input[name="password_confirm"]') || {}).value || "");
      var consentAccepted = !!((form.querySelector('input[name="legal_consent"]') || {}).checked);
      if (!email || !password || !confirmPassword) {
        setFeedback(t("messages.registrationFillAllFields", "Veuillez remplir tous les champs."));
        return;
      }
      if (!consentAccepted) {
        setFeedback(
          t(
            "messages.registrationConsentRequired",
            "Vous devez accepter la politique de confidentialité, le RGPD et les mentions légales."
          )
        );
        return;
      }
      if (password.length < 8) {
        setFeedback(t("messages.registrationPasswordTooShort", "Le mot de passe doit contenir au moins 8 caractères."));
        return;
      }
      if (password !== confirmPassword) {
        setFeedback(t("messages.registrationPasswordsMismatch", "Les mots de passe ne correspondent pas."));
        return;
      }
      postApiJson(
        "./api/auth-register.php",
        {
          provider: "password",
          email: email,
          password: password,
          segment: getSelectedSegment(),
        },
        t("messages.registrationCreateFailed", "Création de compte impossible.")
      )
        .then(function () {
          window.location.href = "./compte.html?registered=1&segment=" + encodeURIComponent(getSelectedSegment());
        })
        .catch(function (error) {
          setFeedback(error.message || t("messages.registrationNetworkError", "Erreur réseau pendant la création du compte."));
        });
    });

    if (!googleBtn) return;
    if (!clientId || !(window.google && window.google.accounts && window.google.accounts.oauth2)) {
      googleBtn.disabled = true;
      return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: function (tokenResponse) {
        if (!tokenResponse || tokenResponse.error || !tokenResponse.access_token) {
          setFeedback(t("messages.googleUnavailableSimple", "Connexion Google indisponible."));
          return;
        }
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: "Bearer " + tokenResponse.access_token,
          },
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (profile) {
            var email = normalizeEmail(profile.email || "");
            if (!email) {
              setFeedback(t("messages.googleEmailUnavailable", "Impossible de récupérer l'email Google."));
              return;
            }
            postApiJson(
              "./api/auth-register.php",
              {
                provider: "google",
                accessToken: tokenResponse.access_token,
                segment: getSelectedSegment(),
              },
              t("messages.googleRegistrationFailed", "Création via Google impossible.")
            )
              .then(function () {
                window.location.href = "./compte.html?registered=1&segment=" + encodeURIComponent(getSelectedSegment());
              })
              .catch(function (error) {
                setFeedback(error.message || t("messages.googleRegistrationNetworkError", "Erreur réseau pendant l'inscription Google."));
              });
          })
          .catch(function () {
            setFeedback(t("messages.googleRegistrationError", "Création via Google échouée."));
          });
      },
    });

    googleBtn.addEventListener("click", function () {
      var consentAccepted = !!((form.querySelector('input[name="legal_consent"]') || {}).checked);
      if (!consentAccepted) {
        setFeedback(
          t(
            "messages.registrationConsentRequired",
            "Vous devez accepter la politique de confidentialité, le RGPD et les mentions légales."
          )
        );
        return;
      }
      tokenClient.requestAccessToken({ prompt: "select_account" });
    });
  }

  function initPasswordVisibilityToggles() {
    var passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    passwordInputs.forEach(function (input, index) {
      if (!input || input.hasAttribute("data-password-toggle-ready")) return;
      input.setAttribute("data-password-toggle-ready", "1");

      var wrapper = document.createElement("span");
      wrapper.className = "password-input-wrap";
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "password-toggle-btn";
      button.setAttribute("aria-label", "Afficher le mot de passe");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("title", "Afficher le mot de passe");
      button.setAttribute("data-password-toggle", String(index));
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M1.5 12s3.9-6.5 10.5-6.5S22.5 12 22.5 12s-3.9 6.5-10.5 6.5S1.5 12 1.5 12Z"></path><circle cx="12" cy="12" r="3.1"></circle></svg>';
      wrapper.appendChild(button);

      button.addEventListener("click", function () {
        var showPassword = input.type === "password";
        input.type = showPassword ? "text" : "password";
        button.classList.toggle("is-visible", showPassword);
        button.setAttribute("aria-pressed", showPassword ? "true" : "false");
        button.setAttribute("aria-label", showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
        button.setAttribute("title", showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
      });
    });
  }

  function initLegalFooterLinks() {
    var legalMap = [
      {
        pattern: /mentions?\s+l[ée]gales?/i,
        href: "./mentions-legales.html",
        labelFr: "Mentions légales",
        labelEn: "Legal notice",
      },
      {
        pattern: /politique\s+de\s+confidentialit[ée]|privacy/i,
        href: "./politique-confidentialite.html",
        labelFr: "Politique de confidentialité",
        labelEn: "Privacy policy",
      },
      { pattern: /^cgv$|conditions/i, href: "./cgv.html", labelFr: "CGV", labelEn: "Terms" },
    ];

    document.querySelectorAll(".footer-links a").forEach(function (link) {
      var raw = normalizeI18nText(link.textContent || "");
      for (var i = 0; i < legalMap.length; i += 1) {
        if (!legalMap[i].pattern.test(raw)) continue;
        link.setAttribute("href", legalMap[i].href);
        if (!link.hasAttribute("data-fr")) link.setAttribute("data-fr", legalMap[i].labelFr);
        if (!link.hasAttribute("data-en")) link.setAttribute("data-en", legalMap[i].labelEn);
        break;
      }
    });
  }

  function enforceUnifiedFooter() {
    var footer = document.querySelector("footer");
    if (!footer) return;
    footer.innerHTML =
      '<div class="footer-grid">' +
      '<div>' +
      '<div class="footer-brand">' +
      '<img src="./images/site/logo-footer-noir.webp" alt="" class="footer-logo-img" width="120" height="120" decoding="async" loading="lazy" aria-hidden="true">' +
      '<div class="footer-wordmark">' +
      '<span class="footer-brand-name">Les Éditions du Sucrier</span>' +
      '<span class="footer-brand-tagline" data-fr="Maison d\\\'édition jeunesse · Martinique" data-en="Children\\\'s publishing house · Martinique">Maison d\\\'édition jeunesse · Martinique</span>' +
      "</div>" +
      "</div>" +
      '<p class="footer-desc" data-fr="Maison d\\\'édition jeunesse martiniquaise fondée en 2018, dédiée à raconter la Caraïbe aux plus jeunes à travers des albums illustrés, dont certains en plusieurs langues." data-en="Martinique-based children\\\'s publisher founded in 2018, dedicated to sharing Caribbean stories through illustrated books, including multilingual titles.">Maison d\\\'édition jeunesse martiniquaise fondée en 2018, dédiée à raconter la Caraïbe aux plus jeunes à travers des albums illustrés, dont certains en plusieurs langues.</p>' +
      '<div class="footer-social">' +
      '<button class="social-btn" type="button" aria-label="Facebook">' +
      '<svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' +
      "</button>" +
      '<button class="social-btn" type="button" aria-label="Instagram">' +
      '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="footer-col">' +
      '<h4 data-fr="Navigation" data-en="Navigation">Navigation</h4>' +
      "<ul>" +
      '<li><a href="./index.html" data-fr="Accueil" data-en="Home">Accueil</a></li>' +
      '<li><a href="./catalogue.html" data-fr="Catalogue" data-en="Catalog">Catalogue</a></li>' +
      '<li><a href="./a-propos.html" data-fr="À propos" data-en="About Us">À propos</a></li>' +
      '<li><a href="./contact.html" data-fr="Contact" data-en="Contact">Contact</a></li>' +
      "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      '<h4 data-fr="Collections" data-en="Collections">Collections</h4>' +
      "<ul>" +
      '<li><a href="./catalogue.html" data-fr="Collection Nikou" data-en="Nikou collection">Collection Nikou</a></li>' +
      '<li><a href="./catalogue.html" data-fr="Bébé Nikou" data-en="Baby Nikou">Bébé Nikou</a></li>' +
      '<li><a href="./catalogue.html" data-fr="Plumes aventureuses" data-en="Adventurous Feathers">Plumes aventureuses</a></li>' +
      '<li><a href="./catalogue.html" data-fr="Bulles de Sucrier" data-en="Sucrier Bubbles">Bulles de Sucrier</a></li>' +
      '<li><a href="./catalogue.html" data-fr="Cahiers d\'activités" data-en="Activity workbooks">Cahiers d\'activités</a></li>' +
      "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      '<h4 data-fr="Contact" data-en="Contact">Contact</h4>' +
      '<div class="footer-contact-item"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Fort-de-France, Martinique</div>' +
      '<div class="footer-contact-item"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.59 5.59l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>06 96 93 27 58</div>' +
      "</div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      '<p data-fr="© 2025 Les Éditions du Sucrier — Tous droits réservés" data-en="© 2025 Les Éditions du Sucrier — All rights reserved">© 2025 Les Éditions du Sucrier — Tous droits réservés</p>' +
      '<div class="footer-links">' +
      '<a href="./mentions-legales.html" data-fr="Mentions légales" data-en="Legal notice">Mentions légales</a>' +
      '<a href="./politique-confidentialite.html" data-fr="Politique de confidentialité" data-en="Privacy policy">Politique de confidentialité</a>' +
      '<a href="./cgv.html" data-fr="CGV" data-en="Terms & Conditions">CGV</a>' +
      "</div>" +
      "</div>";
  }

  function initCookieConsentBanner() {
    if (!document.body) return;
    if (getCookieConsentChoice()) return;
    if (document.querySelector(".cookie-consent-banner")) return;

    var lang = getSelectedLanguage();
    var isEn = lang === "en";
    var banner = document.createElement("section");
    banner.className = "cookie-consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML =
      '<p class="cookie-consent-text">' +
      (isEn
        ? 'We use essential cookies for site operation and optional cookies for usage improvements. You can accept or refuse optional cookies. <a href="./politique-confidentialite.html">Learn more</a>.'
        : 'Nous utilisons des cookies essentiels au fonctionnement du site et des cookies optionnels pour améliorer l\'expérience. Vous pouvez accepter ou refuser les cookies optionnels. <a href="./politique-confidentialite.html">En savoir plus</a>.') +
      "</p>" +
      '<div class="cookie-consent-actions">' +
      '<button type="button" class="cookie-btn cookie-btn--outline" data-cookie-choice="rejected">' +
      (isEn ? "Refuse" : "Refuser") +
      "</button>" +
      '<button type="button" class="cookie-btn cookie-btn--primary" data-cookie-choice="accepted">' +
      (isEn ? "Accept" : "Accepter") +
      "</button>" +
      "</div>";

    document.body.appendChild(banner);
    banner.querySelectorAll("[data-cookie-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var choice = btn.getAttribute("data-cookie-choice");
        setCookieConsentChoice(choice);
        banner.remove();
      });
    });
  }

  function initContactForm() {
    var contactForm = document.querySelector(".contact-form");
    if (!contactForm) return;
    var feedback = document.querySelector("[data-contact-feedback]");

    function setFeedback(message) {
      if (feedback) feedback.textContent = message;
    }

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = String((contactForm.querySelector('input[name="name"]') || {}).value || "").trim();
      var email = normalizeEmail((contactForm.querySelector('input[name="email"]') || {}).value);
      var contactType = String((contactForm.querySelector('select[name="contact-type"]') || {}).value || "").trim();
      var message = String((contactForm.querySelector('textarea[name="message"]') || {}).value || "").trim();

      if (!name || !email || !contactType || !message) {
        setFeedback(t("messages.registrationFillAllFields", "Veuillez remplir tous les champs."));
        return;
      }
      if (message.length < 10) {
        setFeedback(t("messages.contactMessageTooShort", "Votre message est trop court."));
        return;
      }

      setFeedback(t("messages.contactSending", "Envoi en cours..."));
      fetch("./api/contact-send.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          contactType: contactType,
          message: message,
        }),
      })
        .then(function (response) {
          return response.text().then(function (text) {
            var data = {};
            if (text) {
              try {
                data = JSON.parse(text);
              } catch (parseError) {
                data = {};
              }
            }
            return { ok: response.ok, data: data || {} };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setFeedback(result.data.error || t("messages.contactSendFailed", "Envoi impossible pour le moment."));
            return;
          }
          contactForm.reset();
          var successText = result.data.message;
          if (!successText && result.data.copySent) {
            successText = t(
              "messages.contactSentWithCopy",
              "Message envoye. Une copie a ete envoyee a votre adresse email : consultez votre boite de reception (et les indesirables) pour retrouver votre demande."
            );
          }
          if (!successText && result.data.dev) {
            successText = t(
              "messages.contactSentDev",
              "Message enregistre en local (developpement). Sur le site en ligne, configurez l'envoi SMTP pour une reception reelle."
            );
          }
          if (!successText) {
            successText = t("messages.contactSent", "Message envoye. Nous vous repondrons rapidement.");
          }
          setFeedback(successText);
        })
        .catch(function () {
          setFeedback(t("messages.contactNetworkError", "Erreur reseau pendant l'envoi."));
        });
    });
  }

  function initPartnersHeroCarousel() {
    var root = document.querySelector("[data-partners-carousel]");
    if (!root) return;
    var track = root.querySelector(".partners-hero__track");
    var slides = root.querySelectorAll(".partners-hero__slide");
    var dots = root.querySelectorAll("[data-partners-carousel-dot]");
    if (!track || !slides.length) return;

    var index = 0;
    var timer = null;
    var slideHeight = 156;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function goTo(nextIndex, animate) {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transition =
        animate && !reducedMotion ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)" : "none";
      track.style.transform = "translateY(" + -index * slideHeight + "px)";
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
        dot.setAttribute("aria-selected", dotIndex === index ? "true" : "false");
      });
    }

    function syncHeight() {
      var viewport = root.querySelector(".partners-hero__carousel-viewport");
      if (!viewport || !slides[0]) return;
      slideHeight = slides[0].offsetHeight;
      viewport.style.height = slideHeight + "px";
      slides.forEach(function (slide) {
        slide.style.minHeight = slideHeight + "px";
      });
      goTo(index, false);
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (reducedMotion || slides.length < 2) return;
      timer = window.setInterval(function () {
        goTo(index + 1, true);
      }, 4800);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        goTo(dotIndex, true);
        startAutoplay();
      });
    });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", startAutoplay);

    window.addEventListener("resize", syncHeight);
    syncHeight();
    startAutoplay();
  }

  function renderCartPage() {
    var list = document.querySelector(".cart-list");
    if (!list) return;
    var countNode = document.querySelector("[data-cart-count]");
    var promoForm = document.querySelector("[data-promo-form]");
    var promoInput = document.getElementById("promo-code");
    var promoFeedback = document.querySelector("[data-promo-feedback]");
    var deliveryForm = document.querySelector("[data-delivery-form]");
    var deliveryModeSelect = document.getElementById("delivery-mode");
    var postalCountrySelect = document.querySelector("[data-delivery-postal-country]");
    var postalCountryLabel = document.querySelector("[data-delivery-postal-country-label]");
    var identityChoiceSelect = document.querySelector("[data-delivery-identity-choice]");
    var identityChoiceLabel = document.querySelector("[data-delivery-identity-choice-label]");
    var accountCta = document.querySelector("[data-delivery-account-cta]");
    var savedAddressSelect = document.querySelector("[data-delivery-saved-address]");
    var savedAddressLabel = document.querySelector("[data-delivery-saved-address-label]");
    var manageAddressesCta = document.querySelector("[data-delivery-manage-addresses]");
    var pickupBlock = document.querySelector("[data-delivery-pickup-block]");
    var deliveryNoteInput = document.querySelector("[data-delivery-note]");
    var deliveryNoteLabel = document.querySelector("[data-delivery-note-label]");
    var deliveryFeedback = document.querySelector("[data-delivery-feedback]");
    var contactRoot = document.querySelector("[data-delivery-contact]");
    var addressFieldsRoot = document.querySelector("[data-delivery-address-fields]");
    var customerFirstNameInput = document.getElementById("delivery-firstname");
    var customerLastNameInput = document.getElementById("delivery-lastname");
    var customerEmailInput = document.getElementById("delivery-email");
    var customerPhoneInput = document.getElementById("delivery-phone");
    var deliveryLabelInput = document.getElementById("delivery-label");
    var deliveryLine1Input = document.getElementById("delivery-line1");
    var deliveryLine2Input = document.getElementById("delivery-line2");
    var deliveryPostalInput = document.getElementById("delivery-postal");
    var deliveryCityInput = document.getElementById("delivery-city");
    var deliveryCountryInput = document.getElementById("delivery-country");
    var deliveryAddressSuggestions = document.getElementById("delivery-address-suggestions");
    var checkoutFeedback = document.querySelector("[data-checkout-feedback]");
    var checkoutButton = document.querySelector('[data-action="checkout"]');
    var clearCartButton = document.querySelector('[data-action="clear-cart"]');

    var cart = getCart();
    var promoCode = getPromoCode();
    try {
      var urlPromoParam = new URLSearchParams(window.location.search).get("promo");
      if (urlPromoParam) {
        var urlPromo = String(urlPromoParam).trim().toUpperCase();
        if (urlPromo && PROMO_CODES[urlPromo]) {
          setPromoCode(urlPromo);
          promoCode = urlPromo;
        }
      }
    } catch (e) {
      /* no-op */
    }
    var shippingMode = getShippingMode();
    var shippingPostalCountry = getShippingPostalCountry();
    var shippingPostalZone = resolvePostalZoneFromCountry(shippingPostalCountry);
    var shippingNote = getShippingNote();
    var totals = computeCartTotals(cart, promoCode, shippingMode, shippingPostalZone);
    var session = getClientAuthSession();
    var isAuthed = isClientAuthenticated();

    function readCheckoutCustomer() {
      return normalizeCustomerPayload({
        firstName: customerFirstNameInput ? customerFirstNameInput.value : "",
        lastName: customerLastNameInput ? customerLastNameInput.value : "",
        email: customerEmailInput ? customerEmailInput.value : "",
        phone: customerPhoneInput ? customerPhoneInput.value : "",
      });
    }

    function readCheckoutAddress() {
      if (isAuthed && savedAddressSelect) {
        var selectedValue = String(savedAddressSelect.value || "");
        var idx = parseInt(selectedValue, 10);
        var addresses = getShippingAddresses().map(normalizeAddressPayload);
        if (Number.isFinite(idx) && idx >= 0 && idx < addresses.length) {
          return addresses[idx];
        }
      }
      return normalizeAddressPayload({
        label: deliveryLabelInput ? deliveryLabelInput.value : "",
        line1: deliveryLine1Input ? deliveryLine1Input.value : "",
        line2: deliveryLine2Input ? deliveryLine2Input.value : "",
        postal: deliveryPostalInput ? deliveryPostalInput.value : "",
        city: deliveryCityInput ? deliveryCityInput.value : "",
        country: deliveryCountryInput ? deliveryCountryInput.value : "MQ",
      });
    }

    function fillCheckoutAddress(address) {
      var normalized = normalizeAddressPayload(address || {});
      if (deliveryLabelInput) deliveryLabelInput.value = normalized.label || "";
      if (deliveryLine1Input) deliveryLine1Input.value = normalized.line1 || "";
      if (deliveryLine2Input) deliveryLine2Input.value = normalized.line2 || "";
      if (deliveryPostalInput) deliveryPostalInput.value = normalized.postal || "";
      if (deliveryCityInput) deliveryCityInput.value = normalized.city || "";
      if (deliveryCountryInput) deliveryCountryInput.value = normalized.country || "MQ";
    }

    function syncDeliveryBlocksVisibility() {
      var shippingModeValue = String((deliveryModeSelect && deliveryModeSelect.value) || "").trim();
      var isPickup = shippingModeValue === "pickup_siege";
      var guestChoice = String((identityChoiceSelect && identityChoiceSelect.value) || "");
      var savedChoice = savedAddressSelect ? String(savedAddressSelect.value || "") : "";
      var hasSavedAddress = !!(savedAddressSelect && !savedAddressSelect.hidden && savedChoice !== "__manual__" && savedChoice !== "");
      var isPostal = shippingModeValue === "postal";
      var showGuestIdentityChoice = !isAuthed && !isPickup && !!shippingModeValue;
      var showGuestFields = !isAuthed && guestChoice === "guest" && !isPickup;
      var showManualAuthedFields = isAuthed && savedChoice === "__manual__" && !isPickup;
      var showAddressAndContact = showGuestFields || showManualAuthedFields;
      var manualHint = document.querySelector("[data-delivery-manual-hint]");

      if (contactRoot) contactRoot.hidden = !showAddressAndContact;
      if (addressFieldsRoot) addressFieldsRoot.hidden = !showAddressAndContact;
      if (manualHint) manualHint.hidden = !showManualAuthedFields;
      if (identityChoiceSelect) identityChoiceSelect.hidden = !showGuestIdentityChoice;
      if (identityChoiceLabel) identityChoiceLabel.hidden = !showGuestIdentityChoice;
      if (postalCountrySelect) postalCountrySelect.hidden = !isPostal;
      if (postalCountryLabel) postalCountryLabel.hidden = !isPostal;
      if (accountCta) accountCta.hidden = !(showGuestIdentityChoice && guestChoice === "create_account");
      if (pickupBlock) pickupBlock.hidden = !isPickup;
      if (manageAddressesCta) {
        manageAddressesCta.hidden = !(isAuthed && (!hasSavedAddress || (savedAddressSelect && savedAddressSelect.value === "__manual__")));
      }
      if (savedAddressSelect && savedAddressLabel) {
        var hasOptions = Array.isArray(getShippingAddresses()) && getShippingAddresses().length > 0;
        savedAddressSelect.hidden = !(isAuthed && hasOptions && !isPickup);
        savedAddressLabel.hidden = savedAddressSelect.hidden;
      }

      if (deliveryNoteInput && deliveryNoteLabel) {
        var noteForLocal = shippingModeValue === "local_personal";
        var noteForPickup = shippingModeValue === "pickup_siege";
        deliveryNoteInput.hidden = !(noteForLocal || noteForPickup);
        deliveryNoteLabel.hidden = deliveryNoteInput.hidden;
        deliveryNoteLabel.textContent = noteForPickup
          ? t("ui.pickupCoordinationRequired", "Message obligatoire pour organiser le retrait")
          : t("ui.deliveryLocalNoteLabel", "Précisions livraison locale");
      }
    }
    list.innerHTML = "";
    if (countNode) {
      countNode.textContent =
        cart.length +
        " " +
        (cart.length > 1 ? t("ui.cartItemPlural", "articles") : t("ui.cartItemSingular", "article"));
    }

    if (customerEmailInput && !customerEmailInput.value && session && session.email) {
      customerEmailInput.value = String(session.email || "");
    }
    if (customerFirstNameInput && !customerFirstNameInput.value && session && session.fullName) {
      var names = String(session.fullName || "").trim().split(/\s+/);
      if (names.length > 1) customerFirstNameInput.value = names.slice(0, -1).join(" ");
      if (customerLastNameInput && !customerLastNameInput.value) customerLastNameInput.value = names[names.length - 1] || "";
    }

    if (savedAddressSelect && savedAddressLabel) {
      var savedAddresses = getShippingAddresses().map(normalizeAddressPayload);
      if (isAuthed && savedAddresses.length > 0) {
        var currentValue = savedAddressSelect.value;
        savedAddressSelect.innerHTML = "";
        var defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = t("ui.selectSavedAddress", "Choisir une adresse enregistrée");
        savedAddressSelect.appendChild(defaultOption);
        savedAddresses.forEach(function (addr, idx) {
          var option = document.createElement("option");
          option.value = String(idx);
          option.textContent = makeAddressSummaryLabel(addr);
          savedAddressSelect.appendChild(option);
        });
        var manualOption = document.createElement("option");
        manualOption.value = "__manual__";
        manualOption.textContent = t("ui.enterAnotherAddress", "Saisir une autre adresse");
        savedAddressSelect.appendChild(manualOption);
        if (currentValue && savedAddressSelect.querySelector('option[value="' + currentValue + '"]')) {
          savedAddressSelect.value = currentValue;
        } else if (savedAddresses.length > 0) {
          savedAddressSelect.value = "0";
          fillCheckoutAddress(savedAddresses[0]);
          setShippingPostalCountry(savedAddresses[0].country || "MQ");
          if (postalCountrySelect) postalCountrySelect.value = savedAddresses[0].country || "MQ";
        }
      } else {
        savedAddressSelect.innerHTML = '<option value="">Choisir une adresse enregistrée</option><option value="__manual__">Saisir une autre adresse</option>';
        savedAddressSelect.value = "";
      }
    }

    if (deliveryLine1Input && deliveryAddressSuggestions) {
      attachAddressAutocomplete(deliveryLine1Input, deliveryAddressSuggestions, function (picked) {
        if (deliveryLine1Input && picked.line1) deliveryLine1Input.value = picked.line1;
        if (deliveryPostalInput && picked.postal) deliveryPostalInput.value = picked.postal;
        if (deliveryCityInput && picked.city) deliveryCityInput.value = picked.city;
      });
    }

    if (cart.length === 0) {
      list.innerHTML =
        '<article class="cart-item cart-item--empty"><div class="cart-item-info"><h3>' +
        t("ui.emptyCartTitle", "Votre panier est vide") +
        "</h3><p>" +
        t("ui.emptyCartBody", "Ajoutez des livres depuis le catalogue pour commencer votre commande.") +
        "</p></div></article>";
      var summary = document.querySelector(".cart-summary");
      if (summary) {
        summary.querySelectorAll("[data-summary]").forEach(function (el) {
          el.dataset.priceEur = "0";
          el.textContent = formatPrice(0);
        });
      }
      if (promoFeedback) {
        promoFeedback.textContent = t("ui.emptyCartPromoHint", "Ajoutez un article pour appliquer un code promo.");
      }
      if (checkoutButton) checkoutButton.disabled = true;
      if (checkoutFeedback) checkoutFeedback.textContent = "";
      if (deliveryModeSelect) deliveryModeSelect.value = "";
      if (deliveryNoteInput) {
        deliveryNoteInput.value = "";
      }
      syncDeliveryBlocksVisibility();
      if (deliveryFeedback) deliveryFeedback.textContent = "";
      updateHeaderBadges();
      return;
    }

    if (checkoutButton) checkoutButton.disabled = false;
    if (checkoutFeedback) checkoutFeedback.textContent = "";

    cart.forEach(function (item, index) {
      var unitWeightG = getProductWeightGrams(item.id);
      var lineWeightG = unitWeightG * item.qty;
      var article = document.createElement("article");
      article.className = "cart-item";
      article.setAttribute("data-cart-index", String(index));
      if (item && item.id && BOOK_CATALOG[item.id]) {
        article.setAttribute("data-product-id", item.id);
        article.setAttribute("role", "link");
        article.setAttribute("tabindex", "0");
        article.setAttribute("aria-label", t("ui.openProductSheet", "Ouvrir la fiche produit"));
      }
      article.innerHTML =
        '<img src="' +
        item.image +
        '" alt="" class="cart-item-cover" width="180" height="240" decoding="async" loading="lazy">' +
        '<div class="cart-item-info"><h3>' +
        item.title +
        '</h3><p class="cart-item-meta">' +
        t("ui.quantity", "Quantite") +
        " : " +
        item.qty +
        " · " +
        formatPrice(item.price) +
        "/u · " +
        t("ui.weightLabel", "Poids") +
        " : " +
        formatWeight(lineWeightG) +
        '</p><div class="cart-item-bottom"><strong class="cart-item-price">' +
        formatPrice(item.price * item.qty) +
        '</strong><div class="cart-item-actions"><div class="qty-control"><button type="button" class="qty-btn" data-cart-action="decrease" aria-label="' +
        t("ui.decreaseQuantity", "Diminuer la quantite") +
        '">−</button><span class="qty-value">' +
        item.qty +
        '</span><button type="button" class="qty-btn" data-cart-action="increase" aria-label="' +
        t("ui.increaseQuantity", "Augmenter la quantite") +
        '">+</button></div><button type="button" class="remove-item-btn" data-cart-action="remove" aria-label="' +
        t("ui.removeThisItem", "Supprimer cet article") +
        '">' +
        t("ui.removeItem", "Supprimer") +
        "</button></div></div></div>";
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
      shipNode.textContent = shippingMode ? formatPrice(totals.shipping) : t("ui.chooseDeliveryMode", "Choisissez un mode");
    }
    if (discountNode) {
      discountNode.dataset.priceEur = String(totals.discount);
      discountNode.textContent = totals.discount ? "-" + formatPrice(totals.discount) : formatPrice(0);
    }
    if (taxNode) {
      taxNode.dataset.priceEur = "0";
      taxNode.textContent = formatPrice(0);
    }
    if (totalNode) {
      totalNode.dataset.priceEur = String(totals.total);
      totalNode.textContent = formatPrice(totals.total);
    }

    if (promoInput) promoInput.value = promoCode;
    if (deliveryModeSelect) deliveryModeSelect.value = shippingMode;
    if (postalCountrySelect) postalCountrySelect.value = shippingPostalCountry;
    if (deliveryCountryInput && !deliveryCountryInput.value) deliveryCountryInput.value = shippingPostalCountry;
    if (deliveryNoteInput) {
      deliveryNoteInput.value = shippingNote;
    }
    syncDeliveryBlocksVisibility();
    if (promoFeedback) {
      promoFeedback.textContent = totals.promo
        ? getPromoLabel(totals.promo)
        : t(
            "ui.promoHint",
            "Le montant final est recalculé de façon sécurisée avant le paiement SumUp."
          );
    }
    if (deliveryFeedback) {
      var savedChoicePreview = savedAddressSelect ? String(savedAddressSelect.value || "") : "";
      var checkoutIssuesPreview = collectCheckoutValidationIssues({
        shippingMode: shippingMode,
        shippingNote: shippingNote,
        isAuthed: isAuthed,
        identityChoice: String((identityChoiceSelect && identityChoiceSelect.value) || ""),
        savedChoice: savedChoicePreview,
        useManualAddress: isAuthed && savedChoicePreview === "__manual__",
        postalZone: resolvePostalZoneFromCountry(getShippingPostalCountry()),
        customerPayload: readCheckoutCustomer(),
        addressPayload: readCheckoutAddress(),
        elements: {
          deliveryMode: deliveryModeSelect,
          postalCountry: postalCountrySelect,
          identityChoice: identityChoiceSelect,
          savedAddress: savedAddressSelect,
          deliveryNote: deliveryNoteInput,
          contactRoot: contactRoot,
          addressRoot: addressFieldsRoot,
        },
      });
      if (checkoutIssuesPreview.length > 0) {
        deliveryFeedback.textContent = checkoutIssuesPreview[0].message;
        deliveryFeedback.classList.add("is-checkout-error");
      } else {
        deliveryFeedback.classList.remove("is-checkout-error");
        deliveryFeedback.textContent = shippingMode
          ? t("ui.checkoutReadyHint", "Tout est prêt : vous pouvez passer au paiement.")
          : t("ui.deliveryModeRequired", "Choisissez un mode de livraison avant le paiement.");
      }
    }
    var weightSummaryNode = document.querySelector("[data-summary-weight]");
    if (weightSummaryNode) {
      weightSummaryNode.textContent =
        t("ui.totalWeight", "Poids total du panier") + " : " + formatWeight(computeCartWeightGrams(cart));
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

    list.querySelectorAll(".cart-item[data-product-id]").forEach(function (row) {
      row.addEventListener("click", function (event) {
        if (event.target.closest("[data-cart-action]")) return;
        var productId = row.getAttribute("data-product-id");
        if (!productId) return;
        window.location.href = "./livre.html?id=" + encodeURIComponent(productId);
      });

      row.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        var productId = row.getAttribute("data-product-id");
        if (!productId) return;
        window.location.href = "./livre.html?id=" + encodeURIComponent(productId);
      });
    });

    if (promoForm) {
      promoForm.onsubmit = function (event) {
        event.preventDefault();
        var code = String((promoInput && promoInput.value) || "")
          .trim()
          .toUpperCase();
        if (code && !PROMO_CODES[code]) {
          if (promoFeedback) promoFeedback.textContent = t("ui.promoInvalid", "Code promo invalide.");
          return;
        }
        setPromoCode(code);
        renderCartPage();
      };
    }

    if (deliveryModeSelect) {
      deliveryModeSelect.onchange = function () {
        var mode = String(deliveryModeSelect.value || "").trim();
        setShippingMode(mode);
        if (mode === "postal") {
          setShippingPostalCountry((postalCountrySelect && postalCountrySelect.value) || getShippingPostalCountry());
        }
        if (mode !== "local_personal") {
          setShippingNote("");
        } else {
          setShippingNote((deliveryNoteInput && deliveryNoteInput.value) || "");
        }
        syncDeliveryBlocksVisibility();
        renderCartPage();
      };
    }

    if (postalCountrySelect) {
      postalCountrySelect.onchange = function () {
        setShippingPostalCountry(postalCountrySelect.value || "MQ");
        if (deliveryCountryInput) deliveryCountryInput.value = postalCountrySelect.value || "MQ";
        renderCartPage();
      };
    }

    if (identityChoiceSelect) {
      identityChoiceSelect.onchange = function () {
        syncDeliveryBlocksVisibility();
        if (deliveryFeedback) deliveryFeedback.textContent = "";
      };
    }

    if (savedAddressSelect) {
      savedAddressSelect.onchange = function () {
        var value = String(savedAddressSelect.value || "");
        if (value === "__manual__") {
          fillCheckoutAddress({});
          if (deliveryCountryInput && postalCountrySelect) {
            deliveryCountryInput.value = postalCountrySelect.value || "MQ";
          }
          syncDeliveryBlocksVisibility();
          if (deliveryFeedback) deliveryFeedback.textContent = "";
          if (addressFieldsRoot && typeof addressFieldsRoot.scrollIntoView === "function") {
            addressFieldsRoot.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          return;
        }
        if (value === "") {
          syncDeliveryBlocksVisibility();
          return;
        }
        var idx = parseInt(value, 10);
        var addresses = getShippingAddresses().map(normalizeAddressPayload);
        if (Number.isFinite(idx) && idx >= 0 && idx < addresses.length) {
          fillCheckoutAddress(addresses[idx]);
          setShippingPostalCountry(addresses[idx].country || "MQ");
          if (postalCountrySelect) postalCountrySelect.value = addresses[idx].country || "MQ";
        }
        syncDeliveryBlocksVisibility();
      };
    }

    [customerFirstNameInput, customerLastNameInput, customerEmailInput, customerPhoneInput, deliveryLabelInput, deliveryLine1Input, deliveryPostalInput, deliveryCityInput, deliveryCountryInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () {
        if (!deliveryFeedback) return;
        deliveryFeedback.textContent = "";
        deliveryFeedback.classList.remove("is-checkout-error");
        dismissCheckoutHintPopover();
      });
    });

    if (deliveryNoteInput) {
      deliveryNoteInput.oninput = function () {
        var mode = String((deliveryModeSelect && deliveryModeSelect.value) || "").trim();
        if (mode !== "local_personal" && mode !== "pickup_siege") return;
        setShippingNote(deliveryNoteInput.value || "");
      };
    }

    if (clearCartButton) {
      clearCartButton.onclick = function () {
        setCart([]);
        setPromoCode("");
        setShippingMode("");
        setShippingPostalCountry("MQ");
        setShippingNote("");
        renderCartPage();
        renderDisplayPrices();
      };
    }

    if (checkoutButton) {
      checkoutButton.onclick = function () {
        var activeShippingMode = getShippingMode();
        var activePostalCountry = getShippingPostalCountry();
        var activePostalZone = resolvePostalZoneFromCountry(activePostalCountry);
        var activeShippingNote = getShippingNote();
        var identityChoice = String((identityChoiceSelect && identityChoiceSelect.value) || "");
        var savedChoice = savedAddressSelect ? String(savedAddressSelect.value || "") : "";
        var useManualAddress = isAuthed && savedChoice === "__manual__";
        var customerPayload = readCheckoutCustomer();
        var addressPayload = readCheckoutAddress();
        var customerMode = !isAuthed ? "guest" : useManualAddress ? "guest" : "account_saved";
        if (useManualAddress && session) {
          if (!customerPayload.email && session.email) customerPayload.email = String(session.email || "");
          if ((!customerPayload.firstName || !customerPayload.lastName) && session.fullName) {
            var sessionNames = String(session.fullName || "").trim().split(/\s+/);
            if (!customerPayload.firstName && sessionNames.length > 1) {
              customerPayload.firstName = sessionNames.slice(0, -1).join(" ");
            }
            if (!customerPayload.lastName && sessionNames.length) {
              customerPayload.lastName = sessionNames[sessionNames.length - 1] || "";
            }
          }
        }

        var checkoutIssues = collectCheckoutValidationIssues({
          shippingMode: activeShippingMode,
          shippingNote: activeShippingNote,
          isAuthed: isAuthed,
          identityChoice: identityChoice,
          savedChoice: savedChoice,
          useManualAddress: useManualAddress,
          postalZone: activePostalZone,
          customerPayload: customerPayload,
          addressPayload: addressPayload,
          elements: {
            deliveryMode: deliveryModeSelect,
            postalCountry: postalCountrySelect,
            identityChoice: identityChoiceSelect,
            savedAddress: savedAddressSelect,
            deliveryNote: deliveryNoteInput,
            contactRoot: contactRoot,
            addressRoot: addressFieldsRoot,
          },
        });
        if (checkoutIssues.length > 0) {
          showCheckoutValidationHint(checkoutIssues, deliveryFeedback, checkoutButton);
          return;
        }

        dismissCheckoutHintPopover();
        if (deliveryFeedback) {
          deliveryFeedback.classList.remove("is-checkout-error");
        }
        if (isAuthed && useManualAddress) {
          customerMode = "guest";
        }
        if (activeShippingMode === "pickup_siege") {
          customerMode = "pickup";
          customerPayload = { firstName: "", lastName: "", email: "", phone: "" };
          addressPayload = { label: "Retrait au siege", line1: "", line2: "", postal: "", city: "" };
        }
        checkoutButton.disabled = true;
        var initialLabel = checkoutButton.textContent;
        checkoutButton.textContent = t("ui.redirecting", "Redirection...");
        if (checkoutFeedback) checkoutFeedback.textContent = "";

        createCheckoutSession(
          cart,
          activeShippingMode,
          activeShippingNote,
          customerPayload,
          addressPayload,
          activePostalZone,
          customerMode
        )
          .then(function (result) {
            if (!result || !result.url) {
              throw new Error(t("ui.noCheckoutUrl", "Aucune URL de paiement reçue."));
            }
            window.location.href = result.url;
          })
          .catch(function (error) {
            if (checkoutFeedback) {
              checkoutFeedback.textContent = error.message || t("ui.paymentError", "Erreur de paiement. Réessayez.");
            }
            checkoutButton.disabled = false;
            checkoutButton.textContent = initialLabel;
          });
      };
    }

    updateHeaderBadges();
  }

  function renderFavoritesPage() {
    var list = document.querySelector(".favorites-list");
    if (!list) return;
    var countNode = document.querySelector("[data-favorites-count]");
    var clearButton = document.querySelector('[data-action="clear-favorites"]');
    var favorites = getFavorites();
    list.innerHTML = "";

    if (countNode) {
      countNode.textContent =
        favorites.length +
        " " +
        (favorites.length > 1 ? t("ui.favoriteItemPlural", "favoris") : t("ui.favoriteItemSingular", "favori"));
    }

    if (favorites.length === 0) {
      list.innerHTML =
        '<article class="cart-item cart-item--empty"><div class="cart-item-info"><h3>' +
        t("ui.emptyFavoritesTitle", "Vous n'avez pas encore de favoris") +
        "</h3><p>" +
        t("ui.emptyFavoritesBody", "Explorez le catalogue et cliquez sur le coeur pour enregistrer vos livres preferes.") +
        '</p><p><a class="voir-tout" href="./catalogue.html">' +
        t("ui.viewCatalog", "Voir le catalogue") +
        " →</a></p></div></article>";
      if (clearButton) clearButton.disabled = true;
      updateHeaderBadges();
      return;
    }

    if (clearButton) clearButton.disabled = false;

    favorites.forEach(function (id) {
      var book = getLocalizedBook(id);
      if (!book) return;
      var article = document.createElement("article");
      article.className = "favorite-item";
      article.setAttribute("data-favorite-id", id);
      article.innerHTML =
        '<img src="' +
        book.cover +
        '" alt="' +
        t("ui.bookCoverAltPrefix", "Couverture —") +
        " " +
        book.title +
        '">' +
        '<div class="favorite-item-info"><h3>' +
        book.title +
        '</h3><p>' +
        book.collection +
        '</p><strong class="book-card-prix" data-price-eur="' +
        String(book.price) +
        '">' +
        formatPrice(book.price) +
        '</strong></div><div class="favorite-item-actions"><button type="button" class="add-to-cart-btn" data-fav-action="add-to-cart">' +
        t("ui.addToCart", "Ajouter au panier") +
        '</button><button type="button" class="remove-item-btn" data-fav-action="remove">' +
        t("ui.remove", "Retirer") +
        "</button></div>";
      list.appendChild(article);
    });

    list.querySelectorAll("[data-fav-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var row = button.closest("[data-favorite-id]");
        if (!row) return;
        var productId = row.getAttribute("data-favorite-id");
        var action = button.getAttribute("data-fav-action");
        if (action === "add-to-cart") {
          addBookToCartById(productId);
          button.classList.remove("is-added-feedback");
          void button.offsetWidth;
          button.classList.add("is-added-feedback");
          setTimeout(function () {
            button.classList.remove("is-added-feedback");
          }, 550);
          showCartAddedToast();
        }
        if (action === "remove") {
          toggleFavorite(productId);
          renderFavoritesPage();
        }
      });
    });

    if (clearButton) {
      clearButton.onclick = function () {
        setFavorites([]);
        renderFavoritesPage();
      };
    }

    renderDisplayPrices();
    updateHeaderBadges();
  }

  function initPageTransitions() {
    var body = document.body;
    if (!body) return;
    var pageLoader = document.createElement("div");
    pageLoader.className = "page-loader";
    pageLoader.setAttribute("aria-hidden", "true");
    pageLoader.innerHTML =
      '<div class="page-loader-art">' +
      '<span class="loader-orbit loader-orbit--outer" aria-hidden="true"></span>' +
      '<span class="loader-orbit loader-orbit--inner" aria-hidden="true"></span>' +
      '<span class="loader-core"><img src="images/site/logo-editions-sucrier.webp" alt="" class="page-loader-logo" decoding="async"></span>' +
      "</div>";
    body.appendChild(pageLoader);

    function showLoader() {
      pageLoader.classList.add("is-visible");
      body.classList.remove("is-page-entering");
      body.classList.add("is-page-leaving");
    }

    function hideLoader() {
      pageLoader.classList.remove("is-visible");
      body.classList.remove("is-page-leaving");
      body.classList.add("is-page-entering");
      setTimeout(function () {
        body.classList.remove("is-page-entering");
      }, 180);
    }

    var links = document.querySelectorAll('a[href]:not([target="_blank"]):not([download])');
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        var href = link.getAttribute("href");
        if (!href) return;
        if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

        var targetUrl;
        try {
          targetUrl = new URL(href, window.location.href);
        } catch (e) {
          return;
        }

        if (targetUrl.origin !== window.location.origin) return;
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) return;

        event.preventDefault();
        showLoader();
        setTimeout(function () {
          window.location.href = targetUrl.href;
        }, 170);
      });
    });

    window.addEventListener("pageshow", function () {
      hideLoader();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    enforceUnifiedFooter();
    normalizeDocumentRelativePaths();
    applyLazyLoadingToImages();
    initAboutNavDropdown();
    initHeaderDropdownMenu();
    window.addEventListener("pageshow", function () {
      initAboutNavDropdown();
      initHeaderDropdownMenu();
    });

    loadSiteContent().finally(function () {
    var selectedLanguage = getSelectedLanguage();
    loadI18nDictionary(selectedLanguage).finally(function () {
      refreshClientAuthSession().finally(function () {
      applyLanguageSetting(selectedLanguage);
      bindPreferenceControls();
      initAboutNavDropdown();
      initHeaderDropdownMenu();
      bindWishlistButtons();
      bindAddToCartButtons();
      renderAboutAuthorsGrid();
      initAboutPeopleFilters();
      initPasswordVisibilityToggles();
      initAccountPage();
      initEspacePage();
      initContactForm();
      initPartnersHeroCarousel();
      initCatalogueQuickPreviewModal();
      initCatalogueCardInteractions();
      initPageTransitions();
      initRegistrationPage();
      initLegalFooterLinks();
      initCookieConsentBanner();
      renderRecentlyViewedSection("#home-recently-viewed");
      renderRecentlyViewedSection("#catalogue-recently-viewed");
      if (window.location.pathname.endsWith("/checkout-success.html") || window.location.pathname.endsWith("\\checkout-success.html")) {
        var params = new URLSearchParams(window.location.search);
        var checkoutRef = params.get("checkout_ref") || "";
        var statusNode = document.querySelector("[data-payment-status]");
        verifySumupCheckoutStatus(checkoutRef).then(function (result) {
          if (result && result.ok && result.paid) {
            var cartSnapshot = getCart();
            appendVerifiedOrderToHistory(cartSnapshot, checkoutRef);
            setCart([]);
            setPromoCode("");
            if (statusNode) statusNode.textContent = t("messages.paymentVerified", "Paiement vérifié avec succès.");
            return;
          }
          if (statusNode) {
            statusNode.textContent =
              (result && result.error) ||
              t(
                "messages.paymentNotVerified",
                "Paiement non vérifié automatiquement. Votre panier n'a pas été vidé."
              );
          }
        });
      }
      refreshExchangeRates().finally(function () {
        renderDisplayPrices();
        renderCartPage();
        hydrateLanguageDataAttributes();
        switchLang(selectedLanguage);
        syncCurrencySelectorState();
        updateFxRateNotice();
        window.__sucrierRebindCatalogueFilters = bindCatalogueFilters();
      });
      });
    });
  });
    });
})();
