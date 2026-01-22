import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, superAdminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    signup: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { createUser, createVerificationToken } = await import("./db");
          const { sendVerificationEmail } = await import("./emails/service");
          
          // Create user (email_verified = 0 by default)
          const user = await createUser({
            name: input.name,
            email: input.email,
            password: input.password,
          });

          // Generate verification token
          const token = await createVerificationToken(user.id);

          // Send verification email
          const emailResult = await sendVerificationEmail(
            user.email,
            user.name,
            token
          );

          if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
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

          // Verify credentials
          const user = await verifyUserCredentials(input.email, input.password);

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check if 2FA is enabled
          if (user.two_factor_enabled === 1) {
            // Store temporary session data for 2FA verification
            // We'll use a temporary token that expires in 5 minutes
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
          throw new Error(error.message || "Login failed");
        }
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie('auth_token', { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    
    accessStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getUserAccessStatus } = await import("./access");
      return getUserAccessStatus(ctx.user);
    }),

    // 2FA endpoints
    generate2FA: protectedProcedure.mutation(async ({ ctx }) => {
      const { TOTP, generateSecret } = await import('otplib');
      const QRCode = await import('qrcode');
      
      // Generate secret
      const secret = generateSecret();
      
      // Generate QR code URL
      const otpauth = `otpauth://totp/HiWork:${encodeURIComponent(ctx.user.email)}?secret=${secret}&issuer=HiWork`;
      
      const qrCode = await QRCode.toDataURL(otpauth);
      
      // Store secret temporarily (not enabled yet)
      await db.updateUser2FASecret(ctx.user.id, secret);
      
      return { qrCode, secret };
    }),

    verify2FA: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const { verify } = await import('otplib');
        const user = await db.getUserById(ctx.user.id);
        
        if (!user || !user.two_factor_secret) {
          throw new Error('2FA not configured');
        }
        
        const isValid = verify({ token: input.token, secret: user.two_factor_secret });
        
        if (!isValid) {
          throw new Error('Invalid 2FA code');
        }
        
        // Enable 2FA
        await db.enable2FA(ctx.user.id);
        
        return { success: true };
      }),

    disable2FA: protectedProcedure.mutation(async ({ ctx }) => {
      await db.disable2FA(ctx.user.id);
      return { success: true };
    }),

    verify2FALogin: publicProcedure
      .input(z.object({
        tempToken: z.string(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { verify } = await import('otplib');
          const { generateToken } = await import('./_core/auth');

          // Decode and verify temp token
          let tempData;
          try {
            const decoded = Buffer.from(input.tempToken, 'base64').toString('utf-8');
            tempData = JSON.parse(decoded);
          } catch {
            throw new Error('Invalid session token');
          }

          // Check if token is expired (5 minutes)
          const tokenAge = Date.now() - tempData.timestamp;
          if (tokenAge > 5 * 60 * 1000) {
            throw new Error('Session expired. Please login again.');
          }

          // Get user and verify 2FA code
          const user = await db.getUserById(tempData.userId);
          
          if (!user || !user.two_factor_secret || user.two_factor_enabled !== 1) {
            throw new Error('2FA not configured');
          }

          const isValid = verify({ token: input.code, secret: user.two_factor_secret });
          
          if (!isValid) {
            throw new Error('Invalid 2FA code');
          }

          // Send Login Alert Email
          try {
            const { sendEmail, getLoginAlertEmailTemplate } = await import('./_core/email');
            const ip = ctx.req.headers['x-forwarded-for'] || ctx.req.socket.remoteAddress || 'Unknown IP';
            const userAgent = ctx.req.headers['user-agent'] || 'Unknown Device';
            
            const emailHtml = getLoginAlertEmailTemplate(
              user.name,
              Array.isArray(ip) ? ip[0] : ip,
              userAgent,
              new Date()
            );

            sendEmail({
              to: user.email,
              subject: 'Nuevo Inicio de Sesión - WorkFlow',
              html: emailHtml,
            }).catch(err => console.error('[Auth] Failed to send login alert:', err));
          } catch (error) {
            console.error('[Auth] Error preparing login alert:', error);
          }

          // Generate JWT token
          const token = await generateToken(user);

          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie('auth_token', token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          return {
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          };
        } catch (error: any) {
          throw new Error(error.message || '2FA verification failed');
        }
      }),

    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { verifyEmailToken } = await import("./db");
          const { generateToken } = await import("./_core/auth");
          
          // Verify token and get user
          const user = await verifyEmailToken(input.token);
          
          if (!user) {
            throw new Error("Invalid or expired verification token");
          }

          // Generate JWT token and log user in
          const authToken = await generateToken(user);

          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie('auth_token', authToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          return {
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          };
        } catch (error: any) {
          throw new Error(error.message || "Failed to verify email");
        }
      }),

    resendVerification: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        try {
          const { getUserByEmail, createVerificationToken } = await import("./db");
          const { sendVerificationEmail } = await import("./emails/service");
          
          const user = await getUserByEmail(input.email);
          
          if (!user) {
            // Don't reveal if email exists
            return { success: true };
          }
          
          if (user.email_verified) {
            throw new Error("Email already verified");
          }
          
          // Generate new token
          const token = await createVerificationToken(user.id);
          
          // Send verification email
          await sendVerificationEmail(user.email, user.name, token);
          
          return { success: true };
        } catch (error: any) {
          throw new Error(error.message || "Failed to resend verification email");
        }
      }),

    changePassword: protectedProcedure
      .input(z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ ctx, input }) => {
        const bcrypt = await import('bcryptjs');
        const user = await db.getUserById(ctx.user.id);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Verify old password
        const isValid = await bcrypt.compare(input.oldPassword, user.password_hash);
        if (!isValid) {
          throw new Error('Current password is incorrect');
        }
        
        // Hash new password
        const newHash = await bcrypt.hash(input.newPassword, 12);
        
        // Update password
        await db.updateUserPassword(ctx.user.id, newHash);
        
        return { success: true };
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { nanoid } = await import('nanoid');
          const { sendEmail, getPasswordResetEmailTemplate } = await import('./_core/email');
          
          // Get user by email
          const user = await db.getUserByEmail(input.email);
          
          // Always return success to prevent email enumeration
          if (!user) {
            return { success: true, message: "If the email exists, a reset link has been sent" };
          }
          
          // Generate secure token
          const token = nanoid(64);
          
          // Save token to database
          await db.createPasswordResetToken(user.id, token);
          
          // Create reset link
          const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
          
          // Send email
          const emailHtml = getPasswordResetEmailTemplate(user.name, resetLink);
          console.log('[Auth] Sending password reset email to:', user.email);
          console.log('[Auth] Reset link:', resetLink);
          
          const emailSent = await sendEmail({
            to: user.email,
            subject: "Recuperación de Contraseña - Finwrk",
            html: emailHtml,
          });
          
          if (!emailSent) {
            console.error('[Auth] Failed to send password reset email');
            // Still return success to prevent email enumeration
          } else {
            console.log('[Auth] Password reset email sent successfully');
          }
          
          return { success: true, message: "If the email exists, a reset link has been sent" };
        } catch (error: any) {
          console.error("[Auth] Password reset request failed:", error);
          console.error("[Auth] Error details:", error.stack);
          return { success: true, message: "If the email exists, a reset link has been sent" };
        }
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        try {
          const bcrypt = await import('bcryptjs');
          
          // Get token from database
          const resetToken = await db.getPasswordResetToken(input.token);
          
          if (!resetToken) {
            throw new Error("Invalid or expired reset token");
          }
          
          // Check if token is expired
          if (new Date() > resetToken.expires_at) {
            throw new Error("Reset token has expired");
          }
          
          // Check if token was already used
          if (resetToken.used === 1) {
            throw new Error("Reset token has already been used");
          }
          
          // Hash new password
          const newHash = await bcrypt.hash(input.newPassword, 12);
          
          // Update password
          await db.updateUserPassword(resetToken.user_id, newHash);
          
          // Mark token as used
          await db.markPasswordResetTokenAsUsed(resetToken.id);
          
          return { success: true, message: "Password has been reset successfully" };
        } catch (error: any) {
          throw new Error(error.message || "Failed to reset password");
        }
      }),
  }),

  /**
   * Clients router - CRUD operations for clients
   */
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getClientById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional().default(""),
        company: z.string().optional(),
        has_recurring_billing: z.boolean().optional().default(false),
        billing_cycle: z.enum(["monthly", "quarterly", "yearly", "custom"]).optional().default("monthly"),
        custom_cycle_days: z.number().optional(),
        amount: z.string().optional().default("0"),
        next_payment_date: z.string().optional(),
        reminder_days: z.number().default(7),
        status: z.enum(["active", "inactive", "overdue"]).default("active"),
        archived: z.number().default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check plan limits (skip for super admins)
        if (ctx.user.role !== 'super_admin') {
          const { getPlanLimit } = await import("./plans");
          const clientLimit = getPlanLimit(ctx.user.subscription_plan as any, 'clients');
          
          if (clientLimit !== Infinity) {
          const { getClientsByUserId } = await import("./db");
          const existingClients = await getClientsByUserId(ctx.user.id);
            if (existingClients.length >= clientLimit) {
              throw new Error(`You've reached the limit of ${clientLimit} clients on the Free plan. Upgrade to Pro for unlimited clients.`);
            }
          }
        }

        await db.createClient({
          ...input,
          next_payment_date: input.next_payment_date ? new Date(input.next_payment_date) : new Date(),
          user_id: ctx.user.id,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        billing_cycle: z.enum(["monthly", "quarterly", "yearly", "custom"]).optional(),
        custom_cycle_days: z.number().optional(),
        amount: z.string().optional(),
        next_payment_date: z.string().optional(),
        reminder_days: z.number().optional(),
        status: z.enum(["active", "inactive", "overdue"]).optional(),
        archived: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updated_at: new Date() };
        if (data.next_payment_date) {
          updateData.next_payment_date = new Date(data.next_payment_date);
        }
        await db.updateClient(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClient(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Invoices router - CRUD operations for invoices
   */
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInvoicesByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getInvoiceById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        client_id: z.number(),
        invoice_number: z.string(),
        issue_date: z.string(),
        due_date: z.string(),
        subtotal: z.string(),
        tax: z.string().optional(),
        total: z.string(),
        paid_amount: z.string().optional().default("0"),
        status: z.enum(["draft", "sent", "payment_sent", "paid", "overdue", "cancelled"]).default("draft"),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        payment_link: z.string().optional(),
        notes: z.string().optional(),
        // Recurring invoice fields
        is_recurring: z.boolean().optional().default(false),
        recurrence_frequency: z.enum(["every_minute", "monthly", "biweekly", "annual", "custom"]).optional(),
        recurrence_interval: z.number().optional(), // For custom frequency
      }))
      .mutation(async ({ ctx, input }) => {
        // Check plan limits (skip for super admins)
        if (ctx.user.role !== 'super_admin') {
          const { getPlanLimit, getPlanById } = await import("./plans");
          const invoiceLimit = getPlanLimit(ctx.user.subscription_plan as any, 'invoices');
          
          if (invoiceLimit !== Infinity) {
            const { getInvoicesByUserId } = await import("./db");
            const existingInvoices = await getInvoicesByUserId(ctx.user.id);
            if (existingInvoices.length >= invoiceLimit) {
              throw new Error(`You've reached the limit of ${invoiceLimit} invoices on the Free plan. Upgrade to Pro for unlimited invoices.`);
            }
          }
          
          // Check recurring invoice limits
          if (input.is_recurring) {
            const plan = getPlanById(ctx.user.subscription_plan as any);
            const recurringLimit = plan.limits.recurringInvoices;
            
            if (recurringLimit === 0) {
              throw new Error('Recurring invoices are only available in Pro and Business plans. Upgrade to unlock this feature.');
            }
          }
        }

        const paidAmount = input.paid_amount || "0";
        const totalAmount = parseFloat(input.total);
        const paid = parseFloat(paidAmount);
        const balance = (totalAmount - paid).toFixed(2);
        
        // Generate unique payment token
        const crypto = await import('crypto');
        const paymentToken = crypto.randomBytes(32).toString('hex');
        
        // Calculate next generation date for recurring invoices
        let nextGenerationDate = null;
        if (input.is_recurring && input.recurrence_frequency) {
          const { calculateNextGenerationDate } = await import('./_core/recurring-invoices.js');
          nextGenerationDate = calculateNextGenerationDate(
            new Date(),
            input.recurrence_frequency,
            input.recurrence_interval
          );
        }
        
        const result = await db.createInvoice({
          user_id: ctx.user.id,
          client_id: input.client_id,
          invoice_number: input.invoice_number,
          issue_date: new Date(input.issue_date),
          due_date: new Date(input.due_date),
          items: JSON.stringify(input.items),
          subtotal: input.subtotal,
          tax: input.tax || "0",
          total: input.total,
          paid_amount: paidAmount,
          balance: balance,
          status: input.status,
          payment_token: paymentToken,
          payment_link: input.payment_link || null,
          notes: input.notes || null,
          // Recurring fields
          is_recurring: input.is_recurring || false,
          recurrence_frequency: input.recurrence_frequency || null,
          recurrence_interval: input.recurrence_interval || null,
          next_generation_date: nextGenerationDate,
          parent_invoice_id: null,
        });
        return { success: true, id: result.id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        client_id: z.number().optional(),
        invoice_number: z.string().optional(),
        issue_date: z.string().optional(),
        due_date: z.string().optional(),
        amount: z.string().optional(),
        paid_amount: z.string().optional(),
        status: z.enum(["draft", "sent", "payment_sent", "paid", "overdue", "cancelled"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Invoice Update] ========== START ==========');
        console.log('[Invoice Update] Input received:', JSON.stringify(input));
        console.log('[Invoice Update] User ID:', ctx.user.id);
        
        const { id, ...data } = input;
        const updateData: any = { ...data, updated_at: new Date() };
        
        // Convert dates
        if (data.issue_date) {
          updateData.issue_date = new Date(data.issue_date);
        }
        if (data.due_date) {
          updateData.due_date = new Date(data.due_date);
        }
        
        // Serialize items if provided
        if (data.items) {
          updateData.items = JSON.stringify(data.items);
        }
        
        // Get current invoice for calculations
        const invoice = await db.getInvoiceById(id, ctx.user.id);
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        // Calculate totals if items are updated
        if (data.items) {
          const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
          const tax = parseFloat(invoice.tax || "0");
          const total = subtotal + tax;
          
          updateData.subtotal = subtotal.toFixed(2);
          updateData.total = total.toFixed(2);
        }
        
        // Calculate balance
        const total = updateData.total ? parseFloat(updateData.total) : parseFloat(invoice.total);
        const paid = data.paid_amount ? parseFloat(data.paid_amount) : parseFloat(invoice.paid_amount || "0");
        updateData.balance = (total - paid).toFixed(2);
        updateData.paid_amount = paid.toFixed(2);
        
        // Auto-update status based on payment
        const previousPaid = parseFloat(invoice.paid_amount || "0");
        const newPaymentAmount = paid - previousPaid;
        const wasNotPaid = invoice.status !== 'paid';
        const isBeingMarkedAsPaid = data.status === 'paid' || (paid >= total && total > 0);
        
        console.log('[Invoice Update] Payment calculation:', {
          invoiceId: id,
          previousPaid,
          newPaid: paid,
          newPaymentAmount,
          wasNotPaid,
          isBeingMarkedAsPaid,
          currentStatus: invoice.status,
          requestedStatus: data.status
        });
        
        if (paid >= total && total > 0) {
          updateData.status = "paid";
        } else if (data.status === 'paid') {
          // If explicitly marked as paid, set status to paid
          updateData.status = "paid";
        } else if (paid > 0 && paid < total) {
          // Partial payment - keep current status or set to sent if was draft
          if (invoice.status === 'draft') {
            updateData.status = "sent";
          }
        }
        
        // Check if overdue
        if (updateData.status !== 'paid' && updateData.status !== 'cancelled') {
          const dueDate = data.due_date ? new Date(data.due_date) : new Date(invoice.due_date);
          if (dueDate < new Date()) {
            updateData.status = "overdue";
          }
        }
        
        await db.updateInvoice(id, ctx.user.id, updateData);
        
        // Create finance transaction for payments
        // Two scenarios:
        // 1. Invoice marked as paid (full payment) - create transaction for total
        // 2. Partial payment received - create transaction for the partial amount
        const statusChangingToPaid = (data.status === 'paid' || updateData.status === 'paid') && wasNotPaid;
        const hasNewPayment = newPaymentAmount > 0;
        
        console.log('[Invoice Update] Transaction check:', {
          dataStatus: data.status,
          updateDataStatus: updateData.status,
          wasNotPaid,
          statusChangingToPaid,
          hasNewPayment,
          newPaymentAmount,
          total
        });
        
        // Create transaction if there's a new payment (partial or full)
        if (hasNewPayment && newPaymentAmount > 0) {
          try {
            // Get client name for description
            const client = await db.getClientById(invoice.client_id, ctx.user.id);
            const clientName = client?.name || 'Cliente';
            
            // Use the new payment amount (could be partial or full)
            const transactionAmount = newPaymentAmount;
            const isPartial = paid < total;
            const description = isPartial 
              ? `Abono factura ${invoice.invoice_number} - ${clientName}`
              : `Pago de factura ${invoice.invoice_number} - ${clientName}`;
            
            console.log('[Invoice Update] Creating transaction with amount:', transactionAmount, 'isPartial:', isPartial);
            
            await db.createTransaction({
              type: 'income',
              category: 'freelance',
              amount: transactionAmount.toFixed(2),
              description,
              date: new Date(),
              user_id: ctx.user.id,
              created_at: new Date(),
            });
            console.log(`[Invoice Update] Created finance transaction for invoice ${invoice.invoice_number}: $${transactionAmount.toFixed(2)}`);
          } catch (transactionError: any) {
            console.error('[Invoice Update] Error creating finance transaction:', transactionError?.message || transactionError);
            // Don't throw - invoice was already updated successfully
          }
        } else {
          console.log('[Invoice Update] Skipping transaction creation - no new payment');
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteInvoice(input.id, ctx.user.id);
        return { success: true };
      }),

    generatePDF: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { generateInvoicePDF } = await import('./_core/pdf');
          
          // Get invoice with client data
          const invoice = await db.getInvoiceById(input.id, ctx.user.id);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          
          const client = await db.getClientById(invoice.client_id, ctx.user.id);
          if (!client) {
            throw new Error('Client not found');
          }
          
          // Get company profile
          const companyProfile = await db.getCompanyProfile(ctx.user.id);
          
          // Prepare invoice data for PDF
          const invoiceData = {
            ...invoice,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone,
            companyName: client.company || undefined,
            items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
            companyProfile: companyProfile || undefined,
          };
          
          // Generate PDF
          const pdfBase64 = await generateInvoicePDF(invoiceData);
          
          return { success: true, pdf: pdfBase64 };
        } catch (error: any) {
          throw new Error(error.message || 'Failed to generate PDF');
        }
      }),

    sendByEmail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { generateInvoicePDF } = await import('./_core/pdf');
          const { sendEmail } = await import('./_core/email');
          
          // Get invoice with client data
          const invoice = await db.getInvoiceById(input.id, ctx.user.id);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          
          const client = await db.getClientById(invoice.client_id, ctx.user.id);
          if (!client) {
            throw new Error('Client not found');
          }
          
          // Get company profile
          const companyProfile = await db.getCompanyProfile(ctx.user.id);
          
          // Prepare invoice data for PDF
          const invoiceData = {
            ...invoice,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone,
            companyName: client.company || undefined,
            items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
            companyProfile: companyProfile || undefined,
          };
          
          // Generate PDF
          console.log('[Invoice] Generating PDF for invoice:', invoice.invoice_number);
          const pdfBase64 = await generateInvoicePDF(invoiceData);
          console.log('[Invoice] PDF generated successfully, size:', pdfBase64.length, 'chars');
          console.log('[Invoice] Sending email to:', client.email);
          
          // Send email with PDF attachment
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Factura - Finwrk</h1>
    </div>
    <div class="content">
      <h2>Hola ${client.name},</h2>
      <p>Adjunto encontrarás la factura <strong>${invoice.invoice_number}</strong>.</p>
      <p><strong>Total:</strong> ${invoice.currency} ${parseFloat(invoice.total as any).toFixed(2)}</p>
      <p><strong>Fecha de emisión:</strong> ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}</p>
      <p><strong>Fecha de vencimiento:</strong> ${new Date(invoice.due_date).toLocaleDateString('es-ES')}</p>
      ${invoice.payment_token ? `
      <div style="margin: 30px 0; padding: 20px; background: #fff; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 15px 0; color: #000;">Ver Factura y Subir Comprobante</h3>
        <p style="margin: 0 0 20px 0; color: #666;">Haz clic en el botón para ver los detalles de tu factura y subir tu comprobante de pago.</p>
        <a href="${process.env.APP_URL || 'https://finwrk.app'}/invoice/${invoice.payment_token}" class="button">
          Ver Factura
        </a>
      </div>
      ` : ''}
      <p>Gracias por tu preferencia.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Finwrk. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
          `;
          
          const emailSent = await sendEmail({
            to: client.email,
            subject: `Factura ${invoice.invoice_number} - Finwrk`,
            html: emailHtml,
            attachments: [{
              filename: `factura-${invoice.invoice_number}.pdf`,
              content: pdfBase64,
              encoding: 'base64',
            }],
          });
          
          if (!emailSent) {
            console.error('[Invoice] Email send failed for invoice:', invoice.invoice_number);
            console.error('[Invoice] Client email:', client.email);
            throw new Error('No se pudo enviar el email. Verifica que RESEND_API_KEY esté configurado y el dominio verificado en Resend.');
          }
          
          // Update invoice status to 'sent' after successful email
          await db.updateInvoice(input.id, ctx.user.id, { status: 'sent' });
          
          return { success: true, message: 'Invoice sent successfully' };
        } catch (error: any) {
          throw new Error(error.message || 'Failed to send invoice');
        }
      }),
      
    // Public endpoint to get invoice by payment token
    getByPaymentToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceByPaymentToken(input.token);
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        // Get client info
        const client = await db.getClientById(invoice.client_id, invoice.user_id);
        
        return {
          ...invoice,
          clientName: client?.name,
          clientEmail: client?.email,
          items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
        };
      }),
      
    // Public endpoint to create Stripe payment intent
    createPaymentIntent: publicProcedure
      .input(z.object({ 
        token: z.string(),
        amount: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const stripe = await import('stripe');
          const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2024-12-18.acacia',
          });
          
          // Get invoice
          const invoice = await db.getInvoiceByPaymentToken(input.token);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          
          // Create payment intent
          const paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(input.amount * 100), // Convert to cents
            currency: invoice.currency.toLowerCase(),
            metadata: {
              invoice_id: invoice.id.toString(),
              payment_token: input.token,
            },
          });
          
          // Store payment intent ID
          await db.updateInvoice(invoice.id, invoice.user_id, {
            stripe_payment_intent_id: paymentIntent.id,
          });
          
          return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          };
        } catch (error: any) {
          throw new Error(error.message || 'Failed to create payment intent');
        }
      }),
      
    // Public endpoint to upload payment proof
    uploadPaymentProof: publicProcedure
      .input(z.object({
        token: z.string(),
        proof: z.string(), // base64 encoded file
        comment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Get invoice
          const invoice = await db.getInvoiceByPaymentToken(input.token);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          
          console.log('[uploadPaymentProof] Processing payment proof:', {
            invoice_id: invoice.id,
            user_id: invoice.user_id,
            proof_length: input.proof?.length || 0,
            current_status: invoice.status,
            new_status: 'payment_sent'
          });
          
          // Update invoice status to payment_sent (without saving the proof)
          await db.updateInvoiceStatus(invoice.id, invoice.user_id, 'payment_sent');
          console.log('[uploadPaymentProof] Status updated to payment_sent for invoice:', invoice.id);
          
          // Send notification email to user with proof attached
          try {
            const { sendEmail } = await import('./_core/email');
            const { getPaymentProofNotificationTemplate } = await import('./_core/email-payment-proof');
            
            // Get user and client data
            const user = await db.getUserById(invoice.user_id);
            const client = await db.getClientById(invoice.client_id, invoice.user_id);
            
            if (user && client) {
              const dashboardLink = `${process.env.APP_URL || 'http://localhost:3000'}/invoices`;
              const emailHtml = getPaymentProofNotificationTemplate(
                user.name,
                invoice.invoice_number,
                client.name,
                invoice.total.toString(),
                invoice.currency || 'USD',
                dashboardLink
              );
              
              // Extract base64 content and detect file type
              let base64Content = input.proof;
              let contentType = 'image/jpeg';
              let extension = 'jpg';
              
              if (input.proof.includes('base64,')) {
                const parts = input.proof.split('base64,');
                base64Content = parts[1];
                
                // Detect content type from data URL
                const mimeMatch = parts[0].match(/data:([^;]+)/);
                if (mimeMatch) {
                  contentType = mimeMatch[1];
                  // Map content type to extension
                  if (contentType.includes('png')) extension = 'png';
                  else if (contentType.includes('pdf')) extension = 'pdf';
                  else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
                }
              }
              
              // Send email with proof as attachment and inline
              await sendEmail({
                to: user.email,
                subject: `Comprobante de Pago Recibido - Factura ${invoice.invoice_number}`,
                html: emailHtml,
                attachments: [{
                  filename: `comprobante-${invoice.invoice_number}.${extension}`,
                  content: base64Content,
                  contentType: contentType,
                  contentId: 'payment-proof', // For inline display with cid:payment-proof
                }],
              });
              
              console.log('[uploadPaymentProof] Email sent successfully to:', user.email);
            }
          } catch (emailError) {
            console.error('[Invoice] Error sending payment proof notification:', emailError);
            // Don't throw - status was already updated, email is secondary
            console.log('[uploadPaymentProof] Status updated but email failed');
          }
          
          return { success: true, message: 'Payment proof uploaded and email sent' };
        } catch (error: any) {
          throw new Error(error.message || 'Failed to upload payment proof');
        }
      }),

    // Public endpoint to get invoice by token
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getInvoiceByPaymentToken, getClientById, getCompanyProfile } = await import("./db");
        const invoice = await getInvoiceByPaymentToken(input.token);
        
        if (!invoice) {
          throw new Error('Invoice not found');
        }

        // Get client info
        const client = await getClientById(invoice.client_id, invoice.user_id);
        
        // Get company profile
        const companyProfile = await getCompanyProfile(invoice.user_id);
        
        return {
          ...invoice,
          clientName: client?.name || 'Unknown',
          clientEmail: client?.email || '',
          clientPhone: client?.phone,
          companyName: client?.company,
          companyProfile: companyProfile || undefined,
        };
      }),
      
    // Public endpoint to confirm payment
    confirmPayment: publicProcedure
      .input(z.object({ 
        token: z.string(),
        paymentIntentId: z.string(),
        amount: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const stripe = await import('stripe');
          const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2024-12-18.acacia',
          });
          
          // Verify payment intent
          const paymentIntent = await stripeClient.paymentIntents.retrieve(input.paymentIntentId);
          
          if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment not completed');
          }
          
          // Get invoice
          const invoice = await db.getInvoiceByPaymentToken(input.token);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          
          // Update invoice with payment
          const currentPaid = parseFloat(invoice.paid_amount || '0');
          const newPaid = currentPaid + input.amount;
          const total = parseFloat(invoice.total);
          const balance = (total - newPaid).toFixed(2);
          
          await db.updateInvoice(invoice.id, invoice.user_id, {
            paid_amount: newPaid.toFixed(2),
            balance: balance,
            status: newPaid >= total ? 'paid' : invoice.status,
            payment_method: 'stripe',
            updated_at: new Date(),
          });
          
          // Create finance transaction for Stripe payment
          try {
            const client = await db.getClientById(invoice.client_id, invoice.user_id);
            const clientName = client?.name || 'Cliente';
            
            await db.createTransaction({
              type: 'income',
              category: 'freelance', // Using valid enum value - represents invoice payment
              amount: input.amount.toFixed(2),
              description: `Pago Stripe de factura ${invoice.invoice_number} - ${clientName}`,
              date: new Date(),
              user_id: invoice.user_id,
              created_at: new Date(),
            });
            console.log(`[Stripe Payment] Created finance transaction for invoice ${invoice.invoice_number}: $${input.amount.toFixed(2)}`);
          } catch (transactionError) {
            console.error('[Stripe Payment] Error creating finance transaction:', transactionError);
          }
          
          return { success: true, message: 'Payment confirmed' };
        } catch (error: any) {
          throw new Error(error.message || 'Failed to confirm payment');
        }
      }),
    
    // Get recurring invoice history
    getRecurringHistory: protectedProcedure
      .input(z.object({ parentInvoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getRecurringInvoiceHistory(input.parentInvoiceId, ctx.user.id);
      }),
    
    // Stop recurring invoice
    stopRecurring: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.stopRecurringInvoice(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Transactions router - CRUD operations for transactions
   */
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTransactionsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTransactionById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        category: z.string(),
        amount: z.string(),
        description: z.string(),
        date: z.string(),
        client_id: z.number().optional(),
        invoiceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTransaction({
          ...input,
          date: new Date(input.date),
          user_id: ctx.user.id,
          created_at: new Date(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["income", "expense"]).optional(),
        category: z.string().optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        client_id: z.number().optional(),
        invoiceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updated_at: new Date() };
        if (data.date) {
          updateData.date = new Date(data.date);
        }
        await db.updateTransaction(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),
    
    // Void a transaction - marks as voided and creates reversing entry
    void: protectedProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get and void the original transaction
        const transaction = await db.voidTransaction(input.id, ctx.user.id, input.reason || 'Anulación manual');
        
        if (!transaction) {
          throw new Error('Transacción no encontrada');
        }
        
        // Create reversing entry (opposite type)
        const reversingType = transaction.type === 'income' ? 'expense' : 'income';
        await db.createTransaction({
          type: reversingType,
          category: transaction.category,
          amount: transaction.amount,
          description: `[ANULACIÓN] ${transaction.description}`,
          date: new Date(),
          user_id: ctx.user.id,
          created_at: new Date(),
        });
        
        // If linked to an invoice, update invoice status to cancelled
        if (transaction.invoice_id) {
          try {
            await db.updateInvoice(transaction.invoice_id, ctx.user.id, {
              status: 'cancelled',
              updated_at: new Date(),
            });
          } catch (e) {
            console.log('Could not update invoice status:', e);
          }
        }
        
        return { success: true };
      }),

  }),

  /**
   * Support router - Support tickets and messages
   */
  support: router({
    // Create a new support ticket
    createTicket: protectedProcedure
      .input(z.object({
        subject: z.string().min(5, "Subject must be at least 5 characters"),
        message: z.string().min(10, "Message must be at least 10 characters"),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create ticket
        const ticket = await db.createSupportTicket({
          user_id: ctx.user.id,
          subject: input.subject,
          priority: input.priority,
        });

        const ticket_id = ticket.id;

        // Add first message
        await db.createSupportMessage({
          ticket_id,
          user_id: ctx.user.id,
          message: input.message,
          is_staff: false,
        });

        return { success: true, ticket_id };
      }),

    // Get user's tickets
    myTickets: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSupportTicketsByUserId(ctx.user.id);
    }),

    // Get ticket details with messages
    getTicket: protectedProcedure
      .input(z.object({ ticket_id: z.number() }))
      .query(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.ticket_id);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Verify ownership (users can only see their own tickets)
        if (ticket.user_id !== ctx.user.id && ctx.user.role !== 'super_admin') {
          throw new Error("Access denied");
        }

        const messages = await db.getSupportMessagesByTicketId(input.ticket_id);
        return { ticket, messages };
      }),

    // Add message to ticket
    addMessage: protectedProcedure
      .input(z.object({
        ticket_id: z.number(),
        message: z.string().min(1, "Message cannot be empty"),
      }))
      .mutation(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.ticket_id);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Verify ownership
        if (ticket.user_id !== ctx.user.id && ctx.user.role !== 'super_admin') {
          throw new Error("Access denied");
        }

        const is_staff = ctx.user.role === 'super_admin';

        await db.createSupportMessage({
          ticket_id: input.ticket_id,
          user_id: ctx.user.id,
          message: input.message,
          is_staff,
        });

        // If admin replied, update status to in_progress
        if (is_staff && ticket.status === 'open') {
          await db.updateSupportTicketStatus(input.ticket_id, 'in_progress');
        }

        return { success: true };
      }),
  }),

  /**
   * Admin router - Super admin only operations
   */
  admin: router({
    // Get all users
    getAllUsers: superAdminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    // Get all support tickets
    getAllTickets: superAdminProcedure.query(async () => {
      return await db.getAllSupportTickets();
    }),

    // Update ticket status
    updateTicketStatus: superAdminProcedure
      .input(z.object({
        ticket_id: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateSupportTicketStatus(input.ticket_id, input.status);
        return { success: true };
      }),

    // Grant lifetime access to user
    grantLifetimeAccess: superAdminProcedure
      .input(z.object({
        user_id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserLifetimeAccess(input.user_id, true);
        return { success: true };
      }),

    // Revoke lifetime access from user
    revokeLifetimeAccess: superAdminProcedure
      .input(z.object({
        user_id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserLifetimeAccess(input.user_id, false);
        return { success: true };
      }),
  }),

  /**
   * Savings Goals router - CRUD operations for savings goals
   */
  savingsGoals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavingsGoalsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getSavingsGoalById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        target_amount: z.string(),
        current_amount: z.string().optional(),
        target_date: z.string(),
        status: z.enum(["active", "completed", "cancelled"]).default("active"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createSavingsGoal({
          name: input.name,
          target_amount: input.target_amount,
          current_amount: input.current_amount || "0",
          target_date: new Date(input.target_date),
          status: input.status,
          user_id: ctx.user.id,
        });
        return { success: true, id: result.id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        target_amount: z.string().optional(),
        current_amount: z.string().optional(),
        target_date: z.string().optional(),
        status: z.enum(["active", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.target_date) {
          updateData.target_date = new Date(data.target_date);
        }
        await db.updateSavingsGoal(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSavingsGoal(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Markets router - Market favorites and dashboard widget
   */
  markets: router({
    // Get user's favorite assets
    getFavorites: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMarketFavoritesByUserId(ctx.user.id);
    }),

    // Get dashboard widget assets
    getDashboardWidgets: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDashboardWidgets(ctx.user.id);
    }),

    // Add to favorites
    addFavorite: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        type: z.enum(['crypto', 'stock', 'forex', 'commodity']),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addMarketFavorite({
          user_id: ctx.user.id,
          symbol: input.symbol,
          type: input.type,
        });
        return { success: true };
      }),

    // Remove from favorites
    removeFavorite: protectedProcedure
      .input(z.object({
        symbol: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.removeMarketFavorite(ctx.user.id, input.symbol);
        return { success: true };
      }),

    // Toggle dashboard widget
    toggleDashboardWidget: protectedProcedure
      .input(z.object({
        symbol: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.toggleDashboardWidget(ctx.user.id, input.symbol);
      }),
  }),

  /**
   * Price Alerts router - Manage user price alerts
   */
  priceAlerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getPriceAlertsByUserId } = await import("./db");
      return await getPriceAlertsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        type: z.enum(["crypto", "stock", "forex", "commodity"]),
        target_price: z.number(),
        condition: z.enum(["above", "below"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createPriceAlert } = await import("./db");
        return await createPriceAlert({
          ...input,
          user_id: ctx.user.id,
          target_price: input.target_price.toString(), // Store as string for decimal precision
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deletePriceAlert } = await import("./db");
        await deletePriceAlert(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Dashboard Widgets Router
   */
  dashboardWidgets: router({
    // Get user's dashboard widgets
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserDashboardWidgets } = await import("./db");
      return await getUserDashboardWidgets(ctx.user.id);
    }),

    // Add a widget
    add: protectedProcedure
      .input(z.object({
        widget_type: z.string(),
        widget_data: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { addDashboardWidget } = await import("./db");
        return await addDashboardWidget({
          user_id: ctx.user.id,
          widget_type: input.widget_type,
          widget_data: input.widget_data,
        });
      }),

    // Remove a widget
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { removeDashboardWidget } = await import("./db");
        return await removeDashboardWidget(ctx.user.id, input.id);
      }),

    // Update widgets order
    updateOrder: protectedProcedure
      .input(z.object({ widgetIds: z.array(z.union([z.number(), z.string()])) }))
      .mutation(async ({ ctx, input }) => {
        const { updateDashboardWidgetsOrder } = await import("./db");
        return await updateDashboardWidgetsOrder(ctx.user.id, input.widgetIds);
      }),
  }),

  // Subscription management
  subscription: router({
    // Get current subscription info
    current: protectedProcedure.query(async ({ ctx }) => {
      const { PLANS, getPlanById } = await import("./plans");
      const plan = getPlanById(ctx.user.subscription_plan as any);
      return {
        plan: ctx.user.subscription_plan,
        status: ctx.user.subscription_status,
        endsAt: ctx.user.subscription_ends_at,
        stripeCustomerId: ctx.user.stripe_customer_id,
        stripeSubscriptionId: ctx.user.stripe_subscription_id,
        planDetails: plan,
      };
    }),

    // Create Stripe checkout session for upgrade
    createCheckoutSession: protectedProcedure
      .input(z.object({
        planId: z.enum(["pro", "business"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
        const { getPlanById } = await import("./plans");
        const plan = getPlanById(input.planId);

        // Create or get Stripe customer
        let customerId = ctx.user.stripe_customer_id;
        if (!customerId) {
          const customer = await stripeClient.customers.create({
            email: ctx.user.email,
            name: ctx.user.name,
            metadata: {
              user_id: ctx.user.id.toString(),
            },
          });
          customerId = customer.id;

          // Save customer ID
          const { updateUser } = await import("./db");
          await stripeClient.customers.update(customerId, {
            metadata: { user_id: ctx.user.id.toString() },
          });
        }

        // Create checkout session
        const session = await stripeClient.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: plan.stripePriceId,
              quantity: 1,
            },
          ],
          success_url: `${process.env.APP_URL}/dashboard?upgrade=success`,
          cancel_url: `${process.env.APP_URL}/dashboard?upgrade=cancelled`,
          metadata: {
            user_id: ctx.user.id.toString(),
            plan_id: input.planId,
          },
        });

        return { sessionId: session.id, url: session.url };
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripe_subscription_id) {
        throw new Error("No active subscription found");
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

      // Cancel at period end
      await stripeClient.subscriptions.update(ctx.user.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return { success: true };
    }),
   }),

  // Company Profile Management
  companyProfile: router({
    // Get user's company profile
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getCompanyProfile(ctx.user.id);
      return profile;
    }),

    // Create or update company profile
    upsert: protectedProcedure
      .input(z.object({
        company_name: z.string().min(1, "Company name is required"),
        logo_url: z.string().optional(),
        email: z.string().email("Invalid email"),
        phone: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postal_code: z.string().optional(),
        country: z.string().optional(),
        tax_id: z.string().optional(),
        bank_name: z.string().optional(),
        bank_account: z.string().optional(),
        bank_routing: z.string().optional(),
        payment_instructions: z.string().optional(),
        invoice_footer: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.upsertCompanyProfile(ctx.user.id, input);
        return profile;
      }),

    // Upload logo
    uploadLogo: protectedProcedure
      .input(z.object({
        logo: z.string(), // base64 encoded image
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement S3 upload or save to public folder
        // For now, we'll save base64 directly
        const profile = await db.updateCompanyProfileLogo(ctx.user.id, input.logo);
        return profile;
      }),
  }),

  // Custom Reminders Management
  reminders: router({
    // List all reminders for the user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRemindersByUserId(ctx.user.id);
    }),

    // Get a single reminder
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const reminder = await db.getReminderById(input.id, ctx.user.id);
        if (!reminder) {
          throw new Error("Reminder not found");
        }
        return reminder;
      }),

    // Create a new reminder
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        reminder_date: z.string(), // ISO date string
        reminder_time: z.string().optional(),
        category: z.enum(["payment", "meeting", "deadline", "personal", "other"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        notify_email: z.boolean().optional(),
        notify_days_before: z.number().optional(),
        related_client_id: z.number().optional(),
        related_invoice_id: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reminder = await db.createReminder({
          user_id: ctx.user.id,
          title: input.title,
          description: input.description,
          reminder_date: new Date(input.reminder_date),
          reminder_time: input.reminder_time,
          category: input.category,
          priority: input.priority,
          notify_email: input.notify_email,
          notify_days_before: input.notify_days_before,
          related_client_id: input.related_client_id,
          related_invoice_id: input.related_invoice_id,
        });

        // Schedule email notification if enabled
        if (input.notify_email !== false) {
          const { scheduleReminder } = await import("./queues/reminder-queue");
          
          // Calculate when to send notification
          const reminderDate = new Date(input.reminder_date);
          if (input.reminder_time) {
            const [hours, minutes] = input.reminder_time.split(':');
            reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          } else {
            reminderDate.setHours(9, 0, 0, 0); // Default to 9 AM
          }
          
          // Subtract notify_days_before
          const daysBefore = input.notify_days_before || 0;
          const sendAt = new Date(reminderDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));
          
          await scheduleReminder({
            reminderId: reminder.id,
            userId: ctx.user.id,
            title: input.title,
            description: input.description || null,
            reminderDate: input.reminder_date,
            reminderTime: input.reminder_time || null,
            priority: input.priority || 'medium',
            category: input.category || 'other',
          }, sendAt);
        }

        return reminder;
      }),

    // Update a reminder
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        reminder_date: z.string().optional(),
        reminder_time: z.string().optional(),
        category: z.enum(["payment", "meeting", "deadline", "personal", "other"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
        notify_email: z.boolean().optional(),
        notify_days_before: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const reminder = await db.updateReminder(id, ctx.user.id, {
          ...data,
          reminder_date: data.reminder_date ? new Date(data.reminder_date) : undefined,
        });

        // Reschedule if date/time changed and email notification is enabled
        if ((data.reminder_date || data.reminder_time) && data.notify_email !== false) {
          const { rescheduleReminder } = await import("./queues/reminder-queue");
          const fullReminder = await db.getReminderById(id, ctx.user.id);
          
          if (fullReminder && fullReminder.notify_email === 1) {
            const reminderDate = new Date(fullReminder.reminder_date);
            if (fullReminder.reminder_time) {
              const [hours, minutes] = fullReminder.reminder_time.split(':');
              reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            } else {
              reminderDate.setHours(9, 0, 0, 0);
            }
            
            const daysBefore = fullReminder.notify_days_before || 0;
            const sendAt = new Date(reminderDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));
            
            await rescheduleReminder({
              reminderId: fullReminder.id,
              userId: ctx.user.id,
              title: fullReminder.title,
              description: fullReminder.description,
              reminderDate: fullReminder.reminder_date.toISOString(),
              reminderTime: fullReminder.reminder_time,
              priority: fullReminder.priority,
              category: fullReminder.category,
            }, sendAt);
          }
        }

        return reminder;
      }),

    // Delete a reminder
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Cancel scheduled job if exists
        const { cancelReminder } = await import("./queues/reminder-queue");
        await cancelReminder(input.id);
        
        return await db.deleteReminder(input.id, ctx.user.id);
      }),

    // Mark as completed
    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateReminder(input.id, ctx.user.id, { status: "completed" });
      }),

    // Export to calendar (generate .ics file content)
    exportCalendar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const reminder = await db.getReminderById(input.id, ctx.user.id);
        if (!reminder) {
          throw new Error("Reminder not found");
        }

        // Generate ICS content
        const startDate = new Date(reminder.reminder_date);
        if (reminder.reminder_time) {
          const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
          startDate.setHours(hours, minutes, 0, 0);
        }
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

        const formatICSDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Finwrk//Reminders//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:${reminder.id}@finwrk.app`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${reminder.title}`,
          `DESCRIPTION:${reminder.description || ''}`,
          'BEGIN:VALARM',
          'TRIGGER:-P1D',
          'ACTION:DISPLAY',
          `DESCRIPTION:Recordatorio: ${reminder.title}`,
          'END:VALARM',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n');

        // Mark as exported
        await db.markReminderCalendarExported(input.id, ctx.user.id);

        return {
          filename: `reminder-${reminder.id}.ics`,
          content: icsContent,
        };
      }),

    // Send email notification
    sendEmailNotification: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const reminder = await db.getReminderById(input.id, ctx.user.id);
        if (!reminder) {
          throw new Error("Reminder not found");
        }

        const { sendEmail } = await import("./_core/email");
        const user = await db.getUserById(ctx.user.id);

        if (!user) {
          throw new Error("User not found");
        }

        const reminderDate = new Date(reminder.reminder_date);
        const formattedDate = reminderDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Recordatorio</h1>
            </div>
            <div style="padding: 30px; background: #1A1A1A; color: #F5F5F5;">
              <h2 style="color: #FF9500; margin-top: 0;">${reminder.title}</h2>
              ${reminder.description ? `<p style="color: #A0A0A0;">${reminder.description}</p>` : ''}
              <div style="background: #2A2A2A; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Fecha:</strong> ${formattedDate}</p>
                ${reminder.reminder_time ? `<p style="margin: 10px 0 0;"><strong>Hora:</strong> ${reminder.reminder_time}</p>` : ''}
              </div>
              <p style="color: #A0A0A0; font-size: 12px;">Este es un recordatorio automático de Finwrk.</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: `Recordatorio: ${reminder.title}`,
          html: emailHtml,
        });

        await db.markReminderEmailSent(input.id);

        return { success: true };
      }),

    // Trigger manual processing of reminders (for testing)
    triggerProcessing: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { triggerReminderProcessing } = await import("./cron/index");
        await triggerReminderProcessing();
        return { success: true, message: "Reminder processing triggered" };
      }),
  }),

  // Alerts router - Sistema de alertas robusto
  alerts: router({
    // Get all alerts for current user
    list: protectedProcedure
      .input(z.object({
        unreadOnly: z.boolean().optional(),
        type: z.enum(["info", "warning", "critical"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { alerts } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        
        const database = await getDb();
        const conditions = [eq(alerts.user_id, ctx.user!.id)];
        
        if (input?.unreadOnly) {
          conditions.push(eq(alerts.is_read, 0));
        }
        
        if (input?.type) {
          conditions.push(eq(alerts.type, input.type));
        }
        
        return await database
          .select()
          .from(alerts)
          .where(and(...conditions))
          .orderBy(desc(alerts.created_at));
      }),

    // Get unread count
    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { alerts } = await import("../drizzle/schema");
        const { eq, and, count } = await import("drizzle-orm");
        
        const database = await getDb();
        const result = await database
          .select({ count: count() })
          .from(alerts)
          .where(and(
            eq(alerts.user_id, ctx.user!.id),
            eq(alerts.is_read, 0)
          ));
        
        return result[0]?.count || 0;
      }),

    // Mark alert as read
    markAsRead: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { alerts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const database = await getDb();
        await database
          .update(alerts)
          .set({ is_read: 1, updated_at: new Date() })
          .where(and(
            eq(alerts.id, input.id),
            eq(alerts.user_id, ctx.user!.id)
          ));
        
        return { success: true };
      }),

    // Mark all alerts as read
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { alerts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const database = await getDb();
        await database
          .update(alerts)
          .set({ is_read: 1, updated_at: new Date() })
          .where(and(
            eq(alerts.user_id, ctx.user!.id),
            eq(alerts.is_read, 0)
          ));
        
        return { success: true };
      }),

    // Delete alert
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { alerts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const database = await getDb();
        await database
          .delete(alerts)
          .where(and(
            eq(alerts.id, input.id),
            eq(alerts.user_id, ctx.user!.id)
          ));
        
        return { success: true };
      }),

    // Create alert (internal use)
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["info", "warning", "critical"]),
        event: z.string(),
        message: z.string(),
        persistent: z.boolean().default(true),
        shown_as_toast: z.boolean().default(false),
        action_url: z.string().optional(),
        action_text: z.string().optional(),
        required_plan: z.enum(["free", "pro", "business"]).optional(),
        related_id: z.number().optional(),
        related_type: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { alerts } = await import("../drizzle/schema");
        
        const database = await getDb();
        const result = await database.insert(alerts).values({
          user_id: ctx.user!.id,
          type: input.type,
          event: input.event,
          message: input.message,
          persistent: input.persistent ? 1 : 0,
          shown_as_toast: input.shown_as_toast ? 1 : 0,
          is_read: 0,
          action_url: input.action_url,
          action_text: input.action_text,
          required_plan: input.required_plan,
          related_id: input.related_id,
          related_type: input.related_type,
          created_at: new Date(),
          updated_at: new Date(),
        });
        
        return { success: true, id: result[0].insertId };
      }),
  }),
});
export type AppRouter = typeof appRouter;
