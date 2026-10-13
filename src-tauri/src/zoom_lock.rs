//! Verrou anti-zoom natif (layout fixe, CDC §14).
//!
//! Constat instrumenté : sur Linux/WebKitGTK, le pincement trackpad zoome la
//! page sans qu'aucun événement DOM ne soit émis — WebKit consomme le geste en
//! natif et aucun réglage `WebKitSettings` ne le désactive. On avale donc les
//! événements `GDK_TOUCHPAD_PINCH` directement sur les widgets de la fenêtre,
//! avant le traitement WebKit. Coût nul au repos (aucun polling), tous les
//! autres événements (clic, molette, clavier, défilement) intacts.
//!
//! Autres plateformes : Windows couvert par `zoomHotkeysEnabled: false`
//! (WebView2), macOS par les interceptions DOM (pincement = Ctrl+molette
//! annulable). Les couches web restent en défense en profondeur.

#[cfg(target_os = "linux")]
mod imp {
    use gtk::prelude::*;

    /// Avale le pincement trackpad sur tout le sous-arbre de la fenêtre
    /// applicative (la WebView ciblée par le geste est dedans). Les fenêtres
    /// étrangères (ex. DevTools) sont ignorées via le titre.
    pub fn init() {
        for toplevel in gtk::Window::list_toplevels() {
            let window = match toplevel.downcast::<gtk::Window>() {
                Ok(w) => w,
                Err(_) => continue,
            };
            if window.title().as_deref() != Some("Capricio") {
                continue;
            }
            hook_subtree(&window.clone().upcast::<gtk::Widget>());
        }
    }

    fn hook_subtree(widget: &gtk::Widget) {
        widget.connect_event(|_, event| {
            if event.event_type() == gdk::EventType::TouchpadPinch {
                glib::Propagation::Stop
            } else {
                glib::Propagation::Proceed
            }
        });
        if let Ok(container) = widget.clone().downcast::<gtk::Container>() {
            for child in container.children() {
                hook_subtree(&child);
            }
        }
    }
}

/// Arme le verrou (appelée une fois au démarrage du frontend, fenêtre existante).
/// No-op hors Linux.
pub fn init() {
    #[cfg(target_os = "linux")]
    imp::init();
}
