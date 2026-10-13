import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HistoryService } from "../../services/history.service";
import { I18nService } from "../../services/i18n.service";
import { ProsConsArg, ProsConsEvaluation, ProsConsService } from "../../services/pros-cons.service";
import { ToastService } from "../../services/toast.service";

const WEIGHTS = [
  { value: 1, key: "pc.wLow" },
  { value: 2, key: "pc.wMid" },
  { value: 3, key: "pc.wHigh" },
] as const;

type Camp = "pros" | "cons";

/**
 * F5 — Pour/contre pondéré MVP (§8.1) : titre, 2 colonnes dynamiques, poids
 * Faible/Moyen/Fort, verdict Rust + garde-fou. Le résultat est effacé à chaque
 * modification (jamais de verdict périmé affiché).
 */
@Component({
  selector: "app-pros-cons",
  imports: [RouterLink],
  templateUrl: "./pros-cons.component.html",
  styleUrl: "./pros-cons.component.css",
})
export class ProsConsComponent {
  private readonly evaluations = inject(ProsConsService);
  private readonly history = inject(HistoryService);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18nService);

  readonly title = signal("");
  readonly pros = signal<ProsConsArg[]>([{ label: "", weight: 2 }]);
  readonly cons = signal<ProsConsArg[]>([{ label: "", weight: 2 }]);
  readonly evaluation = signal<ProsConsEvaluation | null>(null);
  readonly weights = WEIGHTS;

  /** Alerte biais : un seul camp rempli (§8.1). */
  readonly singleSided = computed(() => {
    const p = this.pros().some((a) => a.label.trim().length > 0);
    const c = this.cons().some((a) => a.label.trim().length > 0);
    return p !== c;
  });

  /** Les deux camps avec libellés localisés (réactifs à la langue). */
  readonly camps = computed(() => [
    { key: "pros" as Camp, name: this.i18n.t("pc.pros"), args: this.pros() },
    { key: "cons" as Camp, name: this.i18n.t("pc.cons"), args: this.cons() },
  ]);

  setTitle(value: string): void {
    this.title.set(value);
    this.evaluation.set(null);
  }

  setLabel(camp: Camp, index: number, value: string): void {
    this.update(camp, index, { label: value });
  }

  setWeight(camp: Camp, index: number, weight: 1 | 2 | 3): void {
    this.update(camp, index, { weight });
  }

  add(camp: Camp): void {
    const list = (camp === "pros" ? this.pros : this.cons)();
    (camp === "pros" ? this.pros : this.cons).set([...list, { label: "", weight: 2 }]);
    this.evaluation.set(null);
  }

  remove(camp: Camp, index: number): void {
    const set = camp === "pros" ? this.pros : this.cons;
    set.set(set().filter((_, i) => i !== index));
    this.evaluation.set(null);
  }

  async evaluate(): Promise<void> {
    try {
      const res = await this.evaluations.evaluate(
        this.title(),
        this.nonEmpty(this.pros()),
        this.nonEmpty(this.cons()),
      );
      this.evaluation.set(res);
      await this.history.add({
        tool: this.i18n.t("tools.prosCons"),
        title: this.title().trim(),
        resume: `${res.verdict} (${res.scorePour} vs ${res.scoreContre})`,
        details: { pros: this.nonEmpty(this.pros()), cons: this.nonEmpty(this.cons()), evaluation: res },
      });
    } catch (e) {
      this.toast.show(typeof e === "string" ? e : this.i18n.t("pc.error"), "error");
    }
  }

  /** Les lignes vides ne partent pas au calcul (0+0 → verdict Indécis). */
  private nonEmpty(args: ProsConsArg[]): ProsConsArg[] {
    return args.filter((a) => a.label.trim().length > 0);
  }

  private update(camp: Camp, index: number, patch: Partial<ProsConsArg>): void {
    const set = camp === "pros" ? this.pros : this.cons;
    set.set(set().map((a, i) => (i === index ? { ...a, ...patch } : a)));
    this.evaluation.set(null);
  }
}
