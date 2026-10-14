//! Tirage au sort (§7.3) : uniforme parmi les options restantes.
//! Le frontend envoie les lignes déjà découpées ; Rust nettoie, valide et tire.
use rand::seq::IndexedRandom;
use serde::Serialize;

const MAX_OPTIONS: usize = 500;
const MAX_LABEL_LEN: usize = 200;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct DrawResult {
    pub winners: Vec<String>,
    pub remaining: Vec<String>,
}

pub fn draw(
    options: &[String],
    count: usize,
    without_replacement: bool,
    lang: Option<&str>,
) -> Result<DrawResult, String> {
    let clean: Vec<String> = options
        .iter()
        .map(|o| o.trim().chars().take(MAX_LABEL_LEN).collect::<String>())
        .filter(|o| !o.is_empty())
        .take(MAX_OPTIONS + 1)
        .collect();
    if clean.is_empty() {
        return Err(super::tr(
            lang,
            "Ajoutez au moins 2 options (une par ligne) pour tirer.",
            "Add at least 2 options (one per line) to draw.",
            "Añada al menos 2 opciones (una por línea) para sortear.",
            "Fügen Sie mindestens 2 Optionen (eine pro Zeile) hinzu, um zu ziehen.",
        ));
    }
    if clean.len() == 1 {
        return Err(super::tr(
            lang,
            "Une seule option : ajoutez-en au moins une 2ᵉ pour tirer.",
            "Only one option: add at least a 2nd one to draw.",
            "Solo una opción: añada al menos una 2.ª para sortear.",
            "Nur eine Option: Fügen Sie mindestens eine 2. hinzu, um zu ziehen.",
        ));
    }
    if count == 0 {
        return Err(super::tr(
            lang,
            "Le nombre à tirer doit être d'au moins 1.",
            "Must draw at least 1.",
            "Debe sortear al menos 1.",
            "Es muss mindestens 1 gezogen werden.",
        ));
    }
    // Plafond : au plus N-1 (on laisse toujours au moins 1 option).
    if count > clean.len() - 1 {
        let max = clean.len() - 1;
        let n = clean.len();
        return Err(match lang.unwrap_or("fr") {
            "en" => format!("At most {max} to draw for {n} options. Leave at least 1."),
            "es" => format!("Como máximo {max} para sortear con {n} opciones. Deje al menos 1."),
            "de" => format!("Höchstens {max} bei {n} Optionen ziehen. Lassen Sie mindestens 1 übrig."),
            _ => format!("Au plus {max} à tirer pour {n} options. Laissez-en au moins 1."),
        });
    }
    if count > clean.len() {
        return Err(super::tr(
            lang,
            "Réduisez le nombre à tirer ou ajoutez des options.",
            "Reduce the number to draw or add options.",
            "Reduzca el número a sortear o añada opciones.",
            "Reduzieren Sie die Anzahl oder fügen Sie Optionen hinzu.",
        ));
    }
    let mut rng = rand::rng();
    let winners: Vec<String> = if without_replacement {
        clean.choose_multiple(&mut rng, count).cloned().collect()
    } else {
        (0..count)
            .filter_map(|_| clean.choose(&mut rng).cloned())
            .collect()
    };
    let remaining = if without_replacement {
        // Retire une occurrence par gagnant (doublons préservés pour le reste).
        let mut rest = clean.clone();
        for w in &winners {
            if let Some(pos) = rest.iter().position(|o| o == w) {
                rest.remove(pos);
            }
        }
        rest
    } else {
        clean.clone()
    };
    Ok(DrawResult { winners, remaining })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn opts(v: &[&str]) -> Vec<String> {
        v.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn rejects_empty_and_singleton() {
        assert!(draw(&[], 1, false, None).is_err());
        assert!(draw(&opts(&["  ", ""]), 1, false, None).is_err());
        assert!(draw(&opts(&["solo"]), 1, false, None).is_err());
    }

    #[test]
    fn rejects_bad_count() {
        let o = opts(&["a", "b", "c"]);
        assert!(draw(&o, 0, false, None).is_err());
        assert!(draw(&o, 3, false, None).is_err(), "plafond N-1");
        assert!(draw(&o, 4, false, None).is_err());
        assert!(draw(&o, 3, true, None).is_err());
        assert!(draw(&o, 2, true, None).is_ok());
    }

    #[test]
    fn winners_come_from_options() {
        let o = opts(&["a", "b", "c", "d"]);
        let r = draw(&o, 2, true, None).unwrap();
        assert_eq!(r.winners.len(), 2);
        for w in &r.winners {
            assert!(o.contains(w));
        }
        assert_eq!(r.remaining.len(), 2);
        for w in &r.winners {
            assert!(!r.remaining.contains(w));
        }
    }

    #[test]
    fn with_replacement_keeps_full_list() {
        let o = opts(&["a", "b", "c"]);
        let r = draw(&o, 2, false, None).unwrap();
        assert_eq!(r.winners.len(), 2);
        assert_eq!(r.remaining, o);
    }

    #[test]
    fn trims_and_skips_blank_lines() {
        let r = draw(&opts(&["  a  ", "", "b"]), 1, true, None).unwrap();
        assert_eq!(r.winners.len(), 1);
        assert!(["a", "b"].contains(&r.winners[0].as_str()));
    }
}
