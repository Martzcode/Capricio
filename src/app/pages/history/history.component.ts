import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ConfirmDialogComponent } from "../../components/confirm-dialog/confirm-dialog.component";
import { HistoryService } from "../../services/history.service";
import { I18nService } from "../../services/i18n.service";
import { ToastService } from "../../services/toast.service";

/**
 * F6 — Historique (§5.3) : journal chrono local, suppression d'une entrée,
 * effacement complet (confirmés). Recherche/filtres : V2 (F12).
 */
@Component({
  selector: "app-history",
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: "./history.component.html",
  styleUrl: "./history.component.css",
})
export class HistoryComponent {
  readonly history = inject(HistoryService);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18nService);
  readonly pendingDelete = signal<number | null>(null);
  readonly showClearConfirm = signal(false);

  askDelete(id: number): void {
    this.pendingDelete.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.pendingDelete();
    this.pendingDelete.set(null);
    if (id === null) return;
    try {
      await this.history.remove(id);
    } catch {
      this.toast.show(this.i18n.t("history.deleteError"), "error");
    }
  }

  async confirmClear(): Promise<void> {
    try {
      await this.history.clear();
    } catch {
      this.toast.show(this.i18n.t("history.clearError"), "error");
    }
    this.showClearConfirm.set(false);
  }
}
