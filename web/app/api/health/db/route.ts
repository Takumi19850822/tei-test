import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const diagnostics: Record<string, unknown> = {
      url: supabaseUrl ?? null,
      hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    };

    if (supabaseUrl && supabaseServiceRoleKey) {
      const healthResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      });
      diagnostics.authHealthStatus = healthResponse.status;
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase API call failed.",
          details: error.message,
          diagnostics,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Supabase connection is healthy.",
        diagnostics,
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
        diagnostics: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
          hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        },
      },
      { status: 500 },
    );
  }
}
