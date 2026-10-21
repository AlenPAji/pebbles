import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import {
  findUserByExternalId,
  upsertUserProfile,
  type UserProfileInput
} from "../repositories/user.repository";

export async function ensureUserProfile() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Unable to load authenticated user");
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  )?.emailAddress ?? null;
  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || clerkUser.username || null;

  const existingUser = await findUserByExternalId(userId);
  if (existingUser) return existingUser;

  return upsertUserProfile({
    externalUserId: userId,
    name,
    email: primaryEmail
  });
}

export async function syncUserProfile(input: UserProfileInput) {
  return upsertUserProfile(input);
}
