import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ConfirmDialogComponent } from "../../components/confirm-dialog/confirm-dialog.component";
import { RecentListComponent } from "../../components/recent-list/recent-list.component";
import { ToolTileComponent, ToolDef } from "../../components/tool-tile/tool-tile.component";
import { HistoryService } from "../../services/history.service";

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
  readonly showTutorial = signal(!this.isTutorialHidden());
  readonly showClearConfirm = signal(false);

  readonly fastTools: ToolDef[] = [
    { id: "coin", title: "Pile ou face", desc: "Trancher en 1 clic", icon: "◐", route: "/coin" },
    { id: "number", title: "Nombre aléatoire", desc: "Entre 2 bornes", icon: "#", route: "/number" },
    { id: "draw", title: "Tirage au sort", desc: "Dans une liste", icon: "☰", route: "/draw" },
  ];
  readonly slowTools: ToolDef[] = [
    { id: "pros-cons", title: "Pour / Contre", desc: "Peser une décision", icon: "±", route: "/pros-cons" },
  ];

  dismissTutorial(): void {    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      /* stockage indisponible : le bandeau reviendra */
    }
    this.showTutorial.set(false);
  }

  private isTutorialHidden(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "1";
    } catch {
      return false;
    }
  }

  /** Corbeille "Tout l'historique" : effacement complet après confirmation (F6 §5.3). */
  clearHistory(): void {
    if (this.history.recent().length === 0) return;
    this.showClearConfirm.set(true);
  }

  confirmClear(): void {
    this.history.clear();
    this.showClearConfirm.set(false);
  }
}
