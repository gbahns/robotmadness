import { io, Socket } from 'socket.io-client';
import { GameState, Player, SocketEvent, ProgramCard } from './game/types';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
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

  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: Function): void {
    if (!this.socket) return;

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
    this.socket.on(event, callback as any);
  }

  off(event: string, callback: Function): void {
    if (!this.socket) return;

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      this.socket.off(event, callback as any);
    }
  }

  // Game-specific methods
  joinGame(roomCode: string, playerName: string, playerId?: string): void {
    this.emit(SocketEvent.JOIN_GAME, { roomCode, playerName, playerId });
  }

  startGame(): void {
    this.emit(SocketEvent.START_GAME);
  }

  leaveGame(): void {
    this.emit(SocketEvent.LEAVE_GAME);
  }

  // Card selection methods
  selectCards(selectedCards: (ProgramCard | null)[]): void {
    this.emit(SocketEvent.SELECT_CARDS, { selectedCards });
  }

  submitCards(): void {
    this.emit(SocketEvent.SUBMIT_CARDS);
  }

  powerDown(isPoweredDown: boolean): void {
    this.emit(SocketEvent.POWER_DOWN, { isPoweredDown });
  }

  // Event listeners
  onGameState(callback: (gameState: GameState) => void): void {
    this.on(SocketEvent.GAME_STATE, callback);
  }

  onPlayerJoined(callback: (data: { player: Player }) => void): void {
    this.on(SocketEvent.PLAYER_JOINED, callback);
  }

  onPlayerLeft(callback: (data: { playerId: string }) => void): void {
    this.on(SocketEvent.PLAYER_LEFT, callback);
  }

  onGameError(callback: (data: { message: string }) => void): void {
    this.on(SocketEvent.GAME_ERROR, callback);
  }

  onCardsDealt(callback: () => void): void {
    this.on(SocketEvent.CARDS_DEALT, callback);
  }

  onRegisterExecuted(callback: (data: any) => void): void {
    this.on(SocketEvent.REGISTER_EXECUTED, callback);
  }
}

// Export singleton instance
export const socketClient = new SocketClient();