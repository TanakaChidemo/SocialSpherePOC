"use client";

import React, { useState } from "react";
import { useAppStore } from "../lib/store";
import { api } from "../lib/apiClient";
import { SparklesIcon, CheckIcon } from "./Icons";

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, setUser, addToast } = useAppStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const res = await api.auth.register({ email, password, name });
        setUser(res.user, res.accessToken);
        addToast("success", `Welcome aboard, ${res.user.name}!`);
      } else {
        const res = await api.auth.login({ email, password });
        setUser(res.user, res.accessToken);
        addToast("success", `Welcome back, ${res.user.name}!`);
      }
      setAuthModalOpen(false);
    } catch (err) {
      addToast("error", err.response?.data?.error || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    try {
      const res = await api.auth.demo();
      setUser(res.user, res.accessToken);
      addToast("success", "Logged in with Tanaka Chidemo (Demo Account)");
      setAuthModalOpen(false);
    } catch (err) {
      // Fallback local demo user
      setUser(
        { id: "11111111-1111-1111-1111-111111111111", email: "demo@example.com", name: "Tanaka Chidemo", role: "admin" },
        "demo_access_token"
      );
      addToast("success", "Demo session initialized");
      setAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="relative w-full max-w-md p-6 rounded-lg bg-slate-900 border border-slate-800">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-lg gradient-brand flex items-center justify-center mb-3">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRegister ? "Create your Account" : "Sign In to SocialSphere"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            AI Copywriting & Instant Publishing to Instagram & Facebook
          </p>
        </div>

        {/* 1-Click Instant Demo Access */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-4 py-2.5 px-4 rounded-md bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border border-indigo-500/50 hover:border-indigo-400 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <SparklesIcon className="w-4 h-4 text-indigo-400" />
          <span>⚡ Instant 1-Click Demo Login (Tanaka Chidemo)</span>
        </button>

        <div className="flex items-center my-3 text-slate-600 text-xs">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3">or continue with email</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tanaka Chidemo"
                className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-md gradient-brand text-white text-xs font-semibold hover:opacity-95 transition"
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-4 text-xs text-slate-400">
          {isRegister ? "Already have an account? " : "Don't have an account yet? "}{""}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-400 hover:underline font-medium"
          >
            {isRegister ? "Sign in" : "Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
