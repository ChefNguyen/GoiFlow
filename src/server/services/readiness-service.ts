const requiredKeys = ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"] as const;

export function getReadinessSnapshot(input: NodeJS.ProcessEnv = process.env) {
  const requirements = requiredKeys.map((key) => ({
    key,
    configured: Boolean(input[key]),
  }));

  return {
    service: "goiflow",
    ready: requirements.every((item) => item.configured),
    requirements,
  };
}
