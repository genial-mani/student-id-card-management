import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import prisma from '@/utils/prismaClient';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface JWTPayload {
  userId: string;
  username: string;
  role: 'admin' | 'school_admin' | 'user';
  schoolId?: string;
  tokenVersion: number;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyTokenWithVersion(token: string): Promise<JWTPayload | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Hardcoded admin user doesn't need version check
  if (payload.userId === 'admin') {
    return payload;
  }

  // Check if token version matches database version
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true }
  });

  console.log('Verifying token for userId:', payload.userId, 'tokenVersion:', payload.tokenVersion, 'dbTokenVersion:', user?.tokenVersion);

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return null; // Token is invalidated due to password reset
  }

  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateCredentials(schoolName: string): {
  username: string;
  password: string;
} {
  // Slug the school name: lowercase, replace spaces with underscores, remove special chars
  const slug = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 20);

  const randomSuffix = Math.random().toString(36).slice(2, 6);
  const username = `${slug}_${randomSuffix}`;

  // Generate a random 10-char password
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return { username, password };
}