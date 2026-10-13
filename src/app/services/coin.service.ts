import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

export interface CoinResult {
  winner: string;
  index: number;
}

/** F2 — Appel IPC `coin_flip` (contrat : in `{labels}`, out `{winner, index}`). */
@Injectable({ providedIn: "root" })
export class CoinService {
  flip(labels: [string, string]): Promise<CoinResult> {
    return invoke<CoinResult>("coin_flip", { labels });
  }
}
