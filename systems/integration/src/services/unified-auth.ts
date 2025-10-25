import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  systemAccess: {
    auterity: boolean;
    relaycore: boolean;
    neuroweaver: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface SystemCredentials {
  system: string;
  username: string;
  password: string;
  apiKey?: string;
  token?: string;
}

export class UnifiedAuth extends EventEmitter {
  private users = new Map<string, User>();
  private refreshTokens = new Map<string, string>();
  private systemCredentials = new Map<string, SystemCredentials>();
  private sessions = new Map<string, any>();

  constructor(
    private jwtSecret: string = process.env.JWT_SECRET || "your-secret-key",
    private jwtRefreshSecret: string = process.env.JWT_REFRESH_SECRET ||
      "your-refresh-secret-key",
    private saltRounds: number = 12,
  ) {
    super();
    this.initializeDefaultUsers();
    this.initializeSystemCredentials();
  }

  private initializeDefaultUsers(): void {
    // Create default admin user
    const adminUser: User = {
      id: uuidv4(),
      email: "admin@auterity.com",
      username: "admin",
      roles: ["admin", "user"],
      permissions: ["read", "write", "delete", "admin"],
      systemAccess: {
        auterity: true,
        relaycore: true,
        neuroweaver: true,
      },
      createdAt: new Date().toISOString(),
    };

    this.users.set(adminUser.id, adminUser);

  }

  private initializeSystemCredentials(): void {
    // Initialize system-to-system credentials
    const systems: SystemCredentials[] = [
      {
        system: "auterity",
        username: process.env.AUTERITY_USERNAME || "auterity_system",
        password: process.env.AUTERITY_PASSWORD || "default_password",
        apiKey: process.env.AUTERITY_API_KEY,
      },
      {
        system: "relaycore",
        username: process.env.RELAYCORE_USERNAME || "relaycore_system",
        password: process.env.RELAYCORE_PASSWORD || "default_password",
        apiKey: process.env.RELAYCORE_API_KEY,
      },
      {
        system: "neuroweaver",
        username: process.env.NEUROWEAVER_USERNAME || "neuroweaver_system",
        password: process.env.NEUROWEAVER_PASSWORD || "default_password",
        apiKey: process.env.NEUROWEAVER_API_KEY,
      },
    ];

    systems.forEach((creds) => {
      this.systemCredentials.set(creds.system, creds);
    });

  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    this.emit("user-created", user);

    return user;
  }

  async authenticateUser(
    username: string,
    password: string,
  ): Promise<AuthToken | null> {
    // Find user by username or email
    const user = Array.from(this.users.values()).find(
      (u) => u.username === username || u.email === username,
    );

    if (!user) {

      return null;
    }

    // TODO: Implement proper password verification with stored hashed passwords
    // For demo purposes, accept any non-empty password
    if (!password || password.length < 1) {

      return null;
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User): AuthToken {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        systemAccess: user.systemAccess,
      },
      this.jwtSecret,
      { expiresIn: "1h" },
    );

    const refreshToken = jwt.sign({ userId: user.id }, this.jwtRefreshSecret, {
      expiresIn: "7d",
    });

    // Store refresh token
    this.refreshTokens.set(refreshToken, user.id);

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.users.set(user.id, user);

    this.emit("user-authenticated", user);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
      tokenType: "Bearer",
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthToken | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;
      const userId = this.refreshTokens.get(refreshToken);

      if (!userId || decoded.userId !== userId) {

        return null;
      }

      const user = this.users.get(userId);
      if (!user) {

        return null;
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      return tokens;
    } catch (error) {

      return null;
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = this.users.get(decoded.userId);

      if (!user) {

        return null;
      }

      return user;
    } catch (error) {

      return null;
    }
  }

  async getSystemCredentials(
    system: string,
  ): Promise<SystemCredentials | null> {
    return this.systemCredentials.get(system) || null;
  }

  async generateSystemToken(
    system: string,
    targetSystem: string,
  ): Promise<string | null> {
    const credentials = this.systemCredentials.get(system);
    if (!credentials) {

      return null;
    }

    // Generate a system-to-system token
    const systemToken = jwt.sign(
      {
        system,
        targetSystem,
        permissions: ["system", "read", "write"],
        type: "system",
      },
      this.jwtSecret,
      { expiresIn: "1h" },
    );

    return systemToken;
  }

  async validateSystemToken(
    token: string,
    expectedSystem: string,
  ): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (decoded.type !== "system" || decoded.system !== expectedSystem) {
        return false;
      }

      return true;
    } catch (error) {

      return false;
    }
  }

  async createSession(userId: string, metadata: any = {}): Promise<string> {
    const sessionId = uuidv4();
    const session = {
      userId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata,
    };

    this.sessions.set(sessionId, session);
    this.emit("session-created", { sessionId, session });

    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
    this.sessions.set(sessionId, session);

    const user = this.users.get(session.userId);
    return user || null;
  }

  async destroySession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.emit("session-destroyed", sessionId);
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async updateUser(
    userId: string,
    updates: Partial<User>,
  ): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);

    this.emit("user-updated", updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    this.users.delete(userId);

    // Clean up refresh tokens
    for (const [token, uid] of this.refreshTokens.entries()) {
      if (uid === userId) {
        this.refreshTokens.delete(token);
      }
    }

    // Clean up sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }

    this.emit("user-deleted", user);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserSessions(userId: string): Promise<any[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  // Cross-system authentication helpers
  async authenticateWithSystem(
    targetSystem: string,
    credentials: any,
  ): Promise<any> {
    // This would handle authentication with external systems
    const systemToken = await this.generateSystemToken(
      "integration",
      targetSystem,
    );

    if (!systemToken) {
      throw new Error(`Cannot generate token for system: ${targetSystem}`);
    }

    // In a real implementation, this would make HTTP calls to authenticate with the target system
    const authResult = {
      system: targetSystem,
      token: systemToken,
      authenticated: true,
      timestamp: new Date().toISOString(),
    };

    this.emit("cross-system-auth", authResult);
    return authResult;
  }

  // Permission checking
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    return (
      user.permissions.includes(permission) || user.roles.includes("admin")
    );
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    return user.roles.includes(role);
  }

  async hasSystemAccess(userId: string, system: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    return user.systemAccess[system as keyof typeof user.systemAccess] || false;
  }

  // Cleanup methods
  async cleanupExpiredTokens(): Promise<void> {
    // In a real implementation, you'd check token expiration
    // For now, just log the cleanup

    this.emit("tokens-cleaned");
  }

  async cleanupExpiredSessions(
    maxAge: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime();
      if (now - lastActivity > maxAge) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {

      this.emit("sessions-cleaned", cleaned);
    }
  }

  // Health check
  getHealthStatus(): any {
    return {
      users: this.users.size,
      sessions: this.sessions.size,
      refreshTokens: this.refreshTokens.size,
      systems: this.systemCredentials.size,
      status: "healthy",
    };
  }

  // Add missing methods for integration
  async getStatus(): Promise<any> {
    return {
      status: "healthy",
      users: this.users.size,
      sessions: this.sessions.size,
      systems: this.systemCredentials.size,
      timestamp: new Date().toISOString(),
    };
  }
}

