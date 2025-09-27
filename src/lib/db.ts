import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = {
  execute: async ({ sql: query, args = [] }: { sql: string; args?: any[] }) => {
    try {
      const result = await pool.query(query, args);
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
};

export default db;
