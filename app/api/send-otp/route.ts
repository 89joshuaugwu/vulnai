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
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
          <div style="padding: 30px; text-align: center; border-bottom: 1px solid #30363d; background-color: #0d1117;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;"><span style="color: #ffffff;">Vuln</span><span style="color: #00d4ff;">AI</span></h1>
            <p style="color: #8b949e; margin-top: 5px; font-size: 14px; margin-bottom: 0;">Security Authentication System</p>
          </div>
          <div style="padding: 40px 30px; text-align: left;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Authentication Required</h2>
            <p style="color: #8b949e; font-size: 16px; line-height: 1.6;">
              A request was made to authenticate this email address with VulnAI. 
              Please use the following 6-digit access code to complete your verification.
            </p>
            
            <div style="background-color: #0d1117; padding: 24px; text-align: center; border-radius: 8px; border: 1px dashed #00d4ff; margin: 30px 0;">
              <span style="font-size: 40px; font-weight: 800; color: #00d4ff; letter-spacing: 8px; font-family: monospace;">${otpRaw}</span>
            </div>
            
            <p style="color: #F85149; font-size: 14px; text-align: center; margin-bottom: 0; font-weight: bold;">
              ⚠️ This code expires in 10 minutes. Do not share it.
            </p>
          </div>
          <div style="background-color: #0d1117; padding: 24px; text-align: center; border-top: 1px solid #30363d;">
            <p style="color: #8b949e; font-size: 13px; margin: 0 0 5px 0;">If you did not request this code, please secure your account.</p>
            <p style="color: #8b949e; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} VulnAI Security. All rights reserved.</p>
          </div>
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
