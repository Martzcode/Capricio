// Commandes métier ajoutées à l'Étape 1 (tools::*) et Étape 3 (ipc::*) — cf. Plan-Developpement.
mod db;
mod tools;
mod zoom_lock;

use std::sync::Mutex;
use tauri::{Manager, State};
use tools::coin_flip::{self, CoinResult};
use tools::draw::{self, DrawResult};
use tools::pros_cons::{self, Arg, Evaluation};
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

/// Tirage au sort (§7.3). Contrat : in JS `{options, count, withoutReplacement}`
/// (camelCase converti par Tauri) → out `{winners, remaining}`.
#[tauri::command]
fn draw_lots(
    options: Vec<String>,
    count: usize,
    without_replacement: bool,
) -> Result<DrawResult, String> {
    draw::draw(&options, count, without_replacement)
}

/// Pour/contre pondéré (§8.1 MVP : poids 1/2/3).
/// Contrat : in `{title, pros: [{label, weight}], cons: [...]}` → out
/// `{scorePour, scoreContre, ecartPct, verdict}` (clés converties en camelCase).
#[tauri::command]
fn pros_cons_evaluate(
    title: String,
    pros: Vec<Arg>,
    cons: Vec<Arg>,
) -> Result<Evaluation, String> {
    pros_cons::evaluate(&title, &pros, &cons)
}

/// Arme le verrou anti-zoom natif (Linux/WebKitGTK, no-op ailleurs).
/// Appelée une fois au démarrage du frontend, quand la fenêtre existe.
#[tauri::command]
fn init_zoom_lock() {
    zoom_lock::init();
}

/// Historique (§9.1 V1) : sauvegarde auto après chaque décision (§13.2).
/// Contrats JS en camelCase : `save_decision {typeOutil, titre, donneesEntree,
/// resultat}` → `id` ; `get_history {limit?, offset?}` → `Decision[]`.
#[tauri::command]
fn save_decision(
    state: State<db::DbState>,
    type_outil: String,
    titre: String,
    donnees_entree: serde_json::Value,
    resultat: serde_json::Value,
) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| format!("Base verrouillée : {e}"))?;
    db::save(&conn, &type_outil, &titre, &donnees_entree.to_string(), &resultat.to_string())
}

#[tauri::command]
fn get_history(
    state: State<db::DbState>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<db::Decision>, String> {
    let conn = state.0.lock().map_err(|e| format!("Base verrouillée : {e}"))?;
    db::list(&conn, limit.unwrap_or(200), offset.unwrap_or(0))
}

#[tauri::command]
fn delete_history_entry(state: State<db::DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| format!("Base verrouillée : {e}"))?;
    db::delete(&conn, id)
}

#[tauri::command]
fn clear_history(state: State<db::DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| format!("Base verrouillée : {e}"))?;
    db::clear(&conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Dossier de données : {e}"))?;
            std::fs::create_dir_all(&dir).map_err(|e| format!("Dossier de données : {e}"))?;
            let conn = db::open(&dir.join("capricio.db"))?;
            app.manage(db::DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init_zoom_lock,
            coin_flip,
            random_number,
            draw_lots,
            pros_cons_evaluate,
            save_decision,
            get_history,
            delete_history_entry,
            clear_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
