//! Pour/contre pondéré MVP (§8.1) : poids 3 niveaux (Faible=1, Moyen=2, Fort=3).
//! Verdict : "Plutôt pour" / "Plutôt contre" / "Équilibré" (écart < 10 %) /
//! "Indécis" (aucun argument). Le résultat reste une aide (cf. garde-fou UI).
use serde::{Deserialize, Serialize};

const MAX_ARGS_PER_SIDE: usize = 50;
const MAX_LABEL_LEN: usize = 200;
const MAX_TITLE_LEN: usize = 120;
const BALANCE_THRESHOLD_PCT: f32 = 10.0;

#[derive(Debug, Clone, Deserialize)]
pub struct Arg {
    pub label: String,
    pub weight: u8,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Evaluation {
    pub score_pour: u32,
    pub score_contre: u32,
    pub ecart_pct: f32,
    pub verdict: String,
}

fn checked_args(args: &[Arg], lang: Option<&str>) -> Result<Vec<u32>, String> {
    if args.len() > MAX_ARGS_PER_SIDE {
        return Err(match lang.unwrap_or("fr") {
            "en" => format!("At most {MAX_ARGS_PER_SIDE} arguments per side."),
            "es" => format!("Como máximo {MAX_ARGS_PER_SIDE} argumentos por lado."),
            "de" => format!("Höchstens {MAX_ARGS_PER_SIDE} Argumente pro Seite."),
            _ => format!("Au plus {MAX_ARGS_PER_SIDE} arguments par camp."),
        });
    }
    args.iter()
        .map(|a| {
            let label: String = a.label.trim().chars().take(MAX_LABEL_LEN).collect();
            if label.is_empty() {
                return Err(super::tr(
                    lang,
                    "Chaque argument doit avoir un libellé.",
                    "Each argument needs a label.",
                    "Cada argumento necesita una etiqueta.",
                    "Jedes Argument braucht eine Bezeichnung.",
                ));
            }
            if !(1..=3).contains(&a.weight) {
                return Err(super::tr(
                    lang,
                    "Poids invalide (1 = Faible, 2 = Moyen, 3 = Fort).",
                    "Invalid weight (1 = Low, 2 = Medium, 3 = High).",
                    "Peso no válido (1 = Bajo, 2 = Medio, 3 = Alto).",
                    "Ungültige Gewichtung (1 = Niedrig, 2 = Mittel, 3 = Hoch).",
                ));
            }
            Ok(a.weight as u32)
        })
        .collect()
}

/// Verdicts localisés (mêmes clés que le frontend `verdict.*`).
fn verdicts(lang: Option<&str>) -> (&'static str, &'static str, &'static str, &'static str) {
    match lang.unwrap_or("fr") {
        "en" => ("Rather for", "Rather against", "Balanced", "Undecided"),
        "es" => ("Más bien a favor", "Más bien en contra", "Equilibrado", "Indeciso"),
        "de" => ("Eher dafür", "Eher dagegen", "Ausgeglichen", "Unentschieden"),
        _ => ("Plutôt pour", "Plutôt contre", "Équilibré", "Indécis"),
    }
}

pub fn evaluate(
    title: &str,
    pros: &[Arg],
    cons: &[Arg],
    lang: Option<&str>,
) -> Result<Evaluation, String> {
    let title: String = title.trim().chars().take(MAX_TITLE_LEN + 1).collect();
    if title.is_empty() {
        return Err(super::tr(
            lang,
            "Donnez un titre à la décision.",
            "Give the decision a title.",
            "Ponga un título a la decisión.",
            "Geben Sie der Entscheidung einen Titel.",
        ));
    }
    if title.chars().count() > MAX_TITLE_LEN {
        return Err(match lang.unwrap_or("fr") {
            "en" => format!("Title too long ({MAX_TITLE_LEN} characters max)."),
            "es" => format!("Título demasiado largo (máximo {MAX_TITLE_LEN} caracteres)."),
            "de" => format!("Titel zu lang (maximal {MAX_TITLE_LEN} Zeichen)."),
            _ => format!("Titre trop long ({MAX_TITLE_LEN} caractères max)."),
        });
    }
    let (v_pour, v_contre, v_equilibre, v_indecis) = verdicts(lang);
    let pour = checked_args(pros, lang)?;
    let contre = checked_args(cons, lang)?;
    let score_pour: u32 = pour.iter().sum();
    let score_contre: u32 = contre.iter().sum();
    let total = score_pour + score_contre;
    if total == 0 {
        return Ok(Evaluation {
            score_pour: 0,
            score_contre: 0,
            ecart_pct: 0.0,
            verdict: v_indecis.into(),
        });
    }
    let ecart_pct = (score_pour as f32 - score_contre as f32).abs() / total as f32 * 100.0;
    let verdict = if ecart_pct < BALANCE_THRESHOLD_PCT {
        v_equilibre
    } else if score_pour > score_contre {
        v_pour
    } else {
        v_contre
    };
    Ok(Evaluation {
        score_pour,
        score_contre,
        ecart_pct,
        verdict: verdict.into(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn arg(label: &str, weight: u8) -> Arg {
        Arg {
            label: label.into(),
            weight,
        }
    }

    #[test]
    fn sums_and_clear_verdict() {
        let r = evaluate(
            "Offre",
            &[arg("salaire", 3), arg("remote", 3), arg("ambiance", 3)],
            &[arg("trajet", 1)],
            None,
        )
        .unwrap();
        assert_eq!((r.score_pour, r.score_contre), (9, 1));
        assert_eq!(r.verdict, "Plutôt pour");
    }

    #[test]
    fn balanced_under_threshold() {
        // écart = 1/19 ≈ 5,3 % → Équilibré
        let r = evaluate("X", &[arg("a", 3), arg("b", 3), arg("c", 3), arg("d", 1)], &[arg("z", 3), arg("y", 3), arg("x", 3)], None)
            .unwrap();
        assert_eq!(r.verdict, "Équilibré");
    }

    #[test]
    fn just_over_threshold() {
        // écart = 2/18 ≈ 11,1 % → Plutôt pour
        let r = evaluate("X", &[arg("a", 3), arg("b", 3), arg("c", 3), arg("d", 1)], &[arg("z", 3), arg("y", 3), arg("x", 2)], None)
            .unwrap();
        assert_eq!(r.verdict, "Plutôt pour");
    }

    #[test]
    fn empty_both_sides_is_undecided() {
        let r = evaluate("X", &[], &[], None).unwrap();
        assert_eq!((r.score_pour, r.score_contre, r.ecart_pct), (0, 0, 0.0));
        assert_eq!(r.verdict, "Indécis");
    }

    #[test]
    fn rejects_bad_input() {
        assert!(evaluate("", &[arg("a", 1)], &[], None).is_err());
        assert!(evaluate("X", &[arg("", 1)], &[], None).is_err());
        assert!(evaluate("X", &[arg("a", 0)], &[], None).is_err());
        assert!(evaluate("X", &[arg("a", 4)], &[], None).is_err());
    }

    #[test]
    fn verdicts_follow_lang() {
        let pros = &[arg("a", 3)];
        let r_en = evaluate("X", pros, &[], Some("en")).unwrap();
        let r_es = evaluate("X", pros, &[], Some("es")).unwrap();
        let r_de = evaluate("X", pros, &[], Some("de")).unwrap();
        assert_eq!(r_en.verdict, "Rather for");
        assert_eq!(r_es.verdict, "Más bien a favor");
        assert_eq!(r_de.verdict, "Eher dafür");
        let e_en = evaluate("", pros, &[], Some("en")).unwrap_err();
        assert_eq!(e_en, "Give the decision a title.");
    }
}
