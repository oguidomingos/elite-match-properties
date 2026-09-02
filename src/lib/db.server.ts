import postgres from "postgres";

// Conexão única (server-only). Nunca importe este módulo em código de cliente.
const url = process.env["DATABASE_URL"];
if (!url) {
  // Falha cedo e clara em produção; em build/client isso nunca roda.
  console.warn("[db] DATABASE_URL ausente — as server functions vão falhar.");
}

declare global {
  var __emSql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  globalThis.__emSql ??
  postgres(url ?? "postgres://invalid", {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });

if (process.env["NODE_ENV"] !== "production") globalThis.__emSql = sql;
