import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Move initialization inside a helper function so it only runs when a request comes in
function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Missing Razorpay Environment Variables: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
  }

  return new Razorpay({ key_id, key_secret });
}

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Initialize dynamically per-request
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err: any) {
    console.error("Razorpay order creation failed:", JSON.stringify(err, null, 2));
    const description = err?.error?.description || err?.message || "Order creation failed";
    return NextResponse.json({ error: description }, { status: 500 });
  }
}