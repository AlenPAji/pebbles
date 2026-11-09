"use client";

import { FormEvent, useState } from "react";

type Status = "pending_payment" | "confirmed" | "shipped" | "delivered" | "cancelled";

export function OrderStatusForm({ orderId, initialStatus, initialShippingCarrier, initialTrackingNumber, initialTrackingUrl }: { orderId: string; initialStatus: Status; initialShippingCarrier?: string | null; initialTrackingNumber?: string | null; initialTrackingUrl?: string | null }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [shippingCarrier, setShippingCarrier] = useState(initialShippingCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, shippingCarrier, trackingNumber, trackingUrl })
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to update status");
      setMessage("Status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update status");
    } finally {
      setSaving(false);
    }
  };

  return <form className="admin-form" onSubmit={submit}><h2>Update order status</h2><label className="field"><span>Order status</span><select value={status} onChange={(event) => setStatus(event.target.value as Status)}><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label><div className="shipment-fields"><p className="form-note">Add tracking details when the order is shipped.</p><label className="field"><span>Shipping carrier</span><input value={shippingCarrier} onChange={(event) => setShippingCarrier(event.target.value)} placeholder="e.g. India Post" /></label><label className="field"><span>Tracking number</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Enter tracking number" /></label><label className="field"><span>Tracking link <small>(optional)</small></span><input type="url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://carrier.example/track/..." /></label></div><button className="admin-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save status"} →</button>{message && <p role="status" aria-live="polite" className={message === "Status updated." ? "form-success" : "form-error"}>{message}</p>}</form>;
}
