import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAsync, getClientIP } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = await rateLimitAsync(`verify-otp:${ip}`, 10, 60); // 10 requests per minute
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many verification attempts. Wait a moment.' }, { status: 429 });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { doc, getDoc, deleteDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    
    const otpRef = doc(db, "otps", email);
    const otpSnap = await getDoc(otpRef);
    
    if (!otpSnap.exists()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    
    const data = otpSnap.data();
    const now = new Date().toISOString();
    
    if (data.expiresAt < now) {
      // Clean up expired OTP
      await deleteDoc(otpRef);
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(code, data.codeHash);

    if (isMatch) {
      // OTP verified successfully, clean up
      await deleteDoc(otpRef);
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
