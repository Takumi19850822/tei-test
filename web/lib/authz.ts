import { createSupabaseAdminClient } from "@/lib/supabase";

type AccessResult = {
  ok: boolean;
  status: 200 | 401 | 403 | 500;
  message?: string;
  actorUserId?: string;
};

const MENU_PERMISSIONS = {
  cases: "cases",
  estimates: "estimates",
  orders: "orders",
  smallOrders: "small-orders",
  estimateLines: "estimate-lines",
  orderLines: "order-lines",
  manufacturingJobs: "manufacturing-jobs",
  diecutSpecs: "diecut-specs",
  lcSpecs: "lc-specs",
  customers: "customers",
  customerBranches: "customer-branches",
  customerContacts: "customer-contacts",
  billingInfos: "billing-infos",
  deliveryDestinations: "delivery-destinations",
  taxRates: "tax-rates",
  invoices: "invoices",
  staff: "staff",
} as const;

export type MenuPermissionKey = keyof typeof MENU_PERMISSIONS;

export async function ensureMenuAccess(
  request: Request,
  menu: MenuPermissionKey,
  requiredLevel: 1 | 2 | 3,
): Promise<AccessResult> {
  const loginId = request.headers.get("x-login-id");
  if (!loginId) {
    return {
      ok: false,
      status: 401,
      message: "x-login-idヘッダが必要です。",
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, group_id, is_active")
      .eq("login_id", loginId)
      .maybeSingle();

    if (userError) {
      return {
        ok: false,
        status: 500,
        message: `ユーザー取得失敗: ${userError.message}`,
      };
    }

    if (!user || !user.is_active) {
      return {
        ok: false,
        status: 401,
        message: "有効なユーザーが見つかりません。",
      };
    }

    if (!user.group_id) {
      return {
        ok: false,
        status: 403,
        message: "ユーザーにグループが紐づいていません。",
      };
    }

    const menuId = MENU_PERMISSIONS[menu];
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("permission_level")
      .eq("group_id", user.group_id)
      .eq("menu_id", menuId)
      .maybeSingle();

    if (roleError) {
      return {
        ok: false,
        status: 500,
        message: `権限取得失敗: ${roleError.message}`,
      };
    }

    const permissionLevel = role?.permission_level ?? 1;
    if (permissionLevel < requiredLevel) {
      return {
        ok: false,
        status: 403,
        message: "権限が不足しています。",
      };
    }

    return { ok: true, status: 200, actorUserId: user.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, status: 500, message };
  }
}
