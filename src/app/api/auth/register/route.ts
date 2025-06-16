import type { RegisterCredentials } from '@/types/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credentials = registerSchema.parse(body) as RegisterCredentials;

    // Replace this with your actual registration logic
    const response = await fetch(`${process.env.API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 },
      );
    }

    const data = await response.json();
    const authResponse = NextResponse.json({ user: data.user });
    // Set cookie on the response
    authResponse.cookies.set('auth-token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return authResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
