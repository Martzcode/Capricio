import { Component, input } from "@angular/core";
import type { DecisionSummary } from "../../services/history.service";

/** 3 dernières décisions sur l'accueil (F1) — état vide prévu si aucun historique (§5.1). */
@Component({
  selector: "app-recent-list",
  templateUrl: "./recent-list.component.html",
  styleUrl: "./recent-list.component.css",
})
export class RecentListComponent {
  readonly items = input.required<DecisionSummary[]>();
}
