import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-secret-key");

    if (secret !== process.env.SECRET_KEY) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const body = await req.json();
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json({ success: false, message: "No telegramId" });
    }

    // TODO: Database coin add logic (temporary success)
    const earnedCoins = 10;

    return NextResponse.json({
      success: true,
      coins: earnedCoins,
      telegramId: telegramId,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
