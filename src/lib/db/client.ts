import { Pool } from "pg";

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "cactus_shop",
        user: process.env.DB_USER || "jordanumlauf",
        password: process.env.DB_PASS || "",
        port: Number(process.env.DB_PORT) || 5432,
      }
);

export default pool;
