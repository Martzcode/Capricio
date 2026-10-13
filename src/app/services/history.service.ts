import { Injectable, signal } from "@angular/core";

/** Résumé affiché dans les "3 récents" de l'accueil (F1) et l'historique (F6). */
export interface DecisionSummary {
  id: number;
  tool: string;
  title: string;
  result: string;
  at: string;
}

/**
 * F1 — Seams pour l'accueil : expose les décisions récentes en Signal.
 * Données réelles branchées à l'Étape 2/3 (SQLite + IPC `get_history`) puis F6/Étape 9.
 * D'ici là : liste vide → l'accueil affiche l'état vide prévu (§5.1).
 */
@Injectable({ providedIn: "root" })
export class HistoryService {
  readonly recent = signal<DecisionSummary[]>([]);
}
