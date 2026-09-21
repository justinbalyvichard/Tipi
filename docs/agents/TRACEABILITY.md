# Matrice de traçabilité — Tipi

Une ligne par identifiant `REQ-xxx` de la section 2 du prompt maître.
Statuts : `non démarré`, `en cours`, `implémenté`, `testé`, `validé`.

Mise à jour à chaque fin de verticale par l'Orchestrateur, vérifiée
intégralement par `recette-finale`. **Une exigence sans fichier ni test à la fin
bloque la recette.**

## REQ-PRD — Produit et parcours

| ID | Intitulé court | Fichiers d'implémentation | Tests | Statut |
| --- | --- | --- | --- | --- |
| PRD-01 | Onboarding 3 écrans, une seule fois à vie | — | — | non démarré |
| PRD-02 | Profil enfant pré-rempli, âge calculé| `src/lib/dates/age.ts`, `prisma/seed.ts` | `age.test.ts` (16), invariant I2a-d | implémenté |
| PRD-03 | Espace parent : capture multi-photos| `src/lib/devoirs/upload.ts`, `compression.ts` | `compression.test.ts` | implémenté |
| PRD-04 | Aperçu du programme modifiable + mode basse énergie | — | — | non démarré |
| PRD-05 | Lancement session même appareil, sans compte enfant | — | — | non démarré |
| PRD-06 | Résumé de fin qualitatif + notification | — | — | non démarré |
| PRD-07 | Annonce du programme : 2 pictos maximum | — | — | non démarré |
| PRD-08 | Étape lecture complète | — | — | non démarré |
| PRD-09 | Étape maths complète | — | — | non démarré |
| PRD-10 | Transition douce entre étapes | — | — | non démarré |
| PRD-11 | Clôture sans incitation à recommencer | — | — | non démarré |
| PRD-12 | Pause enfant, sans coût, sans abandon | — | — | non démarré |
| PRD-13 | Sortie anticipée réservée au parent | — | — | non démarré |
| PRD-14 | Écran Coffre à trésors | — | — | non démarré |
| PRD-15 | Réglages protégés par code à 10 chiffres | — | — | non démarré |
| PRD-16 | États limites traités avec bienveillance | — | — | non démarré |
| PRD-17 | Deux thèmes commutables depuis Réglages | — | — | non démarré |
| PRD-18 | Reprise de session au bon endroit | — | — | non démarré |

## REQ-PED — Pédagogie

| ID | Intitulé court | Fichiers d'implémentation | Tests | Statut |
| --- | --- | --- | --- | --- |
| PED-01 | Jamais donner le résultat en maths | — | — | non démarré |
| PED-02 | Échelle de 4 indices progressifs | — | — | non démarré |
| PED-03 | Concret → représenté → abstrait | — | — | non démarré |
| PED-04 | Jamais « c'est faux » | — | — | non démarré |
| PED-05 | Éloge centré sur l'effort | — | — | non démarré |
| PED-06 | 2 étapes maximum par soir | — | — | non démarré |
| PED-07 | Aucun chrono ni compteur visible | — | — | non démarré |
| PED-08 | Détection de blocage après 3 sollicitations | — | — | non démarré |
| PED-09 | Tolérance large sur la reconnaissance vocale | — | — | non démarré |
| PED-10 | Toute info importante doublée à l'oral | — | — | non démarré |
| PED-11 | ≥ 20 variantes par situation, en fichier | — | — | non démarré |
| PED-12 | Rituel de fermeture identique chaque soir | — | — | non démarré |
| PED-13 | Breton en mode dégradé assumé | — | — | non démarré |

## REQ-TEC — Technique

| ID | Intitulé court | Fichiers d'implémentation | Tests | Statut |
| --- | --- | --- | --- | --- |
| TEC-01 | Next.js 14 App Router, TS strict, Tailwind, pnpm| `package.json`, `tsconfig.json`, `src/app/layout.tsx` | typecheck, lint, build | implémenté |
| TEC-02 | Supabase Postgres + Storage, région UE| `src/lib/storage/supabase.ts` | épreuve base réelle | **couverte sous condition** (ARB-17d : 4 conditions) |
| TEC-03 | Prisma conforme au modèle 3.7| `prisma/schema.prisma`, `src/lib/db/prisma.ts` | `prisma validate`, `db:diff`, 11 tables RLS | implémenté |
| TEC-04 | Zustand + TanStack Query| `src/stores/session-ui.ts`, `src/app/providers.tsx` | typecheck | implémenté |
| TEC-05 | Pipeline photo → OCR Vision → JSON → DeepSeek texte| `src/lib/ocr/**`, `src/lib/ai/**` | épreuve pipeline, 3 scénarios | implémenté |
| TEC-06 | Aucune session sans validation parent| aucun chemin de V2 ne crée de session | contrôle C5 (dérivé du schéma) | implémenté |
| TEC-07 | 4 indices pré-générés à l'analyse| `src/lib/ai/prompts/`, pré-génération à l'analyse | tests d'analyse | implémenté |
| TEC-08 | TTS Chirp3-HD derrière VoiceProvider | — | — | non démarré |
| TEC-09 | STT Web Speech API derrière SpeechProvider | — | — | non démarré |
| TEC-09b | Cache persistant du TTS en Storage | — | — | non démarré |
| TEC-10 | Moteur de session en machine à états explicite | — | — | non démarré |
| TEC-11 | Service pierres côté serveur uniquement | — | — | non démarré |
| TEC-12 | Animation « Pilou réfléchit » au-delà de 400 ms | — | — | non démarré |
| TEC-13 | Clés d'API jamais dans le bundle client| `src/config/env.ts`, `env.client.ts` | grep `.next/static`, 4 jeux de sentinelles | implémenté |
| TEC-14 | typecheck, lint, test, build tous verts | — | — | non démarré |
| TEC-15 | Aucun any, @ts-ignore, console.log | — | — | non démarré |
| TEC-16 | Mode calibration OCR, seuils configurables| `src/config/seuils.config.ts`, `src/lib/devoirs/calibration.ts` | journal en base | implémenté |
| TEC-17 | AiProvider unique, DeepSeek confiné à src/lib/ai/| `src/lib/ai/provider.ts`, `providers/` | contrôles C1 à C8 | implémenté |
| TEC-18 | Pas de multi-appareils, mais état en base | — | — | non démarré |

## REQ-SEC — Sécurité et confidentialité

| ID | Intitulé court | Fichiers d'implémentation | Tests | Statut |
| --- | --- | --- | --- | --- |
| SEC-01 | Code parent hashé, jamais en clair | — | — | non démarré |
| SEC-02 | Blocage progressif après 5 essais | — | — | non démarré |
| SEC-03 | RLS activée sur toutes les tables, prouvée | — | — | non démarré |
| SEC-04 | Payload DeepSeek sans donnée identifiante| `src/lib/ai/anonymisation.ts` (types scellés) | épreuve base réelle, 11 mutations | implémenté |
| SEC-05 | Rétention courte + purge des audios | — | — | non démarré |
| SEC-06 | Solde de pierres non modifiable depuis le client | — | — | non démarré |
| SEC-07 | Écran Données & confidentialité, export, suppression | — | — | non démarré |
| SEC-08 | Code parent absent des écrans enfant et des prompts IA | — | — | non démarré |

## REQ-DES — Design

| ID | Intitulé court | Fichiers d'implémentation | Tests | Statut |
| --- | --- | --- | --- | --- |
| DES-01 | Thème Pilou aux tokens exacts| `src/styles/themes.css`, `tailwind.config.ts` | 68 couples de contraste | implémenté |
| DES-02 | Thème Apple aux tokens exacts| `src/styles/themes.css` | 68 couples de contraste | implémenté |
| DES-03 | Typographies des deux thèmes| `tailwind.config.ts` | contrôle design | implémenté |
| DES-04 | Cibles tactiles ≥ 56 px | — | — | non démarré |
| DES-05 | Contraste WCAG AA dans les deux thèmes | — | — | non démarré |
| DES-06 | Une seule action principale par écran | — | — | non démarré |
| DES-07 | Aucun emoji, icônes SVG au trait | — | — | non démarré |
| DES-08 | Animations courtes, aucun clignotement | — | — | non démarré |
| DES-09 | Pilou en SVG unique piloté par mascot.config.ts | — | — | non démarré |
| DES-10 | Icône et écran de lancement sobres | — | — | non démarré |

## REQ-ETH — Éthique

| ID | Intitulé court | Fichiers d'implémentation | Tests | Statut |
| --- | --- | --- | --- | --- |
| ETH-01 | Aucune urgence ni rareté artificielle | — | — | non démarré |
| ETH-02 | Aucun streak, aucune notification culpabilisante | — | — | non démarré |
| ETH-03 | Aucun achat, aucune publicité, aucun traceur | — | — | non démarré |
| ETH-04 | Les pierres ne se perdent ni n'expirent jamais | — | — | non démarré |
| ETH-05 | L'application n'octroie jamais la récompense réelle | — | — | non démarré |

---

**Total : 73 exigences.** Couverture après V1 et V2 : **16 / 73 implémentées**, aucune validée — la validation appartient à `recette-finale` (P8).

Statuts : `implémenté` = code et instrument en place, contrôlés par un agent distinct. `validé` = vérifié par `recette-finale` contre le référentiel. Aucune exigence ne passe de `implémenté` à `validé` avant P8.
