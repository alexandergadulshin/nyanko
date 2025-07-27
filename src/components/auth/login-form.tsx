"use client";

import { signIn } from "~/lib/auth-client";
import { useForm, validators } from "~/hooks/use-form";
import { FormInput } from "~/components/shared/form-input";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setError,
    clearErrors
  } = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: ""
    },
    validationSchema: {
      email: validators.compose(
        validators.required("Email is required"),
        validators.email()
      ),
      password: validators.required("Password is required")
    },
    onSubmit: async (formValues) => {
      clearErrors();
      
      try {
        console.log("Attempting login with:", { 
          email: formValues.email, 
          baseURL: typeof window !== "undefined" ? window.location.origin : "unknown",
          authURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL 
        });
        
        const result = await signIn.email({
          email: formValues.email,
          password: formValues.password,
        });
        
        console.log("Login result:", result);
        
        if (result?.error) {
          console.error("Login error details:", result.error);
          setError("email", result.error.message || "Login failed");
        } else if (result?.data) {
          console.log("Login successful:", result.data);
          window.location.href = "/";
        } else {
          console.warn("Unexpected result format:", result);
          setError("email", "Login failed - unexpected response");
        }
      } catch (err) {
        console.error("Login error (catch block):", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError("email", `An unexpected error occurred: ${errorMessage}`);
      }
    }
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-white light:text-gray-900">Sign In</h2>
        
        <FormInput
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          error={errors.email}
          touched={touched.email}
          placeholder="Enter your email"
          required
        />
        
        <FormInput
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange('password')}
          onBlur={handleBlur('password')}
          error={errors.password}
          touched={touched.password}
          placeholder="Enter your password"
          required
        />
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-purple-600 light:bg-blue-600 text-white font-medium rounded-md hover:bg-purple-700 light:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 light:focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent light:focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}