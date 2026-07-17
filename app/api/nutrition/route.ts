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
    const foodLogs = await db
      .collection("nutrition")
      .find({ userId: session.user.id })
      .sort({ date: -1, _id: -1 })
      .toArray();

    return NextResponse.json(foodLogs);
  } catch (error: any) {
    console.error("GET /api/nutrition error:", error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
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

    const { id, name, calories, date } = body;

    await db.collection("nutrition").insertOne({
      id,
      userId: session.user.id,
      name,
      calories,
      date,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/nutrition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    await db.collection("nutrition").deleteOne({ id, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/nutrition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
