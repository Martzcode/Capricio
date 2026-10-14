import { Injectable, computed, effect, signal } from "@angular/core";
import { de } from "../i18n/de";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import { fr } from "../i18n/fr";

export type Lang = "fr" | "en" | "es" | "de";

export const LANGS: Lang[] = ["fr", "en", "es", "de"];
export const LANG_NAMES: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
};
const DICTS: Record<Lang, Record<string, string>> = { fr, en, es, de };
const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE" };
const STORAGE_KEY = "capricio.lang";

function isLang(v: string | null): v is Lang {
  return v === "fr" || v === "en" || v === "es" || v === "de";
}

/**
 * F7 — Internationalisation (§13.4) : FR livré + EN/ES/DE, architecture
 * extensible (1 fichier `i18n/xx.ts` + 1 entrée ici). Dictionnaires synchrones
 * (100 % hors-ligne, pas de lib). Repli français si clé manquante.
 */
@Injectable({ providedIn: "root" })
export class I18nService {
  readonly lang = signal<Lang>(this.readInitial());
  readonly locale = computed(() => LOCALES[this.lang()]);

  constructor() {
    effect(() => {
      const l = this.lang();
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* stockage indisponible */
      }
      document.documentElement.lang = l;
    });
  }

  set(lang: Lang): void {
    this.lang.set(lang);
  }

  /** Cycle FR → EN → ES → DE (bouton titlebar, sobre §3). */
  cycle(): void {
    const i = LANGS.indexOf(this.lang());
    this.lang.set(LANGS[(i + 1) % LANGS.length]);
  }

  /** Traduction + interpolation `{param}`. Réactif (lit le signal `lang`). */
  t(key: string, params?: Record<string, string | number>): string {
    const dict = DICTS[this.lang()];
    let s = dict[key] ?? fr[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  }

  /** Date localisée selon la langue courante (§13.4). */
  formatDate(d: Date): string {
    return d.toLocaleString(this.locale());
  }

  private readInitial(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isLang(stored)) return stored;
    } catch {
      /* ignore */
    }
    try {
      const nav = navigator.language.slice(0, 2).toLowerCase();
      if (isLang(nav)) return nav;
    } catch {
      /* ignore */
    }
    return "fr";
  }
}
