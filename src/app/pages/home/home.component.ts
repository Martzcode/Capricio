import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ConfirmDialogComponent } from "../../components/confirm-dialog/confirm-dialog.component";
import { RecentListComponent } from "../../components/recent-list/recent-list.component";
import { ToolTileComponent, ToolDef } from "../../components/tool-tile/tool-tile.component";
import { HistoryService } from "../../services/history.service";
import { I18nService } from "../../services/i18n.service";
import { ToastService } from "../../services/toast.service";

const TUTORIAL_KEY = "capricio.hideTutorial";

/**
 * F1 — Écran d'accueil carrefour (§5.1, §14) : 4 outils max en 2 groupes
 * visuels Rapide/Réfléchi + 3 dernières décisions, sans scroll excessif.
 * Zéro friction : 1 clic par tuile, aucun blocage, tuto masquable (F7 : migrera
 * vers la table `settings` avec le thème à l'Étape 2).
 */
@Component({
  selector: "app-home",
  imports: [RouterLink, ToolTileComponent, RecentListComponent, ConfirmDialogComponent],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.css",
})
export class HomeComponent {
  readonly history = inject(HistoryService);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18nService);
  readonly showTutorial = signal(!this.isTutorialHidden());
  readonly showClearConfirm = signal(false);

  readonly fastTools = computed<ToolDef[]>(() => [
    { id: "coin", title: this.i18n.t("tools.coin"), desc: this.i18n.t("tools.coinDesc"), icon: "◐", route: "/coin" },
    { id: "number", title: this.i18n.t("tools.number"), desc: this.i18n.t("tools.numberDesc"), icon: "#", route: "/number" },
    { id: "draw", title: this.i18n.t("tools.draw"), desc: this.i18n.t("tools.drawDesc"), icon: "☰", route: "/draw" },
  ]);
  readonly slowTools = computed<ToolDef[]>(() => [
    { id: "pros-cons", title: this.i18n.t("tools.prosCons"), desc: this.i18n.t("tools.prosConsDesc"), icon: "±", route: "/pros-cons" },
  ]);

  dismissTutorial(): void {
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      /* stockage indisponible : le bandeau reviendra */
    }
    this.showTutorial.set(false);
  }

  /** Corbeille "Tout l'historique" : effacement complet après confirmation (F6 §5.3). */
  clearHistory(): void {
    if (this.history.entries().length === 0) return;
    this.showClearConfirm.set(true);
  }

  async confirmClear(): Promise<void> {
    try {
      await this.history.clear();
    } catch {
      this.toast.show(this.i18n.t("history.clearError"), "error");
    }
    this.showClearConfirm.set(false);
  }

  private isTutorialHidden(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "1";
    } catch {
      return false;
    }
  }
}
