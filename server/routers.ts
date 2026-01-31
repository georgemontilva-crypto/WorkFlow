import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, superAdminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getRedisClient } from "./config/redis";
import { invoicesRouter } from "./routers_invoices";
import { financesRouter } from "./routers_finances";
import { savingsRouter } from "./routers_savings";
import { notificationsRouter } from "./routers_notifications";
import { paymentsRouter } from "./routers_payments";
import { transactionsRouter } from "./routers_transactions";
import { translationRouter } from "./modules/translation";
import { cryptoRouter } from "./routers_crypto";

/**
 * ROUTER SIMPLIFICADO - SOLO AUTH Y CLIENTS
 * 
 * Este router contiene únicamente la lógica esencial:
 * - Autenticación (login, signup, 2FA, password reset)
 * - Clientes (CRUD básico)
 * 
 * Todos los demás módulos han sido deshabilitados para estabilidad.
 */

export const appRouter = router({
  system: systemRouter,
  
  /**
   * Auth router - Authentication and user management
   */
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    signup: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        businessType: z.enum(["freelancer", "agencia", "empresa"]).optional(),
        primaryCurrency: z.string()
          .length(3, "Currency code must be 3 characters")
          .toUpperCase()
          .default("USD"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { createUser, createVerificationToken, createCompanyProfile } = await import("./db");
          const { sendVerificationEmail } = await import("./emails/service");
          
          console.log(`[Auth] Signup attempt: ${input.email}`);
          
          // Validate currency exists in catalog
          const { CURRENCIES } = await import("../shared/currencies");
          const validCurrency = CURRENCIES.find(c => c.code === input.primaryCurrency);
          if (!validCurrency) {
            console.error(`[Auth] Invalid currency code: ${input.primaryCurrency}`);
            throw new Error(`Invalid currency code: ${input.primaryCurrency}`);
          }
          
          console.log(`[Auth] Currency validated: ${input.primaryCurrency} - ${validCurrency.name}`);
          
          // Create user (email_verified = 0 by default)
          const user = await createUser({
            name: input.name,
            email: input.email,
            password: input.password,
            primaryCurrency: input.primaryCurrency,
          });

          console.log(`[Auth] User created: ${user.id}`);

          // Create company profile with business type if provided
          if (input.businessType) {
            await createCompanyProfile({
              user_id: user.id,
              company_name: input.name,
              email: input.email,
              business_type: input.businessType,
            });
            console.log(`[Auth] Company profile created for user: ${user.id}`);
          }

          // Generate verification token
          const token = await createVerificationToken(user.id);
          console.log(`[Auth] Verification token generated for user: ${user.id}`);

          // Send verification email
          const emailResult = await sendVerificationEmail(
            user.email,
            user.name,
            token
          );

          if (!emailResult.success) {
            console.error('[Auth] Failed to send verification email:', emailResult.error);
          } else {
            console.log(`[Auth] Verification email sent to: ${user.email}`);
          }

          return {
            success: true,
            requiresVerification: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          };
        } catch (error: any) {
          console.error(`[Auth] Signup error:`, error.message);
          throw new Error(error.message || "Failed to create account");
        }
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { verifyUserCredentials } = await import("./db");
          const { generateToken } = await import("./_core/auth");

          console.log(`[Auth] Login attempt: ${input.email}`);

          // Verify credentials
          const user = await verifyUserCredentials(input.email, input.password);

          if (!user) {
            console.log(`[Auth] Login failed: Invalid credentials for ${input.email}`);
            throw new Error("Invalid email or password");
          }

          // Check if email is verified
          if (user.email_verified !== 1) {
            console.log(`[Auth] Login failed: Email not verified for ${input.email}`);
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          // Check if 2FA is enabled
          if (user.two_factor_enabled === 1) {
            console.log(`[Auth] 2FA required for user: ${user.id}`);
            const tempToken = Buffer.from(JSON.stringify({
              userId: user.id,
              email: user.email,
              timestamp: Date.now(),
            })).toString('base64');

            return {
              success: true,
              requires2FA: true,
              tempToken,
            };
          }

          // Send Login Alert Email
          try {
            const { sendEmail, getLoginAlertEmailTemplate } = await import("./_core/email");
            const ip = ctx.req.headers['x-forwarded-for'] || ctx.req.socket.remoteAddress || 'Unknown IP';
            const userAgent = ctx.req.headers['user-agent'] || 'Unknown Device';
            
            const emailHtml = getLoginAlertEmailTemplate(
              user.name,
              Array.isArray(ip) ? ip[0] : ip,
              userAgent,
              new Date()
            );

            // Send email asynchronously without blocking login
            sendEmail({
              to: user.email,
              subject: "Nuevo Inicio de Sesión - WorkFlow",
              html: emailHtml,
            }).catch(err => console.error("[Auth] Failed to send login alert:", err));
          } catch (error) {
            console.error("[Auth] Error preparing login alert:", error);
          }

          // Generate JWT token
          const token = await generateToken(user);

          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie('auth_token', token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          console.log(`[Auth] Login successful for user: ${user.id}`);

          return {
            success: true,
            requires2FA: false,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          };
        } catch (error: any) {
          console.error(`[Auth] Login error:`, error.message);
          throw new Error(error.message || "Login failed");
        }
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie('auth_token', { ...cookieOptions, maxAge: -1 });
      console.log(`[Auth] User logged out`);
      return {
        success: true,
      } as const;
    }),
    
    accessStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        has_lifetime_access: user.has_lifetime_access === 1,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        subscription_ends_at: user.subscription_ends_at,
        trialDaysRemaining: null,
        trialExpired: false,
      };
    }),

    // 2FA endpoints
    generate2FA: protectedProcedure.mutation(async ({ ctx }) => {
      const { TOTP, generateSecret } = await import('otplib');
      const QRCode = await import('qrcode');
      
      const user = await db.getUserById(ctx.user.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.email_verified !== 1) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      
      const secret = generateSecret();
      const otpauth = `otpauth://totp/Finwrk:${encodeURIComponent(ctx.user.email)}?secret=${secret}&issuer=Finwrk`;
      const qrCode = await QRCode.toDataURL(otpauth);
      
      await db.updateUser2FASecret(ctx.user.id, secret);
      
      console.log(`[Auth] 2FA QR code generated for user: ${ctx.user.id}`);
      
      return { qrCode, secret };
    }),

    verify2FA: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const { verify } = await import('otplib');
        const { send2FAStatusEmail } = await import('./emails/service');
        const user = await db.getUserById(ctx.user.id);
        
        if (!user || !user.two_factor_secret) {
          throw new Error('2FA not configured');
        }
        
        const isValid = verify({ token: input.token, secret: user.two_factor_secret });
        
        if (!isValid) {
          console.log(`[Auth] Invalid 2FA code for user: ${ctx.user.id}`);
          throw new Error('Invalid 2FA code');
        }
        
        await db.enable2FA(ctx.user.id);
        await send2FAStatusEmail(user.email, user.name, 'enabled');
        
        console.log(`[Auth] 2FA enabled for user: ${ctx.user.id}`);
        
        return { success: true };
      }),

    disable2FA: protectedProcedure
      .input(z.object({
        password: z.string().min(1),
        code: z.string().length(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const bcrypt = await import('bcryptjs');
        const { verify } = await import('otplib');
        const { send2FAStatusEmail } = await import('./emails/service');
        const user = await db.getUserById(ctx.user.id);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
        if (!isValidPassword) {
          throw new Error('Incorrect password');
        }
        
        if (!user.two_factor_secret) {
          throw new Error('2FA not enabled');
        }
        
        const isValidCode = verify({ token: input.code, secret: user.two_factor_secret });
        if (!isValidCode) {
          throw new Error('Invalid 2FA code');
        }
        
        await db.disable2FA(ctx.user.id);
        await send2FAStatusEmail(user.email, user.name, 'disabled');
        
        console.log(`[Auth] 2FA disabled for user: ${ctx.user.id}`);
        
        return { success: true };
      }),

    verify2FALogin: publicProcedure
      .input(z.object({
        tempToken: z.string(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const { verify } = await import('otplib');
        const { generateToken } = await import("./_core/auth");
        
        let tempData;
        try {
          tempData = JSON.parse(Buffer.from(input.tempToken, 'base64').toString());
        } catch {
          throw new Error('Invalid temp token');
        }
        
        if (Date.now() - tempData.timestamp > 5 * 60 * 1000) {
          throw new Error('Temp token expired');
        }
        
        const user = await db.getUserById(tempData.userId);
        if (!user || !user.two_factor_secret) {
          throw new Error('Invalid session');
        }
        
        const isValid = verify({ token: input.code, secret: user.two_factor_secret });
        if (!isValid) {
          console.log(`[Auth] Invalid 2FA code during login for user: ${user.id}`);
          throw new Error('Invalid 2FA code');
        }
        
        const token = await generateToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('auth_token', token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        console.log(`[Auth] 2FA login successful for user: ${user.id}`);
        
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),

    // Email verification
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        console.log(`[Auth] Email verification attempt with token: ${input.token.substring(0, 10)}...`);
        
        const result = await db.verifyEmailToken(input.token);
        
        if (!result.success) {
          console.log(`[Auth] Email verification failed: ${result.error}`);
          throw new Error(result.error || "Verification failed");
        }
        
        console.log(`[Auth] Email verified successfully for user: ${result.userId}`);
        
        return { success: true };
      }),

    resendVerification: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { sendVerificationEmail } = await import("./emails/service");
        
        console.log(`[Auth] Resend verification email request: ${input.email}`);
        
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new Error("User not found");
        }
        
        if (user.email_verified === 1) {
          throw new Error("Email already verified");
        }
        
        const token = await db.createVerificationToken(user.id);
        const emailResult = await sendVerificationEmail(user.email, user.name, token);
        
        if (!emailResult.success) {
          console.error('[Auth] Failed to resend verification email:', emailResult.error);
          throw new Error("Failed to send email");
        }
        
        console.log(`[Auth] Verification email resent to: ${user.email}`);
        
        return { success: true };
      }),

    // Password reset
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { sendPasswordResetEmail } = await import("./emails/service");
        
        console.log(`[Auth] Password reset request: ${input.email}`);
        
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          return { success: true };
        }
        
        const redis = getRedisClient();
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `password_reset:${user.id}`;
        
        await redis.set(key, token, 'EX', 600);
        
        const emailResult = await sendPasswordResetEmail(user.email, user.name, token);
        
        if (!emailResult.success) {
          console.error('[Auth] Failed to send password reset email:', emailResult.error);
        } else {
          console.log(`[Auth] Password reset email sent to: ${user.email}`);
        }
        
        return { success: true };
      }),

    verifyPasswordReset2FA: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input }) => {
        console.log(`[Auth] Verify password reset 2FA: ${input.email}`);
        
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new Error("Invalid request");
        }
        
        const redis = getRedisClient();
        const key = `password_reset:${user.id}`;
        const storedCode = await redis.get(key);
        
        if (!storedCode || storedCode !== input.code) {
          console.log(`[Auth] Invalid password reset code for user: ${user.id}`);
          throw new Error("Invalid or expired code");
        }
        
        const resetToken = Buffer.from(JSON.stringify({
          userId: user.id,
          timestamp: Date.now(),
        })).toString('base64');
        
        const resetKey = `password_reset_verified:${user.id}`;
        await redis.set(resetKey, resetToken, 'EX', 600);
        
        console.log(`[Auth] Password reset code verified for user: ${user.id}`);
        
        return { success: true, resetToken };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        resetToken: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        let tokenData;
        try {
          tokenData = JSON.parse(Buffer.from(input.resetToken, 'base64').toString());
        } catch {
          throw new Error('Invalid reset token');
        }
        
        if (Date.now() - tokenData.timestamp > 10 * 60 * 1000) {
          throw new Error('Reset token expired');
        }
        
        const redis = getRedisClient();
        const resetKey = `password_reset_verified:${tokenData.userId}`;
        const storedToken = await redis.get(resetKey);
        
        if (!storedToken || storedToken !== input.resetToken) {
          throw new Error('Invalid or expired reset token');
        }
        
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(input.newPassword, 12);
        
        await db.updateUserPassword(tokenData.userId, hashedPassword);
        await redis.del(resetKey);
        await redis.del(`password_reset:${tokenData.userId}`);
        
        console.log(`[Auth] Password reset successful for user: ${tokenData.userId}`);
        
        return { success: true };
      }),

    // Update primary currency
    updatePrimaryCurrency: protectedProcedure
      .input(z.object({
        currency: z.string()
          .length(3, "Currency code must be 3 characters")
          .toUpperCase(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { updateUserPrimaryCurrency } = await import("./db");
          
          console.log(`[Auth] Currency change request from user ${ctx.user.id}: ${ctx.user.primary_currency} -> ${input.currency}`);
          
          // Validate currency exists in catalog
          const { CURRENCIES } = await import("../shared/currencies");
          const validCurrency = CURRENCIES.find(c => c.code === input.currency);
          if (!validCurrency) {
            console.error(`[Auth] Invalid currency code: ${input.currency}`);
            throw new Error(`Invalid currency code: ${input.currency}`);
          }
          
          console.log(`[Auth] Currency validated: ${input.currency} - ${validCurrency.name}`);
          
          // Update currency
          await updateUserPrimaryCurrency(ctx.user.id, input.currency);
          
          console.log(`[Auth] Primary currency updated successfully for user ${ctx.user.id}: ${input.currency}`);
          
          return { success: true };
        } catch (error: any) {
          console.error(`[Auth] Update currency error:`, error.message);
          throw new Error(error.message || "Failed to update currency");
        }
      }),
  }),

  /**
   * Clients router - CRUD operations for clients with strict validations
   */
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      console.log(`[Clients] List request from user: ${ctx.user.id}`);
      const clients = await db.getClientsByUserId(ctx.user.id);
      console.log(`[Clients] Found ${clients.length} clients for user: ${ctx.user.id}`);
      return clients;
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        console.log(`[Clients] Get client ${input.id} for user: ${ctx.user.id}`);
        const client = await db.getClientById(input.id, ctx.user.id);
        if (!client) {
          console.log(`[Clients] Client ${input.id} not found for user: ${ctx.user.id}`);
          throw new Error("Client not found");
        }
        return client;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "El nombre es obligatorio").trim(),
        email: z.string().email("Email inválido").toLowerCase().trim(),
        phone: z.string().optional(),
        company: z.string().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log(`[Clients] Create attempt by user ${ctx.user.id}:`, {
            name: input.name,
            email: input.email,
          });
          
          // Verificar límites de plan
          if (ctx.user.role !== 'super_admin') {
            const { getPlanLimit } = await import("./plans");
            const clientLimit = getPlanLimit(ctx.user.subscription_plan as any, 'clients');
            
            if (clientLimit !== Infinity) {
              const existingClients = await db.getClientsByUserId(ctx.user.id);
              if (existingClients.length >= clientLimit) {
                console.log(`[Clients] Plan limit reached for user ${ctx.user.id}: ${existingClients.length}/${clientLimit}`);
                throw new Error(`Has alcanzado el límite de ${clientLimit} clientes en el plan Free.`);
              }
            }
          }
          
          // Verificar email único por usuario
          const existingClients = await db.getClientsByUserId(ctx.user.id);
          const duplicateEmail = existingClients.find(
            c => c.email.toLowerCase() === input.email.toLowerCase()
          );
          
          if (duplicateEmail) {
            console.log(`[Clients] Duplicate email detected for user ${ctx.user.id}: ${input.email}`);
            throw new Error(`Ya existe un cliente con el email ${input.email}`);
          }
          
          // Crear cliente
          const client = await db.createClient({
            user_id: ctx.user.id,
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            status: input.status,
            notes: input.notes,
          });
          
          console.log(`[Clients] Client created successfully:`, {
            id: client.id,
            user_id: ctx.user.id,
            name: client.name,
            email: client.email,
          });
          
          // Create notification (non-blocking)
          try {
            const { notifyClientCreated } = await import('./helpers/notificationHelpers');
            await notifyClientCreated(
              ctx.user.id,
              client.id,
              client.name
            );
          } catch (notifError: any) {
            console.error(`[Clients] Notification error (non-blocking):`, notifError.message);
          }
          
          return { 
            success: true, 
            client: client 
          };
        } catch (error: any) {
          console.error(`[Clients] Create error for user ${ctx.user.id}:`, error.message);
          throw new Error(error.message || "Error al crear cliente");
        }
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "El nombre es obligatorio").trim().optional(),
        email: z.string().email("Email inválido").toLowerCase().trim().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        archived: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log(`[Clients] Update attempt for client ${input.id} by user ${ctx.user.id}`);
          
          const { id, ...data } = input;
          
          // Si se está actualizando el email, verificar que sea único
          if (data.email) {
            const existingClients = await db.getClientsByUserId(ctx.user.id);
            const duplicateEmail = existingClients.find(
              c => c.id !== id && c.email.toLowerCase() === data.email!.toLowerCase()
            );
            
            if (duplicateEmail) {
              console.log(`[Clients] Duplicate email detected during update: ${data.email}`);
              throw new Error(`Ya existe otro cliente con el email ${data.email}`);
            }
          }
          
          const updateData: any = { ...data, updated_at: new Date() };
          await db.updateClient(id, ctx.user.id, updateData);
          
          console.log(`[Clients] Client ${id} updated successfully by user ${ctx.user.id}`);
          
          return { success: true };
        } catch (error: any) {
          console.error(`[Clients] Update error:`, error.message);
          throw new Error(error.message || "Error al actualizar cliente");
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        console.log(`[Clients] Delete attempt for client ${input.id} by user ${ctx.user.id}`);
        
        await db.deleteClient(input.id, ctx.user.id);
        
        console.log(`[Clients] Client ${input.id} deleted successfully by user ${ctx.user.id}`);
        
        return { success: true };
      }),
  }),

  /**
   * Invoices router - REBUILT FROM SCRATCH
   * Clean, stable, predictable invoice system
   */
  invoices: invoicesRouter,
  
  /**
   * Finances router - BUILT FROM SCRATCH
   * Read-only financial analytics based on paid invoices
   */
  finances: financesRouter,
  
  /**
   * Savings router - BUILT FROM SCRATCH
   * Independent savings goals module with own currency per goal
   */
  savings: savingsRouter,
  
  /**
   * Notifications Router - Persistent notifications system
   * Side panel only, no auto-popups, no toasts
   */
  notifications: notificationsRouter,
  
  /**
   * Payments Router - Manual payment registration system
   * Records payments received outside the system
   * Updates invoice status automatically
   */
  payments: paymentsRouter,
  
  /**
   * Transactions Router - Manual income and expense transactions
   * Independent from invoices, for tracking general finances
   */
  transactions: transactionsRouter,
  
  /**
   * Translation Router - Automatic translation with OpenAI
   * Cached in Redis for performance and cost optimization
   */
  translation: translationRouter,
  
  /**
   * Crypto Router - Cryptocurrency investment tracking
   * Manages crypto projects and purchases for portfolio analysis
   */
  crypto: cryptoRouter,
});

export type AppRouter = typeof appRouter;
