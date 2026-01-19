import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createUser, getUserById, updateUser2FASecret, enable2FA, disable2FA, updateUserPassword } from './db';
import bcrypt from 'bcryptjs';

describe('2FA and Password Management', () => {
  let testUserId: number;
  const testEmail = `test-2fa-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Create a test user
    const user = await createUser({
      name: 'Test 2FA User',
      email: testEmail,
      password: testPassword,
    });
    testUserId = user.id;
  });

  it('should update 2FA secret for user', async () => {
    const testSecret = 'JBSWY3DPEHPK3PXP';
    
    await updateUser2FASecret(testUserId, testSecret);
    
    const user = await getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.two_factor_secret).toBe(testSecret);
    expect(user?.two_factor_enabled).toBe(0); // Not enabled yet
  });

  it('should enable 2FA for user', async () => {
    await enable2FA(testUserId);
    
    const user = await getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.two_factor_enabled).toBe(1);
  });

  it('should disable 2FA for user', async () => {
    await disable2FA(testUserId);
    
    const user = await getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.two_factor_enabled).toBe(0);
    expect(user?.two_factor_secret).toBeNull();
  });

  it('should update user password', async () => {
    const newPassword = 'NewPassword456!';
    const newHash = await bcrypt.hash(newPassword, 12);
    
    await updateUserPassword(testUserId, newHash);
    
    const user = await getUserById(testUserId);
    expect(user).toBeDefined();
    
    // Verify new password works
    const isValid = await bcrypt.compare(newPassword, user!.password_hash);
    expect(isValid).toBe(true);
    
    // Verify old password doesn't work
    const isOldValid = await bcrypt.compare(testPassword, user!.password_hash);
    expect(isOldValid).toBe(false);
  });

  it('should maintain 2FA state after password change', async () => {
    // Enable 2FA
    const testSecret = 'JBSWY3DPEHPK3PXP';
    await updateUser2FASecret(testUserId, testSecret);
    await enable2FA(testUserId);
    
    // Change password
    const newPassword = 'AnotherPassword789!';
    const newHash = await bcrypt.hash(newPassword, 12);
    await updateUserPassword(testUserId, newHash);
    
    // Verify 2FA is still enabled
    const user = await getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.two_factor_enabled).toBe(1);
    expect(user?.two_factor_secret).toBe(testSecret);
  });
});
