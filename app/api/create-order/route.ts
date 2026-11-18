import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureUserProfile } from "../../../server/services/user.service";
import {
  checkoutLines,
  checkoutAddress,
} from "../../../server/validators/checkout";
import { optionalId } from "../../../server/validators/catalog";
import { startCheckout } from "../../../server/repositories/checkout";
import {
  paymentError,
  paymentSession,
} from "../../../server/services/razorpay";

export async function POST(request: Request) {
  try {
    const user = await ensureUserProfile();
    const body = await request.json();
    const order = await startCheckout(
      user.id,
      optionalId(body.checkoutKey) ?? randomUUID(),
      checkoutLines(body.items ?? [body]),
      checkoutAddress(body.address),
    );
    return NextResponse.json(await paymentSession(order));
  } catch (error) {
    return paymentError(error);
  }
}
