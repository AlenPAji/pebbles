import { NextResponse } from "next/server";

import { findAdminOrder, type AdminOrderStatus } from "../../../../../server/repositories/product.repository";
import { requireVendor } from "../../../../../server/services/vendor.service";

import { changeOrderStatus } from "../../../../../server/repositories/checkout";
import { Conflict } from "../../../../../server/repositories/inventory";

const statuses: AdminOrderStatus[] = ["pending_payment", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await requireVendor();
  const body = await request.json() as {
    status?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  if (!body.status || !statuses.includes(body.status as AdminOrderStatus)) {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }
  const shippingCarrier = body.shippingCarrier?.trim() || null;
  const trackingNumber = body.trackingNumber?.trim() || null;
  const trackingUrl = body.trackingUrl?.trim() || null;
  if (trackingUrl) {
    try {
      const url = new URL(trackingUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ error: "Tracking URL must be a valid http or https URL" }, { status: 400 });
    }
  }
  if (body.status === "shipped" && (!shippingCarrier || !trackingNumber)) {
    return NextResponse.json({ error: "Carrier and tracking number are required when shipping an order" }, { status: 400 });
  }
  try {
  const order = await changeOrderStatus(params.id, {
    status: body.status as AdminOrderStatus,
    shippingCarrier,
    trackingNumber,
    trackingUrl
  });
  return order ? NextResponse.json(order) : NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof Conflict) return NextResponse.json({error:error.message},{status:409});
    throw error;
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireVendor();
  const order = await findAdminOrder(params.id);
  return order ? NextResponse.json(order) : NextResponse.json({ error: "Order not found" }, { status: 404 });
}
