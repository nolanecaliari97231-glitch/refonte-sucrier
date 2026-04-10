# Refonte UX - Site unique Les Editions du Sucrier

## 1) Contexte et objectif

Objectif principal: fusionner le site vitrine et la boutique en un seul site coherent, fluide et orienté conversion.

Constat actuel:
- Le site vitrine (`leseditionsdusucrier.fr`) et la boutique (`boutique.leseditionsdusucrier.fr`) sont separes.
- La navigation provoque une rupture d'experience (changement d'interface, de structure, de repere utilisateur).
- La valeur editoriale (actualites, galerie, temoignages) et l'acte d'achat sont dissocies.

Vision cible:
- Une seule plateforme avec une meme navigation, un meme design system et un tunnel d'achat integre.
- Architecture "catalogue first" avec acces direct fiche produit > panier > paiement.

## 2) Diagnostic UX rapide (a partir des liens et du document de reference)

Points de friction:
- Double ecosysteme et redirections externes entre vitrine et boutique.
- Navigation principale peu orientee vers la conversion catalogue.
- Incoherences de categories/facettes (ex. doublons "Collection Bebe Nikou").
- Hierarchie visuelle et priorisation des CTA a clarifier.
- Compteurs/chiffres a 0 sur la vitrine qui reduisent la credibilite.

Opportunites:
- Mettre le catalogue au centre de l'experience.
- Relier contenu de marque et produits (actualites, conseils de lecture, univers personnages).
- Standardiser fiches produit et facettes de recherche.
- Capitaliser sur un parcours court: Home > Catalogue > Fiche > Panier > Paiement.

## 3) Arborescence cible (MVP)

Navigation principale:
- Accueil
- Catalogue
- Collections
- Actualites
- A propos
- Contact
- Compte
- Panier

Pages coeur e-commerce:
- `/catalogue` (filtres + grille)
- `/produit/:slug`
- `/panier`
- `/commande` (checkout)
- `/confirmation`

Pages contenu:
- `/actualites` + detail article
- `/galerie`
- `/temoignages`
- `/a-propos`
- `/contact`

## 4) Parcours utilisateur prioritaire

Parcours achat:
1. Arrivee sur Accueil (mise en avant best-sellers + collections).
2. Entree dans Catalogue via CTA principal.
3. Filtrage par age/theme/collection/prix.
4. Consultation fiche produit complete.
5. Ajout panier puis paiement.

Parcours inspiration:
1. Arrivee via contenu (actualite, reseaux, recherche).
2. Lecture article/temoignage.
3. Bloc "produits associes" contextualise.
4. Ajout panier.

## 5) Contenus et donnees a structurer avant design final

Produits (fiche type):
- Titre
- Collection
- Auteur/illustrateur
- Age recommande
- Theme
- Langue
- Format / ISBN
- Prix / stock
- Description courte + longue
- Visuels (cover + galerie)

Taxonomie:
- Categories (Albums, Cahiers, Objets)
- Collections (Nikou, Bebe Nikou, etc.)
- Tranches d'age
- Themes

Regle: supprimer doublons de categories et harmoniser les libelles.

## 6) Recommandation technique sans acces code source

Option la plus pragmatique:
- Rebuild complet sur un CMS e-commerce unifie (ex. WordPress + WooCommerce, Shopify, ou Prestashop refondu avec theme unique et pages edito integrees).

Critere de choix:
- Facile a maintenir pour l'equipe.
- Gestion native produits/stock/commandes.
- Possibilite de pages editoriales modernes.
- SEO solide (URLs propres, metadonnees, schema).

Migration:
- Export des produits/categorisations de l'existant.
- Nettoyage taxonomie.
- Import dans la nouvelle structure.

## 7) Priorites UX/UI (MVP)

1. Header unique sticky:
- Logo, menu principal, recherche, compte, wishlist, panier.

2. Home orientee conversion:
- Hero clair + CTA "Explorer le catalogue".
- Best-sellers.
- Collections.
- Bloc "Conseils de lecture / actualites".

3. Catalogue performant:
- Filtres utiles, non redondants.
- Tri pertinent.
- Cartes produit normalisees.

4. Fiche produit complete:
- Infos decisives visibles au-dessus de la ligne de flottaison.
- Preuves de confiance (livraison, paiement securise, retours).

5. Tunnel d'achat simplifie:
- Moins d'etapes.
- Frais/livraison explicites.
- Messages de reassurance.

## 8) SEO et performance (indispensable)

SEO:
- Redirections 301 des anciennes URLs (vitrine + boutique) vers nouvelles pages.
- Balises title/meta unifiees.
- Donnees structurees Product/Organization/Article.

Performance:
- Compression images (WebP/AVIF).
- Lazy-load medias.
- Polices optimisees.
- Core Web Vitals surveilles des la preprod.

## 9) Plan d'execution propose (6 semaines)

Semaine 1:
- Audit detaille contenu + inventaire produits/categories.
- Validation arborescence et parcours.

Semaine 2:
- Wireframes basse fidelite (Home, Catalogue, Fiche, Panier, Checkout).
- Validation metier.

Semaine 3:
- UI kit + maquettes haute fidelite (desktop/mobile).
- Prototype cliquable.

Semaine 4:
- Integration front + configuration CMS/e-commerce.
- Import data pilote.

Semaine 5:
- Recette UX, QA fonctionnelle, SEO technique.
- Corrections.

Semaine 6:
- Redirections, mise en ligne progressive, suivi analytics.

## 10) KPI de succes

- Taux de conversion e-commerce.
- Taux de rebond sur pages catalogue/produit.
- Temps moyen jusqu'a ajout panier.
- Valeur moyenne du panier.
- Taux d'abandon checkout.
- Positionnement SEO sur requetes coeur.

## 11) Ce qu'on peut lancer tout de suite (sans code source)

1. Cadrage fonctionnel final:
- Verrouiller l'arborescence et les parcours cibles.

2. Inventaire de contenu:
- Lister tous les produits, categories, collections, actualites.

3. Normalisation taxonomie:
- Corriger doublons et nommage.

4. Wireframes:
- Produire les ecrans MVP et en faire valider la logique.

5. Brief technique:
- Choisir la plateforme de reconstruction et definir la migration.
