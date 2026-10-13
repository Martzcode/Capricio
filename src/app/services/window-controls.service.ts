import { Injectable, signal } from "@angular/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Contrôles de la barre de titre personnalisée (decorations:false).
 * Hors Tauri (ex. `ng serve` navigateur) : inopérant, les boutons sont masqués (cf. TitlebarComponent).
 */
@Injectable({ providedIn: "root" })
export class WindowControlsService {
  /**
   * Vrai quand on tourne dans la coquille Tauri (fenêtre native masquée à remplacer).
   * V2 : `__TAURI_INTERNALS__` est toujours injecté ; `__TAURI__` seulement si
   * `app.withGlobalTauri=true` (non activé : moindre privilège §10.2).
   */
  readonly isTauri =
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
  readonly isMaximized = signal(false);

  async refresh(): Promise<void> {
    if (!this.isTauri) return;
    try {
      this.isMaximized.set(await getCurrentWindow().isMaximized());
    } catch {
      /* fenêtre indisponible (tests) */
    }
  }

  /** Déplacement natif au clic-glisser (complète data-tauri-drag-region, fiable y c. Wayland). */
  async startDragging(): Promise<void> {
    if (!this.isTauri) return;
    try {
      await getCurrentWindow().startDragging();
    } catch (e) {
      console.error("[titlebar] startDragging refusé (permission ?)", e);
    }
  }

  async minimize(): Promise<void> {
    if (!this.isTauri) return;
    try {
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error("[titlebar] minimize refusé (permission ?)", e);
    }
  }

  async toggleMaximize(): Promise<void> {
    if (!this.isTauri) return;
    try {
      await getCurrentWindow().toggleMaximize();
    } catch (e) {
      console.error("[titlebar] toggleMaximize refusé (permission ?)", e);
    }
    await this.refresh();
  }

  async closeWindow(): Promise<void> {
    if (!this.isTauri) return;
    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error("[titlebar] close refusé (permission ?)", e);
    }
  }
}
