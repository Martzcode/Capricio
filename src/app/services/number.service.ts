import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

export interface NumberResult {
  value: number;
}

/** F3 — Appel IPC `random_number` (contrat : in `{min, max}`, out `{value}`). */
@Injectable({ providedIn: "root" })
export class NumberService {
  draw(min: number, max: number): Promise<NumberResult> {
    return invoke<NumberResult>("random_number", { min, max });
  }
}
