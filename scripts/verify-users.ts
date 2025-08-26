import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${users.length} users in SQLite database:\n`);
    
    // Display users in a table format
    console.log('ID'.padEnd(25) + 'Email'.padEnd(30) + 'Username'.padEnd(20) + 'Created');
    console.log('-'.repeat(95));
    
    for (const user of users) {
      console.log(
        (user.id.substring(0, 23) + '..').padEnd(25) +
        user.email.padEnd(30) +
        user.username.padEnd(20) +
        user.createdAt.toISOString().split('T')[0]
      );
    }
    
    console.log('\n' + '-'.repeat(95));
    console.log(`Total users: ${users.length}`);
    
    // Check for any duplicates
    const emailCounts = users.reduce((acc, user) => {
      acc[user.email] = (acc[user.email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicateEmails = Object.entries(emailCounts).filter(([, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      console.log('\nWarning: Found duplicate emails:', duplicateEmails);
    }
    
    const usernameCounts = users.reduce((acc, user) => {
      acc[user.username] = (acc[user.username] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicateUsernames = Object.entries(usernameCounts).filter(([, count]) => count > 1);
    if (duplicateUsernames.length > 0) {
      console.log('\nWarning: Found duplicate usernames:', duplicateUsernames);
    }
    
  } catch (error) {
    console.error('Error verifying users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers().catch(console.error);