import { Injectable, signal } from "@angular/core";

export type ToastKind = "error" | "info";

const OUT_MS = 600;

/**
 * Toasts applicatifs (infobulles flottantes bas-droite) : un seul motif visuel
 * pour tous les messages d'erreur/info (§14 cohérence). Apparition rapide,
 * disparition lente. Coût nul au repos.
 */
@Injectable({ providedIn: "root" })
export class ToastService {
  readonly message = signal("");
  readonly kind = signal<ToastKind>("info");
  readonly leaving = signal(false);
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private clearTimer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;

  show(message: string, kind: ToastKind = "info", visibleMs = 3000): void {
    const id = ++this.seq;
    clearTimeout(this.hideTimer);
    clearTimeout(this.clearTimer);
    this.leaving.set(false);
    this.kind.set(kind);
    this.message.set(message);
    this.hideTimer = setTimeout(() => {
      if (id !== this.seq) return;
      this.leaving.set(true);
      this.clearTimer = setTimeout(() => {
        if (id !== this.seq) return;
        this.message.set("");
        this.leaving.set(false);
      }, OUT_MS);
    }, visibleMs);
  }
}
