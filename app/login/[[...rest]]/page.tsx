import { SignIn } from "@clerk/nextjs";

export default function LoginPage({ searchParams }: { searchParams: { redirect_url?: string } }) {
  const redirectUrl = searchParams.redirect_url?.startsWith("/") ? searchParams.redirect_url : "/";
  return <main className="clerk-auth-page"><SignIn path="/login" routing="path" signUpUrl="/register" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} /></main>;
}
