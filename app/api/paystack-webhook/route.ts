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
      }

      // Send confirmation email
      if (customerEmail) {
        await transporter.sendMail({
          from: `"VulnAI Billing" <${process.env.EMAIL_USER}>`,
          to: customerEmail,
          subject: "Payment Received - VulnAI Pro ✅",
          html: `
            <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
              <h2 style="color: #3FB950;">Payment Confirmed</h2>
              <p>Amount: ₦${(data.amount / 100).toLocaleString()}</p>
              <p>Reference: ${data.reference}</p>
              <p>Your Pro access is active until <strong>${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>.</p>
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
            <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
              <h2 style="color: #F85149;">Subscription Cancelled</h2>
              <p>Your VulnAI Pro subscription has been cancelled. You've been moved to the Free tier.</p>
              <p>You can re-subscribe at any time from the pricing page.</p>
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
            <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
              <h2 style="color: #E3B341;">Payment Failed</h2>
              <p>We were unable to charge your card for your VulnAI Pro subscription.</p>
              <p>Please update your payment method to avoid service interruption.</p>
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
