import { cookies } from "next/headers";

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("auth-session");
  return session?.value === "authenticated";
}

