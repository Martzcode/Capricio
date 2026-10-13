import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

export interface ProsConsArg {
  label: string;
  weight: 1 | 2 | 3;
}

export interface ProsConsEvaluation {
  scorePour: number;
  scoreContre: number;
  ecartPct: number;
  verdict: string;
}

/** F5 — Appel IPC `pros_cons_evaluate` (poids 1/2/3 côté Rust, échelle fine en V2). */
@Injectable({ providedIn: "root" })
export class ProsConsService {
  evaluate(title: string, pros: ProsConsArg[], cons: ProsConsArg[]): Promise<ProsConsEvaluation> {
    return invoke<ProsConsEvaluation>("pros_cons_evaluate", { title, pros, cons });
  }
}
