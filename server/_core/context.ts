import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { extractToken, verifyToken } from "./auth";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Extract token from Authorization header or cookie
    const token = extractToken(
      opts.req.headers.authorization,
      opts.req.headers.cookie
    );

    if (token) {
      // Verify and decode token
      const payload = await verifyToken(token);
      
      if (payload) {
        // Get user from database
        user = await getUserById(payload.userId) || null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error('[Context] Authentication error:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
