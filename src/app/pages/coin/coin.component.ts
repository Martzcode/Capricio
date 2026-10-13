import { Component, OnDestroy, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CoinService, CoinResult } from "../../services/coin.service";
import { HistoryService } from "../../services/history.service";

const FLIP_MS = 700;

/**
 * F2 — Pile ou face (§7.1, §5.2) : 1 bouton, animation < 1 s, rejouer en 1 clic.
 * `Entrée` dans le formulaire relance (submit natif). Persistance SQLite à
 * l'Étape 2 — d'ici là l'historique vit en mémoire (onglet courant).
 */
@Component({
  selector: "app-coin",
  imports: [RouterLink],
  templateUrl: "./coin.component.html",
  styleUrl: "./coin.component.css",
})
export class CoinComponent implements OnDestroy {
  private readonly coin = inject(CoinService);
  private readonly history = inject(HistoryService);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly labelA = signal("Pile");
  readonly labelB = signal("Face");
  readonly result = signal<CoinResult | null>(null);
  readonly flipping = signal(false);
  readonly error = signal("");

  setLabel(which: 0 | 1, value: string): void {
    if (which === 0) this.labelA.set(value);
    else this.labelB.set(value);
  }

  async flip(): Promise<void> {
    if (this.flipping()) return;
    this.error.set("");
    this.flipping.set(true);
    try {
      const res = await this.coin.flip([this.labelA(), this.labelB()]);
      // Suspens = durée de l'animation ; nul si animations désactivées.
      const wait = this.animationsOff() ? 0 : FLIP_MS;
      this.timer = setTimeout(() => {
        this.result.set(res);
        this.flipping.set(false);
        this.history.recent.update((list) => [
          {
            id: Date.now(),
            tool: "Pile ou face",
            title: `${this.labelA()} / ${this.labelB()}`,
            result: res.winner,
            at: new Date().toLocaleString("fr-FR"),
          },
          ...list,
        ]);
      }, wait);
    } catch (e) {
      this.flipping.set(false);
      this.error.set(typeof e === "string" ? e : "Tirage impossible.");
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  private animationsOff(): boolean {
    return (
      document.documentElement.dataset["animations"] === "off" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
}
