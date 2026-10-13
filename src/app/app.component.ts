import { Component, HostListener, OnDestroy, OnInit, inject } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { invoke } from "@tauri-apps/api/core";
import { TitlebarComponent } from "./components/titlebar/titlebar.component";

/** Shell applicatif : titlebar custom + contenu routé (§5.4, §14). */
@Component({
  selector: "app-root",
  imports: [RouterOutlet, TitlebarComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly stopZoom: Array<() => void> = [];

  /** §5.4 : Échap revient toujours à l'accueil. */
  @HostListener("document:keydown.escape")
  goHome(): void {
    void this.router.navigate(["/"]);
  }

  ngOnInit(): void {
    // Verrou anti-zoom natif (Linux/WebKitGTK, no-op ailleurs et hors Tauri).
    invoke("init_zoom_lock").catch(() => undefined);
    // Zoom désactivé : layout fixe (§14 densité maîtrisée). Couvre le pincement
    // tactile, son équivalent natif WebKit (gestures Safari, molette+Ctrl des
    // pavés tactiles) et les raccourcis clavier Ctrl + molette/+/−/0.
    const block = (e: Event): void => e.preventDefault();
    // Capture + stopPropagation : le polyfill zoom de Tauri écoute
    // `mousewheel`/`keydown` en propagation sur window AVANT notre code
    // (script d'initialisation) — on l'intercepte donc avant lui.
    const ctrlZoom = (e: Event): void => {
      if ((e as WheelEvent).ctrlKey) {
        // eslint-disable-next-line no-console
        console.debug(`[zoom-block] ${e.type} +Ctrl intercepté`);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const multiTouch = (e: TouchEvent): void => {
      // Pincement tactile natif (2+ doigts) : consommé ici, jamais transmis
      // au geste de zoom du WebView. Le défilement à 1 doigt reste intact.
      if (e.touches.length > 1) {
        // eslint-disable-next-line no-console
        console.debug(`[zoom-block] tactile ${e.touches.length} doigts intercepté`);
        e.preventDefault();
      }
    };
    const keys = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const on = (type: string, fn: EventListener, opts?: AddEventListenerOptions): void => {
      document.addEventListener(type, fn, opts);
      this.stopZoom.push(() => document.removeEventListener(type, fn, opts));
    };
    // Non-passifs : preventDefault interdit en passif (Chrome/WebKit).
    // Capture : nos interceptions courent avant le polyfill Tauri.
    const capture: AddEventListenerOptions = { passive: false, capture: true };
    on("gesturestart", block);
    on("gesturechange", block);
    on("gestureend", block);
    on("wheel", ctrlZoom as EventListener, capture);
    on("mousewheel", ctrlZoom as EventListener, capture);
    on("touchstart", multiTouch as EventListener, { passive: false });
    on("touchmove", multiTouch as EventListener, { passive: false });
    on("keydown", keys as EventListener, capture);
    // Témoin : si la page zoome malgré les blocages, visualViewport.scale ≠ 1.
    const vv = window.visualViewport;
    const watchZoom = (): void => {
      if (vv && vv.scale !== 1) {
        // eslint-disable-next-line no-console
        console.warn(`[zoom] ZOOM ACTIF ×${vv.scale} (contourné nos blocages)`);
      }
    };
    vv?.addEventListener("resize", watchZoom);
    this.stopZoom.push(() => vv?.removeEventListener("resize", watchZoom));
  }

  ngOnDestroy(): void {
    this.stopZoom.forEach((off) => off());
    this.stopZoom.length = 0;
  }
}
