import { Injectable, computed, effect, signal } from "@angular/core";

export type ThemeChoice = "light" | "dark" | "auto";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "capricio.theme";

/** F7a — Thème clair/sombre + détection système (§5.4, §9.4). Persisté en localStorage (migré vers table `settings` Étape 2). */
@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly choice = signal<ThemeChoice>(this.readStored());
  readonly effective: ReturnType<typeof computed<EffectiveTheme>> = computed(() => {
    const c = this.choice();
    if (c !== "auto") return c;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  constructor() {
    // Applique le thème effectif sur <html data-theme="..."> + bascule auto sur changement système.
    effect(() => {
      document.documentElement.dataset["theme"] = this.effective();
    });
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => this.choice.update((c) => c)); // réévalue le computed
  }

  set(choice: ThemeChoice): void {
    this.choice.set(choice);
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* stockage indisponible : le défaut auto s'applique */
    }
  }

  /** Bascule manuel clair ↔ sombre (depuis "auto", part du thème effectif). */
  toggle(): void {
    this.set(this.effective() === "dark" ? "light" : "dark");
  }

  private readStored(): ThemeChoice {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "auto") return v;
    } catch {
      /* ignore */
    }
    return "auto";
  }
}
