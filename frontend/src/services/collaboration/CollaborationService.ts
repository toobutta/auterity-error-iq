/**
 * Collaboration Service
 * Real-time collaborative editing using Yjs and WebRTC
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { MonacoBinding } from 'y-monaco';
import { FileItem } from '../continueDevService';

export interface CollaborationSession {
  id: string;
  name: string;
  participants: CollaborationParticipant[];
  activeFile?: FileItem;
  createdAt: Date;
  lastActivity: Date;
}

export interface CollaborationParticipant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
  isActive: boolean;
  lastSeen: Date;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  fileId?: string;
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'cursor' | 'edit' | 'selection' | 'file-change';
  participantId: string;
  data: any;
  timestamp: Date;
}

export class CollaborationService {
  private ydoc: Y.Doc;
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private monacoBinding: MonacoBinding | null = null;
  private sessions: Map<string, CollaborationSession> = new Map();
  private currentSession: CollaborationSession | null = null;
  private eventListeners: Map<string, (event: CollaborationEvent) => void> = new Map();

  constructor() {
    this.ydoc = new Y.Doc();
    this.setupYjsObservers();
  }

  // Session Management
  async createSession(name: string, creatorId: string, creatorName: string): Promise<CollaborationSession> {
    const sessionId = this.generateSessionId();
    const session: CollaborationSession = {
      id: sessionId,
      name,
      participants: [{
        id: creatorId,
        name: creatorName,
        color: this.generateRandomColor(),
        isActive: true,
        lastSeen: new Date()
      }],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;

    // Initialize Yjs provider for this session
    await this.initializeProvider(sessionId);

    return session;
  }

  async joinSession(sessionId: string, participantId: string, participantName: string): Promise<CollaborationSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if participant already exists
    const existingParticipant = session.participants.find(p => p.id === participantId);
    if (existingParticipant) {
      existingParticipant.isActive = true;
      existingParticipant.lastSeen = new Date();
    } else {
      // Add new participant
      const newParticipant: CollaborationParticipant = {
        id: participantId,
        name: participantName,
        color: this.generateRandomColor(),
        isActive: true,
        lastSeen: new Date()
      };
      session.participants.push(newParticipant);
    }

    session.lastActivity = new Date();
    this.currentSession = session;

    // Initialize Yjs provider for this session
    await this.initializeProvider(sessionId);

    // Emit join event
    this.emitEvent({
      type: 'join',
      participantId,
      data: { sessionId, participantName },
      timestamp: new Date()
    });

    return session;
  }

  async leaveSession(participantId: string): Promise<void> {
    if (!this.currentSession) return;

    const participant = this.currentSession.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isActive = false;
      participant.lastSeen = new Date();
    }

    this.currentSession.lastActivity = new Date();

    // Emit leave event
    this.emitEvent({
      type: 'leave',
      participantId,
      data: { sessionId: this.currentSession.id },
      timestamp: new Date()
    });

    // Clean up if no active participants
    const activeParticipants = this.currentSession.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      await this.cleanupSession();
    }
  }

  // File Synchronization
  async syncFile(file: FileItem, monacoEditor: any): Promise<void> {
    if (!this.currentSession) return;

    // Update session with active file
    this.currentSession.activeFile = file;

    // Initialize Monaco binding for collaborative editing
    if (this.monacoBinding) {
      this.monacoBinding.destroy();
    }

    // Create Yjs text type for file content
    const ytext = this.ydoc.getText(`file-${file.id}`);
    ytext.delete(0, ytext.length);
    ytext.insert(0, file.content);

    // Bind Monaco editor to Yjs
    this.monacoBinding = new MonacoBinding(
      ytext,
      monacoEditor.getModel(),
      new Set([monacoEditor]),
      this.provider?.awareness
    );

    // Emit file change event
    this.emitEvent({
      type: 'file-change',
      participantId: 'system',
      data: { fileId: file.id, fileName: file.name },
      timestamp: new Date()
    });
  }

  // Cursor and Selection Tracking
  updateCursor(participantId: string, position: CursorPosition): void {
    if (!this.currentSession || !this.provider) return;

    // Update participant cursor position
    const participant = this.currentSession.participants.find(p => p.id === participantId);
    if (participant) {
      participant.cursor = position;
      participant.lastSeen = new Date();
    }

    // Update Yjs awareness
    this.provider.awareness.setLocalStateField('cursor', position);
    this.provider.awareness.setLocalStateField('user', {
      id: participantId,
      name: participant?.name,
      color: participant?.color
    });

    // Emit cursor event
    this.emitEvent({
      type: 'cursor',
      participantId,
      data: position,
      timestamp: new Date()
    });
  }

  updateSelection(participantId: string, selection: any): void {
    if (!this.currentSession || !this.provider) return;

    // Update Yjs awareness with selection
    this.provider.awareness.setLocalStateField('selection', selection);

    // Emit selection event
    this.emitEvent({
      type: 'selection',
      participantId,
      data: selection,
      timestamp: new Date()
    });
  }

  // Event System
  onEvent(eventType: string, callback: (event: CollaborationEvent) => void): void {
    this.eventListeners.set(eventType, callback);
  }

  offEvent(eventType: string): void {
    this.eventListeners.delete(eventType);
  }

  private emitEvent(event: CollaborationEvent): void {
    const listener = this.eventListeners.get(event.type);
    if (listener) {
      listener(event);
    }

    // Also emit to general listeners
    const generalListener = this.eventListeners.get('*');
    if (generalListener) {
      generalListener(event);
    }
  }

  // Yjs Setup
  private async initializeProvider(sessionId: string): Promise<void> {
    // Clean up existing provider
    if (this.provider) {
      this.provider.destroy();
    }

    // Initialize WebRTC provider
    this.provider = new WebrtcProvider(`auterity-session-${sessionId}`, this.ydoc, {
      signaling: ['wss://signaling.auterity.com'],
      password: undefined,
      maxConns: 20,
      filterBcConns: true,
      awareness: new Map()
    });

    // Initialize persistence
    this.persistence = new IndexeddbPersistence(`auterity-session-${sessionId}`, this.ydoc);

    // Wait for persistence to load
    await new Promise<void>((resolve) => {
      this.persistence?.once('synced', () => resolve());
    });

    // Setup awareness for user presence
    this.provider.awareness.on('change', () => {
      this.handleAwarenessChange();
    });
  }

  private setupYjsObservers(): void {
    // Observe document changes
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== this.provider) {
        this.emitEvent({
          type: 'edit',
          participantId: 'system',
          data: { update, origin },
          timestamp: new Date()
        });
      }
    });
  }

  private handleAwarenessChange(): void {
    if (!this.provider || !this.currentSession) return;

    const states = this.provider.awareness.getStates();
    const participants: CollaborationParticipant[] = [];

    states.forEach((state, clientId) => {
      if (state.user) {
        participants.push({
          id: state.user.id,
          name: state.user.name,
          color: state.user.color,
          cursor: state.cursor,
          isActive: true,
          lastSeen: new Date()
        });
      }
    });

    // Update session participants
    this.currentSession.participants = participants;
  }

  // Session Cleanup
  private async cleanupSession(): Promise<void> {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }

    if (this.monacoBinding) {
      this.monacoBinding.destroy();
      this.monacoBinding = null;
    }

    this.currentSession = null;
  }

  // Utility Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Public API
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  getSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  getParticipants(): CollaborationParticipant[] {
    return this.currentSession?.participants || [];
  }

  isConnected(): boolean {
    return this.provider?.connected || false;
  }

  // Cleanup
  destroy(): void {
    this.cleanupSession();
    this.eventListeners.clear();
    this.sessions.clear();
  }
}
