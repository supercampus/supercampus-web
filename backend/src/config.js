import 'dotenv/config';

const port = Number.parseInt(process.env.PORT ?? '4000', 10);
const poolMax = Number.parseInt(process.env.PGPOOL_MAX ?? '10', 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and update it.');
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  databaseUrl: process.env.DATABASE_URL,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  poolMax: Number.isInteger(poolMax) && poolMax > 0 ? poolMax : 10,
  jwtSecret: process.env.JWT_SECRET,
};
