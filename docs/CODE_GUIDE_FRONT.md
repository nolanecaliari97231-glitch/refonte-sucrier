# Guide Simple - Front

Ce guide explique les parties importantes du front.

## Fichiers principaux

- `app.js`: logique applicative principale (catalogue, fiche produit, panier, i18n, auth).
- `style.css`: styles desktop + base commune.
- `mobile-ux.css` et `mobile-ux.js`: adaptations mobile/tablette.
- Pages HTML (`index.html`, `catalogue.html`, `livre.html`, etc.): structure des ecrans.

## Flux de donnees

1. Le front demarre avec `BOOK_CATALOG_DEFAULT` dans `app.js`.
2. `loadSiteContent()` charge `./api/content.php` (ou `data/contenu.json` en fallback).
3. `applyContentPayload()` applique la surcouche CMS:
   - catalogue,
   - textes,
   - stocks,
   - profils auteurs/heros.

## Stock (important)

- `catalog_stock` vient du backoffice.
- `applyCatalogStockFromContent()` construit:
  - `CATALOG_STOCK` (quantites),
  - `PRODUCTS_OUT_OF_STOCK` (ruptures).
- `isBookOutOfStock()` decide si un produit est en rupture.
- `canPurchaseBook()` bloque l'achat si rupture/coming soon.

## Fiche produit

- `renderBookDetailPage()` alimente tous les blocs de `livre.html`.
- `buildProductTechListHtml()` construit les lignes techniques.
- La disponibilite affiche:
  - rupture si stock = 0,
  - quantite explicite si stock suivi > 0,
  - message standard si stock non suivi.

## Panier

- Stockage local: `localStorage` via `STORAGE_KEYS.cart`.
- Ajout: `addToCartFromButton()`.
- Quantites: `updateCartItemQuantity()`.
- Totaux/frais: `computeCartTotals()` + transport.

## Internationalisation

- Dictionnaires: `locales/fr.json`, `locales/en.json`.
- `switchLang()` et `applyPageTranslations()` re-rendent les textes.
- Les textes CMS sont injectes puis retraduits si besoin.
