import 'dotenv/config';
import { db } from './db.js';
import { users } from '@shared/schema';
import { hashPassword } from './auth.js';
import { eq } from 'drizzle-orm';

async function resetUserPassword() {
  try {
    const username = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!username || !newPassword) {
      console.error('Usage: npx tsx server/reset-user-password.ts <username> <newPassword>');
      process.exit(1);
    }
    
    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!user) {
      console.error(`User "${username}" not found!`);
      process.exit(1);
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));
    
    console.log(`Password for user "${username}" has been reset successfully!`);
    console.log(`Username: ${username}`);
    console.log(`New Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetUserPassword();
