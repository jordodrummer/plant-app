import pg from "pg";

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://jordanumlauf@localhost:5432/cactus_shop",
});

async function dropTables() {
  console.log("Dropping all tables...");
  await client.query(`
    DROP TABLE IF EXISTS order_details;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS plant_variants;
    DROP TABLE IF EXISTS plant_images;
    DROP TABLE IF EXISTS plants;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS categories;
  `);
  console.log("Finished dropping tables.");
}

async function createTables() {
  console.log("Creating tables...");

  await client.query(`
    CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE plants (
      id SERIAL PRIMARY KEY,
      cultivar_name VARCHAR(100) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      details TEXT,
      in_stock BOOLEAN DEFAULT false
    );
  `);

  await client.query(`
    CREATE TABLE plant_variants (
      id SERIAL PRIMARY KEY,
      plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      variant_type VARCHAR(20) NOT NULL CHECK (variant_type IN ('cutting', 'rooted_cutting', 'cut_to_order', 'mother_stand', 'seedling', 'op_seeds', 'hybrid_seeds', 'special')),
      price INTEGER NOT NULL,
      inventory INTEGER DEFAULT 0,
      label VARCHAR(100),
      note TEXT,
      sort_order INTEGER DEFAULT 0,
      weight_lbs INTEGER DEFAULT 0,
      weight_oz INTEGER DEFAULT 0,
      shipping_override INTEGER
    );
  `);

  await client.query(`
    CREATE TABLE plant_images (
      id SERIAL PRIMARY KEY,
      plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      url VARCHAR(500) NOT NULL,
      image_type VARCHAR(20) DEFAULT 'plant' CHECK (image_type IN ('plant', 'mother', 'father', 'cutting', 'grown_example')),
      caption VARCHAR(200),
      sort_order INTEGER DEFAULT 0
    );
  `);

  await client.query(`
    CREATE TABLE customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      address VARCHAR(50),
      city VARCHAR(50),
      state VARCHAR(50),
      zip VARCHAR(50),
      email VARCHAR(50)
    );
  `);

  await client.query(`
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending'
    );
  `);

  await client.query(`
    CREATE TABLE order_details (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      plant_id INTEGER REFERENCES plants(id),
      variant_id INTEGER REFERENCES plant_variants(id),
      price_each INTEGER,
      quantity INTEGER
    );
  `);

  await client.query(`
    CREATE TABLE shipping_config (
      id SERIAL PRIMARY KEY,
      variant_type VARCHAR(20) UNIQUE NOT NULL,
      method VARCHAR(10) NOT NULL CHECK (method IN ('flat', 'realtime')),
      base_price INTEGER,
      additional_price INTEGER
    );
  `);

  await client.query(`
    CREATE INDEX idx_plant_variants_plant_id ON plant_variants(plant_id);
    CREATE INDEX idx_plant_images_plant_id ON plant_images(plant_id);
  `);

  console.log("Finished creating tables.");
}

async function seedData() {
  console.log("Seeding sample data...");

  await client.query(`
    INSERT INTO categories (name) VALUES
      ('seeds'),
      ('cuts'),
      ('stands');
  `);

  // Plant 1: Echeveria Lola (cutting + mother stand)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (1, 'Echeveria Lola', 2, 'Rosette-forming succulent with pale purple leaves. Provenance: Originally sourced from Korean nursery.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, note, sort_order) VALUES
      (1, 'cutting', 15, 8, 'The cut you see here is the cut you get, unless noted as an inventory listing.', 0),
      (1, 'mother_stand', 45, 1, NULL, 1);
  `);

  // Plant 2: Prickly Pear (cutting + cut to order)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (2, 'Prickly Pear', 2, 'Paddle-shaped cactus with colorful fruit.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, note, sort_order) VALUES
      (2, 'cutting', 10, 12, 'Inventory listing, so you will likely not receive the exact cut shown here.', 0),
      (2, 'cut_to_order', 15, 5, 'Allow 7-10 days for cut-to-order listings to callous before shipment.', 1);
  `);

  // Plant 3: Golden Barrel (seeds only)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (3, 'Golden Barrel', 1, 'Round cactus with golden spines. Mother: Wild collected Baja California.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, label, sort_order) VALUES
      (3, 'op_seeds', 8, 20, 'Pack of 100', 0);
  `);

  // Plant 4: Aloe Vera (out of stock)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (4, 'Aloe Vera', 2, 'Popular succulent known for its soothing gel.', false);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, sort_order) VALUES
      (4, 'cutting', 20, 0, 0);
  `);

  // Plant 5: Burro's Tail (hybrid seeds)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (5, 'Burro''s Tail', 1, 'Trailing succulent with plump blue-green leaves. Mother: Sedum morganianum x Father: Sedum burrito.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, label, sort_order) VALUES
      (5, 'hybrid_seeds', 12, 10, 'Pack of 50', 0);
  `);

  // Note: plant_images are not seeded because image URLs come from Vercel Blob uploads.
  // The gallery will show the cactus placeholder until images are uploaded via the UI.

  await client.query(`
    INSERT INTO customers (name, address, city, state, zip, email) VALUES
      ('Test Customer', '123 Main St', 'Denver', 'CO', '80202', 'test@example.com');
  `);

  await client.query(`
    INSERT INTO shipping_config (variant_type, method, base_price, additional_price) VALUES
      ('cutting', 'flat', 600, 150),
      ('rooted_cutting', 'realtime', NULL, NULL),
      ('cut_to_order', 'realtime', NULL, NULL),
      ('mother_stand', 'realtime', NULL, NULL),
      ('seedling', 'realtime', NULL, NULL),
      ('op_seeds', 'flat', 400, 100),
      ('hybrid_seeds', 'flat', 400, 100),
      ('special', 'realtime', NULL, NULL);
  `);

  console.log("Finished seeding data.");
}

async function rebuildDb() {
  try {
    await client.connect();
    await dropTables();
    await createTables();
    await seedData();
    console.log("Database rebuild complete.");
  } catch (error) {
    console.error("Error rebuilding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

rebuildDb();
