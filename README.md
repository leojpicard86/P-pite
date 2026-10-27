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
* La boutique 3D est un **concept stylisé**, pas les vrais locaux (bandeau permanent pendant la visite).
* Les personas sont des **hypothèses d'équipe**, pas des résultats d'enquête.
* **À trancher avant la soutenance :** voir « Points à confirmer » dans `docs/FACT_MAP.md` (en particulier le traitement du remboursement du prêt dans le tableau de trésorerie).

## Vérification
```bash
npm run verify     # typecheck + 21 tests + build
npm run qa         # navigateur : parcourt toutes les scènes hors ligne, teste les contrôles, produit des captures (qa-output/)
npm run docs       # régénère docs/SCRIPT.md
```
Les tests contrôlent : 720 s, 4 × 3 min, débit de parole 85–125 mots/min par scène, longueur des phrases, cohérence des tableaux financiers (sommes, soldes cumulés), répartition des facteurs clés (8/17/12/3), et que tout chiffre prononcé figure dans la liste des données sourcées.

## Performance 3D
Boutique entièrement procédurale (pas de fichier 3D), un seul rendu en continu uniquement pendant la scène 6 ; qualité adaptative (résolution et ombres baissent si la fréquence d'images chute) ; repli automatique sans WebGL. Mesures et limites : voir le compte rendu de livraison.

## Polices
Cormorant Garamond et Arimo (licence SIL OFL), embarquées via `@fontsource` ; aucune requête réseau à l'exécution.
