// Commandes métier ajoutées à l'Étape 1 (tools::*) et Étape 3 (ipc::*) — cf. Plan-Developpement.
mod zoom_lock;

/// Arme le verrou anti-zoom natif (Linux/WebKitGTK, no-op ailleurs).
/// Appelée une fois au démarrage du frontend, quand la fenêtre existe.
#[tauri::command]
fn init_zoom_lock() {
    zoom_lock::init();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![init_zoom_lock])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
