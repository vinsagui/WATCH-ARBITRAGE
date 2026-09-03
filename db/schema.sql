-- Annonces vues (historique complet, sert aussi à calculer les prix de référence)
CREATE TABLE IF NOT EXISTS listings (
  id              SERIAL PRIMARY KEY,
  vinted_id       BIGINT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  brand           TEXT NOT NULL,
  model_guess     TEXT,              -- référence détectée dans le titre/desc (ex: "DW5600E-1")
  price           NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'EUR',
  url             TEXT NOT NULL,
  photo_url       TEXT,
  condition_tag   TEXT,              -- 'fonctionnel' | 'a_reviser' | 'pour_pieces' | 'inconnu'
  status          TEXT DEFAULT 'active', -- 'active' | 'sold' | 'removed'
  first_seen_at   TIMESTAMPTZ DEFAULT now(),
  last_seen_at    TIMESTAMPTZ DEFAULT now(),
  alert_sent      BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_listings_brand_model ON listings(brand, model_guess);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Prix médian de référence par marque+modèle, recalculé périodiquement
CREATE TABLE IF NOT EXISTS reference_prices (
  id              SERIAL PRIMARY KEY,
  brand           TEXT NOT NULL,
  model_guess     TEXT NOT NULL,
  median_price    NUMERIC(10,2) NOT NULL,
  sample_size     INTEGER NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand, model_guess)
);
