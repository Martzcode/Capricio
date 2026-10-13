import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DrawService } from "../../services/draw.service";
import { HistoryService } from "../../services/history.service";
import { ToastService } from "../../services/toast.service";

/**
 * F4 — Tirage au sort (§7.3, §5.2) : 1 option/ligne, N à tirer, sans remise
 * optionnel, relance sur le reste. `Entrée` hors textarea = tirer.
 */
@Component({
  selector: "app-draw",
  imports: [RouterLink],
  templateUrl: "./draw.component.html",
  styleUrl: "./draw.component.css",
})
export class DrawComponent {
  private readonly draws = inject(DrawService);
  private readonly history = inject(HistoryService);
  private readonly toast = inject(ToastService);

  readonly rawText = signal("");
  readonly count = signal(1);
  readonly withoutReplacement = signal(false);
  readonly winners = signal<string[]>([]);
  readonly remainingCount = signal(0);

  /** Options nettoyées (une/ligne, sans vides) — compteur et envoi. */
  readonly options = computed(() =>
    this.rawText()
      .split("\n")
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
  );

  /** Plafond : au plus N-1 (au moins 1 si moins de 2 options saisies). */
  readonly maxCount = computed(() => Math.max(1, this.options().length - 1));

  setText(value: string): void {
    this.rawText.set(value);
  }

  stepCount(delta: number): void {
    this.count.update((c) => Math.min(this.maxCount(), Math.max(1, c + delta)));
  }

  toggleReplacement(): void {
    this.withoutReplacement.update((v) => !v);
  }

  async draw(): Promise<void> {
    const options = this.options();
    // Replafonne si la liste a rétréci depuis le réglage du compteur.
    this.count.update((c) => Math.min(this.maxCount(), Math.max(1, c)));
    try {
      const res = await this.draws.draw(options, this.count(), this.withoutReplacement());
      this.winners.set(res.winners);
      this.remainingCount.set(res.remaining.length);
      if (this.withoutReplacement()) {
        // La suite se joue sur le reste : la zone reflète la liste restante.
        this.rawText.set(res.remaining.join("\n"));
      }
      await this.history.add({
        tool: "Tirage au sort",
        title: `${options.length} option${options.length > 1 ? "s" : ""}`,
        resume: res.winners.join(", "),
        details: { options, count: this.count(), winners: res.winners },
      });
    } catch (e) {
      this.toast.show(typeof e === "string" ? e : "Tirage impossible.", "error");
    }
  }
}
