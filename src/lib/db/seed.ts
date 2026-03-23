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
      name VARCHAR(50) NOT NULL,
      price INTEGER
    );
  `);

  await client.query(`
    CREATE TABLE plants (
      id SERIAL PRIMARY KEY,
      cultivar_name VARCHAR(50) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      image VARCHAR(250),
      inventory INTEGER DEFAULT 0,
      price INTEGER,
      details TEXT,
      in_stock BOOLEAN DEFAULT true
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
      price_each INTEGER,
      quantity INTEGER
    );
  `);

  console.log("Finished creating tables.");
}

async function seedData() {
  console.log("Seeding sample data...");

  await client.query(`
    INSERT INTO categories (name, price) VALUES
      ('seeds', 5),
      ('cuts', 15),
      ('stands', 25);
  `);

  await client.query(`
    INSERT INTO plants (cultivar_name, category_id, image, inventory, price, details, in_stock) VALUES
      ('Echeveria Lola', 1, '', 10, 5, 'Rosette-forming succulent with pale purple leaves', true),
      ('Burro''s Tail', 1, '', 8, 7, 'Trailing succulent with plump blue-green leaves', true),
      ('Prickly Pear', 2, '', 5, 15, 'Paddle-shaped cactus with colorful fruit', true),
      ('Aloe Vera', 2, '', 0, 20, 'Popular succulent known for its soothing gel', false),
      ('Golden Barrel', 3, '', 3, 25, 'Round cactus with golden spines', true);
  `);

  await client.query(`
    INSERT INTO customers (name, address, city, state, zip, email) VALUES
      ('Test Customer', '123 Main St', 'Denver', 'CO', '80202', 'test@example.com');
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
