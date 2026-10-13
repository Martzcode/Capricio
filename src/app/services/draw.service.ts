import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

export interface DrawResult {
  winners: string[];
  remaining: string[];
}

/** F4 — Appel IPC `draw_lots` (contrat : in `{options, count, withoutReplacement}`, out `{winners, remaining}`).
 *  Clés JS en camelCase : Tauri v2 les convertit en snake_case côté Rust.
 *  Les erreurs protocole brutes sont traduites (jamais affichées telles quelles). */
@Injectable({ providedIn: "root" })
export class DrawService {
  async draw(options: string[], count: number, withoutReplacement: boolean): Promise<DrawResult> {
    try {
      return await invoke<DrawResult>("draw_lots", { options, count, withoutReplacement });
    } catch (e) {
      if (typeof e === "string" && /invalid args|missing required key/i.test(e)) {
        throw "Erreur interne de l'application, veuillez réessayer.";
      }
      throw e;
    }
  }
}
