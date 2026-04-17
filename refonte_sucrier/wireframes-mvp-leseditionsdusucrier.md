# Wireframes textuels MVP - Les Editions du Sucrier

## 1) Principes globaux (desktop + mobile)

- Header unique sur toutes les pages.
- CTA principal coherent: `Explorer le catalogue`.
- Composants repetables: cartes produit, badges, blocs reassurance, footer.
- Priorite mobile-first: actions critiques visibles sans effort.

Header commun:
- Logo (retour accueil)
- Menu: Catalogue, Collections, Actualites, A propos, Contact
- Recherche
- Compte
- Wishlist
- Panier (avec compteur)

Footer commun:
- Liens utiles (livraison, CGV, contact, mentions legales, confidentialite)
- Coordonnees entreprise
- Newsletter
- Reseaux sociaux

---

## 2) Page Accueil (`/`)

### Desktop

Zone 1 - Hero (premier ecran):
- Colonne gauche:
  - H1: promesse claire (albums jeunesse, univers caribeen, apprentissage ludique)
  - Texte court (2 lignes max)
  - CTA primaire: `Explorer le catalogue`
  - CTA secondaire: `Decouvrir les collections`
- Colonne droite:
  - Visuel editorial fort (illustration/album phare)

Zone 2 - Univers principaux:
- 3 tuiles cliquables:
  - Albums de jeunesse
  - Cahiers d'activites
  - Nos autres produits

Zone 3 - Best-sellers:
- Titre + lien `Voir tout`
- Carrousel horizontal de cartes produit (4 visibles)
- Carte produit:
  - Couverture
  - Titre (2 lignes max)
  - Age recommande
  - Prix
  - Boutons: `Voir produit` + icone wishlist

Zone 4 - Collections:
- Grille 2x2 (Nikou, Bebe Nikou, Plumes aventureuses, etc.)
- Chaque carte: visuel + courte description + CTA

Zone 5 - Conseils de lecture / Actualites:
- 3 cartes article
- CTA `Voir toutes les actualites`

Zone 6 - Reassurance:
- Paiement securise
- Livraison
- Service client

Zone 7 - Newsletter:
- Titre + champ email + bouton inscription

### Mobile

Ordre vertical:
1. Hero compact (H1 + CTA principal)
2. Tuiles univers (stack vertical ou slider)
3. Best-sellers (scroll horizontal)
4. Collections (2 cartes visibles puis scroll)
5. Actualites (cards)
6. Reassurance
7. Newsletter

Spec mobile:
- Header compact avec menu burger.
- Panier/wishlist accessibles en 1 tap.
- CTA sticky bas d'ecran optionnel sur accueil: `Catalogue`.

---

## 3) Page Catalogue (`/catalogue`)

### Desktop

Structure:
- Bandeau haut:
  - Titre page
  - Nombre de resultats
  - Tri (pertinence, nouveautes, prix, meilleures ventes)
- Layout principal 2 colonnes:
  - Colonne gauche: filtres
  - Colonne droite: grille produits

Filtres (colonne gauche):
- Recherche par mot-cle produit
- Categories
- Collections
- Age
- Themes
- Prix (range)
- Disponibilite
- Boutons: `Appliquer` / `Reinitialiser`

Grille produits:
- 3 ou 4 colonnes selon largeur
- Carte produit standardisee:
  - Image couverture
  - Badge eventuel (Nouveau, Best-seller)
  - Titre
  - Meta courte (collection, age)
  - Prix
  - Actions: `Voir produit`, wishlist

Pagination / chargement:
- Option 1: pagination classique
- Option 2: `Charger plus`

### Mobile

Structure:
- Barre haute:
  - Titre + nb resultats
  - Bouton `Filtrer`
  - Bouton `Trier`
- Grille 2 colonnes

Filtres mobile:
- Ouvrir en panneau plein ecran (drawer)
- Sections accordions (categorie, collection, age, theme, prix)
- CTA fixes en bas du drawer: `Reinitialiser` + `Voir les resultats`

Spec mobile:
- Etat des filtres actif visible par chips horizontales.
- Scroll fluide, images legeres.

---

## 4) Fiche Produit (`/produit/:slug`)

### Desktop

Layout 2 colonnes:
- Colonne gauche:
  - Image principale
  - Miniatures (galerie)
- Colonne droite:
  - Titre
  - Auteur/illustrateur
  - Collection
  - Age recommande
  - Prix
  - Stock
  - Quantite
  - CTA principal: `Ajouter au panier`
  - CTA secondaire: `Ajouter a la wishlist`
  - Blocs reassurance (paiement, livraison)

Sous la zone principale:
- Onglets ou sections:
  - Description
  - Details (ISBN, format, langue, pagination)
  - Avis / temoignages

Bloc cross-sell:
- `Vous aimerez aussi`
- 4 produits associes

### Mobile

Ordre vertical:
1. Galerie swipe
2. Titre + prix + infos cle
3. Quantite + bouton `Ajouter au panier` (full width)
4. Wishlist
5. Description en accordions
6. Produits associes (scroll horizontal)

Spec mobile:
- CTA `Ajouter au panier` sticky en bas si utile.

---

## 5) Panier (`/panier`)

### Desktop

Layout 2 colonnes:
- Colonne gauche: liste produits panier
  - Ligne produit:
    - image
    - titre + meta
    - quantite +/- (editable)
    - prix unitaire
    - sous-total ligne
    - supprimer
- Colonne droite: recap commande
  - Sous-total
  - Livraison (estimation)
  - Total
  - Champ code promo
  - CTA `Passer au paiement`
  - CTA secondaire `Continuer mes achats`

### Mobile

Ordre vertical:
1. Lignes produits
2. Code promo
3. Recap total
4. Bouton `Passer au paiement` sticky bas d'ecran

Spec mobile:
- Quantite facile a modifier (boutons + et -).
- Prix toujours visible avant validation.

---

## 6) Checkout (`/commande`)

### Desktop

Stepper en 3 etapes:
1. Informations client
2. Livraison
3. Paiement

Zone gauche:
- Formulaires simples, labels clairs, erreurs inline.

Zone droite:
- Recap commande fixe (sticky)
- Produits, total, frais, mode livraison choisi

Paiement:
- Cartes bancaires (+ autres methodes si necessaire)
- Message de securisation visible

### Mobile

Structure verticale:
- Etapes compactes en accordions
- Recap repliable
- CTA final large: `Payer maintenant`

Spec mobile:
- Auto-completion activee (email, adresse, tel).
- Reduction du nombre de champs au strict necessaire.

---

## 7) Pages editoriales (Actualites, A propos, Contact)

### Actualites (`/actualites`)
- Liste cartes article (image, titre, date, extrait)
- Filtres leger par theme
- CTA vers produits associes en bas d'article

### A propos (`/a-propos`)
- Histoire de la maison
- Valeurs editoriales
- Partenaires (logos)
- CTA `Voir le catalogue`

### Contact (`/contact`)
- Coordonnees completes
- Formulaire simple (nom, email, sujet, message)
- Horaires et adresse
- Bloc FAQ court

---

## 8) Composants UI a valider avant maquette

- Carte produit (1 seul modele, reutilise partout)
- Boutons (primaire, secondaire, ghost)
- Chips filtres
- Badges (Nouveau, Best-seller, Rupture)
- Inputs formulaire
- Messages d'etat (erreur, succes, info)

---

## 9) Regles UX critiques (definition of done)

- Aucun lien ne bascule vers un "autre site" durant l'achat.
- En 3 clics max depuis accueil: acces a une fiche produit.
- Ajout panier possible sans friction sur mobile.
- Filtres lisibles et sans doublon.
- Temps de chargement percu rapide sur catalogue/fiche.

---

## 10) Prochaine etape recommandee

Transformer ces wireframes textuels en:
1. Wireframes basse fidelite (Figma ou equivalent),
2. Prototype cliquable,
3. Test utilisateur rapide (5 profils) avant design haute fidelite.
