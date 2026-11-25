export function validateEnvironment(env: Record<string, unknown>) {
  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const databaseUrl = String(env.DATABASE_URL ?? '');
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) throw new Error('DATABASE_URL must be a PostgreSQL URL');
  const nodeEnv = String(env.NODE_ENV ?? 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('Invalid NODE_ENV');
  const origins = String(env.CORS_ORIGINS ?? '').split(',').map(v => v.trim()).filter(Boolean);
  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error('CORS_ORIGINS must contain exact HTTP origins');
  }
  const currency = String(env.CHECKOUT_CURRENCY ?? '');
  if (currency && !/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid CHECKOUT_CURRENCY');
  return {
    ...env, PORT: port, DATABASE_URL: databaseUrl, NODE_ENV: nodeEnv, CORS_ORIGINS: origins,
    CHECKOUT_CURRENCY: currency || undefined,
  };
}
