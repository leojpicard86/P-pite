# PÉPITE — Pitch immersif (12 minutes, anglais, Master 2)

Présentation web plein écran 16:9 pour la boutique de seconde main **PÉPITE** (Chantilly) : motion design, visite 3D de la boutique, graphiques financiers, **pilotée au clavier**, **100 % hors ligne**.

## Lancer en soutenance (hors ligne)
```bash
npm install          # une seule fois, avec internet
npm run build        # produit dist/index.html
```
`dist/index.html` est **un seul fichier autonome** (code, polices et 3D inclus) : copiez-le sur une clé USB et ouvrez-le par **double-clic** dans Chrome, Edge ou Firefox. Aucune connexion n'est nécessaire. Appuyez sur **F** pour le plein écran (projecteur en 16:9).

Développement : `npm run dev`.

## Pilotage au clavier (touche `?` pour l'aide dans l'application)
| Touche | Action |
|---|---|
| `→` `Espace` `Entrée` `PageDown` | **Beat suivant** (animation suivante = phrase suivante du script) |
| `←` `Retour arrière` `PageUp` | Beat précédent |
| `Maj+→` / `Maj+←` | Scène suivante / précédente |
| `Début` / `Fin` | Première scène / annexe « Sources » (pour les questions) |
| `N` | Notes : script, indication d'animation, sources, relais |
| `P` | Répétition automatique au rythme prévu |
| `T` / `R` | Pause-reprise / remise à zéro de l'horloge de 12 minutes |
| `O` | Vue d'ensemble des scènes |
| `H` | Masquer l'interface |
| `L` | Mode léger (sans WebGL : plan de la boutique à la place de la 3D) |
| `F` | Plein écran |

Les télécommandes de présentation (PageDown/PageUp) fonctionnent directement. Le curseur de souris est inutile : la barre de contrôle apparaît seulement si on bouge la souris.

L'indicateur d'allure (`+00:12` / `−00:12`) compare votre temps réel au temps prévu pour le beat courant.

## Contenu
* 12 scènes = **720 s exactement** ; 4 parties de 3 minutes (relais indiqués dans les notes, aucun nom d'intervenant dans l'interface).
* Script complet : **`docs/SCRIPT.md`** (≈ 1 190 mots, ≈ 100 mots/min pauses comprises, phrases courtes B1–B2) — régénéré par `npm run docs`.
* Traçabilité : **`docs/FACT_MAP.md`** relie chaque chiffre à son fichier/onglet et signale le statut (plan, rapporté, estimation, extrapolation) + les points à confirmer.
* Les données vivent dans `src/data/facts.ts`, le script dans `src/data/script.ts`.

## Honnêteté des données (important pour le jury)
* Les chiffres financiers sont **provisoires** (plan BGE) ; la scène « Numbers » le dit et montre que le scénario central perd de l'argent chaque mois. Le mois 7 est **notre extrapolation**, étiqueté comme tel.
* Les chiffres de marché sont **rapportés, non vérifiés à la source** ; ils sont étiquetés sur la diapositive.
* La boutique 3D est une **vue d'artiste de la future boutique** (≈ 25 m²) : bandeau « Artist's impression · our future boutique » pendant la visite. Aucune photo, aucun plan ni aucune mesure des futurs locaux n'a servi.
* Les personas sont des **hypothèses d'équipe**, pas des résultats d'enquête.
* **À trancher avant la soutenance :** voir « Points à confirmer » dans `docs/FACT_MAP.md` (en particulier le traitement du remboursement du prêt dans le tableau de trésorerie).

## Vérification
```bash
npm run verify     # typecheck + 21 tests + build
npm run qa         # navigateur : parcourt toutes les scènes hors ligne, teste les contrôles, produit des captures (qa-output/)
npm run docs       # régénère docs/SCRIPT.md
```
Les tests contrôlent : 720 s, 4 × 3 min, débit de parole 85–125 mots/min par scène, longueur des phrases, cohérence des tableaux financiers (sommes, soldes cumulés), répartition des facteurs clés (8/17/12/3), et que tout chiffre prononcé figure dans la liste des données sourcées.

## Boutique 3D (scène 6)
Direction « boutique parisienne vintage chic », entièrement générée par le code (aucun fichier 3D, aucune image, aucune police distante) :
* **Rue au crépuscule** : devanture anthracite, enseigne dorée « PÉPITE · Seconde main · Chantilly », store rayé bordeaux et crème, immeuble en pierre avec balcons, réverbère, buis, ardoise « Pépites du jour ».
* **Intérieur** : boiseries, parquet en chevrons, niche rose avec néon « Pépite », portant laiton, chapelières, cabine d'essayage en velours, comptoir cannelé en chêne et marbre, mannequin couture en vitrine, olivier, fauteuil en velours, suspensions globe.
* **Vêtements** : manteau camel, marinière, robe en soie, veste en jean, tweed, petite robe noire, perfecto en cuir… avec volume, texture et léger balancement.
* **Image** : éclairage d'environnement, ombres douces, occlusion ambiante, halo des lampes, vignettage, tons ACES.
* **Visite** : 6 arrêts (rue → vitrine → portants → cabine → comptoir → maquette ouverte), caméra guidée avec un léger mouvement « caméra à l'épaule » ; au dernier arrêt le toit se soulève et on peut tourner autour à la souris.

### Performance
La qualité s'adapte seule : niveau 2 (occlusion ambiante + halo + ombres), puis 1 (sans occlusion), puis 0 (rendu simple) si les images par seconde chutent. Le rendu 3D ne tourne que pendant la scène 6. Sans WebGL, un plan 2D prend le relais (touche `L` pour le forcer).
Pour tester un niveau précis : ajouter `?q=0`, `?q=1` ou `?q=2` à l'adresse du fichier.
**À faire avant la soutenance : ouvrir la scène 6 sur l'ordinateur et le projecteur de la salle** et vérifier la fluidité (sinon appuyer sur `L`).

## Polices
Cormorant Garamond et Arimo (licence SIL OFL), embarquées via `@fontsource` ; aucune requête réseau à l'exécution.
