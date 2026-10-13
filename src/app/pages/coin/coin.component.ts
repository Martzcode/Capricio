import { Component, OnDestroy, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CoinService, CoinResult } from "../../services/coin.service";
import { HistoryService } from "../../services/history.service";
import { I18nService } from "../../services/i18n.service";
import { ToastService } from "../../services/toast.service";

const FLIP_MS = 700;

/**
 * F2 — Pile ou face (§7.1, §5.2) : 1 bouton, animation < 1 s, rejouer en 1 clic.
 * `Entrée` dans le formulaire relance (submit natif). Historique persisté (F6).
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
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18nService);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly labelA = signal(this.i18n.t("coin.defaultA"));
  readonly labelB = signal(this.i18n.t("coin.defaultB"));
  readonly result = signal<CoinResult | null>(null);
  readonly flipping = signal(false);

  setLabel(which: 0 | 1, value: string): void {
    if (which === 0) this.labelA.set(value);
    else this.labelB.set(value);
  }

  async flip(): Promise<void> {
    if (this.flipping()) return;
    this.flipping.set(true);
    try {
      const res = await this.coin.flip([this.labelA(), this.labelB()]);
      // Suspens = durée de l'animation ; nul si animations désactivées.
      const wait = this.animationsOff() ? 0 : FLIP_MS;
      this.timer = setTimeout(() => {
        this.result.set(res);
        this.flipping.set(false);
        this.history
          .add({
            tool: this.i18n.t("tools.coin"),
            title: `${this.labelA()} / ${this.labelB()}`,
            resume: res.winner,
            details: { labels: [this.labelA(), this.labelB()], winner: res.winner },
          })
          .catch((e: unknown) =>
            this.toast.show(typeof e === "string" ? e : this.i18n.t("common.historyError"), "error"),
          );
      }, wait);
    } catch (e) {
      this.flipping.set(false);
      this.toast.show(typeof e === "string" ? e : this.i18n.t("coin.error"), "error");
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
