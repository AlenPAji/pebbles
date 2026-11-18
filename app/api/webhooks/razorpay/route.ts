import { NextResponse } from "next/server";
import {
  processCapture,
  validSignature,
} from "../../../../server/services/razorpay";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook secret missing" },
      { status: 503 },
    );
  const raw = await request.text();
  if (
    !validSignature(
      raw,
      request.headers.get("x-razorpay-signature") ?? "",
      secret,
    )
  )
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (event.event === "payment.captured") {
      const p = event.payload.payment.entity;
      await processCapture(p.order_id, p.id);
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Capture processing incomplete" },
      { status: 503 },
    );
  }
}
