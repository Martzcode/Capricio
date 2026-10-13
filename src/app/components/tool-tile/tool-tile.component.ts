import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

/** Définition d'un outil affichable sur l'accueil (F1). */
export interface ToolDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  route: string;
}

/** Tuile d'outil réutilisable : lien natif (clavier OK §13.3), 1 clic vers l'outil. */
@Component({
  selector: "app-tool-tile",
  imports: [RouterLink],
  templateUrl: "./tool-tile.component.html",
  styleUrl: "./tool-tile.component.css",
})
export class ToolTileComponent {
  readonly tool = input.required<ToolDef>();
}
