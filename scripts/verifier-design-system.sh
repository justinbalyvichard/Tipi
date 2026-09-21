#!/usr/bin/env bash
# Instrument de contrôle du design system (P3).
#
# Chaque bloc imprime CE QU'IL A TROUVÉ avant de conclure : un contrôle qui
# n'affiche que « aucun problème » est un instrument qui produit une preuve
# verte sans rien voir (40-protocole-agents.mdc, « Corriger un instrument de
# mesure », règle 5). Le compte est donc toujours publié, y compris quand il
# vaut zéro, et les occurrences légitimes sont listées, pas seulement filtrées.
#
# Usage : bash scripts/verifier-design-system.sh
set -uo pipefail
cd "$(dirname "$0")/.."

echec=0
titre() { printf '\n=== %s ===\n' "$1"; }

titre "1. Couleurs en dur (DES-01, DES-02)"
echo "Motif : #hex (avec ou sans dièse pour la table de référence), rgb(), rgba(), hsl(), hsla()"
echo "-- occurrences DANS themes.css (attendu : > 0, c'est le seul fichier de code autorisé) --"
grep -rEc '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src/styles/themes.css
echo "-- occurrences dans le CODE APPLICATIF, ailleurs (attendu : 0) --"
hors=$(grep -rEn '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src tailwind.config.ts 2>/dev/null \
  | grep -v '^src/styles/themes.css' || true)
if [ -n "$hors" ]; then echo "$hors"; echec=1; else echo "(aucune)"; fi
printf 'compte : %s\n' "$(printf '%s' "$hors" | grep -c . || true)"
echo "-- BALAYAGE DU DÉPÔT ENTIER, y compris sans dièse : les porteurs de couleur"
echo "   hors themes.css doivent être des TABLES DE RÉFÉRENCE nommées ci-dessous,"
echo "   jamais du code rendu. Le tour 1 annonçait un périmètre trop large et ce"
echo "   contrôle était aveugle à sa propre table (constat 6) --"
LEGITIMES="scripts/verifier-design-system.sh .cursor/rules/20-themes.mdc src/styles/themes.css"
echo "   porteurs légitimes déclarés : $LEGITIMES"
porteurs=$(grep -rlEi '#?(fff8ee|2e2a26|6b6459|8a8074|ede6d8|d8ccb8|6fb8e8|ff8b7b|8fe3c0|ffd166|e8f4fc|ffefe0|fff3d6|e9f9f0|f5f5f7|1d1d1f|86868b|e5e5ea|c7c7cc|007aff|ff9500|34c759|ff3b30|8e8e93|eaf3ff)\b' \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=docs \
  --exclude='pnpm-lock.yaml' --exclude='TIPI-PROMPT-CURSOR.md' . 2>/dev/null | sed 's|^\./||' | sort || true)
echo "   porteurs trouvés :"
echo "$porteurs" | sed 's/^/     /'
inattendus=""
for f in $porteurs; do
  case " $LEGITIMES " in *" $f "*) ;; *) inattendus="$inattendus $f" ;; esac
done
if [ -n "$inattendus" ]; then echo "   INATTENDU :$inattendus"; echec=1; else echo "   aucun porteur inattendu"; fi

titre "2. Interdits de code TEC-15 (any, @ts-ignore, console.log)"
for motif in ': any\b|<any>|as any' '@ts-ignore' 'console\.log'; do
  trouve=$(grep -rEn "$motif" src tailwind.config.ts 2>/dev/null || true)
  printf '%-24s -> %s occurrence(s)\n' "$motif" "$(printf '%s' "$trouve" | grep -c . || true)"
  if [ -n "$trouve" ]; then echo "$trouve"; echec=1; fi
done

titre "3. Emoji et dégradés (DES-07, 3.8)"
emoji=$(grep -rPn '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]' src 2>/dev/null || true)
printf 'emoji          -> %s\n' "$(printf '%s' "$emoji" | grep -c . || true)"
[ -n "$emoji" ] && { echo "$emoji"; echec=1; }
grad=$(grep -rEn 'gradient|linear-gradient|radial-gradient|bg-gradient' src tailwind.config.ts 2>/dev/null || true)
printf 'dégradés       -> %s\n' "$(printf '%s' "$grad" | grep -c . || true)"
[ -n "$grad" ] && { echo "$grad"; echec=1; }

titre "4. Éléments cliquables : jamais un div ni un span"
echo "-- toutes les lignes portant onClick, avec la balise ouvrante la plus proche --"
grep -rn 'onClick' src --include='*.tsx' || echo "(aucune)"
echo "-- div/span portant directement un onClick (attendu : 0) --"
mauvais=$(grep -rEn '<(div|span)[^>]*onClick' src --include='*.tsx' || true)
if [ -n "$mauvais" ]; then echo "$mauvais"; echec=1; else echo "(aucun)"; fi

titre "5. Cible tactile 56 px (DES-04)"
echo "-- valeur du jeton --"
grep -n 'tipi-cible-min' src/styles/themes.css
echo "-- composants interactifs et leur contrainte de hauteur --"
for f in src/components/ui/Button.tsx src/components/ui/Keypad.tsx \
         src/components/ui/ListRow.tsx src/components/ui/ThemeSwitch.tsx \
         src/components/ui/GemCounter.tsx; do
  printf '%-40s %s\n' "$f" "$(grep -oE 'min-h-cible(-large)?' "$f" | sort -u | tr '\n' ' ')"
  if ! grep -q 'min-h-cible' "$f"; then echo "  MANQUANT"; echec=1; fi
done

titre "6. Texte utilisateur en dur dans un composant"
echo "-- chaînes littérales rendues entre balises JSX, hors expressions --"
dur=$(grep -rEn '>[[:space:]]*[A-ZÉÀÇ][^<>{}]{3,}[[:space:]]*<' src --include='*.tsx' || true)
if [ -n "$dur" ]; then echo "$dur"; echec=1; else echo "(aucune)"; fi

titre "7. Jetons de 3.8 réellement déclarés"
# Les 26 valeurs distinctes de la section 3.8 : 15 côté Pilou, 12 côté Apple,
# #FFFFFF étant la surface des deux thèmes.
jetons="fff8ee ffffff 2e2a26 6b6459 8a8074 ede6d8 d8ccb8 6fb8e8 ff8b7b 8fe3c0 ffd166
e8f4fc ffefe0 fff3d6 e9f9f0 f5f5f7 1d1d1f 86868b e5e5ea c7c7cc 007aff ff9500
34c759 ff3b30 8e8e93 eaf3ff"
attendus=0; manquants=0
for t in $jetons; do
  attendus=$((attendus + 1))
  if ! grep -qi "#$t" src/styles/themes.css; then echo "MANQUANT: #$t"; manquants=$((manquants + 1)); fi
done
printf 'jetons 3.8 attendus : %s — manquants : %s\n' "$attendus" "$manquants"
[ "$manquants" -eq 0 ] || echec=1

titre "8. Règle d'emploi des deux jetons gris (DES-05)"
echo "-- text-texte-discret : ATTENDU 0 emploi (ratio 3,67:1 / 3,32:1) --"
d1=$(grep -rn 'text-texte-discret' src --include='*.tsx' || true)
if [ -n "$d1" ]; then echo "$d1"; echec=1; else echo "(aucun)"; fi
echo "-- text-texte-secondaire : chaque emploi, avec la taille de texte de la même classe --"
grep -rn 'text-texte-secondaire' src --include='*.tsx' || echo "(aucun)"
echo "   (attendu : uniquement la variante « texte » de Button, rendue en text-action,"
echo "    soit 20 px graisse 700 — donc « grand texte » au sens de WCAG)"
if grep -rn 'text-texte-secondaire' src --include='*.tsx' | grep -qv 'Button.tsx'; then
  echo "   ATTENTION : emploi hors de Button.tsx, à mesurer en petit texte"; echec=1
fi

titre "9. Animations (DES-08)"
echo "-- toutes les images-clés déclarées --"
grep -nE '^\s+(apparait|respire|"pense-1"):' tailwind.config.ts
echo "-- motifs interdits, ANCIENNE règle (mots nus) : elle signalait aussi la prose --"
ancien=$(grep -rEni 'blink|flash|clignot|animate-ping|animate-pulse|animate-bounce' src tailwind.config.ts || true)
printf 'ancienne règle -> %s occurrence(s), toutes listées :\n' "$(printf '%s' "$ancien" | grep -c . || true)"
[ -n "$ancien" ] && echo "$ancien"
echo "-- motifs interdits, RÈGLE RETENUE : utilitaires d'animation et noms d'images-clés"
echo "   seulement, parce que « flash » et « clignotement » ci-dessus sont des mots de"
echo "   commentaire qui DISENT l'interdit, jamais du code qui le produit --"
anim=$(grep -rEn 'animate-(ping|pulse|bounce)|@keyframes[^{]*(blink|flash)|animation:[^;]*(blink|flash)' \
  src tailwind.config.ts || true)
printf 'règle retenue -> %s occurrence(s)\n' "$(printf '%s' "$anim" | grep -c . || true)"
[ -n "$anim" ] && { echo "$anim"; echec=1; }
echo "-- durées déclarées --"
grep -nE 'duree-(douce|posee):|respire 4s|pense-1 1.8s' src/styles/themes.css tailwind.config.ts
echo "-- valeurs RECOPIÉES dans src/config/ui.config.ts : comparées, pas seulement imprimées --"
echo "   Ajouté au tour 2 de G4.V1. Avant, ce bloc n'ouvrait jamais ui.config.ts :"
echo "   il imprimait la source et laissait croire qu'il surveillait la copie."
echo "   Le contrôle de code l'a prouvé en faisant diverger 160ms en 999ms sans"
echo "   qu'aucun instrument ne rougisse (V1.review.md, MAJEUR 1)."
comparer_jeton() {
  # $1 = nom du jeton CSS, $2 = unité, $3 = constante TypeScript
  local css ts
  # `--` avant le motif : sans lui, un jeton CSS commençant par « -- » est pris
  # pour une option de grep, et la comparaison échoue au lieu de comparer.
  # C'est arrivé à la première version de ce bloc ; elle échouait FERMÉE
  # (verdict ECHEC), jamais verte — c'est le seul mode de panne acceptable
  # pour un instrument.
  css=$(grep -oE -- "$1:[[:space:]]*[0-9]+$2" src/styles/themes.css | grep -oE '[0-9]+' | head -1)
  ts=$(grep -oE -- "$3[[:space:]]*=[[:space:]]*[0-9]+" src/config/ui.config.ts | grep -oE '[0-9]+$' | head -1)
  if [ -z "$css" ] || [ -z "$ts" ]; then
    printf '   ECART : %s ou %s introuvable (css=%s ts=%s) — la comparaison ne peut pas se faire\n' \
      "$1" "$3" "${css:-?}" "${ts:-?}"
    echec=1
    return
  fi
  if [ "$css" != "$ts" ]; then
    printf '   ECART : themes.css %s = %s%s  MAIS  ui.config.ts %s = %s\n' "$1" "$css" "$2" "$3" "$ts"
    echec=1
  else
    printf '   egal : themes.css %s = %s%s  ==  ui.config.ts %s = %s\n' "$1" "$css" "$2" "$3" "$ts"
  fi
}
comparer_jeton '--tipi-duree-douce' 'ms' 'DUREE_DOUCE_MS'
comparer_jeton '--tipi-duree-posee' 'ms' 'DUREE_POSEE_MS'
comparer_jeton '--tipi-cible-min' 'px' 'CIBLE_TACTILE_MIN_PX'
echo "-- prise en compte de prefers-reduced-motion --"
grep -n 'prefers-reduced-motion' src/styles/themes.css || { echo "MANQUANT"; echec=1; }

printf '\n=== VERDICT DE L INSTRUMENT : %s ===\n' "$([ "$echec" -eq 0 ] && echo OK || echo ECHEC)"
exit "$echec"
