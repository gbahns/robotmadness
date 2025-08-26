import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// MongoDB connection string
const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

async function migrateUsers() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // First, let's see what collections are available
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Try common collection names for users
    const possibleCollections = ['users', 'accounts', 'players', 'user'];
    let usersCollection = null;
    let collectionName = '';
    
    for (const name of possibleCollections) {
      if (await db.collection(name).countDocuments() > 0) {
        usersCollection = db.collection(name);
        collectionName = name;
        console.log(`Found users in collection: ${name}`);
        break;
      }
    }
    
    if (!usersCollection) {
      // If no standard names, use the first non-empty collection
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        if (count > 0) {
          usersCollection = db.collection(col.name);
          collectionName = col.name;
          console.log(`Using collection: ${col.name} (${count} documents)`);
          break;
        }
      }
    }
    
    if (!usersCollection) {
      console.log('No user data found in MongoDB');
      return;
    }
    
    // Get sample document to see structure
    const sampleUser = await usersCollection.findOne();
    console.log('Sample user document structure:', sampleUser);
    
    // Fetch all users from MongoDB
    const mongoUsers = await usersCollection.find({}).toArray();
    console.log(`Found ${mongoUsers.length} users in MongoDB collection '${collectionName}'`);
    
    // Clear existing users in SQLite (optional - comment out if you want to append)
    console.log('Clearing existing users in SQLite...');
    await prisma.user.deleteMany();
    
    // Migrate each user
    let migrated = 0;
    let skipped = 0;
    
    for (const mongoUser of mongoUsers) {
      try {
        // Map MongoDB fields to Prisma schema based on actual structure
        const userData: any = {
          // Extract email from emails array
          email: mongoUser.emails?.[0]?.address || 
                 mongoUser.email || 
                 mongoUser.Email || 
                 mongoUser.mail || 
                 mongoUser.emailAddress ||
                 mongoUser.username || // fallback to username if no email
                 `user${migrated + 1}@migrated.local`, // generate if missing
          
          // Extract username from email or generate from email
          username: mongoUser.username || 
                    mongoUser.userName || 
                    mongoUser.profile?.name || 
                    mongoUser.emails?.[0]?.address?.split('@')[0] || // use email prefix
                    mongoUser.displayName ||
                    `user${migrated + 1}`, // generate if missing
          
          // Try to get name from profile or other fields
          name: mongoUser.profile?.name || 
                mongoUser.profile?.displayName || 
                mongoUser.name || 
                mongoUser.displayName || 
                mongoUser.fullName || 
                mongoUser.full_name ||
                null,
        };
        
        // If MongoDB uses _id, we might want to preserve it
        if (mongoUser._id && typeof mongoUser._id === 'string') {
          userData.id = mongoUser._id;
        }
        
        // Preserve timestamps if they exist
        if (mongoUser.createdAt) {
          userData.createdAt = new Date(mongoUser.createdAt);
        }
        if (mongoUser.updatedAt) {
          userData.updatedAt = new Date(mongoUser.updatedAt);
        }
        
        // Create user in SQLite
        await prisma.user.create({
          data: userData,
        });
        
        migrated++;
        console.log(`✓ Migrated user: ${userData.email} (${userData.username})`);
      } catch (error: any) {
        skipped++;
        console.log(`✗ Skipped user due to error:`, error.message);
        console.log('  User data:', mongoUser);
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`- Successfully migrated: ${migrated} users`);
    console.log(`- Skipped: ${skipped} users`);
    
    // Verify migration
    const sqliteUserCount = await prisma.user.count();
    console.log(`\nTotal users now in SQLite: ${sqliteUserCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

// Run the migration
migrateUsers().catch(console.error);