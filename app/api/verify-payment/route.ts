import { NextResponse } from "next/server";
import { ensureUserProfile } from "../../../server/services/user.service";
import { findOrderForUser } from "../../../server/repositories/product.repository";
import {
  paymentError,
  processCapture,
  validSignature,
} from "../../../server/services/razorpay";
import { InputError, optionalId } from "../../../server/validators/catalog";

export async function POST(request: Request) {
  try {
    const user = await ensureUserProfile();
    const body = await request.json();
    const id = optionalId(body.local_order_id);
    if (!id) throw new InputError("Missing order ID");
    const order = await findOrderForUser(id, user.id);
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const provider = order.providerOrderId ?? body.razorpay_order_id;
    if (
      !secret ||
      !provider ||
      provider !== body.razorpay_order_id ||
      !validSignature(
        provider + "|" + body.razorpay_payment_id,
        body.razorpay_signature ?? "",
        secret,
      )
    )
      throw new InputError("Invalid payment signature");
    const status = await processCapture(provider, body.razorpay_payment_id, id);
    if (status === "review")
      return NextResponse.json(
        {
          error:
            "Payment received and sent for review. Please do not pay again.",
          order_id: id,
        },
        { status: 409 },
      );
    return NextResponse.json({ success: true, order_id: id });
  } catch (error) {
    return paymentError(error);
  }
}
