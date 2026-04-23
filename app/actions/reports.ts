"use server";

import { adminDb } from "@/lib/firebase-admin";
import { encrypt, decrypt } from "@/lib/crypto";

export async function saveReportSecurely(userId: string, scanType: string, reportContent: string, rawScanInput: string) {
  try {
    const encryptedInput = encrypt(rawScanInput);
    
    const docRef = await adminDb.collection("reports").add({
      userId,
      scanType,
      reportContent,
      scanInputSnippet: encryptedInput, // We save the encrypted full input here for future iterations
      createdAt: new Date().toISOString()
    });

    // Increment user usage
    const userRef = adminDb.collection("users").doc(userId);
    await userRef.update({
      reportsGeneratedToday: adminDb.FieldValue.increment(1)
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error securely saving report:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserReportsSecurely(userId: string) {
  try {
    const snapshot = await adminDb.collection("reports")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
      
    const reports = snapshot.docs.map(doc => {
      const data = doc.data();
      // Decrypt the input snippet
      const decryptedInput = decrypt(data.scanInputSnippet || "");
      // Just take first 100 chars for the snippet in the UI
      const snippet = decryptedInput.substring(0, 100) + (decryptedInput.length > 100 ? "..." : "");
      
      return {
        id: doc.id,
        ...data,
        scanInputSnippet: snippet,
        fullScanInput: decryptedInput
      };
    });
    
    return { success: true, reports };
  } catch (error: any) {
    console.error("Error fetching secure reports:", error);
    return { success: false, error: error.message };
  }
}
