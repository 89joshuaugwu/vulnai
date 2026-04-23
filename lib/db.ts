import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, setDoc, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface SavedReport {
  id?: string;
  userId: string;
  scanType: string;
  reportContent: string;
  scanInputSnippet: string;
  createdAt: string;
}

export interface UserProfile {
  email: string | null;
  isAdmin: boolean;
  isPro: boolean;
  reportsGeneratedToday: number;
  lastReportDate: string | null;
  require2FA?: boolean;
  isSuspended?: boolean;
}

const FREE_DAILY_LIMIT = 3;

export async function getUserProfile(userId: string, email?: string): Promise<UserProfile> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  const today = new Date().toISOString().split("T")[0];

  if (!userSnap.exists()) {
    const newProfile: UserProfile = {
      email: email || null,
      isAdmin: false,
      isPro: false,
      reportsGeneratedToday: 0,
      lastReportDate: null,
      require2FA: false,
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }

  const data = userSnap.data() as UserProfile;
  let needsUpdate = false;
  const updates: Partial<UserProfile> = {};
  
  // Backfill email if missing
  if (email && !data.email) {
    updates.email = email;
    data.email = email;
    needsUpdate = true;
  }
  
  // Reset daily limit if it's a new day
  if (data.lastReportDate !== today) {
    updates.reportsGeneratedToday = 0;
    updates.lastReportDate = today;
    data.reportsGeneratedToday = 0;
    data.lastReportDate = today;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await updateDoc(userRef, updates);
  }

  return data;
}

export async function checkCanGenerateReport(userId: string | null, email?: string): Promise<{ allowed: boolean; remaining: number; isPro: boolean, isAdmin: boolean, require2FA: boolean, isSuspended: boolean, announcementBanner?: string }> {
  if (!userId) return { allowed: false, remaining: 0, isPro: false, isAdmin: false, require2FA: false, isSuspended: false };

  const [profile, settingsSnap] = await Promise.all([
    getUserProfile(userId, email),
    getDoc(doc(db, "settings", "global"))
  ]);

  const globalSettings = settingsSnap.exists() ? settingsSnap.data() : { maintenanceMode: false, freeTierLimit: 3, announcementBanner: "" };
  const banner = globalSettings.announcementBanner || undefined;

  if (profile.isAdmin) {
    return { allowed: true, remaining: 9999, isPro: true, isAdmin: true, require2FA: profile.require2FA || false, isSuspended: profile.isSuspended || false, announcementBanner: banner };
  }

  // Block normal users if maintenance mode is enabled
  if (globalSettings.maintenanceMode) {
    return { allowed: false, remaining: 0, isPro: profile.isPro, isAdmin: false, require2FA: profile.require2FA || false, isSuspended: true, announcementBanner: banner };
  }

  if (profile.isPro) {
    return { allowed: true, remaining: 9999, isPro: true, isAdmin: false, require2FA: profile.require2FA || false, isSuspended: profile.isSuspended || false, announcementBanner: banner };
  }

  const remaining = globalSettings.freeTierLimit - profile.reportsGeneratedToday;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining), isPro: false, isAdmin: false, require2FA: profile.require2FA || false, isSuspended: profile.isSuspended || false, announcementBanner: banner };
}

// ── ADMIN FUNCTIONS ──────────────────────────────────────────

export async function getAllUsers(): Promise<(UserProfile & { id: string })[]> {
  const querySnapshot = await getDocs(collection(db, "users"));
  const users: (UserProfile & { id: string })[] = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() } as UserProfile & { id: string });
  });
  return users;
}

export async function toggleProStatus(userId: string, currentStatus: boolean) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    isPro: !currentStatus
  });
}

export async function claimAdminStatus(userId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    isAdmin: true,
    isPro: true // Admins should probably be pro too
  });
}

export async function logAuditAction(adminId: string, adminEmail: string, action: string, details: string) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminId,
      adminEmail,
      action,
      details,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to log audit action", e);
  }
}

export async function saveReportToFirestore(report: Omit<SavedReport, "id">) {
  try {
    const docRef = await addDoc(collection(db, "reports"), report);
    
    // Increment the user's daily usage count
    const userRef = doc(db, "users", report.userId);
    await updateDoc(userRef, {
      reportsGeneratedToday: increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error("Error saving report:", error);
    throw error;
  }
}

export async function toggle2FA(uid: string, current: boolean) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { require2FA: !current });
}

export async function getUserReports(userId: string): Promise<SavedReport[]> {
  try {
    const q = query(
      collection(db, "reports"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const reports: SavedReport[] = [];
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as SavedReport);
    });
    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}

export async function getAllReportsAdmin(): Promise<SavedReport[]> {
  try {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const reports: SavedReport[] = [];
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as SavedReport);
    });
    return reports;
  } catch (error) {
    console.error("Error fetching all reports:", error);
    throw error;
  }
}

export async function saveOtpToFirestore(email: string, code: string) {
  // Save OTP with 10 minute expiration
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await setDoc(doc(db, "otps", email), {
    code,
    expiresAt,
    createdAt: new Date().toISOString()
  });
}

export async function verifyOtpFromFirestore(email: string, code: string): Promise<boolean> {
  const otpRef = doc(db, "otps", email);
  const otpSnap = await getDoc(otpRef);
  
  if (!otpSnap.exists()) return false;
  
  const data = otpSnap.data();
  const now = new Date().toISOString();
  
  if (data.code === code && data.expiresAt > now) {
    // Delete OTP completely after successful use
    await deleteDoc(otpRef);
    return true;
  }
  
  return false;
}
