import { NextResponse } from "next/server";
import { getHealthResponse } from "@/services/server/health.service";

export async function GET() {
  return NextResponse.json(getHealthResponse());
}

