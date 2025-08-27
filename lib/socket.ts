// lib/socket.ts

import { io, Socket } from 'socket.io-client';
import { GameState, Player, SocketEvent } from './game/types';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  public auth: { userId?: string; username?: string; isAuthenticated?: boolean } = {}; // Store auth data

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: this.auth // Pass auth data on connection
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.socket) return;

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
    this.socket.on(event, callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.socket) return;

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      this.socket.off(event, callback);
    }
  }

  // Game-specific methods
  joinGame(roomCode: string, playerName: string, playerId?: string, isPractice?: boolean): void {
    this.emit(SocketEvent.JOIN_GAME, { 
      roomCode, 
      playerName, 
      playerId,
      userId: this.auth?.userId,
      username: this.auth?.username,
      isAuthenticated: this.auth?.isAuthenticated || false,
      isPractice: isPractice || false
    });
  }

  startGame(roomCode: string, selectedCourse: string): void {
    this.emit(SocketEvent.START_GAME, { roomCode, selectedCourse });
  }

  leaveGame(): void {
    this.emit(SocketEvent.LEAVE_GAME);
  }

  onGameState(callback: (gameState: GameState) => void): void {
    this.on(SocketEvent.GAME_STATE, (data) => callback(data as GameState));
  }

  onPlayerJoined(callback: (data: { player: Player }) => void): void {
    this.on(SocketEvent.PLAYER_JOINED, (data) => callback(data as { player: Player }));
  }

  onPlayerLeft(callback: (data: { playerId: string }) => void): void {
    this.on(SocketEvent.PLAYER_LEFT, (data) => callback(data as { playerId: string }));
  }

  onGameError(callback: (data: { message: string }) => void): void {
    this.on(SocketEvent.GAME_ERROR, (data) => callback(data as { message: string }));
  }
}

// Export singleton instance
export const socketClient = new SocketClient();