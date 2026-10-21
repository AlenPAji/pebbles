import { headers } from "next/headers";
import { Webhook } from "svix";

import {
  anonymizeUserProfile,
  upsertUserProfile
} from "../../../../server/repositories/user.repository";

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserEvent = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ClerkWebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserEvent;
};

function isClerkWebhookEvent(value: unknown): value is ClerkWebhookEvent {
  if (!value || typeof value !== "object") return false;

  const event = value as Partial<ClerkWebhookEvent>;
  return (
    (event.type === "user.created" ||
      event.type === "user.updated" ||
      event.type === "user.deleted") &&
    !!event.data &&
    typeof event.data === "object" &&
    typeof event.data.id === "string"
  );
}

function getUserName(data: ClerkUserEvent) {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return fullName || data.username || null;
}

function getPrimaryEmail(data: ClerkUserEvent) {
  return (
    data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id
    )?.email_address ?? null
  );
}

export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return Response.json(
      { error: "Webhook signing secret is not configured" },
      { status: 503 }
    );
  }

  const requestHeaders = await headers();
  const svixHeaders = {
    "svix-id": requestHeaders.get("svix-id") ?? "",
    "svix-timestamp": requestHeaders.get("svix-timestamp") ?? "",
    "svix-signature": requestHeaders.get("svix-signature") ?? ""
  };

  let event: unknown;
  try {
    const payload = await request.text();
    event = new Webhook(signingSecret).verify(payload, svixHeaders);
  } catch {
    return Response.json({ error: "Invalid webhook signature or payload" }, { status: 400 });
  }

  if (!isClerkWebhookEvent(event)) {
    return Response.json({ error: "Invalid webhook payload" }, { status: 422 });
  }

  try {
    if (event.type === "user.deleted") {
      await anonymizeUserProfile(event.data.id);
    } else {
      await upsertUserProfile({
        externalUserId: event.data.id,
        name: getUserName(event.data),
        email: getPrimaryEmail(event.data)
      });
    }

    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
