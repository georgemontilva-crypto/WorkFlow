import { router, superAdminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

/**
 * Admin Router - Super Admin Panel
 * Only accessible by users with role 'super_admin'
 */
export const adminRouter = router({
  /**
   * Get all users with their stats
   */
  getAllUsers: superAdminProcedure.query(async () => {
    try {
      console.log('[Admin] Fetching all users...');
      
      const users = await db.getAllUsers();
      
      console.log(`[Admin] Found ${users.length} users`);
      
      // Get stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          try {
            const clients = await db.getClientsByUserId(user.id);
            const invoices = await db.getInvoicesByUserId(user.id);
            
            return {
              ...user,
              stats: {
                clients: clients.length,
                invoices: invoices.length,
              },
            };
          } catch (error) {
            console.error(`[Admin] Error fetching stats for user ${user.id}:`, error);
            return {
              ...user,
              stats: {
                clients: 0,
                invoices: 0,
              },
            };
          }
        })
      );
      
      return usersWithStats;
    } catch (error: any) {
      console.error('[Admin] Error fetching users:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  }),

  /**
   * Get platform statistics
   */
  getStats: superAdminProcedure.query(async () => {
    try {
      console.log('[Admin] Fetching platform stats...');
      
      const users = await db.getAllUsers();
      const totalClients = await db.getTotalClientsCount();
      const totalInvoices = await db.getTotalInvoicesCount();
      
      const stats = {
        totalUsers: users.length,
        verifiedUsers: users.filter(u => u.email_verified === 1).length,
        usersWithLifetimeAccess: users.filter(u => u.has_lifetime_access === 1).length,
        users2FA: users.filter(u => u.two_factor_enabled === 1).length,
        totalClients,
        totalInvoices,
      };
      
      console.log('[Admin] Platform stats:', stats);
      
      return stats;
    } catch (error: any) {
      console.error('[Admin] Error fetching stats:', error);
      throw new Error(error.message || 'Failed to fetch stats');
    }
  }),

  /**
   * Update user role
   */
  updateUserRole: superAdminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['user', 'admin', 'super_admin']),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Admin] Updating role for user ${input.userId} to ${input.role}`);
        
        await db.updateUserRole(input.userId, input.role);
        
        console.log(`[Admin] Role updated successfully for user ${input.userId}`);
        
        return { success: true };
      } catch (error: any) {
        console.error('[Admin] Error updating user role:', error);
        throw new Error(error.message || 'Failed to update user role');
      }
    }),

  /**
   * Grant lifetime access to user
   */
  grantLifetimeAccess: superAdminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Admin] Granting lifetime access to user ${input.userId}`);
        
        await db.grantLifetimeAccess(input.userId);
        
        console.log(`[Admin] Lifetime access granted to user ${input.userId}`);
        
        return { success: true };
      } catch (error: any) {
        console.error('[Admin] Error granting lifetime access:', error);
        throw new Error(error.message || 'Failed to grant lifetime access');
      }
    }),

  /**
   * Revoke lifetime access from user
   */
  revokeLifetimeAccess: superAdminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Admin] Revoking lifetime access from user ${input.userId}`);
        
        await db.revokeLifetimeAccess(input.userId);
        
        console.log(`[Admin] Lifetime access revoked from user ${input.userId}`);
        
        return { success: true };
      } catch (error: any) {
        console.error('[Admin] Error revoking lifetime access:', error);
        throw new Error(error.message || 'Failed to revoke lifetime access');
      }
    }),
});
