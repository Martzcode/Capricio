import { Component, HostListener, OnInit, inject, signal } from "@angular/core";
import { I18nService } from "../../services/i18n.service";
import { ThemeService, ThemeChoice } from "../../services/theme.service";
import { WindowControlsService } from "../../services/window-controls.service";

const THEME_ORDER: ThemeChoice[] = ["light", "dark", "auto"];

/**
 * Barre de titre personnalisée (remplace la barre native : decorations:false §5.4).
 * Boutons : thème clair/sombre/auto (F7a), langue FR/EN/ES/DE (F7 §13.4),
 * à propos, réduire/agrandir/fermer.
 */
@Component({
  selector: "app-titlebar",
  templateUrl: "./titlebar.component.html",
  styleUrl: "./titlebar.component.css",
})
export class TitlebarComponent implements OnInit {
  readonly theme = inject(ThemeService);
  readonly win = inject(WindowControlsService);
  readonly i18n = inject(I18nService);
  readonly showAbout = signal(false);
  readonly appVersion = "0.1.0";

  async ngOnInit(): Promise<void> {
    await this.win.refresh();
  }

  /** Clic gauche maintenu sur la zone de drag => déplace la fenêtre (bouton gauche seul). */
  onDragMouseDown(event: MouseEvent): void {
    if (event.button === 0) void this.win.startDragging();
  }

  /** Un seul bouton cycle : clair → sombre → auto (§3 sobriété). */
  cycleTheme(): void {
    const cur = this.theme.choice();
    const next = THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length];
    this.theme.set(next as ThemeChoice);
  }

  themeIcon(): string {
    switch (this.theme.choice()) {
      case "light":
        return "☀";
      case "dark":
        return "☾";
      default:
        return "◐";
    }
  }

  themeLabel(): string {
    switch (this.theme.choice()) {
      case "light":
        return this.i18n.t("titlebar.themeLight");
      case "dark":
        return this.i18n.t("titlebar.themeDark");
      default:
        return this.i18n.t("titlebar.themeAuto");
    }
  }

  openAbout(): void {
    this.showAbout.set(true);
  }

  closeAbout(): void {
    this.showAbout.set(false);
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.closeAbout();
  }
}
