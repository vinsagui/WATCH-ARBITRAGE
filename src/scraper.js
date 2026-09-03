const axios = require('axios');

// Vinted n'a pas d'API publique officielle, mais expose un endpoint interne
// utilisé par son propre site web (celui que ton navigateur appelle quand tu
// fais une recherche). On le réutilise ici en imitant un navigateur classique.
//
// ⚠️ Points d'attention (déjà discutés) :
// - Vinted peut bloquer une IP qui fait trop de requêtes trop vite. Reste sur
//   un intervalle de scan raisonnable (10-15 min) et un nombre de cibles limité.
// - Cet endpoint peut changer sans préavis — si le scraper casse, c'est
//   probablement lui qu'il faut vérifier en premier (ouvre vinted.fr dans un
//   navigateur, onglet réseau, refais une recherche, regarde l'URL appelée).
// - Si tu scales le volume, il faudra un service de proxy résidentiel (ex:
//   celui mentionné dans les scrapers open-source qu'on a vus) — pas
//   nécessaire pour démarrer.

const BASE_URL = 'https://www.vinted.fr/api/v2/catalog/items';

async function searchListings(searchText, { perPage = 40 } = {}) {
  const params = {
    search_text: searchText,
    order: 'newest_first',
    per_page: perPage,
  };

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  };

  const { data } = await axios.get(BASE_URL, { params, headers, timeout: 15000 });

  if (!data || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item) => ({
    vinted_id: item.id,
    title: item.title || '',
    // La liste de recherche ne donne pas toujours la description complète ;
    // on la récupère au besoin via getListingDetail() ci-dessous.
    price: item.price ? parseFloat(item.price.amount) : null,
    currency: item.price ? item.price.currency_code : 'EUR',
    url: item.url,
    photo_url: item.photo ? item.photo.url : null,
  }));
}

// Optionnel : récupère la description complète d'une annonce (utile pour la
// détection de mots-clés d'état, souvent absente de la liste de recherche).
async function getListingDetail(vintedId) {
  const url = `https://www.vinted.fr/api/v2/items/${vintedId}`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  };
  const { data } = await axios.get(url, { headers, timeout: 15000 });
  return data && data.item ? data.item.description : '';
}

module.exports = { searchListings, getListingDetail };
