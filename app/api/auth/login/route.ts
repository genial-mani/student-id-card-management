import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if this is the hardcoded admin
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
      const token = await signToken({
        userId: 'admin',
        username: adminUsername,
        role: 'admin',
        tokenVersion: 0,
      });

      // Record LOGIN Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            userId: 'admin',
            username: adminUsername,
            role: 'admin',
            action: 'LOGIN',
          },
        });
      } catch (err) {
        console.error('Failed to write login log for admin:', err);
      }

      const response = NextResponse.json({
        success: true,
        user: { username: adminUsername, role: 'admin' },
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // Check database users
    const user = await prisma.user.findUnique({
      where: { username },
      include: { school: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'user',
      schoolId: user.schoolId || undefined,
      tokenVersion: user.tokenVersion,
    });

    // Record LOGIN Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          username: user.username,
          role: user.role,
          action: 'LOGIN',
          schoolId: user.schoolId || undefined,
          schoolName: user.school?.name || undefined,
        },
      });
    } catch (err) {
      console.error('Failed to write login log for user:', err);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        schoolId: user.schoolId,
      },
    });


    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}