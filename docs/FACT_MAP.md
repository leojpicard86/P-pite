# Carte des faits : chaque chiffre → son fichier source

Statut : **Plan** = prévision BGE (provisoire) · **Rapporté** = estimation secondaire non vérifiée à la source · **Estimation équipe** = jugement de travail · **Extrapolation** = calcul de notre part, absent du plan. Les mêmes données vivent dans `src/data/facts.ts` ; `npm test` vérifie leur cohérence interne.

## Finances (`Plan_de_financement_Pepite_trame_BGE_complete.pdf`)
| Affirmation | Valeur | Emplacement | Statut |
|---|---|---|---|
| Besoin initial (emplois) | 34 460 € = 18 800 + 3 160 + 5 000 + 7 500 | Tableau 1, colonnes 3 mois / central | Plan |
| Apport personnel | 5 000 € | Tableau 1, Ressources | Plan |
| Prêt bancaire | 29 460 € | Tableau 1, Ressources | Plan |
| Ratio apport / dette | ≈ 15 % / 85 % | Calculé ; cité aussi dans `Demonter_une_evidence_Pepite.pdf` (ligne « finançable ») | Plan |
| Trésorerie fin M6 : prudent / central / optimiste | −2 644 € / 207 € / 3 758 € | Tableau 1, « Trésorerie en fin de période » | Plan |
| Trésorerie fin M3 : prudent / central / optimiste | 2 306 € / 3 561 € / 5 026 € | idem | Plan |
| Solde cumulé central M1…M6 | 6 237 · 4 860 · 3 561 · 2 346 · 1 223 · 207 € | Tableau 2 | Plan |
| Solde du mois central M1…M6 | −1 263 · −1 377 · −1 299 · −1 215 · −1 123 · −1 015 € | Tableau 2 | Plan |
| Recettes 6 mois (central) | 15 420 € TTC | Tableau 1 (Repères) et tableau 2 | Plan |
| Rémunération des associées | 0 € | Introduction du plan ; « Ce qu'il manque » | Plan |
| **Trésorerie < 0 au mois 7** | ≈ −758 € | Régression linéaire du solde mensuel (M1→M6) | **Extrapolation** |

## Marché (`Tableaux_Etude_de_marche_Pepite.xlsx`, onglet Pestel ; `SWOT_Pepite.pdf`)
| Affirmation | Valeur | Emplacement | Statut |
|---|---|---|---|
| Marché FR de la seconde main 2024 | ≈ 14 Md€ (+12 %) dont ≈ 7 Md€ mode (Xerfi) | Pestel, ligne C ; SWOT | Rapporté |
| Part des Français ayant acheté de la seconde main | 64 % en 2023 | Pestel, ligne E (le SWOT dit « près de 3 sur 4 » : incohérent, on garde 64 %) | Rapporté |
| Utilisateurs Vinted en France | > 23 millions | Pestel, ligne H ; onglet Concurrence | Rapporté |
| Loi anti fast-fashion n° 2026-602 (juillet 2026), décrets à paraître | — | Pestel, lignes A et B | Rapporté |

## Concurrence (`Tableaux_Etude_de_marche_Pepite.xlsx`, onglet Concurrence ; `Demonter_une_evidence_Pepite.pdf`)
| Affirmation | Emplacement |
|---|---|
| Un seul concurrent identifié à Chantilly (Aux Bonheurs des Dames) ; autres boutiques à Senlis, Compiègne, Beauvais | Concurrence ; Porter ligne U |
| Fait et Affaire : dépôt de 3 mois minimum, chèque à l'échéance, commission 40 % | Concurrence, « Faiblesses » et « Prix » |
| Le Dressing Circulaire : déplacement 40–70 €, partage 50/50, hors Oise | Concurrence |
| Vinted : pas de boutique, pas de conseil ni d'essayage | Concurrence, « Faiblesses » |
| Aucun concurrent local identifié ne propose le rachat à domicile (« à confirmer sur le terrain ») | Porter ligne V ; Démonter une évidence |

## Autres
| Élément | Source |
|---|---|
| Boutique ≈ 25 m², 2 associées (70 / 30), Instagram/TikTok, rachat à domicile, coûts, revenus | `Business_Model_Canvas_Pepite_EN.pdf` |
| Visite 3D : vue d'artiste (décor, mobilier, vêtements imaginés pour donner envie ; seule la surface ≈ 25 m² et la façade rafraîchie viennent du BMC) | `Business_Model_Canvas_Pepite_EN.pdf`, Key Resources |
| 40 facteurs clés de succès : 8 fondamentaux, 17 hauts, 12 moyens, 3 bas ; 10 retenus | `Facteurs_cles_de_succes_Pepite.xlsx`, onglets Liste globale / Liste réduite / Graphiques |
| 12 actions notées impact/faisabilité, seuil 3,5 | `Matrice_impact_faisabilite_Pepite.pdf` (notes = estimation équipe) |
| 7 hypothèses et verdicts (1 validée, 2 partielles, 3 à valider, 1 invalidée) ; 5 prochaines étapes | `Demonter_une_evidence_Pepite.pdf` |
| Léa (21 ans) et Nathalie (58 ans), verbatims | `Donnees_Persona_Pepite_2.xlsx` (hypothèses d'équipe, pas des résultats d'enquête) |
| Charte (Cormorant Garamond / Arimo, crème-taupe-bordeaux) | `P_pite_pitch_deck_1.pptx` |

## Points à confirmer par l'équipe (non résolus dans les sources)
1. **Service de la dette.** Dans le tableau 2, « Solde du mois » = Recettes − Dépenses d'exploitation − TVA (vérifié sur les 6 mois) ; les lignes *Intérêts* (≈ 95 €/mois) et *Remboursement* (≈ 307 €/mois) ne sont pas soustraites. Si ces 402 €/mois ne sont pas déjà dans les « dépenses d'exploitation », la trésorerie centrale à M6 serait ≈ −2 200 € au lieu de +207 €. **Le pitch n'avance pas cette hypothèse**, mais il faut que l'auteur du plan la tranche avant la soutenance.
2. **Deux versions de personas** : Camille/Sophie (fichier 1) et Léa/Nathalie (fichier 2). Le pitch utilise la version 2 (choix de l'équipe). L'onglet « Exemple » (Valérie) n'est qu'un modèle.
3. **« 8 boutiques étudiées dans l'Oise »** : chiffre du deck, mais le fichier Excel ne détaille que 4 boutiques + Vinted + Le Dressing Circulaire. Le pitch ne reprend pas ce « 8 ».
4. **64 % vs « près de 3 sur 4 »** (voir plus haut).
5. **Statut juridique (SAS) et TVA** : provisoires dans le plan ; non présentés comme acquis.
