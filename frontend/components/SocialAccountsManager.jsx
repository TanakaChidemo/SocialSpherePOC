"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import { api } from "../lib/apiClient";
import {
  InstagramIcon,
  FacebookIcon,
  PlusIcon,
  CheckIcon,
} from "./Icons";

const AVAILABLE_CHANNELS = [
  {
    platform: "instagram",
    name: "Instagram Business",
    icon: InstagramIcon,
    color: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    description: "Publish photo carousels, reels, and stories with automated hashtags.",
  },
  {
    platform: "facebook",
    name: "Facebook Global Page",
    icon: FacebookIcon,
    color: "text-blue-500 border-blue-600/30 bg-blue-600/10",
    description: "Publish community updates, media assets, and engage your fan base.",
  },
];

export function SocialAccountsManager() {
  const { socialAccounts, setSocialAccounts, addToast } = useAppStore();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("instagram");
  const [accountHandle, setAccountHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const items = await api.socialAccounts.list();
      if (items.length > 0) {
        setSocialAccounts(items);
      }
    } catch (err) {
      // ignore
    }
  }

  async function handleConnect(e) {
    e.preventDefault();
    if (!accountHandle.trim()) return addToast("error", "Please provide account handle or page name");

    setLoading(true);
    try {
      const created = await api.socialAccounts.link({
        platform: selectedChannel,
        handle: accountHandle,
        displayName: displayName || `${accountHandle} (${selectedChannel.toUpperCase()})`,
      });

      setSocialAccounts([...socialAccounts, created]);
      addToast("success", `Connected ${selectedChannel} account successfully!`);
      setIsConnectModalOpen(false);
      setAccountHandle("");
      setDisplayName("");
    } catch (err) {
      addToast("error", err.message || "Failed to link channel");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(id, name) {
    try {
      await api.socialAccounts.unlink(id);
      setSocialAccounts(socialAccounts.filter((a) => a.id !== id));
      addToast("info", `Disconnected ${name}`);
    } catch (err) {
      addToast("error", "Failed to disconnect channel");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Social Channels</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your authenticated social platforms, token permissions, and publishing routes.
          </p>
        </div>

        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md gradient-brand text-white text-xs font-semibold hover:opacity-95 transition"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Connect New Channel</span>
        </button>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {AVAILABLE_CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const connected = socialAccounts.find((a) => a.platform === ch.platform);

          return (
            <div
              key={ch.platform}
              className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-md border ${ch.color}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{ch.name}</h3>
                      <p className="text-[11px] text-slate-400">{ch.description}</p>
                    </div>
                  </div>

                  {connected ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[11px] font-semibold">
                      Inactive
                    </span>
                  )}
                </div>

                {connected && (
                  <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 font-medium">Account Name:</span>
                      <span className="font-semibold text-white truncate max-w-xs">
                        {connected.displayName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <span className="text-emerald-400 font-medium">Demo Account · Sandbox</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {connected ? (
                  <>
                    <span className="text-[11px] text-slate-500">Ready for automated publish</span>
                    <button
                      onClick={() => handleDisconnect(connected.id, connected.displayName)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-500">Not linked yet</span>
                    <button
                      onClick={() => {
                        setSelectedChannel(ch.platform);
                        setIsConnectModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      Connect Channel
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Channel Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="relative w-full max-w-md p-6 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setIsConnectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-white mb-1">Connect Social Channel</h3>
            <p className="text-xs text-slate-400 mb-4">
              Authorize publishing access for multi-platform scheduling.
            </p>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Platform</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="instagram">Instagram Business</option>
                  <option value="facebook">Facebook Page</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Handle or Page ID
                </label>
                <input
                  type="text"
                  required
                  value={accountHandle}
                  onChange={(e) => setAccountHandle(e.target.value)}
                  placeholder="@company_official or page_109238"
                  className="w-full px-3.5 py-2.5 rounded-md bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Brand Main Page"
                  className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md gradient-brand text-white text-xs font-semibold hover:opacity-95 transition"
              >
                {loading ? "Authorizing..." : "Link Channel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
