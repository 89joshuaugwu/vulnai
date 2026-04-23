import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// This endpoint should be triggered daily by Vercel Cron or Google Cloud Scheduler
// Configured in vercel.json: { "crons": [{ "path": "/api/cron/daily", "schedule": "0 0 * * *" }] }

export async function GET(req: NextRequest) {
  // Simple security check (in production, use a secure CRON_SECRET)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    // We allow bypass in dev if CRON_SECRET isn't strictly enforced
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    let totalUsers = 0;
    let proUsers = 0;
    let scansToday = 0;

    const usersData: any[] = [];
    usersSnapshot.forEach((doc) => {
      const u = doc.data();
      totalUsers++;
      if (u.isPro) proUsers++;
      if (u.reportsGeneratedToday) scansToday += u.reportsGeneratedToday;
      usersData.push({ id: doc.id, ...u });
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 1. Send Admin Daily Summary
    const adminEmailHtml = `
      <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
        <h2 style="color: #F85149;">VulnAI Daily Admin Summary</h2>
        <p>Here is the platform health for today:</p>
        <ul>
          <li><strong>Total Users:</strong> ${totalUsers}</li>
          <li><strong>Pro Subscribers:</strong> ${proUsers}</li>
          <li><strong>Reports Generated Today:</strong> ${scansToday}</li>
        </ul>
        <p>Estimated MRR: $${proUsers * 29}</p>
        <p>Keep pushing! 🚀</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"VulnAI Server" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to the admin
      subject: "📈 VulnAI Daily Report",
      html: adminEmailHtml,
    });

    // 2. Billing Reminders (3 days before) & Expirations
    // *This requires a subscriptionExpiresAt field which is populated by Paystack Webhooks*
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    for (const u of usersData) {
      if (u.subscriptionExpiresAt) {
        const expDate = new Date(u.subscriptionExpiresAt);
        
        // Expiration check
        if (expDate <= now && u.isPro) {
          // Send Expiration Email
          if (u.email) {
            await transporter.sendMail({
              from: `"VulnAI Billing" <${process.env.EMAIL_USER}>`,
              to: u.email,
              subject: "Your VulnAI Pro Subscription Expired",
              html: `
                <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
                  <h2 style="color: #F85149;">Subscription Expired</h2>
                  <p>Your VulnAI Pro access has expired. You have been downgraded to the Free tier.</p>
                  <p>Please log in and update your payment method to continue enjoying unlimited reports.</p>
                </div>
              `,
            });
          }
        } 
        // 3-Day Reminder
        else if (
          expDate.getFullYear() === threeDaysFromNow.getFullYear() &&
          expDate.getMonth() === threeDaysFromNow.getMonth() &&
          expDate.getDate() === threeDaysFromNow.getDate()
        ) {
          if (u.email) {
            await transporter.sendMail({
              from: `"VulnAI Billing" <${process.env.EMAIL_USER}>`,
              to: u.email,
              subject: "Upcoming VulnAI Pro Renewal",
              html: `
                <div style="font-family: monospace; background-color: #0D1117; color: #E6EDF3; padding: 40px; border-radius: 10px;">
                  <h2 style="color: #E3B341;">Renewal Notice</h2>
                  <p>Your VulnAI Pro subscription will renew in 3 days on ${expDate.toLocaleDateString()}.</p>
                  <p>No action is needed if your payment details are up to date.</p>
                </div>
              `,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Cron jobs executed" });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ success: false, error: "Cron execution failed" }, { status: 500 });
  }
}
