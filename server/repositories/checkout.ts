import { createHash } from "node:crypto";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { writeDb, type WriteTransaction } from "../db/transaction";
import {
  products,
  productColors,
  productVariants,
  inventoryReservations as reservations,
  orders,
  orderItems,
  orderAddresses,
  payments,
  paymentReviews,
} from "../db/schema";
import { Conflict, heldQuantities, lockVariants } from "./inventory";
import {
  checkoutAddress,
  checkoutLines,
  paise,
  rupees,
  type CheckoutLine,
} from "../validators/checkout";

type Address = ReturnType<typeof checkoutAddress>;
type Order = typeof orders.$inferSelect;
type Tx = WriteTransaction;
const expiry = sql`clock_timestamp() + interval '15 minutes'`;

async function lockedOrder(tx: Tx, id: string) {
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .for("no key update");
  if (!order) throw new Conflict("Order not found");
  return order;
}

async function checkPayable(tx: Tx, order: Order) {
  const [review] = await tx
    .select({ id: paymentReviews.paymentId })
    .from(paymentReviews)
    .where(eq(paymentReviews.orderId, order.id))
    .limit(1);
  if (review)
    throw new Conflict("Payment received. This order is under review.");
  const [paid] = await tx
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(eq(payments.orderId, order.id), eq(payments.status, "succeeded")),
    )
    .limit(1);
  if (paid) throw new Conflict("Payment already received for this order");
  if (order.status !== "pending_payment")
    throw new Conflict("This order is no longer awaiting payment");
}

async function reserve(tx: Tx, orderId: string, lines: CheckoutLine[]) {
  const ids = lines.map((l) => l.variantId);
  await lockVariants(tx, ids);
  const rows = await tx
    .select({
      id: productVariants.id,
      productId: products.id,
      productName: products.name,
      colorName: productColors.name,
      colorHex: productColors.hex,
      sku: productVariants.sku,
      size: productVariants.size,
      stock: productVariants.stockQuantity,
      unitPrice: sql<string>`coalesce(${productVariants.priceOverride},${products.price})`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(
      productColors,
      eq(productColors.id, productVariants.productColorId),
    )
    .where(
      and(
        inArray(productVariants.id, ids),
        isNull(products.deletedAt),
        isNull(productVariants.deletedAt),
        isNull(productColors.deletedAt),
      ),
    );
  const held = await heldQuantities(tx, ids, orderId);
  const snapshots = lines.map((line) => {
    const row = rows.find(
      (r) => r.id === line.variantId && r.productId === line.productId,
    );
    if (!row || row.stock - (held.get(row.id) ?? 0) < line.quantity)
      throw new Conflict(
        "Insufficient stock or unavailable variant. Review your bag.",
      );
    if (line.unitPaise !== undefined && line.unitPaise !== paise(row.unitPrice))
      throw new Conflict(
        "A price has changed. Refresh your bag before paying.",
      );
    return {
      orderId,
      productId: row.productId,
      variantId: row.id,
      productName: row.productName,
      colorName: row.colorName,
      colorHex: row.colorHex,
      sku: row.sku,
      size: row.size,
      quantity: line.quantity,
      unitPrice: row.unitPrice,
    };
  });
  for (const line of lines) {
    await tx
      .insert(reservations)
      .values({
        orderId,
        variantId: line.variantId,
        quantity: line.quantity,
        status: "reserved",
        expiresAt: expiry,
      })
      .onConflictDoUpdate({
        target: [reservations.orderId, reservations.variantId],
        set: { quantity: line.quantity, status: "reserved", expiresAt: expiry },
      });
  }
  return snapshots;
}

async function renew(tx: Tx, order: Order) {
  await checkPayable(tx, order);
  const rows = await tx
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  if (
    !rows.length ||
    rows.reduce((n, i) => n + paise(i.unitPrice) * i.quantity, 0) !==
      paise(order.subtotal) ||
    paise(order.subtotal) + paise(order.shippingAmount) !==
      paise(order.totalAmount)
  )
    throw new Conflict("The shop needs to review this order before payment.");
  const legacy = rows.filter((i) => !i.variantId);
  if (legacy.length) {
    const productIds = Array.from(new Set(rows.map((i) => i.productId)));
    const available = await tx
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));
    await lockVariants(
      tx,
      available.map((v) => v.id),
    );
    const variants = await tx
      .select()
      .from(productVariants)
      .where(
        and(
          inArray(productVariants.productId, productIds),
          isNull(productVariants.deletedAt),
        ),
      );
    for (const item of legacy) {
      const match = variants.filter(
        (v) =>
          v.productId === item.productId &&
          v.sku === item.sku &&
          v.size === item.size,
      );
      if (match.length !== 1)
        throw new Conflict(
          "A size in this earlier order needs a stock review. Contact the shop.",
        );
      item.variantId = match[0].id;
      await tx
        .update(orderItems)
        .set({ variantId: item.variantId })
        .where(eq(orderItems.id, item.id));
    }
  }
  await reserve(
    tx,
    order.id,
    checkoutLines(
      rows.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    ),
  );
  return order;
}

export async function startCheckout(
  userId: string,
  key: string,
  lines: CheckoutLine[],
  address: Address,
) {
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ lines, address }))
    .digest("hex");
  return writeDb.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        checkoutKey: key,
        requestHash,
        subtotal: "0",
        shippingAmount: "0",
        totalAmount: "0",
      })
      .onConflictDoNothing({ target: [orders.userId, orders.checkoutKey] })
      .returning();
    if (!order) {
      const [existing] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), eq(orders.checkoutKey, key)))
        .for("no key update");
      if (existing.requestHash !== requestHash)
        throw new Conflict("Checkout details changed. Start a new checkout.");
      return renew(tx, existing);
    }
    const items = await reserve(tx, order.id, lines);
    const total = items.reduce(
      (sum, item) => sum + paise(item.unitPrice) * item.quantity,
      0,
    );
    if (total < 100) throw new Conflict("Minimum order amount is ₹1");
    const totalAmount = rupees(total);
    await tx.insert(orderItems).values(items);
    await tx.insert(orderAddresses).values({ ...address, orderId: order.id });
    const [saved] = await tx
      .update(orders)
      .set({ subtotal: totalAmount, totalAmount })
      .where(eq(orders.id, order.id))
      .returning();
    return saved;
  });
}

export async function retryCheckout(id: string, userId: string) {
  return writeDb.transaction(async (tx) => {
    const order = await lockedOrder(tx, id);
    if (order.userId !== userId) throw new Conflict("Order not found");
    return renew(tx, order);
  });
}

export async function bindProviderOrder(id: string, providerId: string) {
  return writeDb.transaction(async (tx) => {
    const order = await lockedOrder(tx, id);
    await checkPayable(tx, order);
    if (order.providerOrderId) return order.providerOrderId;
    await tx
      .update(orders)
      .set({ providerOrderId: providerId })
      .where(eq(orders.id, id));
    return providerId;
  });
}

// Called only after Razorpay capture, amount, currency, order and receipt verification.
export async function recordCapture(
  id: string,
  providerId: string,
  paymentId: string,
  amount: number,
) {
  return writeDb.transaction(async (tx) => {
    const order = await lockedOrder(tx, id);
    const [previous] = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.provider, "razorpay"),
          eq(payments.providerPaymentId, paymentId),
        ),
      );
    if (
      previous?.status === "succeeded" &&
      previous.orderId === id &&
      paise(previous.amount) === amount
    )
      return "confirmed" as const;
    const [review] = await tx
      .select()
      .from(paymentReviews)
      .where(eq(paymentReviews.paymentId, paymentId));
    if (review) return "review" as const;
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    const ids = items.flatMap((i) => (i.variantId ? [i.variantId] : []));
    await lockVariants(tx, ids);
    const holds = await tx
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.orderId, id),
          eq(reservations.status, "reserved"),
          sql`${reservations.expiresAt} > clock_timestamp()`,
        ),
      );
    const required = new Map<string, number>();
    for (const item of items)
      if (item.variantId)
        required.set(
          item.variantId,
          (required.get(item.variantId) ?? 0) + item.quantity,
        );
    let reason: string | undefined;
    if (
      order.providerOrderId !== providerId ||
      paise(order.totalAmount) !== amount ||
      previous
    )
      reason = "Capture does not match the stored payment reference";
    else if (order.status !== "pending_payment")
      reason = "Capture received for a closed order";
    else if (
      !items.length ||
      items.some((i) => !i.variantId) ||
      holds.length !== required.size ||
      !holds.every((r) => required.get(r.variantId) === r.quantity)
    )
      reason = "Reservation expired or unavailable";
    if (reason) {
      await tx
        .insert(paymentReviews)
        .values({
          orderId: id,
          paymentId,
          providerOrderId: providerId,
          amount: rupees(amount),
          reason,
        });
      return "review" as const;
    }
    for (const hold of holds) {
      const [row] = await tx
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity}-${hold.quantity}`,
        })
        .where(
          and(
            eq(productVariants.id, hold.variantId),
            sql`${productVariants.stockQuantity} >= ${hold.quantity}`,
          ),
        )
        .returning({ id: productVariants.id });
      if (!row) throw new Conflict("Reserved stock changed unexpectedly");
    }
    await tx
      .update(reservations)
      .set({ status: "consumed" })
      .where(
        and(eq(reservations.orderId, id), eq(reservations.status, "reserved")),
      );
    await tx
      .insert(payments)
      .values({
        orderId: id,
        provider: "razorpay",
        providerPaymentId: paymentId,
        amount: rupees(amount),
        status: "succeeded",
      });
    await tx
      .update(orders)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(orders.id, id));
    return "confirmed" as const;
  });
}

export async function changeOrderStatus(
  id: string,
  input: Pick<Order, "status"> &
    Partial<Pick<Order, "shippingCarrier" | "trackingNumber" | "trackingUrl">>,
) {
  return writeDb.transaction(async (tx) => {
    const order = await lockedOrder(tx, id);
    const transitions: Record<Order["status"], Order["status"][]> = {
      pending_payment: ["cancelled"],
      confirmed: ["shipped"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    if (
      input.status !== order.status &&
      !transitions[order.status].includes(input.status)
    )
      throw new Conflict("Invalid order status transition");
    if (input.status === "cancelled" && order.status !== "cancelled") {
      await checkPayable(tx, order);
      await tx
        .update(reservations)
        .set({ status: "released" })
        .where(
          and(
            eq(reservations.orderId, id),
            eq(reservations.status, "reserved"),
          ),
        );
    }
    const [saved] = await tx
      .update(orders)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return saved;
  });
}
