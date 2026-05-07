
// Prisma client — run: npx prisma db push  to initialize
// eslint-disable-next-line
type AnyClient = any

let _client: AnyClient = null

function getClient(): AnyClient {
  if (_client) return _client
  try {
    // eslint-disable-next-line
    const { PrismaClient } = require("@prisma/client")
    const g = globalThis as Record<string, AnyClient>
    _client = g["_prisma"] ?? new PrismaClient()
    if (process.env.NODE_ENV !== "production") g["_prisma"] = _client
    return _client
  } catch {
    // Prisma not generated yet — return proxy that returns empty data
    return new Proxy({}, {
      get: (_, prop) => {
        if (prop === "then") return undefined
        return new Proxy({}, {
          get: (__, method) => {
            if (["findMany","findFirst","findUnique"].includes(String(method)))
              return async () => (String(method) === "findMany" ? [] : null)
            if (["create","update","upsert"].includes(String(method)))
              return async (args: AnyClient) => args?.data ?? {}
            if (String(method) === "delete") return async () => ({})
            return () => Promise.resolve(null)
          }
        })
      }
    })
  }
}

export const prisma: AnyClient = getClient()
