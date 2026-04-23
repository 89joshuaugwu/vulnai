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

    if (type === "login") {
      subject = "New Login Detected - VulnAI";
      html = `
        <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
          <h2 style="color: #00D4FF;">Security Alert: New Login</h2>
          <p>We detected a new login to your VulnAI account (${email}).</p>
          <p>Time: ${new Date().toLocaleString()}</p>
          <p>If this was you, you can safely ignore this email. If not, please reset your password immediately.</p>
        </div>
      `;
    } else if (type === "signup") {
      subject = "Welcome to VulnAI! 🎉";
      html = `
        <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
          <h2 style="color: #00D4FF;">Welcome to VulnAI!</h2>
          <p>Your account (${email}) has been successfully created and verified.</p>
          <p>You can now start generating professional penetration testing reports powered by Gemini AI.</p>
        </div>
      `;
    } else if (type === "scan_complete") {
      subject = "Your VulnAI Report is Ready! 📊";
      html = `
        <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
          <h2 style="color: #3FB950;">Scan Complete</h2>
          <p>Your vulnerability report for the recent scan is ready.</p>
          <p>Scanner: ${metadata?.scanner || "Unknown"}</p>
          <p>Log in to your dashboard to view and download the PDF.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?tab=history" style="display: inline-block; padding: 10px 20px; background-color: #00D4FF; color: #0D1117; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">View Report</a>
        </div>
      `;
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
