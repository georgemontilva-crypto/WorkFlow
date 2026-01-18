export const ENV = {
  appId: process.env.VITE_APP_ID ?? "hiwork",
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://api.manus.im",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "owner",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://api.manus.im",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
