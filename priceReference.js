function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Recalcule et met à jour la table reference_prices à partir des annonces
// "fonctionnelles" vues récemment (on ignore les annonces en panne pour ne
// pas fausser la médiane vers le bas).
async function updateReferencePrices(pool, { minSampleSize = 3 } = {}) {
  const { rows } = await pool.query(
    `SELECT brand, model_guess, price
     FROM listings
     WHERE condition_tag = 'fonctionnel'
       AND model_guess IS NOT NULL
       AND first_seen_at > now() - interval '90 days'`
  );

  const groups = {};
  for (const row of rows) {
    const key = `${row.brand}|||${row.model_guess}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(parseFloat(row.price));
  }

  let updated = 0;
  for (const key of Object.keys(groups)) {
    const [brand, model_guess] = key.split('|||');
    const prices = groups[key];
    if (prices.length < minSampleSize) continue;

    const med = median(prices);
    await pool.query(
      `INSERT INTO reference_prices (brand, model_guess, median_price, sample_size, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (brand, model_guess)
       DO UPDATE SET median_price = $3, sample_size = $4, updated_at = now()`,
      [brand, model_guess, med, prices.length]
    );
    updated += 1;
  }
  return updated;
}

async function getMedianPrice(pool, brand, modelGuess) {
  if (!modelGuess) return null;
  const { rows } = await pool.query(
    `SELECT median_price FROM reference_prices WHERE brand = $1 AND model_guess = $2`,
    [brand, modelGuess]
  );
  return rows.length > 0 ? parseFloat(rows[0].median_price) : null;
}

module.exports = { updateReferencePrices, getMedianPrice, median };
