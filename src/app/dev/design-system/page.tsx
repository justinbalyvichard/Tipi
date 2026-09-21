"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { GemCounter } from "@/components/ui/GemCounter";
import { Icon, type IconeNom } from "@/components/ui/Icon";
import { Keypad } from "@/components/ui/Keypad";
import { ListGroup, ListRow } from "@/components/ui/ListRow";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { appliquerTheme, THEMES, type Theme } from "@/components/ui/theme";
import { Pilou } from "@/components/pilou/Pilou";
import { PilouReflechit } from "@/components/pilou/PilouReflechit";
import { SpeechBubble } from "@/components/pilou/SpeechBubble";
import { mascotConfig } from "@/config/mascot.config";
import { t } from "./textes";

/**
 * Page de contrôle visuel du design system. Jamais liée depuis l'application
 * (architecture P2, section 2) : elle n'existe que pour que le contrôleur voie
 * tous les composants, dans les deux thèmes, sur un même écran.
 *
 * Deux dispositifs y cohabitent :
 * 1. Deux panneaux `data-theme` côte à côte — la preuve que les deux thèmes
 *    sont deux jeux de variables sur **le même arbre de composants**. Le code
 *    de `Galerie` est écrit une seule fois et rendu deux fois.
 * 2. Un `ThemeSwitch` qui écrit sur `<html>` — la preuve que la commutation se
 *    fait à chaud, sans remontage.
 *
 * Aucun texte utilisateur n'est écrit dans ce fichier : tout passe par `t()`,
 * qui lit `content/`. Les seules chaînes littérales sont des noms de
 * composants et des identifiants techniques, qui ne sont pas de la copie.
 */

const ICONES: readonly IconeNom[] = [
  "micro",
  "pause",
  "pierre",
  "chevron",
  "engrenage",
  "retour",
  "son",
  "livre",
  "calcul",
  "coche",
  "photo",
  "effacer",
  "tipi",
];

function Bloc({ titre, children }: { readonly titre: string; readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-titre text-corps uppercase tracking-wide text-texte-appui">{titre}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Galerie(): ReactElement {
  const [code, setCode] = useState("");
  const [etape, setEtape] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      <Bloc titre="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variante="primaire">{t("enfant.accueil.bouton")}</Button>
          <Button variante="secondaire" icone="son">
            {t("lecture.modele.relire")}
          </Button>
          <Button variante="texte">{t("lecture.question.passer")}</Button>
          <Button variante="secondaire" icone="pause" etiquette={t("session.pause.bouton")} />
          <Button variante="primaire" desactive>
            {t("enfant.programme.bouton")}
          </Button>
        </div>
        <Button variante="primaire" pleineLargeur icone="micro">
          {t("lecture.micro.bouton")}
        </Button>
      </Bloc>

      <Bloc titre="Card">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card ton="surface">
            <p className="font-titre text-corps font-semibold">{t("coffre.titre")}</p>
            <p className="font-texte text-appui text-texte-appui">{t("coffre.rassurance")}</p>
          </Card>
          <Card ton="bleu">
            <p className="font-titre text-corps font-semibold">
              {t("enfant.programme.carte.lecture")}
            </p>
          </Card>
          <Card ton="corail">
            <p className="font-titre text-corps font-semibold">
              {t("enfant.programme.carte.maths")}
            </p>
          </Card>
          <Card ton="menthe">
            <p className="font-texte text-corps">{t("enfant.programme.corps.lecture_maths")}</p>
          </Card>
        </div>
      </Bloc>

      <Bloc titre="Chip">
        <div className="flex flex-wrap gap-2">
          <Chip ton="bleu" icone="livre">
            {t("enfant.programme.carte.lecture")}
          </Chip>
          <Chip ton="corail" icone="calcul">
            {t("enfant.programme.carte.maths")}
          </Chip>
          <Chip ton="jaune" icone="pierre">
            {t("coffre.solde.label")}
          </Chip>
          <Chip ton="menthe" icone="coche">
            {t("coffre.cosmetiques.debloque")}
          </Chip>
          <Chip ton="neutre">{t("reglages.menu.theme")}</Chip>
        </div>
      </Bloc>

      <Bloc titre="ProgressDots">
        <div className="flex items-center gap-4">
          <ProgressDots total={3} courant={etape} />
          <Button variante="texte" onClick={() => setEtape((e) => (e + 1) % 3)}>
            {t("lecture.retour.bouton")}
          </Button>
        </div>
      </Bloc>

      <Bloc titre="ListRow">
        <ListGroup>
          <ListRow
            icone="engrenage"
            tonIcone="primaire"
            titre={t("reglages.theme.titre")}
            sousTitre={t("reglages.theme.pilou_aide")}
            valeur={t("reglages.theme.pilou")}
            href="#"
          />
          <ListRow
            icone="pierre"
            tonIcone="secondaire"
            titre={t("reglages.menu.paliers")}
            onClick={() => undefined}
          />
          <ListRow icone="son" tonIcone="tertiaire" titre={t("reglages.menu.sons")} href="#" />
          <ListRow titre={t("reglages.menu.code")} sousTitre={t("reglages.code.saisie.corps")} />
        </ListGroup>
      </Bloc>

      <Bloc titre="Keypad">
        <Keypad
          valeur={code}
          onChange={setCode}
          longueur={10}
          etiquetteEffacer={t("reglages.code.saisie.effacer")}
          etiquetteSaisie={t("reglages.code.saisie.titre")}
        />
        <Button variante="primaire" pleineLargeur desactive={code.length < 10}>
          {t("reglages.code.saisie.bouton")}
        </Button>
      </Bloc>

      <Bloc titre="SpeechBubble">
        <div className="flex items-end gap-3">
          <Pilou taille="icone" />
          <SpeechBubble pointe="gauche">{t("enfant.attente.pilou")}</SpeechBubble>
        </div>
        <SpeechBubble pointe="bas">{t("lecture.modele.corps")}</SpeechBubble>
      </Bloc>

      <Bloc titre="GemCounter">
        <div className="flex flex-wrap items-center gap-3">
          <GemCounter solde={12} etiquette={t("coffre.solde.label")} />
          <GemCounter solde={147} etiquette={t("coffre.solde.label")} taille="hero" />
        </div>
      </Bloc>

      <Bloc titre="Icon">
        <div className="flex flex-wrap gap-4 text-encre">
          {ICONES.map((nom) => (
            <Icon key={nom} nom={nom} decorative taille={28} />
          ))}
        </div>
      </Bloc>

      <Bloc titre="Pilou">
        <div className="flex flex-wrap items-end gap-6">
          <Pilou taille="hero" anime />
          <Pilou taille="moyenne" />
          <Pilou taille="icone" />
        </div>
        <p className="font-titre text-corps font-semibold">{t("coffre.cosmetiques.titre")}</p>
        <div className="flex flex-wrap items-end gap-6">
          {mascotConfig.cosmetiques.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <Pilou taille="moyenne" cosmetique={c.id} />
              <code className="font-texte text-appui text-texte-appui">{c.id}</code>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <Pilou taille="moyenne" silhouette />
            <code className="font-texte text-appui text-texte-appui">silhouette</code>
          </div>
        </div>
        {/* Les quatre paliers VERROUILLÉS : Pilou normale, le cosmétique seul
            en silhouette neutre. Sans ces vignettes, le contrôle visuel ne
            verrait pas que les quatre paliers sont bien distincts — c'est le
            défaut exact du tour 1. */}
        {/* Le jeton {n} s'affiche non rendu : le rendu des jetons est serveur
            (`src/content/jetons.ts`, architecture §2) et n'appartient pas au
            design system. Une galerie montre la chaîne telle qu'elle est
            stockée. */}
        <p className="font-titre text-corps font-semibold">
          {t("coffre.cosmetiques.verrouille")}
        </p>
        <div className="flex flex-wrap items-end gap-6">
          {mascotConfig.cosmetiques
            .filter((c) => c.id !== "aucun")
            .map((c) => (
              <div key={`verrouille-${c.id}`} className="flex flex-col items-center gap-1">
                <Pilou taille="moyenne" cosmetique={c.id} cosmetiqueVerrouille />
                <code className="font-texte text-appui text-texte-appui">{c.id}</code>
              </div>
            ))}
        </div>
      </Bloc>

      <Bloc titre="PilouReflechit">
        <PilouReflechit etiquette={t("enfant.attente.pilou")} />
      </Bloc>
    </div>
  );
}

function Panneau({ theme }: { readonly theme: Theme }): ReactElement {
  return (
    <div
      data-theme={theme}
      className="min-w-0 flex-1 rounded-ecran bg-fond p-6 text-encre shadow-douce"
    >
      <p className="mb-6 font-titre text-titre">{theme}</p>
      <Galerie />
    </div>
  );
}

export default function PageDesignSystem(): ReactElement {
  const [theme, setTheme] = useState<Theme>("pilou");

  const changer = (t2: Theme): void => {
    setTheme(t2);
    appliquerTheme(t2);
  };

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4">
        <h1 className="font-titre text-titre-hero">{mascotConfig.nom}</h1>
        <Card ton="surface" className="max-w-md">
          <h2 className="mb-3 font-titre text-corps font-semibold">{t("reglages.theme.titre")}</h2>
          <ThemeSwitch
            valeur={theme}
            onChange={changer}
            etiquetteGroupe={t("reglages.theme.titre")}
            options={[
              {
                theme: "pilou",
                libelle: t("reglages.theme.pilou"),
                aide: t("reglages.theme.pilou_aide"),
              },
              {
                theme: "apple",
                libelle: t("reglages.theme.apple"),
                aide: t("reglages.theme.apple_aide"),
              },
            ]}
          />
          <p className="mt-3 font-texte text-appui text-texte-appui">{t("reglages.theme.corps")}</p>
        </Card>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        {THEMES.map((nom) => (
          <Panneau key={nom} theme={nom} />
        ))}
      </div>
    </main>
  );
}
