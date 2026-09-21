#!/usr/bin/env bash
# Compare les migrations livrées au schéma, SANS jamais toucher la base vive.
#
# `pnpm db:diff`
#
# POURQUOI CE SCRIPT EXISTE — et c'est une faute de ma part, publiée.
# `prisma migrate diff --shadow-database-url` **réinitialise** la base qu'on lui
# donne. Au tour 2 de G4.V1, j'ai passé la base vive en base fantôme : la
# commande a effacé les données du seed. `controle-code` a reproduit le geste et
# a tiré la conséquence que je n'avais pas tirée ([MINEUR] T2-6) — sur une vraie
# base, cela aurait détruit **les pierres d'Evan**, et le seed ne les
# reconstitue pas : `prisma/seed.ts` ne réécrit jamais `gem_balance`,
# `theme_prefere`, `cosmetique_active` ni `onboarding_termine_le`, parce qu'un
# seed qui remettrait le solde à zéro violerait ETH-04.
#
# Un avertissement dans la prose d'un rapport ne protège personne. La commande
# dangereuse ne doit plus être celle qu'on tape de mémoire : celle-ci l'est, et
# elle refuse de s'exécuter si la base fantôme n'est pas distincte.
#
# La base fantôme n'est PAS une variable de `.env.example` : ce fichier décrit
# la configuration d'exécution du produit (P2 §11, 27 variables), pas
# l'outillage de développement. Par défaut, le nom de la base est suffixé
# `_shadow` ; `SHADOW_DATABASE_URL` permet d'en désigner une autre.
set -uo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "db:diff — DATABASE_URL n'est pas définie. Rien à comparer." >&2
  exit 1
fi

# Par défaut : la même base, suffixée _shadow. Jamais la base vive.
defaut="$(printf '%s' "$DATABASE_URL" | sed -E 's#^([^?]*/)([^/?]+)(\?.*)?$#\1\2_shadow\3#')"
shadow="${SHADOW_DATABASE_URL:-$defaut}"

if [ "$shadow" = "$DATABASE_URL" ] || [ "$shadow" = "${DIRECT_URL:-}" ]; then
  cat >&2 <<'MSG'
db:diff — REFUSÉ.

La base fantôme désignée est la base vive (DATABASE_URL ou DIRECT_URL).
`prisma migrate diff` RÉINITIALISE la base fantôme : cette commande aurait
effacé les données, y compris le solde de pierres, que le seed ne reconstitue
pas (ETH-04).

Désigner une autre base avec SHADOW_DATABASE_URL, ou laisser la valeur par
défaut, qui suffixe le nom de la base par `_shadow`.
MSG
  exit 1
fi

echo "db:diff — base fantôme : ${shadow%%\?*}"
echo "db:diff — la base vive n'est ni lue ni écrite."
exec npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$shadow"
