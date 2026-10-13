import { Injectable, inject } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { I18nService } from "./i18n.service";

export interface CoinResult {
  winner: string;
  index: number;
}

/** F2 — Appel IPC `coin_flip` (contrat : in `{labels, lang?}`, out `{winner, index}`). */
@Injectable({ providedIn: "root" })
export class CoinService {
  private readonly i18n = inject(I18nService);

  flip(labels: [string, string]): Promise<CoinResult> {
    return invoke<CoinResult>("coin_flip", { labels, lang: this.i18n.lang() });
  }
}
