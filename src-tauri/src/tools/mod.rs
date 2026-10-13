//! Noyau métier Rust (§10.3) : un module par outil, testé indépendamment de l'UI.
pub mod coin_flip;
pub mod draw;
pub mod pros_cons;
pub mod random_number;

/// Message localisé FR/EN/ES/DE (CDC §13.4). `lang` vient des commandes IPC ;
/// français par défaut et pour toute valeur inconnue.
pub fn tr(lang: Option<&str>, fr: &str, en: &str, es: &str, de: &str) -> String {
    match lang.unwrap_or("fr") {
        "en" => en.into(),
        "es" => es.into(),
        "de" => de.into(),
        _ => fr.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tr_covers_four_languages_with_french_fallback() {
        assert_eq!(tr(None, "a", "b", "c", "d"), "a");
        assert_eq!(tr(Some("en"), "a", "b", "c", "d"), "b");
        assert_eq!(tr(Some("es"), "a", "b", "c", "d"), "c");
        assert_eq!(tr(Some("de"), "a", "b", "c", "d"), "d");
        assert_eq!(tr(Some("it"), "a", "b", "c", "d"), "a");
    }
}
