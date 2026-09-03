const axios = require('axios');

// Vinted n'a pas d'API publique officielle, mais expose un endpoint interne
// utilisé par son propre site web. Depuis peu, cet endpoint exige une session
// valide (cookies) avant d'accepter une recherche — un appel direct sans
// passer par la page d'accueil renvoie une erreur 401 Unauthorized.
//
// Solution : on visite d'abord la page d'accueil pour récupérer les cookies
// de session envoyés par Vinted, puis on les réutilise sur chaque requête de
// recherche. La session est mise en cache et renouvelée automatiquement si
// elle expire (nouvelle erreur 401).

const BASE_URL = 'https://www.vinted.fr/api/v2/catalog/items';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

let cachedCookies = null;

async function fetchSessionCookies() {
  const response = await axios.get('https://www.vinted.fr/', {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000,
  });

  const setCookieHeaders = response.headers['set-cookie'] || [];
  const cookies = setCookieHeaders.map((c) => c.split(';')[0]).join('; ');
  cachedCookies = cookies;
  return cookies;
}

async function getCookies({ forceRefresh = false } = {}) {
  if (!cachedCookies || forceRefresh) {
    await fetchSessionCookies();
  }
  return cachedCookies;
}

async function vintedGet(url, params) {
  const cookies = await getCookies();
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'application/json, text/plain, */*',
    Cookie: cookies,
  };

  try {
    return await axios.get(url, { params, headers, timeout: 15000 });
  } catch (err) {
    if (err.response && err.response.status === 401) {
      const freshCookies = await getCookies({ forceRefresh: true });
      const retryHeaders = { ...headers, Cookie: freshCookies };
      return axios.get(url, { params, headers: retryHeaders, timeout: 15000 });
    }
    throw err;
  }
}

async function searchListings(searchText, { perPage = 40 } = {}) {
  const params = {
    search_text: searchText,
    order: 'newest_first',
    per_page: perPage,
  };

  const { data } = await vintedGet(BASE_URL, params);

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
