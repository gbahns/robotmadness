#!/usr/bin/env tsx
/**
 * Script to grant admin privileges to a user
 * Usage: npx tsx scripts/make-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        isAdmin: true
      }
    });

    console.log('✅ Successfully granted admin privileges to:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Admin: ${user.isAdmin}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) {
      console.error('❌ User not found with email:', email);
    } else {
      console.error('❌ Failed to update user:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email>');
  console.error('Example: npx tsx scripts/make-admin.ts user@example.com');
  process.exit(1);
}

makeAdmin(email);