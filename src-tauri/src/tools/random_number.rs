//! Nombre aléatoire (§7.2) : uniforme sur l'intervalle fermé [min, max].
//! V1 : entiers uniquement, 1 tirage par appel (le "sans répétition" de session
//! est géré côté frontend — cf. NumberComponent).
use rand::RngExt;
use serde::Serialize;

const MAX_SPAN: i64 = 1_000_000_000;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct NumberResult {
    pub value: i64,
}

pub fn draw_number(min: i64, max: i64) -> Result<NumberResult, String> {
    if min >= max {
        return Err("La borne min doit être strictement inférieure à max.".into());
    }
    if max - min > MAX_SPAN {
        return Err("Intervalle trop grand (1 milliard maximum).".into());
    }
    Ok(NumberResult {
        value: rand::rng().random_range(min..=max),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn stays_within_bounds() {
        for _ in 0..200 {
            let v = draw_number(1, 6).unwrap().value;
            assert!((1..=6).contains(&v));
        }
    }

    #[test]
    fn covers_binary_range() {
        let seen: HashSet<_> = (0..100).map(|_| draw_number(5, 6).unwrap().value).collect();
        assert_eq!(seen, HashSet::from([5, 6]));
    }

    #[test]
    fn rejects_min_gte_max() {
        assert!(draw_number(6, 6).is_err());
        assert!(draw_number(10, 1).is_err());
    }

    #[test]
    fn rejects_huge_span() {
        assert!(draw_number(0, MAX_SPAN + 1).is_err());
        assert!(draw_number(0, MAX_SPAN).is_ok());
    }

    #[test]
    fn supports_negative_bounds() {
        let v = draw_number(-10, -1).unwrap().value;
        assert!((-10..=-1).contains(&v));
    }
}
