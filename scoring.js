const { brokenKeywords, minorIssueKeywords } = require('../config/targets');

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // enlève les accents pour matcher plus large
}

// Classe une annonce en fonction de son titre + description.
// Retourne : 'pour_pieces_ou_panne' | 'pile_a_changer' | 'fonctionnel' | 'inconnu'
function classifyCondition(title, description) {
  const text = normalize(`${title} ${description}`);

  const hasBroken = brokenKeywords.some((kw) => text.includes(normalize(kw)));
  const hasMinor = minorIssueKeywords.some((kw) => text.includes(normalize(kw)));

  if (hasBroken) return 'pour_pieces_ou_panne';
  if (hasMinor) return 'pile_a_changer';
  // Si aucune mention de problème détectée, on considère l'annonce comme
  // probablement fonctionnelle — mais avec un niveau de confiance moyen
  // puisque l'absence de mention ne garantit rien.
  return 'fonctionnel';
}

// Calcule l'écart en % entre le prix observé et le prix médian de référence.
// Retourne un nombre entre 0 et 1 (0.35 = 35% en dessous du prix médian).
function computeDiscount(price, medianPrice) {
  if (!medianPrice || medianPrice <= 0) return null;
  return (medianPrice - price) / medianPrice;
}

// Décide si une annonce mérite une alerte.
function shouldAlert(listing, medianPrice, threshold) {
  if (listing.condition_tag === 'pour_pieces_ou_panne') {
    return { alert: false, reason: 'État dégradé — exclu' };
  }

  const discount = computeDiscount(listing.price, medianPrice);
  if (discount === null) {
    return { alert: false, reason: 'Pas encore assez de données de prix pour ce modèle' };
  }

  // Une montre "pile à changer" garde un léger malus car il faut compter
  // 10-15€ et un peu de temps en plus.
  const adjustedThreshold = listing.condition_tag === 'pile_a_changer' ? threshold + 0.05 : threshold;

  if (discount >= adjustedThreshold) {
    return { alert: true, discount, reason: 'Bonne affaire détectée' };
  }
  return { alert: false, discount, reason: 'Écart insuffisant' };
}

module.exports = { classifyCondition, computeDiscount, shouldAlert, normalize };
