import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { cryptoWalletAddresses } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Wallet Router - Manages cryptocurrency wallet addresses
 * This is NOT a real wallet - only stores public addresses for reference
 * NO private keys, NO custody, NO transactions
 */

// Validation regex for common crypto address formats
const ADDRESS_PATTERNS = {
  // Bitcoin (P2PKH, P2SH, Bech32)
  BTC: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  // Ethereum (ERC20) and similar
  ETH: /^0x[a-fA-F0-9]{40}$/,
  // Tron (TRC20)
  TRX: /^T[a-zA-Z0-9]{33}$/,
  // Binance Smart Chain (BEP20) - same as ETH
  BNB: /^0x[a-fA-F0-9]{40}$/,
  // Ripple
  XRP: /^r[a-zA-Z0-9]{24,34}$/,
  // Generic fallback (at least 20 chars)
  DEFAULT: /^[a-zA-Z0-9]{20,}$/,
};

function validateAddress(crypto: string, address: string): boolean {
  const pattern = ADDRESS_PATTERNS[crypto as keyof typeof ADDRESS_PATTERNS] || ADDRESS_PATTERNS.DEFAULT;
  return pattern.test(address);
}

export const walletRouter = router({
  /**
   * List all wallet addresses for the current user
   */
  listAddresses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const addresses = await db
      .select()
      .from(cryptoWalletAddresses)
      .where(eq(cryptoWalletAddresses.user_id, ctx.user.id))
      .orderBy(desc(cryptoWalletAddresses.created_at));
    
    return addresses;
  }),

  /**
   * Get addresses grouped by cryptocurrency
   */
  getAddressesByCrypto: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const addresses = await db
      .select()
      .from(cryptoWalletAddresses)
      .where(eq(cryptoWalletAddresses.user_id, ctx.user.id))
      .orderBy(desc(cryptoWalletAddresses.created_at));
    
    // Group by crypto_symbol
    const grouped = addresses.reduce((acc, addr) => {
      if (!acc[addr.crypto_symbol]) {
        acc[addr.crypto_symbol] = [];
      }
      acc[addr.crypto_symbol].push(addr);
      return acc;
    }, {} as Record<string, typeof addresses>);
    
    return grouped;
  }),

  /**
   * Add a new wallet address
   */
  addAddress: protectedProcedure
    .input(
      z.object({
        crypto_symbol: z.string().min(1).max(20),
        network: z.string().min(1).max(50),
        address: z.string().min(20).max(255),
        alias: z.string().max(100).optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Validate address format
      if (!validateAddress(input.crypto_symbol, input.address)) {
        throw new Error("Formato de dirección inválido");
      }

      // Check if address already exists for this user
      const existing = await db
        .select()
        .from(cryptoWalletAddresses)
        .where(
          and(
            eq(cryptoWalletAddresses.user_id, ctx.user.id),
            eq(cryptoWalletAddresses.address, input.address)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Esta dirección ya está registrada");
      }

      const result = await db.insert(cryptoWalletAddresses).values({
        user_id: ctx.user.id,
        crypto_symbol: input.crypto_symbol.toUpperCase(),
        network: input.network,
        address: input.address,
        alias: input.alias || null,
        note: input.note || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return { success: true, id: result[0].insertId };
    }),

  /**
   * Update an existing wallet address
   */
  updateAddress: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        crypto_symbol: z.string().min(1).max(20).optional(),
        network: z.string().min(1).max(50).optional(),
        address: z.string().min(20).max(255).optional(),
        alias: z.string().max(100).optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verify ownership
      const existing = await db
        .select()
        .from(cryptoWalletAddresses)
        .where(
          and(
            eq(cryptoWalletAddresses.id, input.id),
            eq(cryptoWalletAddresses.user_id, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Dirección no encontrada");
      }

      // Validate address format if provided
      if (input.address && input.crypto_symbol) {
        if (!validateAddress(input.crypto_symbol, input.address)) {
          throw new Error("Formato de dirección inválido");
        }
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (input.crypto_symbol) updateData.crypto_symbol = input.crypto_symbol.toUpperCase();
      if (input.network) updateData.network = input.network;
      if (input.address) updateData.address = input.address;
      if (input.alias !== undefined) updateData.alias = input.alias || null;
      if (input.note !== undefined) updateData.note = input.note || null;

      await db
        .update(cryptoWalletAddresses)
        .set(updateData)
        .where(eq(cryptoWalletAddresses.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a wallet address
   */
  deleteAddress: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verify ownership
      const existing = await db
        .select()
        .from(cryptoWalletAddresses)
        .where(
          and(
            eq(cryptoWalletAddresses.id, input.id),
            eq(cryptoWalletAddresses.user_id, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Dirección no encontrada");
      }

      await db
        .delete(cryptoWalletAddresses)
        .where(eq(cryptoWalletAddresses.id, input.id));

      return { success: true };
    }),
});
