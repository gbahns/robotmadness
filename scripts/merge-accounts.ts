import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeAccounts() {
  const mainEmail = 'greg@bahns.com';
  const googleEmail = 'gbahns@gmail.com';
  
  try {
    console.log('🔍 Finding accounts...\n');
    
    // Find both user accounts
    const mainUser = await prisma.user.findUnique({
      where: { email: mainEmail },
      include: {
        accounts: true,
        sessions: true,
        hostedGames: true,
        wonGames: true,
        gamesPlayed: true
      }
    });
    
    const googleUser = await prisma.user.findUnique({
      where: { email: googleEmail },
      include: {
        accounts: true,
        sessions: true,
        hostedGames: true,
        wonGames: true,
        gamesPlayed: true
      }
    });
    
    if (!mainUser) {
      console.error(`❌ Main user not found: ${mainEmail}`);
      return;
    }
    
    if (!googleUser) {
      console.error(`❌ Google user not found: ${googleEmail}`);
      return;
    }
    
    console.log('✅ Found both accounts:');
    console.log(`\n📧 Main Account (${mainEmail}):`);
    console.log(`  - ID: ${mainUser.id}`);
    console.log(`  - Username: ${mainUser.username}`);
    console.log(`  - Has Password: ${!!mainUser.password}`);
    console.log(`  - OAuth Accounts: ${mainUser.accounts.map(a => a.provider).join(', ') || 'none'}`);
    console.log(`  - Games Hosted: ${mainUser.hostedGames.length}`);
    console.log(`  - Games Won: ${mainUser.wonGames.length}`);
    console.log(`  - Games Played: ${mainUser.gamesPlayed.length}`);
    
    console.log(`\n📧 Google Account (${googleEmail}):`);
    console.log(`  - ID: ${googleUser.id}`);
    console.log(`  - Username: ${googleUser.username}`);
    console.log(`  - Has Password: ${!!googleUser.password}`);
    console.log(`  - OAuth Accounts: ${googleUser.accounts.map(a => a.provider).join(', ') || 'none'}`);
    console.log(`  - Games Hosted: ${googleUser.hostedGames.length}`);
    console.log(`  - Games Won: ${googleUser.wonGames.length}`);
    console.log(`  - Games Played: ${googleUser.gamesPlayed.length}`);
    
    // Ask for confirmation
    console.log('\n⚠️  This will:');
    console.log(`  1. Move Google OAuth account to main user (${mainEmail})`);
    console.log(`  2. Transfer any games from Google account to main account`);
    console.log(`  3. Delete the Google user account`);
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔄 Starting merge process...\n');
    
    // Step 1: Move OAuth accounts from Google user to main user
    if (googleUser.accounts.length > 0) {
      console.log('📎 Moving OAuth accounts...');
      const updated = await prisma.account.updateMany({
        where: { userId: googleUser.id },
        data: { userId: mainUser.id }
      });
      console.log(`  ✅ Moved ${updated.count} OAuth account(s)`);
    }
    
    // Step 2: Transfer games hosted by Google user
    if (googleUser.hostedGames.length > 0) {
      console.log('🎮 Transferring hosted games...');
      const updated = await prisma.game.updateMany({
        where: { hostId: googleUser.id },
        data: { hostId: mainUser.id }
      });
      console.log(`  ✅ Transferred ${updated.count} hosted game(s)`);
    }
    
    // Step 3: Transfer games won by Google user
    if (googleUser.wonGames.length > 0) {
      console.log('🏆 Transferring won games...');
      const updated = await prisma.game.updateMany({
        where: { winnerId: googleUser.id },
        data: { winnerId: mainUser.id }
      });
      console.log(`  ✅ Transferred ${updated.count} won game(s)`);
    }
    
    // Step 4: Transfer game participations
    if (googleUser.gamesPlayed.length > 0) {
      console.log('🎯 Transferring game participations...');
      const updated = await prisma.gamePlayer.updateMany({
        where: { userId: googleUser.id },
        data: { userId: mainUser.id }
      });
      console.log(`  ✅ Transferred ${updated.count} game participation(s)`);
    }
    
    // Step 5: Delete sessions for Google user
    if (googleUser.sessions.length > 0) {
      console.log('🔑 Cleaning up sessions...');
      const deleted = await prisma.session.deleteMany({
        where: { userId: googleUser.id }
      });
      console.log(`  ✅ Deleted ${deleted.count} session(s)`);
    }
    
    // Step 6: Delete the Google user account
    console.log('🗑️  Deleting duplicate Google account...');
    await prisma.user.delete({
      where: { id: googleUser.id }
    });
    console.log('  ✅ Deleted Google user account');
    
    // Verify the merge
    console.log('\n✨ Merge complete! Verifying...\n');
    
    const mergedUser = await prisma.user.findUnique({
      where: { email: mainEmail },
      include: {
        accounts: true,
        hostedGames: true,
        wonGames: true,
        gamesPlayed: true
      }
    });
    
    if (mergedUser) {
      console.log(`📧 Merged Account (${mainEmail}):`);
      console.log(`  - ID: ${mergedUser.id}`);
      console.log(`  - Username: ${mergedUser.username}`);
      console.log(`  - OAuth Accounts: ${mergedUser.accounts.map(a => a.provider).join(', ') || 'none'}`);
      console.log(`  - Games Hosted: ${mergedUser.hostedGames.length}`);
      console.log(`  - Games Won: ${mergedUser.wonGames.length}`);
      console.log(`  - Games Played: ${mergedUser.gamesPlayed.length}`);
      
      console.log('\n🎉 Success! You can now:');
      console.log(`  - Sign in with email/password (${mainEmail})`);
      console.log(`  - Sign in with Google (${googleEmail})`);
      console.log('  Both will access the same account!');
    }
    
  } catch (error) {
    console.error('❌ Error merging accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the merge
mergeAccounts().catch(console.error);