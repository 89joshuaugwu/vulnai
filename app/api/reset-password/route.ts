import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { rateLimitAsync, getClientIP } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = await rateLimitAsync(`reset-pw:${ip}`, 5, 60); // 5 requests per minute
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many reset attempts. Wait a moment.' }, { status: 429 });
  }

  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const otpRef = adminDb.collection('otps').doc(email);
    const otpSnap = await otpRef.get();
    
    if (!otpSnap.exists) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    
    const data = otpSnap.data()!;
    const now = new Date().toISOString();
    
    if (data.expiresAt < now) {
      // Clean up expired OTP
      await otpRef.delete();
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(code, data.codeHash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // OTP matches! Let's get the user ID
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
      }
      throw error;
    }

    // Update password
    await adminAuth.updateUser(userRecord.uid, {
      password: newPassword
    });

    // Cleanup OTP
    await otpRef.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
