import { Component, inject } from "@angular/core";
import { ToastService } from "../../services/toast.service";

/** Infobulle flottante globale (bas-droite, couleurs du thème). */
@Component({
  selector: "app-toast",
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.component.css",
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
