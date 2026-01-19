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
      .mutation(async ({ input, ctx }) => {
        try {
          const { createUser } = await import("./db");
          const { generateToken } = await import("./_core/auth");
          
          // Create user
          const user = await createUser({
            name: input.name,
            email: input.email,
            password: input.password,
          });

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
        phone: z.string(),
        company: z.string().optional(),
        billing_cycle: z.enum(["monthly", "quarterly", "yearly", "custom"]),
        custom_cycle_days: z.number().optional(),
        amount: z.string(),
        next_payment_date: z.string(),
        reminder_days: z.number().default(7),
        status: z.enum(["active", "inactive", "overdue"]).default("active"),
        archived: z.number().default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createClient({
          ...input,
          next_payment_date: new Date(input.next_payment_date),
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
        amount: z.string(),
        paid_amount: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled", "archived"]).default("pending"),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createInvoice({
          ...input,
          issue_date: new Date(input.issue_date),
          due_date: new Date(input.due_date),
          user_id: ctx.user.id,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return { success: true };
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
        status: z.enum(["pending", "paid", "overdue", "cancelled", "archived"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updated_at: new Date() };
        if (data.issue_date) {
          updateData.issue_date = new Date(data.issue_date);
        }
        if (data.due_date) {
          updateData.due_date = new Date(data.due_date);
        }
        await db.updateInvoice(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteInvoice(input.id, ctx.user.id);
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
        deadline: z.string(),
        status: z.enum(["active", "completed", "cancelled"]).default("active"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSavingsGoal({
          ...input,
          deadline: new Date(input.deadline),
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
        target_amount: z.string().optional(),
        current_amount: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["active", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updated_at: new Date() };
        if (data.deadline) {
          updateData.deadline = new Date(data.deadline);
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
});

export type AppRouter = typeof appRouter;
