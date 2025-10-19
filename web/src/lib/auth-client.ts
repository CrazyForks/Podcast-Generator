import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const { signIn, signUp, signOut, useSession, updateUser, changeEmail, changePassword} =
  createAuthClient({
    plugins: [usernameClient()],
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    fetchOptions: {
      onError: (ctx) => {
        console.error('Auth client error:', ctx.error);
      },
    },
  });