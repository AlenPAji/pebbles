"use server";

import { requireUser } from "../../server/auth/require-user";
import { getAuthenticatedExample } from "../../server/services/example";

export async function getAuthenticatedExampleAction() {
  const userId = await requireUser();
  return getAuthenticatedExample(userId);
}
