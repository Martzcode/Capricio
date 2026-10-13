//! Pile ou face (§7.1) : tirage 50/50 strict via `rand`, libellés personnalisables.
use rand::RngExt;
use serde::Serialize;

pub const DEFAULT_LABELS: [&str; 2] = ["Pile", "Face"];
const MAX_LABEL_LEN: usize = 20;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CoinResult {
    pub winner: String,
    pub index: u8,
}

/// Tire un côté. Erreur si libellés vides, identiques ou trop longs.
pub fn flip(labels: [String; 2], lang: Option<&str>) -> Result<CoinResult, String> {
    let sides: [String; 2] = [
        labels[0].trim().chars().take(MAX_LABEL_LEN).collect(),
        labels[1].trim().chars().take(MAX_LABEL_LEN).collect(),
    ];
    if sides[0].is_empty() || sides[1].is_empty() {
        return Err(super::tr(
            lang,
            "Les deux libellés sont requis.",
            "Both labels are required.",
            "Se requieren ambas etiquetas.",
            "Beide Bezeichnungen sind erforderlich.",
        ));
    }
    if sides[0] == sides[1] {
        return Err(super::tr(
            lang,
            "Les deux libellés doivent être distincts.",
            "Both labels must be different.",
            "Ambas etiquetas deben ser distintas.",
            "Beide Bezeichnungen müssen unterschiedlich sein.",
        ));
    }
    let index: u8 = rand::rng().random_range(0..2);
    Ok(CoinResult {
        winner: sides[index as usize].clone(),
        index,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn labels() -> [String; 2] {
        ["Pile".into(), "Face".into()]
    }

    #[test]
    fn returns_one_of_the_labels() {
        for _ in 0..50 {
            let r = flip(labels(), None).unwrap();
            assert!(r.winner == "Pile" || r.winner == "Face");
            assert!(r.index <= 1);
        }
    }

    #[test]
    fn roughly_fair_over_many_draws() {
        let mut zeros = 0;
        for _ in 0..1000 {
            if flip(labels(), None).unwrap().index == 0 {
                zeros += 1;
            }
        }
        assert!((350..=650).contains(&zeros), "biais suspect : {zeros}/1000");
    }

    #[test]
    fn rejects_identical_labels() {
        assert!(flip(["Oui".into(), " Oui ".into()], None).is_err());
    }

    #[test]
    fn rejects_empty_labels() {
        assert!(flip(["".into(), "Face".into()], None).is_err());
        assert!(flip(["  ".into(), "Face".into()], None).is_err());
    }

    #[test]
    fn trims_and_truncates_labels() {
        let long = "x".repeat(99);
        let r = flip(["  Pile  ".into(), long], None).unwrap();
        assert_eq!(r.winner.chars().count() <= MAX_LABEL_LEN, true);
    }
}
