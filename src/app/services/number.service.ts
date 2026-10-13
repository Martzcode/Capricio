import { Injectable, inject } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { I18nService } from "./i18n.service";

export interface NumberResult {
  value: number;
}

/** F3 — Appel IPC `random_number` (contrat : in `{min, max, lang?}`, out `{value}`). */
@Injectable({ providedIn: "root" })
export class NumberService {
  private readonly i18n = inject(I18nService);

  draw(min: number, max: number): Promise<NumberResult> {
    return invoke<NumberResult>("random_number", { min, max, lang: this.i18n.lang() });
  }
}
