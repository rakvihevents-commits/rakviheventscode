import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err: any) {
    // ✅ Razorpay's SDK rejects with { statusCode, error: { code, description } },
    // not a plain Error — err.message is usually undefined, which is why you
    // were only ever seeing the generic fallback string.
    console.error("Razorpay order creation failed:", JSON.stringify(err, null, 2));
    const description = err?.error?.description || err?.message || "Order creation failed";
    return NextResponse.json({ error: description }, { status: 500 });
  }
}