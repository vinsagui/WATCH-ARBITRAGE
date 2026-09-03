require('dotenv').config();
const cron = require('node-cron');
const { Pool } = require('pg');

const targets = require('../config/targets');
const { searchListings } = require('./scraper');
const { guessModel } = require('./modelGuess');
const { classifyCondition, shouldAlert } = require('./scoring');
const { updateReferencePrices, getMedianPrice } = require('./priceReference');
const { sendAlert } = require('./telegram');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DISCOUNT_THRESHOLD = parseFloat(process.env.DISCOUNT_THRESHOLD || '0.35');

async function processTarget(target) {
  const results = await searchListings(target.search_text);
  console.log(`[${target.search_text}] ${results.length} annonces récupérées`);

  for (const item of results) {
    if (!item.vinted_id || !item.price) continue;

    const model_guess = guessModel(target.brand, item.title);
    const condition_tag = classifyCondition(item.title, ''); // description ajoutée en V2 si besoin

    // Upsert de l'annonce (on la met à jour si déjà vue, sinon on l'insère)
    const { rows } = await pool.query(
      `INSERT INTO listings (vinted_id, title, brand, model_guess, price, currency, url, photo_url, condition_tag, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       ON CONFLICT (vinted_id)
       DO UPDATE SET price = $5, last_seen_at = now()
       RETURNING id, alert_sent`,
      [
        item.vinted_id,
        item.title,
        target.brand,
        model_guess,
        item.price,
        item.currency,
        item.url,
        item.photo_url,
        condition_tag,
      ]
    );

    const row = rows[0];
    if (row.alert_sent) continue; // déjà alerté, on ne spam pas

    const medianPrice = await getMedianPrice(pool, target.brand, model_guess);
    const decision = shouldAlert({ ...item, condition_tag }, medianPrice, DISCOUNT_THRESHOLD);

    if (decision.alert) {
      await sendAlert({ ...item, condition_tag }, medianPrice, decision.discount);
      await pool.query(`UPDATE listings SET alert_sent = true WHERE id = $1`, [row.id]);
      console.log(`  ✅ Alerte envoyée : ${item.title} (${item.price}€, -${Math.round(decision.discount * 100)}%)`);
    }
  }
}

async function runScan() {
  console.log(`\n--- Scan démarré : ${new Date().toISOString()} ---`);
  for (const target of targets) {
    try {
      await processTarget(target);
      // petite pause entre chaque recherche pour rester discret côté Vinted
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.error(`Erreur sur la cible "${target.search_text}":`, err.message);
    }
  }

  try {
    const updated = await updateReferencePrices(pool);
    console.log(`Prix de référence mis à jour pour ${updated} modèle(s).`);
  } catch (err) {
    console.error('Erreur mise à jour des prix de référence:', err.message);
  }

  console.log('--- Scan terminé ---\n');
}

// Premier scan immédiat au démarrage, puis toutes les N minutes
runScan();
const interval = parseInt(process.env.SCAN_INTERVAL_MINUTES || '10', 10);
cron.schedule(`*/${interval} * * * *`, runScan);

console.log(`Agent démarré. Scan toutes les ${interval} minutes.`);
