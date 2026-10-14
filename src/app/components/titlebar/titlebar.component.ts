import { Component, ElementRef, HostListener, OnInit, inject, signal } from "@angular/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { I18nService, LANGS, LANG_NAMES, Lang } from "../../services/i18n.service";
import { ThemeService, ThemeChoice } from "../../services/theme.service";
import { APP_VERSION } from "../../version";
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
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly showAbout = signal(false);
  readonly showLangMenu = signal(false);
  readonly appVersion = APP_VERSION;
  readonly repoUrl = "https://github.com/Martzcode/Capricio";
  readonly authorUrl = "https://github.com/Martzcode";

  readonly langs: Array<{ code: Lang; label: string }> = LANGS.map((code) => ({
    code,
    label: LANG_NAMES[code],
  }));

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
    this.showLangMenu.set(false);
  }

  /** Ouvre un lien externe : navigateur système sous Tauri, nouvel onglet sur le web. */
  openExternal(url: string): void {
    if (this.win.isTauri) {
      // `openUrl` → application par défaut du système (permission `opener:default`).
      openUrl(url).catch((e: unknown) => console.error("[titlebar] openUrl refusé", e));
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  closeAbout(): void {
    this.showAbout.set(false);
  }

  toggleLangMenu(): void {
    this.showLangMenu.update((v) => !v);
  }

  selectLang(lang: Lang): void {
    this.i18n.set(lang);
    this.showLangMenu.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.showLangMenu() && !this.host.nativeElement.querySelector(".lang-wrap")?.contains(event.target as Node)) {
      this.showLangMenu.set(false);
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.showLangMenu()) {
      this.showLangMenu.set(false);
      return;
    }
    this.closeAbout();
  }
}
