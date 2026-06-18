type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

type SupabaseAdminConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
};

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getJwtRole(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(Buffer.from(normalizedPayload, "base64").toString("utf8")) as {
      role?: string;
    };

    return decodedPayload.role ?? null;
  } catch {
    return null;
  }
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  const role = getJwtRole(serviceRoleKey);

  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY must be a service_role key, but received a ${role} key. ` +
        "Get the secret service role key from Supabase project settings and keep it only in .env.local."
    );
  }

  return {
    ...getSupabasePublicConfig(),
    serviceRoleKey
  };
}
