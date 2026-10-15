# Changelog — Capricio

Entrées écrites manuellement à chaque release (version `YYYY.MM.xx`, tri décroissant).

## [2026.10.02]

- Windows : ajout du paquet `.msix`, réservé **uniquement** au Microsoft Store
  (généré automatiquement en CI via `scripts/pack-msix.ps1` + Windows SDK —
  même approche que Vivum ; non signé, Partner Center re-signe à la soumission).
- Windows (installation directe, hors Store) : toujours l'installeur `.exe`
  (NSIS). Ni l'`.exe` ni un `.msi` ne vont au Store : seul le `.msix` y va.
- Pas de `.msi` : la limite WiX (chaque composante ≤ 255) est incompatible avec
  les versions calendaires `2026.xx` — l'`.exe` NSIS couvre l'installation directe.
- Métadonnées Store : éditeur (`publisher`) = Martzcode, distinct du nom produit
  (exigence Microsoft Store) ; identité/nom du package paramétrables côté CI.

