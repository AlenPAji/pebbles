import "server-only";

import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";

export type UserProfileInput = {
  externalUserId: string;
  name: string | null;
  email: string | null;
};

export async function upsertUserProfile(input: UserProfileInput) {
  const [existingByExternalId] = await db
    .select()
    .from(users)
    .where(eq(users.externalUserId, input.externalUserId))
    .limit(1);

  if (existingByExternalId) {
    const [user] = await db
      .update(users)
      .set({
        name: input.name,
        email: input.email,
        deletedAt: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingByExternalId.id))
      .returning();
    return user;
  }

  if (input.email) {
    const [existingByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingByEmail) {
      const [user] = await db
        .update(users)
        .set({
          externalUserId: input.externalUserId,
          name: input.name,
          email: input.email,
          deletedAt: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingByEmail.id))
        .returning();
      return user;
    }
  }

  const [user] = await db
    .insert(users)
    .values(input)
    .onConflictDoUpdate({
      target: users.externalUserId,
      set: {
        name: input.name,
        email: input.email,
        deletedAt: null,
        updatedAt: new Date()
      }
    })
    .returning();

  return user;
}

export async function anonymizeUserProfile(externalUserId: string) {
  await db
    .update(users)
    .set({
      name: null,
      email: null,
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(users.externalUserId, externalUserId));
}

export async function findUserByExternalId(externalUserId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.externalUserId, externalUserId))
    .limit(1);

  return user ?? null;
}
