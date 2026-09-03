// Liste des cibles V1 — montres grand public à rotation rapide, ticket bas.
// "search_text" = ce qui est envoyé à Vinted. "catalog_ids" = 1231 correspond
// à la catégorie "Montres" sur Vinted (à vérifier/ajuster si Vinted change ses IDs).
//
// Ajoute/retire des lignes ici au fil de l'eau selon ce qui marche.

module.exports = [
  { brand: 'Casio', search_text: 'Casio G-Shock' },
  { brand: 'Casio', search_text: 'Casio DW5600' },
  { brand: 'Casio', search_text: 'Casio GA-2100' },
  { brand: 'Casio', search_text: 'Casio F-91W' },
  { brand: 'Casio', search_text: 'Casio vintage databank' },
  { brand: 'Seiko', search_text: 'Seiko 5' },
  { brand: 'Seiko', search_text: 'Seiko SNK' },
  { brand: 'Citizen', search_text: 'Citizen Eco-Drive' },
];

// Mots-clés qui indiquent un problème d'état (à exclure ou fortement décoter)
module.exports.brokenKeywords = [
  'ne fonctionne plus', "ne marche plus", 'en panne', 'a réviser', 'à réviser',
  'pour pièces', 'hs', 'cassé', 'cassée', 'fêlé', 'fêlée', 'fissuré',
  'sans pile', 'à réparer', 'a reparer', 'défectueux', 'defectueux',
];

// Mots-clés qui indiquent un problème mineur (juste la pile — pas grave, réparation ~10-15€)
module.exports.minorIssueKeywords = [
  'juste la pile', 'pile à changer', 'pile a changer', 'besoin d\'une pile',
];
