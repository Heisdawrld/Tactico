/**
 * Tactico Authentication System
 * Handles user registration, login, sessions, and OAuth
 */

import { db, getDbClient } from '@tactico/database';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// JWT Secret — MUST be set via environment variable in production
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })()
    : 'tactico-dev-secret-change-in-production')
);

export interface User {
  id: string;
  name: string | null;
  email: string;
  password?: string;
  created_at: string;
  last_login: string | null;
  email_verified: boolean;
  image: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  user: User;
}

export interface AuthOptions {
  email: string;
  password: string;
}

export interface RegisterOptions {
  name: string;
  email: string;
  password: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export async function generateToken(payload: object): Promise<string> {
  return new SignJWT(payload as Record<string, any>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(options: RegisterOptions): Promise<User | null> {
  const { name, email, password } = options;

  // Check if user already exists
  const existing = await db.query<{ id: string }>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.run(
    `INSERT INTO users (id, name, email, password, created_at, email_verified) 
     VALUES (?, ?, ?, ?, datetime('now'), 0)`,
    [userId, name, email, hashedPassword]
  );

  // Fetch and return user
  const users = await db.query<User>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  return users[0] || null;
}

/**
 * Authenticate a user
 */
export async function authenticateUser(options: AuthOptions): Promise<User | null> {
  const { email, password } = options;

  // Find user by email
  const users = await db.query<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  // Verify password
  if (!user.password) {
    return null; // OAuth user
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Update last login
  await db.run(
    'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?',
    [user.id]
  );

  // Remove password from returned user
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * Create a session for a user
 */
export async function createSession(userId: string): Promise<Session> {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await db.run(
    `INSERT INTO user_sessions (id, user_id, expires_at) 
     VALUES (?, ?, ?)`,
    [sessionId, userId, expiresAt]
  );

  // Fetch user
  const users = await db.query<User>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new Error('User not found');
  }

  const { password: _, ...user } = users[0];

  return {
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt,
    user: user as User,
  };
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessions = await db.query<Session & { user: User }>(
    `SELECT s.*, u.* 
     FROM user_sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
    [sessionId]
  );

  if (sessions.length === 0) {
    return null;
  }

  const session = sessions[0];
  const { password: _, ...user } = session;

  return {
    id: session.id,
    user_id: session.user_id,
    expires_at: session.expires_at,
    user: user as User,
  };
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.run('DELETE FROM user_sessions WHERE id = ?', [sessionId]);
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.run(
    'DELETE FROM user_sessions WHERE expires_at < datetime(\'now\')'
  );
  return result.changes;
}

/**
 * Verify user's email
 */
export async function verifyEmail(userId: string, token: string): Promise<boolean> {
  // Check if token exists and is valid
  const tokens = await db.query<{ identifier: string }>(
    'SELECT identifier FROM user_verification_tokens WHERE token = ? AND expires_at > datetime(\'now\')',
    [token]
  );

  if (tokens.length === 0) {
    return false;
  }

  const verificationToken = tokens[0];
  if (verificationToken.identifier !== userId) {
    return false;
  }

  // Mark email as verified
  await db.run(
    'UPDATE users SET email_verified = 1 WHERE id = ?',
    [userId]
  );

  // Delete used token
  await db.run(
    'DELETE FROM user_verification_tokens WHERE identifier = ? AND token = ?',
    [userId, token]
  );

  return true;
}

/**
 * Generate email verification token
 */
export async function generateVerificationToken(userId: string): Promise<string> {
  const token = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await db.run(
    `INSERT OR REPLACE INTO user_verification_tokens (identifier, token, expires_at) 
     VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const users = await db.query<User>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    return null;
  }

  const { password: _, ...user } = users[0];
  return user as User;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await db.query<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return null;
  }

  const { password: _, ...user } = users[0];
  return user as User;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'image'>>
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.image !== undefined) {
    fields.push('image = ?');
    values.push(updates.image);
  }

  if (fields.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);

  await db.run(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getUserById(userId);
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const users = await db.query<User>(
    'SELECT password FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0 || !users[0].password) {
    return false;
  }

  const user = users[0];

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    return false;
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await db.run(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, userId]
  );

  return true;
}

/**
 * Request password reset token
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const users = await db.query<User>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    // Don't reveal if email exists
    return null;
  }

  const userId = users[0].id;
  const token = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.run(
    `INSERT OR REPLACE INTO user_verification_tokens (identifier, token, expires_at) 
     VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const tokens = await db.query<{ identifier: string }>(
    'SELECT identifier FROM user_verification_tokens WHERE token = ? AND expires_at > datetime(\'now\')',
    [token]
  );

  if (tokens.length === 0) {
    return false;
  }

  const userId = tokens[0].identifier;
  const hashedPassword = await hashPassword(newPassword);

  await db.run(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, userId]
  );

  // Delete used token
  await db.run(
    'DELETE FROM user_verification_tokens WHERE identifier = ?',
    [userId]
  );

  return true;
}

// Export main auth functions
export const auth = {
  register: registerUser,
  login: authenticateUser,
  logout: deleteSession,
  getSession,
  createSession,
  verifyToken,
  generateToken,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  changePassword,
  verifyEmail,
  generateVerificationToken,
  requestPasswordReset,
  resetPassword,
  cleanupExpiredSessions,
};

export default auth;
