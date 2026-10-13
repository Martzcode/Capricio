import { Injectable, inject } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { I18nService } from "./i18n.service";

export interface DrawResult {
  winners: string[];
  remaining: string[];
}

/** F4 — Appel IPC `draw_lots` (contrat : in `{options, count, withoutReplacement, lang?}`, out `{winners, remaining}`).
 *  Clés JS en camelCase : Tauri v2 les convertit en snake_case côté Rust.
 *  Les erreurs protocole brutes sont traduites (jamais affichées telles quelles). */
@Injectable({ providedIn: "root" })
export class DrawService {
  private readonly i18n = inject(I18nService);

  async draw(options: string[], count: number, withoutReplacement: boolean): Promise<DrawResult> {
    const lang = this.i18n.lang();
    try {
      return await invoke<DrawResult>("draw_lots", { options, count, withoutReplacement, lang });
    } catch (e) {
      if (typeof e === "string" && /invalid args|missing required key/i.test(e)) {
        throw this.i18n.t("draw.internalError");
      }
      throw e;
    }
  }
}
