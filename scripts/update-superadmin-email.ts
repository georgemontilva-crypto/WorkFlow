/**
 * Migration Script: Update Super Admin Email
 * Changes super admin email to admin@finwrk.app
 */

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:LTctBojuWhrxYaLpkFHesSoFKiDfLwlf@crossover.proxy.rlwy.net:57415/railway";

async function updateSuperAdminEmail() {
  console.log("🔄 Starting super admin email update...");
  
  // Create database connection
  const pool = mysql.createPool({ uri: DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Find current super admin
    const superAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, "super_admin"));

    if (superAdmins.length === 0) {
      console.log("⚠️  No super admin found in database");
      console.log("Creating new super admin with email: admin@finwrk.app");
      
      // Create new super admin (you'll need to set a password manually or via reset)
      await db.insert(users).values({
        name: "Admin",
        email: "admin@finwrk.app",
        password_hash: "$2a$10$placeholder", // Placeholder - user must reset password
        email_verified: 1,
        login_method: "email",
        role: "super_admin",
        subscription_plan: "business",
        subscription_status: "active",
        has_lifetime_access: 1,
        trial_ends_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_signed_in: new Date(),
      });
      
      console.log("✅ Super admin created: admin@finwrk.app");
      console.log("⚠️  IMPORTANT: User must reset password via /forgot-password");
    } else {
      console.log(`📋 Found ${superAdmins.length} super admin(s):`);
      superAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (ID: ${admin.id})`);
      });

      // Update all super admins to the new email
      for (const admin of superAdmins) {
        if (admin.email === "admin@finwrk.app") {
          console.log(`✓ Super admin ${admin.id} already has correct email`);
          continue;
        }

        console.log(`🔄 Updating super admin ${admin.id}: ${admin.email} → admin@finwrk.app`);
        
        await db
          .update(users)
          .set({
            email: "admin@finwrk.app",
            updated_at: new Date(),
          })
          .where(eq(users.id, admin.id));

        console.log(`✅ Updated super admin ${admin.id}`);
      }
    }

    // Verify the change
    const updatedAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, "super_admin"));

    console.log("\n✅ Migration completed successfully!");
    console.log("📋 Current super admin(s):");
    updatedAdmins.forEach((admin) => {
      console.log(`   - ${admin.email} (ID: ${admin.id}, Name: ${admin.name})`);
    });

  } catch (error) {
    console.error("❌ Error updating super admin email:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
updateSuperAdminEmail()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });
