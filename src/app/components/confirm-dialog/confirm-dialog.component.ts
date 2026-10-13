import { Component, HostListener, input, output } from "@angular/core";

/** Dialogue de confirmation applicatif (remplace confirm() natif, dont le titre technique fuit dans la WebView). */
@Component({
  selector: "app-confirm-dialog",
  templateUrl: "./confirm-dialog.component.html",
  styleUrl: "./confirm-dialog.component.css",
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input("Supprimer");
  readonly cancelLabel = input("Annuler");
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.cancelled.emit();
  }
}
