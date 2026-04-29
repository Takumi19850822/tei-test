import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase API call failed.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Supabase connection is healthy.",
      },
      { status: 200 },
    );
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        message: "Supabase health check failed.",
        details,
      },
      { status: 500 },
    );
  }
}
