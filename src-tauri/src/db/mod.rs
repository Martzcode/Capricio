//! Persistance SQLite locale (§10.4, §11) : un fichier unique dans le dossier de
//! données applicatives, migrations automatiques au démarrage, journal WAL
//! (tenue à la fermeture brutale §13.2). V1 : `decision` + `settings`.
//! Les tables détaillées V2 (`template`, `matrix_*`) viendront en migration.
use chrono::Utc;
use rusqlite::{params, Connection};
use serde::Serialize;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

/// Migration 001 — schéma MVP.
const MIGRATION_001: &str = "
CREATE TABLE IF NOT EXISTS decision(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_outil TEXT NOT NULL,
  titre TEXT NOT NULL DEFAULT '',
  date_creation TEXT NOT NULL,
  donnees_entree TEXT NOT NULL,
  resultat TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings(
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO schema_version(version) VALUES (1);
";

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Decision {
    pub id: i64,
    pub type_outil: String,
    pub titre: String,
    pub date_creation: String,
    pub donnees_entree: String,
    pub resultat: String,
}

/// Ouvre (et crée) la base + applique les migrations. Testable en mémoire.
pub fn open(path: &std::path::Path) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| format!("Base inaccessible : {e}"))?;
    migrate(&conn)?;
    Ok(conn)
}

pub fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("Pragmas SQLite : {e}"))?;
    conn.execute_batch(MIGRATION_001)
        .map_err(|e| format!("Migration 001 : {e}"))?;
    Ok(())
}

pub fn save(
    conn: &Connection,
    type_outil: &str,
    titre: &str,
    donnees_entree: &str,
    resultat: &str,
) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO decision(type_outil, titre, date_creation, donnees_entree, resultat)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            type_outil,
            titre,
            Utc::now().to_rfc3339(),
            donnees_entree,
            resultat
        ],
    )
    .map_err(|e| format!("Sauvegarde impossible : {e}"))?;
    Ok(conn.last_insert_rowid())
}

pub fn list(conn: &Connection, limit: i64, offset: i64) -> Result<Vec<Decision>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, type_outil, titre, date_creation, donnees_entree, resultat
             FROM decision ORDER BY id DESC LIMIT ?1 OFFSET ?2",
        )
        .map_err(|e| format!("Historique illisible : {e}"))?;
    stmt.query_map(params![limit.max(1).min(1000), offset.max(0)], |row| {
        Ok(Decision {
            id: row.get(0)?,
            type_outil: row.get(1)?,
            titre: row.get(2)?,
            date_creation: row.get(3)?,
            donnees_entree: row.get(4)?,
            resultat: row.get(5)?,
        })
    })
    .map_err(|e| format!("Historique illisible : {e}"))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Historique illisible : {e}"))
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM decision WHERE id = ?1", params![id])
        .map_err(|e| format!("Suppression impossible : {e}"))?;
    Ok(())
}

pub fn clear(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM decision", [])
        .map_err(|e| format!("Effacement impossible : {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mem() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        conn
    }

    #[test]
    fn roundtrip_save_list_delete_clear() {
        let conn = mem();
        let id = save(&conn, "coin", "", r#"{"labels":["Pile","Face"]}"#, r#"{"resume":"Pile"}"#).unwrap();
        assert!(id > 0);
        save(&conn, "number", "1–100", "{}", r#"{"resume":"42"}"#).unwrap();
        let all = list(&conn, 100, 0).unwrap();
        assert_eq!(all.len(), 2);
        assert_eq!(all[0].type_outil, "number"); // ordre inverse
        delete(&conn, id).unwrap();
        assert_eq!(list(&conn, 100, 0).unwrap().len(), 1);
        clear(&conn).unwrap();
        assert!(list(&conn, 100, 0).unwrap().is_empty());
    }

    #[test]
    fn migration_is_idempotent() {
        let conn = mem();
        migrate(&conn).unwrap();
        migrate(&conn).unwrap();
        let v: i64 = conn
            .query_row("SELECT version FROM schema_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(v, 1);
    }

    #[test]
    fn pagination_bounds_are_clamped() {
        let conn = mem();
        save(&conn, "coin", "", "{}", "{}").unwrap();
        assert_eq!(list(&conn, 0, -5).unwrap().len(), 1);
        assert!(list(&conn, 100, 99).unwrap().is_empty());
    }
}
