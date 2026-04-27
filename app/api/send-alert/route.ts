import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { type, email, metadata } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ success: false, error: "Missing email or type" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = "";
    let html = "";

    const baseHtml = (title: string, message: string, actionButton: string = "") => `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
          <div style="padding: 30px; text-align: center; border-bottom: 1px solid #30363d; background-color: #0d1117;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;"><span style="color: #ffffff;">Vuln</span><span style="color: #00d4ff;">AI</span></h1>
          </div>
          <div style="padding: 40px 30px; text-align: left;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">${title}</h2>
            <div style="color: #8b949e; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${message}</div>
            ${actionButton}
          </div>
          <div style="background-color: #0d1117; padding: 24px; text-align: center; border-top: 1px solid #30363d;">
            <p style="color: #8b949e; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} VulnAI Security. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    if (type === "login") {
      subject = "New Login Detected - VulnAI";
      html = baseHtml(
        "Security Alert: New Login",
        `<p>We detected a new login to your VulnAI account (${email}).</p><p style="color:#ffffff;">Time: ${new Date().toLocaleString()}</p><p>If this was you, you can safely ignore this email. If not, please reset your password immediately.</p>`
      );
    } else if (type === "signup") {
      subject = "Welcome to VulnAI! 🎉";
      html = baseHtml(
        "Welcome to VulnAI!",
        `<p>Your account (${email}) has been successfully created and verified.</p><p>You can now start generating professional penetration testing reports powered by Gemini AI.</p>`,
        `<a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #00d4ff; color: #0d1117; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>`
      );
    } else if (type === "scan_complete") {
      subject = "Your VulnAI Report is Ready! 📊";
      html = baseHtml(
        "Scan Complete",
        `<p>Your vulnerability report for the recent scan is ready.</p><p style="color:#ffffff;">Scanner: ${metadata?.scanner || "Unknown"}</p><p>Log in to your dashboard to view and download the PDF.</p>`,
        `<a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?tab=history" style="display: inline-block; padding: 12px 24px; background-color: #00d4ff; color: #0d1117; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Report</a>`
      );
    } else {
      return NextResponse.json({ success: false, error: "Invalid alert type" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"VulnAI Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Alert email error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
