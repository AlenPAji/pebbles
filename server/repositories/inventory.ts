import { and, eq, inArray, sql } from "drizzle-orm";
import { inventoryReservations, productVariants } from "../db/schema";
import type { WriteTransaction } from "../db/transaction";

export class Conflict extends Error {}

export const availableStock = sql<number>`(${productVariants.stockQuantity} - coalesce((
  select sum(r.quantity) from inventory_reservations r
  where r.variant_id = ${productVariants.id} and r.status = 'reserved'
    and r.expires_at > clock_timestamp()
), 0))::integer`;

// Acquire every variant lock in the same order in checkout, capture and catalogue edits.
// Run the reservation aggregate as a separate statement after acquiring these locks
// so READ COMMITTED sees reservations committed by a previous lock holder.
export async function lockVariants(tx: WriteTransaction, ids: string[]) {
  if (!ids.length) return;
  await tx
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(inArray(productVariants.id, ids))
    .orderBy(productVariants.id)
    .for("update");
}

export async function heldQuantities(
  tx: WriteTransaction,
  ids: string[],
  exceptOrder?: string,
) {
  if (!ids.length) return new Map<string, number>();
  const r = inventoryReservations;
  const rows = await tx
    .select({ id: r.variantId, held: sql<number>`sum(${r.quantity})::integer` })
    .from(r)
    .where(
      and(
        inArray(r.variantId, ids),
        eq(r.status, "reserved"),
        sql`${r.expiresAt} > clock_timestamp()`,
        exceptOrder ? sql`${r.orderId} <> ${exceptOrder}` : undefined,
      ),
    )
    .groupBy(r.variantId);
  return new Map(rows.map((row) => [row.id, row.held]));
}
