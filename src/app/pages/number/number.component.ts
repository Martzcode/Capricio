import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HistoryService } from "../../services/history.service";
import { NumberService } from "../../services/number.service";
import { ToastService } from "../../services/toast.service";

/**
 * F3 — Nombre aléatoire (§7.2, §5.2) : bornes min/max, tirage uniforme,
 * mini-historique des 5 derniers dans l'écran. `Entrée` = tirer (submit natif).
 * "Sans répétition" : ensemble de session côté frontend (V1, cf. plan §6) —
 * couvre aussi l'exclusion du dernier résultat.
 * Messages d'erreur/info : toasts applicatifs (ToastService).
 */
@Component({
  selector: "app-number",
  imports: [RouterLink],
  templateUrl: "./number.component.html",
  styleUrl: "./number.component.css",
})
export class NumberComponent {
  private readonly numbers = inject(NumberService);
  private readonly history = inject(HistoryService);
  private readonly toast = inject(ToastService);

  readonly min = signal(1);
  readonly max = signal(100);
  readonly withoutRepetition = signal(false);
  readonly value = signal<number | null>(null);
  readonly tail = signal<number[]>([]);
  private readonly drawn = new Set<number>();

  setBound(which: "min" | "max", raw: string): void {
    const text = raw.trim();
    if (!/^-?\d+$/.test(text)) {
      this.toast.show(
        text === "" ? "Veuillez saisir un nombre entier." : `« ${text} » n'est pas un nombre entier.`,
        "error",
      );
      return;
    }
    const v = Number.parseInt(text, 10);
    if (which === "min") this.min.set(v);
    else this.max.set(v);
  }

  toggleRepetition(): void {
    this.withoutRepetition.update((v) => !v);
    this.drawn.clear();
  }

  async draw(): Promise<void> {
    const lo = this.min();
    const hi = this.max();
    try {
      let v = await this.drawFresh(lo, hi);
      if (this.withoutRepetition()) {
        const span = hi - lo + 1;
        if (this.drawn.size >= span) {
          this.drawn.clear();
          this.toast.show("Toutes les valeurs ont été tirées — tirage réinitialisé.", "info");
        }
        let guard = 0;
        while (this.drawn.has(v) && guard++ < 100) v = (await this.drawFresh(lo, hi));
        this.drawn.add(v);
      }
      this.value.set(v);
      this.tail.update((t) => [v, ...t].slice(0, 5));
      this.history.recent.update((list) => [
        {
          id: Date.now(),
          tool: "Nombre aléatoire",
          title: `${lo} – ${hi}`,
          result: String(v),
          at: new Date().toLocaleString("fr-FR"),
        },
        ...list,
      ]);
    } catch (e) {
      this.toast.show(typeof e === "string" ? e : "Tirage impossible.", "error");
    }
  }

  private drawFresh(lo: number, hi: number): Promise<number> {
    return this.numbers.draw(lo, hi).then((r) => r.value);
  }
}
