import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const profile = await db.collection("profiles").findOne({ userId: session.user.id });

    if (!profile) {
      return NextResponse.json({
        height: 0,
        weight: 0,
        age: 0,
        goal: "maintain",
        activityLevel: "moderate",
        calorieTarget: 0,
        isOnboarded: false,
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Database error or unconfigured MongoDB" }, { status: 200 }); // Return default gracefully if DB unconfigured
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, userId, ...profileData } = body;

    await db.collection("profiles").updateOne(
      { userId: session.user.id },
      { $set: { ...profileData, userId: session.user.id } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
