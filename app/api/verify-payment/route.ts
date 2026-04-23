import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { reference, userId } = await req.json();

    if (!reference || !userId) {
      return NextResponse.json({ success: false, error: "Missing reference or userId" }, { status: 400 });
    }

    // Verify payment with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();
    if (verifyData.status && verifyData.data.status === "success") {
      const customerEmail = verifyData.data.customer?.email;

      if (customerEmail) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: `"VulnAI Security" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: "Welcome to VulnAI Pro! 🚀",
            html: `
              <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
                <h2 style="color: #00D4FF;">Welcome to VulnAI Pro Pentester!</h2>
                <p>Your payment was successful and your account has been upgraded.</p>
                <p>You now have access to:</p>
                <ul>
                  <li><span style="color: #3FB950;">✓</span> Unlimited vulnerability reports</li>
                  <li><span style="color: #3FB950;">✓</span> Advanced Gemini Pro reasoning</li>
                  <li><span style="color: #3FB950;">✓</span> Cloud report history</li>
                </ul>
                <p style="margin-top: 30px;">Happy Hacking,<br/>The VulnAI Team</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send upgrade email:", emailError);
          // Don't fail the verification if email fails
        }
      }
      
      return NextResponse.json({ success: true, message: "Payment verified" }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
