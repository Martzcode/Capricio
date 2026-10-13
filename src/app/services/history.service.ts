import { Injectable, computed, inject, signal } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { I18nService } from "./i18n.service";

/** Résumé affiché dans les récents (F1) et l'historique (F6). */
export interface DecisionSummary {
  id: number;
  tool: string;
  title: string;
  result: string;
  at: string;
}

/** Ligne brute SQLite (clés camelCase via `rename_all`). */
interface DecisionRow {
  id: number;
  typeOutil: string;
  titre: string;
  dateCreation: string;
  resultat: string;
}

/**
 * F6 — Historique persisté (§5.3, §9.1 V1) : SQLite via IPC, journal chrono,
 * suppression unitaire + effacement complet. Hors Tauri (navigateur) : repli
 * mémoire, l'app reste utilisable en dev.
 */
@Injectable({ providedIn: "root" })
export class HistoryService {
  private readonly i18n = inject(I18nService);
  private readonly all = signal<DecisionSummary[]>([]);
  /** Les 3 dernières pour l'accueil (§5.1). */
  readonly recent3 = computed(() => this.all().slice(0, 3));
  /** Journal complet pour la page Historique. */
  readonly entries = this.all.asReadonly();

  /** Charge depuis SQLite au démarrage (échec silencieux hors Tauri). */
  async load(): Promise<void> {
    try {
      const rows = await invoke<DecisionRow[]>("get_history", { limit: 200 });
      this.all.set(rows.map((r) => this.toSummary(r)));
    } catch {
      this.all.set([]);
    }
  }

  /** Sauvegarde auto après chaque décision (§13.2). */
  async add(input: { tool: string; title: string; resume: string; details: unknown }): Promise<void> {
    const at = this.i18n.formatDate(new Date());
    try {
      const id = await invoke<number>("save_decision", {
        typeOutil: input.tool,
        titre: input.title,
        donneesEntree: input.details,
        resultat: { resume: input.resume },
      });
      this.all.update((list) => [{ id, tool: input.tool, title: input.title, result: input.resume, at }, ...list]);
    } catch {
      throw this.i18n.t("common.historyError");
    }
  }

  async remove(id: number): Promise<void> {
    await invoke("delete_history_entry", { id });
    this.all.update((list) => list.filter((d) => d.id !== id));
  }

  async clear(): Promise<void> {
    await invoke("clear_history", {});
    this.all.set([]);
  }

  private toSummary(row: DecisionRow): DecisionSummary {
    let resume = row.resultat;
    try {
      const parsed: unknown = JSON.parse(row.resultat);
      if (typeof parsed === "object" && parsed !== null && "resume" in parsed) {
        resume = String((parsed as Record<string, unknown>)["resume"]);
      }
    } catch {
      /* resultat brut (ligne legacy) */
    }
    let at = row.dateCreation;
    try {
      at = new Date(row.dateCreation).toLocaleString(this.i18n.locale());
    } catch {
      /* garde la valeur brute */
    }
    return { id: row.id, tool: row.typeOutil, title: row.titre, result: resume, at };
  }
}
