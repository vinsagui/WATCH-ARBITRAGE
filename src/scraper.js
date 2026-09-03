const axios = require('axios');

// Vinted bloque les requêtes venant de serveurs cloud (comme Railway) avec
// une erreur 401, même avec des cookies de session valides — c'est une
// protection anti-bot basée sur la réputation de l'IP, pas sur le contenu de
// la requête elle-même.
//
// Solution : on route les requêtes via Scrape.do (https://scrape.do), un
// service avec un plan gratuit permanent (1000 requêtes/mois, sans carte
// bancaire) qui fait la requête à notre place depuis des IP "propres".
//
// Si la variable d'environnement SCRAPEDO_KEY n'est pas définie, le scraper
// retombe sur des requêtes directes (utile pour tester en local, où ton IP
// personnelle n'est généralement pas bloquée).

const VINTED_BASE_URL = 'https://www.vinted.fr/api/v2/catalog/items';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const SCRAPEDO_KEY = process.env.SCRAPEDO_KEY;
const SCRAPEDO_URL = 'https://api.scrape.do';

function buildRequest(targetUrl, params) {
  if (SCRAPEDO_KEY) {
    const targetWithParams = axios.getUri({ url: targetUrl, params });
    return {
      url: SCRAPEDO_URL,
      params: { token: SCRAPEDO_KEY, url: targetWithParams },
      headers: { Accept: 'application/json, text/plain, */*' },
    };
  }

  return {
    url: targetUrl,
    params,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/plain, */*',
    },
  };
}

async function vintedGet(targetUrl, params = {}) {
  const { url, params: reqParams, headers } = buildRequest(targetUrl, params);
  return axios.get(url, { params: reqParams, headers, timeout: 30000 });
}

async function searchListings(searchText, { perPage = 40 } = {}) {
  const params = {
    search_text: searchText,
    order: 'newest_first',
    per_page: perPage,
  };

  const { data } = await vintedGet(VINTED_BASE_URL, params);

  if (!data || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item) => ({
    vinted_id: item.id,
    title: item.title || '',
    price: item.price ? parseFloat(item.price.amount) : null,
    currency: item.price ? item.price.currency_code : 'EUR',
    url: item.url,
    photo_url: item.photo ? item.photo.url : null,
  }));
}

async function getListingDetail(vintedId) {
  const url = `https://www.vinted.fr/api/v2/items/${vintedId}`;
  const { data } = await vintedGet(url);
  return data && data.item ? data.item.description : '';
}

module.exports = { searchListings, getListingDetail };
