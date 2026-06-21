import { NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { generateCredentials, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const schools = await prisma.school.findMany();
    const results = [];

    for (const school of schools) {
      const existingAdmin = await prisma.user.findFirst({
        where: { schoolId: school.id, role: 'school_admin' },
      });

      if (!existingAdmin) {
        const { username, password: plainPassword } = generateCredentials(school.name + ' Admin');
        const hashedPassword = await hashPassword(plainPassword);

        const newAdmin = await prisma.user.create({
          data: {
            username,
            password: hashedPassword,
            role: 'school_admin',
            schoolId: school.id,
          },
        });
        results.push({ schoolId: school.id, username, plainPassword });
      }
    }

    return NextResponse.json({ message: 'Migration complete', createdCount: results.length, details: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
