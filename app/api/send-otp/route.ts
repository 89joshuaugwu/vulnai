import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { rateLimitAsync, getClientIP } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = await rateLimitAsync(`otp:${ip}`, 5, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many OTP requests. Wait a moment.' }, { status: 429 });
  }

  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otpRaw = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before storing it
    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpRaw, salt);

    // Save hashed OTP to Firestore using client SDK
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await setDoc(doc(db, "otps", email), {
      codeHash: hashedOtp,
      expiresAt,
      createdAt: new Date().toISOString()
    });


    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const subjectText = type === 'signup' ? 'Verify your VulnAI Account' : 'Reset your VulnAI Password';
    
    const htmlTemplate = `
      <div style="font-family: 'Courier New', Courier, monospace; background-color: #0D1117; color: #C9D1D9; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #30363D;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00D4FF; margin: 0; font-size: 28px;">Vuln<span style="color: #ffffff;">AI</span></h1>
          <p style="color: #8B949E; margin-top: 5px; font-size: 14px;">Security Authentication System</p>
        </div>
        
        <div style="background-color: #161B22; padding: 30px; border-radius: 8px; border: 1px solid #30363D;">
          <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Authentication Required</h2>
          <p style="color: #C9D1D9; font-size: 15px; line-height: 1.6;">
            A request was made to authenticate this email address with VulnAI. 
            Please use the following 6-digit access code to complete your verification.
          </p>
          
          <div style="background-color: #0D1117; padding: 20px; text-align: center; border-radius: 6px; border: 1px dashed #00D4FF; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #00D4FF; letter-spacing: 6px;">${otpRaw}</span>
          </div>
          
          <p style="color: #F85149; font-size: 13px; text-align: center; margin-bottom: 0;">
            ⚠️ This code expires in 10 minutes. Do not share this with anyone.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #30363D; padding-top: 20px;">
          <p style="color: #8B949E; font-size: 12px; margin: 0;">
            If you did not request this code, please ignore this email or secure your account.
          </p>
          <p style="color: #8B949E; font-size: 12px; margin-top: 5px;">
            &copy; ${new Date().getFullYear()} VulnAI Security. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"VulnAI Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subjectText,
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
