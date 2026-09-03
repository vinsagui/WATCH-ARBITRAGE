// Extraction simple de la référence modèle depuis le titre d'une annonce.
// Objectif : regrouper les annonces du même modèle exact pour calculer un
// prix médian fiable. Pas besoin de perfection — au pire, une annonce sans
// référence détectée n'entre juste pas dans le calcul de prix de référence
// (mieux vaut ignorer que mal classer).

const PATTERNS = {
  Casio: /\b([A-Z]{1,3}-?\d{3,4}[A-Z0-9-]*)\b/i,
  Seiko: /\b(SNK[A-Z0-9]{2,4}|SKX\d{3}|S[A-Z]{2}\d{3,4}[A-Z0-9]*)\b/i,
  Citizen: /\b([A-Z]{2}\d{4}-\d{2}[A-Z]?)\b/i,
};

function guessModel(brand, title) {
  const pattern = PATTERNS[brand];
  if (!pattern) return null;
  const match = title.match(pattern);
  return match ? match[1].toUpperCase() : null;
}

module.exports = { guessModel };
