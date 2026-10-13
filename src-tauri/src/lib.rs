// Commandes métier ajoutées à l'Étape 1 (tools::*) et Étape 3 (ipc::*) — cf. Plan-Developpement.
mod tools;
mod zoom_lock;

use tools::coin_flip::{self, CoinResult};
use tools::random_number::{self, NumberResult};

/// Pile ou face (§7.1). `labels` optionnels, défaut Pile/Face.
/// Contrat : in `{labels?: [string,string]}` → out `{winner, index}`.
#[tauri::command]
fn coin_flip(labels: Option<[String; 2]>) -> Result<CoinResult, String> {
    let labels = labels.unwrap_or([
        coin_flip::DEFAULT_LABELS[0].into(),
        coin_flip::DEFAULT_LABELS[1].into(),
    ]);
    coin_flip::flip(labels)
}

/// Nombre aléatoire (§7.2). Contrat : in `{min, max}` → out `{value}`.
#[tauri::command]
fn random_number(min: i64, max: i64) -> Result<NumberResult, String> {
    random_number::draw_number(min, max)
}

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
        .invoke_handler(tauri::generate_handler![init_zoom_lock, coin_flip, random_number])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
