#!/usr/bin/env bash
# Tamponne la version dans les fichiers du projet.
# Usage : stamp-version.sh <VERSION_AFFICHAGE> <VERSION_SEMVER>
#   VERSION_AFFICHAGE : YYYY.MM.xx avec zéro (tag, release, À propos)
#   VERSION_SEMVER    : forme normalisée sans zéros initiaux (Tauri/Cargo stricts)
set -euo pipefail
VERSION="$1"
SEMVER="$2"
export VERSION SEMVER

node -e "
  const fs = require('fs');
  const version = process.env.VERSION;
  const semver = process.env.SEMVER;
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = semver;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  conf.version = semver;
  fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n');
  fs.writeFileSync('src/app/version.ts', '/** Version affichée (À propos). Écrite par la CI release — ne pas modifier à la main. */\nexport const APP_VERSION = ' + JSON.stringify(version) + ';\n');
"

python3 - <<'EOF'
import os, re
version = os.environ["SEMVER"]
p = "src-tauri/Cargo.toml"
s = open(p).read()
s, n = re.subn(r'^version = "[^"]+"', f'version = "{version}"', s, count=1, flags=re.M)
assert n == 1, "version introuvable dans Cargo.toml"
open(p, "w").write(s)
p = "src-tauri/Cargo.lock"
s = open(p).read()
s, n = re.subn(r'(name = "capricio"\nversion = ")[^"]+(")', rf"\g<1>{version}\g<2>", s, count=1)
assert n == 1, "entrée capricio introuvable dans Cargo.lock"
open(p, "w").write(s)
EOF
