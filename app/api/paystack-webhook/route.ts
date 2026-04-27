import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import nodemailer from "nodemailer";

// Paystack sends webhooks as POST requests with a signature header
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    const signature = req.headers.get("x-paystack-signature");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const data = event.data;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // ─── CHARGE SUCCESS (one-time or recurring) ────────────────────
    if (eventType === "charge.success") {
      const customerEmail = data.customer?.email;
      const metadata = data.metadata || {};
      const userId = metadata.userId;

      if (userId) {
        // Set subscription expiry to 30 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          isPro: true,
          subscriptionExpiresAt: expiresAt.toISOString(),
          paystackCustomerCode: data.customer?.customer_code || null,
          lastPaymentReference: data.reference,
        });

        // Save transaction record to 'payments' collection
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "payments", data.reference), {
          userId,
          email: customerEmail,
          amount: data.amount,
          currency: data.currency || "NGN",
          status: "success",
          reference: data.reference,
          createdAt: new Date().toISOString()
        });
      }

      // Send confirmation email
      if (customerEmail) {
        await transporter.sendMail({
          from: `"VulnAI Billing" <${process.env.EMAIL_USER}>`,
          to: customerEmail,
          subject: "Payment Received - VulnAI Pro ✅",
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 40px 20px; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
                <div style="padding: 30px; text-align: center; border-bottom: 1px solid #30363d; background-color: #0d1117;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;"><span style="color: #ffffff;">Vuln</span><span style="color: #00d4ff;">AI</span></h1>
                </div>
                <div style="padding: 40px 30px; text-align: left;">
                  <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Payment Confirmed</h2>
                  <div style="color: #8b949e; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    <p>Amount: <span style="color:#ffffff;">₦${(data.amount / 100).toLocaleString()}</span></p>
                    <p>Reference: <span style="color:#ffffff;">${data.reference}</span></p>
                    <p>Your Pro access is active until <strong>${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>.</p>
                  </div>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://vulnai.com"}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #00d4ff; color: #0d1117; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
                </div>
                <div style="background-color: #0d1117; padding: 24px; text-align: center; border-top: 1px solid #30363d;">
                  <p style="color: #8b949e; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} VulnAI Security. All rights reserved.</p>
                </div>
              </div>
            </div>
          `,
        }).catch(console.error);
      }
    }

    // ─── SUBSCRIPTION CREATE ───────────────────────────────────────
    if (eventType === "subscription.create") {
      const customerEmail = data.customer?.email;
      const metadata = data.metadata || {};
      const userId = metadata.userId;
      const nextPaymentDate = data.next_payment_date;

      if (userId && nextPaymentDate) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          isPro: true,
          subscriptionExpiresAt: new Date(nextPaymentDate).toISOString(),
          paystackSubscriptionCode: data.subscription_code,
        });
      }
    }

    // ─── SUBSCRIPTION DISABLE (cancelled or failed) ────────────────
    if (eventType === "subscription.disable" || eventType === "subscription.not_renew") {
      const customerEmail = data.customer?.email;
      const metadata = data.metadata || {};
      const userId = metadata.userId;

      if (userId) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          isPro: false,
          subscriptionExpiresAt: null,
        });
      }

      if (customerEmail) {
        await transporter.sendMail({
          from: `"VulnAI Billing" <${process.env.EMAIL_USER}>`,
          to: customerEmail,
          subject: "VulnAI Pro Subscription Cancelled",
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 40px 20px; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
                <div style="padding: 30px; text-align: center; border-bottom: 1px solid #30363d; background-color: #0d1117;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;"><span style="color: #ffffff;">Vuln</span><span style="color: #00d4ff;">AI</span></h1>
                </div>
                <div style="padding: 40px 30px; text-align: left;">
                  <h2 style="color: #F85149; margin-top: 0; font-size: 22px; font-weight: 700;">Subscription Cancelled</h2>
                  <div style="color: #8b949e; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    <p>Your VulnAI Pro subscription has been cancelled. You've been moved to the Free tier.</p>
                    <p>You can re-subscribe at any time from the pricing page.</p>
                  </div>
                </div>
                <div style="background-color: #0d1117; padding: 24px; text-align: center; border-top: 1px solid #30363d;">
                  <p style="color: #8b949e; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} VulnAI Security. All rights reserved.</p>
                </div>
              </div>
            </div>
          `,
        }).catch(console.error);
      }
    }

    // ─── INVOICE PAYMENT FAILED ────────────────────────────────────
    if (eventType === "invoice.payment_failed") {
      const customerEmail = data.customer?.email;

      if (customerEmail) {
        await transporter.sendMail({
          from: `"VulnAI Billing" <${process.env.EMAIL_USER}>`,
          to: customerEmail,
          subject: "⚠️ VulnAI Payment Failed",
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 40px 20px; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
                <div style="padding: 30px; text-align: center; border-bottom: 1px solid #30363d; background-color: #0d1117;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;"><span style="color: #ffffff;">Vuln</span><span style="color: #00d4ff;">AI</span></h1>
                </div>
                <div style="padding: 40px 30px; text-align: left;">
                  <h2 style="color: #E3B341; margin-top: 0; font-size: 22px; font-weight: 700;">Payment Failed</h2>
                  <div style="color: #8b949e; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    <p>We were unable to charge your card for your VulnAI Pro subscription.</p>
                    <p>Please update your payment method to avoid service interruption.</p>
                  </div>
                </div>
                <div style="background-color: #0d1117; padding: 24px; text-align: center; border-top: 1px solid #30363d;">
                  <p style="color: #8b949e; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} VulnAI Security. All rights reserved.</p>
                </div>
              </div>
            </div>
          `,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
