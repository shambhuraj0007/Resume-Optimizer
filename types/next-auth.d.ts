
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionStatus?: string | null;
      hasCompletedOnboarding?: boolean;
      hasCompletedAtsOnboarding?: boolean;
      hasCompletedOptimizedResumeOnboarding?: boolean;
      isNewUser?: boolean;
      justLoggedIn?: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    subscriptionStatus?: string | null;
    subscriptionProvider?: string | null;
    hasCompletedOnboarding?: boolean;
    hasCompletedAtsOnboarding?: boolean;
    hasCompletedOptimizedResumeOnboarding?: boolean;
    isNewUser?: boolean;
    justLoggedIn?: boolean;
  }
}
