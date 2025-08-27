import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white light:text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-300 light:text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <div className="flex justify-center">
          <SignIn 
            afterSignInUrl="/"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
}