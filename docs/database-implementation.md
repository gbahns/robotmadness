# Database Implementation Handoff Document

## Overview
This document contains the complete design decisions and implementation instructions for adding PostgreSQL database support to the RoboRally Next.js application. The database will store users, games, results, and support future features like chat, custom boards, and statistics.

## Design Decisions

### Core Purpose
The database serves to store **persistent data only**:
1. **Users** - Player accounts and authentication
2. **Games** - Game sessions and their metadata
3. **Results** - Final game outcomes and player rankings
4. **Future**: Chat history, custom boards/courses, statistics

### What NOT to Store
- Active game state (remains in server memory)
- Player cards (ephemeral, only during gameplay)
- Current positions/damage (only final results matter)
- Real-time game data (handled by Socket.io)

### Architecture Decision
- **Database**: PostgreSQL (not MongoDB)
- **ORM**: Prisma
- **Why**: Better for relational data, type safety with Prisma, ACID compliance, easier querying for leaderboards

## Implementation Instructions

### Step 1: Install Dependencies
```bash
npm install prisma @prisma/client
npm install -D @types/node
```

### Step 2: Create Prisma Schema
Create file `prisma/schema.prisma` with this exact content:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================================
// CORE FEATURES - Users, Games, Results
// =====================================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  name      String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  hostedGames   Game[]       @relation("HostedGames")
  gamesPlayed   GamePlayer[]
  wonGames      Game[]       @relation("WonGames")
  createdBoards Board[]
  createdCourses Course[]
  chatMessages   ChatMessage[]
  stats          UserStats?
}

model Game {
  id       String @id @default(uuid())
  roomCode String @unique @default(cuid())
  
  // Basic game info
  name      String?
  hostId    String?
  host      User?   @relation("HostedGames", fields: [hostId], references: [id])
  
  // Board/Course selection
  boardId   String?
  courseId  String?
  
  // Game settings
  maxPlayers Int     @default(8)
  isPrivate  Boolean @default(false)
  
  // Game lifecycle
  status     GameStatus @default(WAITING)
  startedAt  DateTime?
  endedAt    DateTime?
  
  // Results (populated when game ends)
  winnerId      String?
  winner        User?    @relation("WonGames", fields: [winnerId], references: [id])
  finalResults  Json?    // Array of {playerId, position, flags, finalDamage}
  totalDuration Int?     // Game duration in seconds
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  players      GamePlayer[]
  board        Board?       @relation(fields: [boardId], references: [id])
  course       Course?      @relation(fields: [courseId], references: [id])
  chatMessages ChatMessage[]
  
  @@index([roomCode])
  @@index([status])
  @@index([hostId])
}

model GamePlayer {
  id String @id @default(uuid())
  
  // Foreign keys
  gameId String
  game   Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  userId String
  user   User   @relation(fields: [userId], references: [id])
  
  // Player game info
  robotColor      String?
  startingDock    Int?     // 1-8
  joinedAt        DateTime @default(now())
  
  // Final results (populated when game ends)
  finalPosition   Int?
  flagsReached    Int?
  livesRemaining  Int?
  finalDamage     Int?
  robotsDestroyed Int?
  
  @@unique([gameId, userId])
  @@unique([gameId, startingDock])
  @@index([gameId])
  @@index([userId])
}

enum GameStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

// =====================================================
// EXPANDABLE FEATURES - Boards, Courses, Chat
// =====================================================

model Board {
  id          String  @id @default(uuid())
  boardId     String  @unique
  name        String
  description String?
  
  // Board configuration
  width       Int
  height      Int
  definition  Json    // Complete board JSON
  
  // Metadata
  category    String?
  difficulty  Int?
  minPlayers  Int?
  maxPlayers  Int?
  
  // Creator info
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  isOfficial  Boolean  @default(false)
  isPublished Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  games       Game[]
  courses     CourseBoard[]
  
  @@index([boardId])
  @@index([category])
  @@index([createdById])
}

model Course {
  id          String  @id @default(uuid())
  courseId    String  @unique
  name        String
  description String?
  
  // Course metadata
  category        String?
  difficulty      Int?
  estimatedTime   String?
  minPlayers      Int?
  maxPlayers      Int?
  specialRules    String?
  
  // Creator info
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  isOfficial  Boolean  @default(false)
  isPublished Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  games       Game[]
  boards      CourseBoard[]
  
  @@index([courseId])
  @@index([category])
  @@index([createdById])
}

model CourseBoard {
  id       String @id @default(uuid())
  
  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  boardId  String
  board    Board  @relation(fields: [boardId], references: [id])
  
  orderIndex Int
  
  @@unique([courseId, orderIndex])
  @@index([courseId])
  @@index([boardId])
}

model ChatMessage {
  id String @id @default(uuid())
  
  gameId String
  game   Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  userId     String
  user       User    @relation(fields: [userId], references: [id])
  
  message    String
  timestamp  DateTime @default(now())
  
  @@index([gameId])
  @@index([timestamp])
}

model UserStats {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Aggregate stats
  gamesPlayed       Int @default(0)
  gamesWon          Int @default(0)
  gamesAbandoned    Int @default(0)
  
  totalFlagsReached Int @default(0)
  totalRobotsPushed Int @default(0)
  totalDamageDealt  Int @default(0)
  totalDamageTaken  Int @default(0)
  
  // Best records
  fastestWin        Int?
  mostFlagsInGame   Int?
  longestWinStreak  Int @default(0)
  currentWinStreak  Int @default(0)
  
  favoriteBoard     String?
  favoriteRobotColor String?
  
  updatedAt DateTime @updatedAt
  
  @@index([gamesWon])
  @@index([gamesPlayed])
}
```

### Step 3: Configure Environment
Create `.env` file in project root:
```env
# For local development
DATABASE_URL="postgresql://username:password@localhost:5432/roborally?schema=public"

# For production (example with Supabase)
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```

### Step 4: Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init
```

### Step 5: Create Database Service Layer
Create file `lib/db/database.ts`:

```typescript
import { PrismaClient, GameStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class Database {
  // =====================================================
  // USER MANAGEMENT
  // =====================================================
  
  async createUser(email: string, username: string, name?: string) {
    return await prisma.user.create({
      data: { email, username, name },
    });
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: { stats: true },
    });
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: { stats: true },
    });
  }

  // =====================================================
  // GAME MANAGEMENT
  // =====================================================

  async createGame(
    roomCode: string,
    hostId?: string,
    name?: string,
    boardId?: string,
    courseId?: string
  ) {
    return await prisma.game.create({
      data: {
        roomCode,
        hostId,
        name: name || `Game ${roomCode}`,
        boardId,
        courseId,
        status: GameStatus.WAITING,
      },
    });
  }

  async getGame(roomCode: string) {
    return await prisma.game.findUnique({
      where: { roomCode },
      include: {
        players: {
          include: { user: true },
        },
        host: true,
        winner: true,
      },
    });
  }

  async addPlayerToGame(gameId: string, userId: string, startingDock?: number) {
    return await prisma.gamePlayer.create({
      data: {
        gameId,
        userId,
        startingDock,
      },
    });
  }

  async startGame(roomCode: string) {
    return await prisma.game.update({
      where: { roomCode },
      data: {
        status: GameStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  async endGame(
    roomCode: string,
    winnerId: string,
    results: Array<{
      userId: string;
      position: number;
      flagsReached: number;
      livesRemaining: number;
      finalDamage: number;
    }>
  ) {
    // Update game with results
    const game = await prisma.game.update({
      where: { roomCode },
      data: {
        status: GameStatus.COMPLETED,
        endedAt: new Date(),
        winnerId,
        finalResults: results,
      },
      include: {
        players: true,
      },
    });

    // Update each player's results
    for (const result of results) {
      await prisma.gamePlayer.updateMany({
        where: {
          gameId: game.id,
          userId: result.userId,
        },
        data: {
          finalPosition: result.position,
          flagsReached: result.flagsReached,
          livesRemaining: result.livesRemaining,
          finalDamage: result.finalDamage,
        },
      });

      // Update user stats
      await this.updateUserStats(result.userId, {
        gamesPlayed: 1,
        gamesWon: result.position === 1 ? 1 : 0,
        flagsReached: result.flagsReached,
      });
    }

    return game;
  }

  async getActiveGames() {
    return await prisma.game.findMany({
      where: {
        status: { in: [GameStatus.WAITING, GameStatus.IN_PROGRESS] },
      },
      include: {
        players: true,
        host: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================================
  // BOARD & COURSE MANAGEMENT
  // =====================================================

  async createBoard(board: {
    boardId: string;
    name: string;
    description?: string;
    width: number;
    height: number;
    definition: any;
    category?: string;
    createdById?: string;
  }) {
    return await prisma.board.create({
      data: board,
    });
  }

  async getAllBoards(includeUnpublished = false) {
    return await prisma.board.findMany({
      where: includeUnpublished ? {} : { isPublished: true },
      orderBy: [{ isOfficial: 'desc' }, { name: 'asc' }],
    });
  }

  // =====================================================
  // USER STATISTICS
  // =====================================================

  async updateUserStats(
    userId: string,
    updates: {
      gamesPlayed?: number;
      gamesWon?: number;
      flagsReached?: number;
    }
  ) {
    const existing = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (existing) {
      return await prisma.userStats.update({
        where: { userId },
        data: {
          gamesPlayed: existing.gamesPlayed + (updates.gamesPlayed || 0),
          gamesWon: existing.gamesWon + (updates.gamesWon || 0),
          totalFlagsReached: existing.totalFlagsReached + (updates.flagsReached || 0),
        },
      });
    } else {
      return await prisma.userStats.create({
        data: {
          userId,
          gamesPlayed: updates.gamesPlayed || 0,
          gamesWon: updates.gamesWon || 0,
          totalFlagsReached: updates.flagsReached || 0,
        },
      });
    }
  }
}

// Export singleton instance
export const db = new Database();
```

### Step 6: Integrate with Server
Modify key points in `server.ts`:

```typescript
import { db } from './lib/db/database';

// When creating a game
socket.on('create-game', async ({ playerName, playerId, boardId }, callback) => {
    try {
        const roomCode = generateRoomCode();
        const gameState = gameEngine.createGame(roomCode, playerName, playerId, boardId);
        
        games.set(roomCode, gameState);
        
        // Save to database (if user is registered)
        await db.createGame(roomCode, undefined, `${playerName}'s Game`, boardId);
        
        socket.join(roomCode);
        // ... rest of existing code
    } catch (error) {
        console.error('Error creating game:', error);
    }
});

// When game ends
async function handleGameEnd(roomCode: string, gameState: ServerGameState) {
    // Determine winner and rankings
    const rankings = Object.values(gameState.players)
        .map(player => ({
            userId: player.id, // This would need to be actual user ID if registered
            position: 0, // Calculate actual position
            flagsReached: player.checkpointsReached || 0,
            livesRemaining: player.lives,
            finalDamage: player.damage,
        }))
        .sort((a, b) => b.flagsReached - a.flagsReached);
    
    // Assign positions
    rankings.forEach((player, index) => {
        player.position = index + 1;
    });
    
    const winner = rankings[0];
    
    // Save to database (only if users are registered)
    // await db.endGame(roomCode, winner.userId, rankings);
    
    // Remove from active games after a delay
    setTimeout(() => {
        games.delete(roomCode);
    }, 5 * 60 * 1000); // Keep for 5 minutes
}
```

### Step 7: Update package.json
Add these scripts:
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:reset": "prisma migrate reset"
  }
}
```

## Migration Strategy

### Phase 1: Basic Setup (Immediate)
1. Install dependencies and create schema
2. Run migrations to create tables
3. Deploy without integration (tables exist but unused)

### Phase 2: Minimal Integration (Next Sprint)
1. Create games in database when created in memory
2. Mark games as completed when they end
3. No user authentication required yet

### Phase 3: User Accounts (Future)
1. Add authentication system
2. Link games to registered users
3. Track statistics for registered users
4. Anonymous players continue to work without accounts

### Phase 4: Full Features (Later)
1. Migrate boards from hard-coded to database
2. Add board editor that saves to database
3. Implement chat with persistence
4. Add leaderboards and achievements

## Database Options for Development

### Option A: Local PostgreSQL
```bash
# Mac
brew install postgresql
brew services start postgresql
createdb roborally

# Ubuntu
sudo apt-get install postgresql
sudo service postgresql start
createdb roborally

# Windows
# Download from postgresql.org
```

### Option B: Docker
```bash
docker run --name roborally-db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=roborally \
  -p 5432:5432 \
  -d postgres:15
```

### Option C: Cloud (Recommended for Production)
- **Supabase**: Free tier, easy setup, built-in auth
- **Neon**: Serverless PostgreSQL, scales to zero
- **Railway**: One-click deploy, simple pricing

## Testing the Implementation

1. **Verify database connection**:
```bash
npx prisma studio
```

2. **Test basic operations**:
```typescript
// test-db.ts
import { db } from './lib/db/database';

async function test() {
  const game = await db.createGame('TEST123');
  console.log('Created game:', game);
}
test();
```

## Important Notes

1. **Do NOT store active game state in database** - Keep using in-memory Map
2. **Database is for persistent data only** - Users, game results, chat history
3. **Start simple** - Just create/end games initially, add features gradually
4. **Anonymous play still works** - Database is optional for gameplay
5. **No breaking changes** - Existing code continues to work

## Success Criteria

✅ Database tables created successfully
✅ Can create a game record when game starts
✅ Can mark game as completed when it ends
✅ Existing gameplay unaffected
✅ Server still uses in-memory state for active games

## Questions to Resolve

1. **Authentication**: What auth system? (NextAuth, Supabase Auth, custom?)
2. **User Registration**: Required or optional for play?
3. **Data Privacy**: What user data to store?
4. **Backup Strategy**: How often to backup database?

---

**This implementation adds database support without disrupting current functionality. The database is additive - it provides persistence and history while the game continues to run from memory.**