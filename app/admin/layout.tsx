import { redirect } from "next/navigation";

import { ensureUserProfile } from "../../server/services/user.service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const profile = await ensureUserProfile();
    if (profile.role !== "vendor") redirect("/profile");
    return children;
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      redirect("/login");
    }
    throw error;
  }
}
