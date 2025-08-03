import 'dotenv/config';
import { db } from './db.js';
import { users } from '@shared/schema';
import { hashPassword } from './auth.js';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Insert the admin user
    const result = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@orderflow.com',
      department: 'role_creator', // Admin with full access
      isActive: 'true'
    }).returning();
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Department: role_creator (Admin)');
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('Admin user already exists!');
    } else {
      console.error('Error creating admin user:', error);
    }
    process.exit(1);
  }
}

createAdminUser();
