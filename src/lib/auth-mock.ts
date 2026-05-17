import { headers } from "next/headers";
import { mockDb } from "@/lib/db/mockDb";

/**
 * Returns the authenticated user for the current request.
 * In this Clerk-free prototype, we read the active profile from the 'x-user-id' header.
 * Defaults to 'user-1001' (Dave, our lead tractor operator) for seamless out-of-the-box previewing.
 */
export async function getCurrentUser() {
  const reqHeaders = await headers();
  const userId = reqHeaders.get("x-user-id");
  
  if (!userId) {
    return mockDb.getUserById("user-1001") || mockDb.getUsers()[0];
  }
  
  const user = mockDb.getUserById(userId);
  if (!user) {
    return mockDb.getUserById("user-1001") || mockDb.getUsers()[0];
  }
  
  return user;
}
