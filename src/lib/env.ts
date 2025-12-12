export type PublicFirebaseEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

const requiredKeys: (keyof PublicFirebaseEnv)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

export function getFirebaseEnv(): PublicFirebaseEnv {
  const env = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  } satisfies PublicFirebaseEnv;

  const missing = requiredKeys.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing Firebase env var${missing.length > 1 ? "s" : ""}: ${missing
        .map((key) => key.replace("authDomain", "auth domain"))
        .join(", ")}`,
    );
  }

  return env;
}
