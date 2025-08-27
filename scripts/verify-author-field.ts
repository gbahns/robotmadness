import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// MongoDB connection - set MONGO_URI environment variable with connection string
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable not set!');
  console.error('Please set MONGO_URI with your MongoDB connection string');
  process.exit(1);
}

async function verifyAuthorField() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    const gamesCollection = db.collection('games');
    const usersCollection = db.collection('users');
    
    // Get all games
    const games = await gamesCollection.find({}).toArray();
    
    console.log('=== AUTHOR FIELD ANALYSIS ===');
    console.log(`Total games: ${games.length}`);
    
    // Check if userId and author match
    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches = [];
    
    for (const game of games) {
      if (game.userId && game.author) {
        // Find the user by ID
        const user = await usersCollection.findOne({ _id: game.userId });
        
        // Check if author matches any username field
        if (user) {
          // Check email prefix (username)
          const emailUsername = user.emails?.[0]?.address?.split('@')[0];
          
          if (game.author === emailUsername) {
            matchCount++;
          } else {
            mismatchCount++;
            mismatches.push({
              gameId: game._id,
              gameName: game.name,
              author: game.author,
              userId: game.userId,
              userEmail: user.emails?.[0]?.address,
              emailUsername: emailUsername
            });
          }
        }
      }
    }
    
    console.log(`\nMatches (author = email username): ${matchCount}`);
    console.log(`Mismatches: ${mismatchCount}`);
    
    if (mismatches.length > 0) {
      console.log('\n=== SAMPLE MISMATCHES ===');
      for (const mismatch of mismatches.slice(0, 5)) {
        console.log(`Game: "${mismatch.gameName}"`);
        console.log(`  author field: "${mismatch.author}"`);
        console.log(`  user email: "${mismatch.userEmail}"`);
        console.log(`  expected username: "${mismatch.emailUsername}"`);
      }
    }
    
    // Check author values distribution
    console.log('\n=== AUTHOR VALUES DISTRIBUTION ===');
    const authorCounts = new Map<string, number>();
    for (const game of games) {
      const count = authorCounts.get(game.author) || 0;
      authorCounts.set(game.author, count + 1);
    }
    
    const sortedAuthors = Array.from(authorCounts.entries()).sort((a, b) => b[1] - a[1]);
    for (const [author, count] of sortedAuthors) {
      console.log(`"${author}": ${count} games`);
    }
    
    // Check if we can map authors to SQLite users
    console.log('\n=== AUTHOR TO SQLITE USER MAPPING ===');
    const sqliteUsers = await prisma.user.findMany();
    const unmappedAuthors = [];
    
    for (const [author] of authorCounts) {
      const user = sqliteUsers.find(u => 
        u.username === author || 
        u.name === author ||
        u.username === author.replace(' ', '.') // Handle "marco bahns" -> "marco.bahns"
      );
      
      if (!user) {
        unmappedAuthors.push(author);
      } else {
        console.log(`✓ "${author}" → ${user.username} (${user.id})`);
      }
    }
    
    if (unmappedAuthors.length > 0) {
      console.log('\n=== UNMAPPED AUTHORS ===');
      console.log(unmappedAuthors);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

verifyAuthorField().catch(console.error);