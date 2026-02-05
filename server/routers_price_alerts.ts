import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as priceAlertsDb from "./db-price-alerts";
import { checkPriceAlerts } from "./services/priceAlertsMonitor";

/**
 * Price Alerts Router
 * Handles cryptocurrency price alerts configuration and management
 */
export const priceAlertsRouter = router({
  /**
   * Get all alerts for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log(`[PriceAlerts] List request from user: ${ctx.user.id}`);
      const alerts = await priceAlertsDb.getUserPriceAlerts(ctx.user.id);
      console.log(`[PriceAlerts] Found ${alerts.length} alerts for user: ${ctx.user.id}`);
      return alerts;
    } catch (error: any) {
      console.error('[PriceAlerts] Error fetching alerts:', error);
      throw new Error(error.message || 'Failed to fetch alerts');
    }
  }),

  /**
   * Get active alerts for the current user
   */
  listActive: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log(`[PriceAlerts] Active alerts request from user: ${ctx.user.id}`);
      const alerts = await priceAlertsDb.getActivePriceAlerts(ctx.user.id);
      console.log(`[PriceAlerts] Found ${alerts.length} active alerts for user: ${ctx.user.id}`);
      return alerts;
    } catch (error: any) {
      console.error('[PriceAlerts] Error fetching active alerts:', error);
      throw new Error(error.message || 'Failed to fetch active alerts');
    }
  }),

  /**
   * Get alerts for a specific symbol
   */
  getBySymbol: protectedProcedure
    .input(z.object({
      symbol: z.string().min(1).max(20),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log(`[PriceAlerts] Get alerts for symbol ${input.symbol} by user: ${ctx.user.id}`);
        const alerts = await priceAlertsDb.getUserAlertsBySymbol(ctx.user.id, input.symbol);
        console.log(`[PriceAlerts] Found ${alerts.length} alerts for ${input.symbol}`);
        return alerts;
      } catch (error: any) {
        console.error('[PriceAlerts] Error fetching alerts by symbol:', error);
        throw new Error(error.message || 'Failed to fetch alerts');
      }
    }),

  /**
   * Create a new price alert
   */
  create: protectedProcedure
    .input(z.object({
      symbol: z.string().min(1).max(20),
      type: z.enum(["crypto", "stock", "forex", "commodity"]).default("crypto"),
      target_price: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format"),
      condition: z.enum(["above", "below"]),
      notify_email: z.boolean().default(true),
      notify_app: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[PriceAlerts] Create alert for ${input.symbol} by user: ${ctx.user.id}`);
        
        // Validate price is positive
        const price = parseFloat(input.target_price);
        if (price <= 0) {
          throw new Error('El precio debe ser mayor a cero');
        }

        // Check for duplicate alerts (same symbol, condition, target price)
        const existingAlerts = await priceAlertsDb.getUserAlertsBySymbol(ctx.user.id, input.symbol);
        const duplicate = existingAlerts.find(
          alert => 
            alert.condition === input.condition && 
            parseFloat(alert.target_price) === price &&
            alert.is_active === 1
        );

        if (duplicate) {
          throw new Error(`Ya existe una alerta activa para ${input.symbol} cuando el precio esté ${input.condition === 'above' ? 'por encima' : 'por debajo'} de $${price}`);
        }

        // Create alert
        const alert = await priceAlertsDb.createPriceAlert({
          user_id: ctx.user.id,
          symbol: input.symbol,
          type: input.type,
          target_price: input.target_price,
          condition: input.condition,
          notify_email: input.notify_email,
          notify_app: input.notify_app,
        });

        console.log(`[PriceAlerts] Alert created successfully:`, {
          id: alert.id,
          user_id: ctx.user.id,
          symbol: alert.symbol,
          target_price: alert.target_price,
          condition: alert.condition,
        });

        return { 
          success: true, 
          alert 
        };
      } catch (error: any) {
        console.error(`[PriceAlerts] Create error for user ${ctx.user.id}:`, error.message);
        throw new Error(error.message || "Error al crear alerta");
      }
    }),

  /**
   * Toggle alert status (activate/deactivate)
   */
  toggleStatus: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[PriceAlerts] Toggle status for alert ${input.alertId} by user: ${ctx.user.id}`);
        
        // Verify alert belongs to user
        const alert = await priceAlertsDb.getPriceAlertById(input.alertId, ctx.user.id);
        if (!alert) {
          throw new Error('Alerta no encontrada');
        }

        await priceAlertsDb.updatePriceAlertStatus(input.alertId, ctx.user.id, input.isActive);
        
        console.log(`[PriceAlerts] Alert ${input.alertId} status updated to ${input.isActive}`);
        
        return { success: true };
      } catch (error: any) {
        console.error(`[PriceAlerts] Toggle status error:`, error.message);
        throw new Error(error.message || "Error al actualizar estado de alerta");
      }
    }),

  /**
   * Delete a price alert
   */
  delete: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[PriceAlerts] Delete alert ${input.alertId} by user: ${ctx.user.id}`);
        
        // Verify alert belongs to user
        const alert = await priceAlertsDb.getPriceAlertById(input.alertId, ctx.user.id);
        if (!alert) {
          throw new Error('Alerta no encontrada');
        }

        await priceAlertsDb.deletePriceAlert(input.alertId, ctx.user.id);
        
        console.log(`[PriceAlerts] Alert ${input.alertId} deleted successfully`);
        
        return { success: true };
      } catch (error: any) {
        console.error(`[PriceAlerts] Delete error:`, error.message);
        throw new Error(error.message || "Error al eliminar alerta");
      }
    }),

  /**
   * Count active alerts for current user
   */
  countActive: protectedProcedure.query(async ({ ctx }) => {
    try {
      const count = await priceAlertsDb.countUserActivePriceAlerts(ctx.user.id);
      return { count };
    } catch (error: any) {
      console.error('[PriceAlerts] Error counting active alerts:', error);
      throw new Error(error.message || 'Failed to count alerts');
    }
  }),

  /**
   * Check price alerts (called by frontend when prices update)
   */
  checkAlerts: protectedProcedure
    .input(z.object({
      prices: z.array(z.object({
        symbol: z.string(),
        price: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      try {
        await checkPriceAlerts(input.prices);
        return { success: true };
      } catch (error: any) {
        console.error('[PriceAlerts] Error checking alerts:', error);
        // Don't throw error to avoid disrupting price updates
        return { success: false, error: error.message };
      }
    }),
});
