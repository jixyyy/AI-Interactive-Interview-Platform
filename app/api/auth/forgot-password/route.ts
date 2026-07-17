import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import UserModel from '@/lib/models/User';
import OtpModel from '@/lib/models/Otp';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user exists
        const existingUser = await UserModel.findOne({ email });
        if (!existingUser) {
            return NextResponse.json(
                { error: 'No account found with this email address.' },
                { status: 404 }
            );
        }

        // Generate 4-digit OTP
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        // Delete any existing OTPs for this email to prevent spam conflicts
        await OtpModel.deleteMany({ email });

        // Save new OTP
        await OtpModel.create({ email, code });

        // Simulating sending the email by printing it clearly to the terminal (fallback)
        console.log('\n======================================================');
        console.log(`✉️  MOCK PASSWORD RESET EMAIL SENT TO: ${email}`);
        console.log(`🔑 YOUR VERIFICATION CODE IS: ${code}`);
        console.log('======================================================\n');

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS.length > 0) {
            try {
                const transporter = (await import('nodemailer')).default.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"Interview Coach" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Reset your Interview Coach Password',
                    html: `
                        <div style="font-family: sans-serif; max-width: md; margin: 0 auto; text-align: center; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
                            <h2 style="color: #111827; margin-bottom: 20px;">Interview Coach Password Reset 🔑</h2>
                            <p style="color: #4b5563; font-size: 16px;">We received a request to reset your password. Use the verification code below to proceed.</p>
                            <div style="background-color: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <h1 style="color: #2563eb; font-size: 48px; letter-spacing: 12px; margin: 0;">${code}</h1>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">This code securely expires in 5 minutes. If you did not request a password reset, please ignore this email.</p>
                        </div>
                    `
                });
                console.log('✅ Real password reset email successfully sent via Gmail API.');
            } catch (mailError: any) {
                console.warn('\n⚠️ WARNING: Failed to send real password reset email via Gmail.');
                console.warn('Reason:', mailError.message);
                console.warn('The app is falling back to the MOCK OTP printed above.');
                console.warn('To fix this, ensure you are using a 16-digit Google App Password in .env.local, NOT your normal password!\n');
            }
        }

        return NextResponse.json({ success: true, message: 'Password reset code sent successfully' });

    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: error?.message || 'An error occurred while processing password reset' },
            { status: 500 }
        );
    }
}
