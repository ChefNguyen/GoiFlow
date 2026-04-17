import { SignInCard } from "@/features/auth/components/sign-in-card";
import { getEnabledAuthProviderDescriptors } from "@/server/auth/providers";

export default function SignInPage() {
  const providers = getEnabledAuthProviderDescriptors();

  return <SignInCard providers={providers} />;
}
