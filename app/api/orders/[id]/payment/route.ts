import { NextResponse } from "next/server";
import { ensureUserProfile } from "../../../../../server/services/user.service";
import { retryCheckout } from "../../../../../server/repositories/checkout";
import { paymentError,paymentSession } from "../../../../../server/services/razorpay";

export async function POST(_:Request,{params}:{params:{id:string}}) {
  try {
    const user=await ensureUserProfile();
    return NextResponse.json(await paymentSession(await retryCheckout(params.id,user.id)));
  } catch(error) { return paymentError(error); }
}
