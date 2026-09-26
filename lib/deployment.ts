export type DeploymentEnvironment = {
  DATABASE_URL?: string;
  SESSION_SECRET?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
};

function databaseUrlIsUsable(value: string | undefined) {
  if (!value || (!value.startsWith("mongodb://") && !value.startsWith("mongodb+srv://"))) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.pathname.length > 1;
  } catch {
    return false;
  }
}

export function deploymentConfigStatus(env: DeploymentEnvironment) {
  const checks = {
    databaseUrl: databaseUrlIsUsable(env.DATABASE_URL),
    sessionSecret: Boolean(env.SESSION_SECRET && env.SESSION_SECRET.length >= 32),
    geminiApiKey: Boolean(env.GEMINI_API_KEY && !env.GEMINI_API_KEY.startsWith("replace-")),
    geminiModel: /^[a-zA-Z0-9._-]{1,80}$/.test(env.GEMINI_MODEL?.trim() || "gemini-3.5-flash"),
  };
  return { ready: Object.values(checks).every(Boolean), checks };
}
