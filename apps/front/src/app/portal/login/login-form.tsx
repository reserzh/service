"use client";

import { useState } from "react";
import { createPortalBrowserClient } from "@/lib/portal-supabase-browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createPortalBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Full page navigation ensures cookies are sent on the server request
      window.location.href = "/portal/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createPortalBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/portal/login`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (resetSent) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Check your email</p>
          <p className="mt-1">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setResetSent(false);
            setShowForgot(false);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (showForgot) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowForgot(false);
            setError(null);
          }}
          className="w-full text-sm text-blue-600 hover:text-blue-800"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <button
            type="button"
            onClick={() => {
              setShowForgot(true);
              setError(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot password?
          </button>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
