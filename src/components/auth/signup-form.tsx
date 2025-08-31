"use client";

import { useState } from "react";
import { signUp } from "~/lib/auth-client";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }
    
    try {
      const result = await signUp.email({
        email,
        password,
        name: username,
      });
      
      console.log("Signup result:", result);
      
      if (result.error) {
        setError(result.error.message ?? "Signup failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="p-6 bg-green-100 light:bg-green-50 rounded-lg border border-green-200 light:border-green-300">
          <h2 className="text-2xl font-bold text-green-800 light:text-green-900 mb-2">Welcome!</h2>
          <p className="text-green-700 light:text-green-800">Your account has been created successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-white light:text-gray-900">Create Account</h2>
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 light:bg-red-50 light:text-red-800 rounded-md border border-red-200 light:border-red-300">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 light:bg-white border border-gray-600 light:border-gray-300 rounded-md text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 light:focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            placeholder="Enter your username"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 light:bg-white border border-gray-600 light:border-gray-300 rounded-md text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 light:focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 light:bg-white border border-gray-600 light:border-gray-300 rounded-md text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 light:focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            placeholder="Create a password"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 light:bg-white border border-gray-600 light:border-gray-300 rounded-md text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 light:focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            placeholder="Confirm your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-purple-600 light:bg-blue-600 text-white font-medium rounded-md hover:bg-purple-700 light:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 light:focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent light:focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}