import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await verifyUser(email, password);

        // In a real app, generate a JWT here
        // For MVP, just return the user data to be stored in Context/localStorage
        const { password: _, ...safeUser } = user;

        return NextResponse.json({ user: safeUser });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: error?.message || 'An error occurred during login' },
            { status: 401 }
        );
    }
}
