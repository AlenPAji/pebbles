import "server-only";

import { ensureUserProfile } from "./user.service";

export async function requireVendor() {
  const profile = await ensureUserProfile();
  if (profile.role !== "vendor") {
    throw new Error("Vendor access required");
  }
  return profile;
}
