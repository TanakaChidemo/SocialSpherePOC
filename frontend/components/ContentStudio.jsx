"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import { api } from "../lib/apiClient";
import {
  InstagramIcon,
  FacebookIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  SendIcon,
  CheckIcon,
  LayersIcon,
} from "./Icons";
import { AIModal } from "./AIModal";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon, maxChars: 2200, color: "text-pink-400 border-pink-500/40 bg-pink-500/10" },
  { id: "facebook", label: "Facebook", icon: FacebookIcon, maxChars: 63206, color: "text-blue-500 border-blue-600/40 bg-blue-600/10" },
];

const MAX_MEDIA = 4;

function isVideoUrl(url) {
  return url.startsWith("data:video");
}

export function ContentStudio() {
  const { drafts, setDrafts, activeDraft, setActiveDraft, addToast, setAiModalOpen, socialAccounts } = useAppStore();

  const [title, setTitle] = useState("New Social Campaign");
  const [body, setBody] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram", "facebook"]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState("instagram");
  const [previewMediaIndex, setPreviewMediaIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    if (activeDraft) {
      setTitle(activeDraft.title);
      setBody(activeDraft.body);
      setSelectedPlatforms(activeDraft.platforms.length > 0 ? activeDraft.platforms : ["instagram", "facebook"]);
      setMediaUrls(activeDraft.mediaUrls || []);
      setPreviewMediaIndex(0);
    }
  }, [activeDraft]);

  async function loadDrafts() {
    try {
      const items = await api.content.list();
      setDrafts(items);
      // Deliberately not auto-selecting a saved draft here — the compose box
      // should start blank on load. Users open a saved draft explicitly by
      // clicking it in the "Saved Drafts" list below.
    } catch (err) {
      // fallback
    }
  }

  function togglePlatform(id) {
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length === 1) return addToast("info", "At least one platform must be selected");
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      if (previewPlatform === id) {
        const remaining = selectedPlatforms.filter((p) => p !== id);
        if (remaining.length > 0) setPreviewPlatform(remaining[0]);
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
      setPreviewPlatform(id);
    }
  }

  async function handleSaveDraft() {
    if (!title.trim()) return addToast("error", "Draft title is required");
    if (!body.trim()) return addToast("error", "Draft body is required");

    setLoading(true);
    try {
      if (activeDraft?._id) {
        const updated = await api.content.update(activeDraft._id, {
          title,
          body,
          platforms: selectedPlatforms,
          mediaUrls,
        });
        setActiveDraft(updated);
        addToast("success", "Draft updated successfully!");
      } else {
        const created = await api.content.create({
          title,
          body,
          platforms: selectedPlatforms,
          mediaUrls,
        });
        setActiveDraft(created);
        addToast("success", "New draft created!");
      }
      loadDrafts();
    } catch (err) {
      addToast("error", err.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  }

  async function handlePublishNow() {
    if (!body.trim()) return addToast("error", "Please write post content before publishing");

    setLoading(true);
    try {
      let draftId = activeDraft?._id;
      if (!draftId) {
        const created = await api.content.create({
          title,
          body,
          platforms: selectedPlatforms,
          mediaUrls,
        });
        draftId = created._id;
        setActiveDraft(created);
      }

      for (const plt of selectedPlatforms) {
        const account = socialAccounts.find((a) => a.platform === plt);
        await api.publish.now({
          contentDraftId: draftId,
          platform: plt,
          socialAccountId: account?.id || null,
        });
      }

      addToast("success", `🚀 Published to ${selectedPlatforms.join(", ")} successfully!`);
    } catch (err) {
      addToast("error", err.message || "Publishing failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setActiveDraft(null);
    setTitle(`Campaign #${drafts.length + 1}`);
    setBody("");
    setSelectedPlatforms(["instagram", "facebook"]);
    setMediaUrls([]);
    setPreviewMediaIndex(0);
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_MEDIA - mediaUrls.length;
    if (room <= 0) {
      return addToast("info", `You can attach up to ${MAX_MEDIA} files per post`);
    }
    const filesToUpload = files.slice(0, room);
    if (files.length > filesToUpload.length) {
      addToast("info", `Only added ${filesToUpload.length} of ${files.length} files (max ${MAX_MEDIA} per post)`);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => formData.append("files", file));
      const res = await api.content.uploadMedia(formData);
      setMediaUrls((prev) => [...prev, ...(res.mediaUrls || [])]);
    } catch (err) {
      addToast("error", err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveMedia(index) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
    setPreviewMediaIndex(0);
  }

  async function handleDeleteDraft(id) {
    try {
      await api.content.delete(id);
      addToast("info", "Draft deleted");
      if (activeDraft?._id === id) {
        handleCreateNew();
      }
      loadDrafts();
    } catch (err) {
      addToast("error", "Could not delete draft");
    }
  }

  const activeMediaUrl = mediaUrls[previewMediaIndex] ?? mediaUrls[0];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Omnichannel Content Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Craft, preview, repurpose with AI, and publish to all networks in sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Draft</span>
          </button>

          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/40 text-purple-200 hover:border-purple-400 text-xs font-semibold transition"
          >
            <SparklesIcon className="w-4 h-4 text-purple-400" />
            <span>AI Assist</span>
          </button>

          <button
            onClick={handlePublishNow}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md gradient-brand text-white text-xs font-semibold hover:opacity-95 transition"
          >
            <SendIcon className="w-4 h-4" />
            <span>Publish Now</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target Platforms Bar */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Publish Destinations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                      isSelected
                        ? p.color
                        : "border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{p.label}</span>
                    {isSelected && <CheckIcon className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 AI Platform Launch"
                className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-400">Post Copy</label>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{body.length} characters</span>
                </div>
              </div>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your post here or use AI Studio to generate captions, hashtags, and variations..."
                className="w-full px-4 py-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />
            </div>

            {/* Media Attachment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">Photos or Videos</label>
                <span className="text-[10px] text-slate-500">{mediaUrls.length}/{MAX_MEDIA} attached</span>
              </div>

              {mediaUrls.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {mediaUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-900 border border-slate-800 shrink-0"
                    >
                      {isVideoUrl(url) ? (
                        <video src={url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => handleRemoveMedia(i)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-slate-950/80 text-slate-300 hover:text-rose-400 text-[10px] leading-none flex items-center justify-center"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {mediaUrls.length < MAX_MEDIA ? (
                <label className="flex flex-col items-center justify-center gap-1.5 py-6 rounded-md bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-300 cursor-pointer transition">
                  <span className="text-xs font-semibold">
                    {uploading ? "Uploading..." : mediaUrls.length > 0 ? "Add another image or video" : "Click to upload an image or video"}
                  </span>
                  <span className="text-[10px] text-slate-600">JPG, PNG, MP4 up to 25MB each, {MAX_MEDIA} max</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFilesSelected}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              ) : (
                <p className="text-[10px] text-slate-600 text-center py-1">Maximum of {MAX_MEDIA} files reached</p>
              )}
            </div>

            {/* Bottom Editor Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Save as Draft
              </button>

              <button
                onClick={() => setAiModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Optimize with AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Feed Preview
              </span>
              {/* Preview platform selector */}
              <div className="flex items-center gap-1 p-0.5 rounded bg-slate-950 border border-slate-800">
                {selectedPlatforms.map((plt) => (
                  <button
                    key={plt}
                    onClick={() => setPreviewPlatform(plt)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition ${
                      previewPlatform === plt
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {plt}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Card Simulation */}
            <div className="rounded-md bg-slate-950 border border-slate-800 p-4">
              {/* Instagram Preview */}
              {previewPlatform === "instagram" && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
                          TP
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">techpulse.studio</span>
                    </div>
                    <span className="text-slate-500">•••</span>
                  </div>

                  {activeMediaUrl ? (
                    <div className="relative rounded-md overflow-hidden border border-slate-800 max-h-64 bg-slate-900">
                      {isVideoUrl(activeMediaUrl) ? (
                        <video src={activeMediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={activeMediaUrl} alt="Instagram post" className="w-full h-full object-cover" />
                      )}
                      {mediaUrls.length > 1 && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] text-white">
                          <LayersIcon className="w-3 h-3" />
                          {previewMediaIndex + 1}/{mediaUrls.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-44 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                      Upload media for Instagram post
                    </div>
                  )}

                  {mediaUrls.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      {mediaUrls.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPreviewMediaIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full ${i === previewMediaIndex ? "bg-indigo-400" : "bg-slate-700"}`}
                          title={`Show media ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <span>❤️</span>
                      <span>💬</span>
                      <span>✈️</span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-3">
                      <strong className="text-white mr-1.5">techpulse.studio</strong>
                      {body || "Your Instagram caption and hashtags..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Facebook Preview */}
              {previewPlatform === "facebook" && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      TP
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">TechPulse Global</div>
                      <span className="text-[10px] text-slate-500">Public · Just now</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {body || "Your Facebook post copy..."}
                  </p>

                  {activeMediaUrl && (
                    <div className="relative rounded-md overflow-hidden border border-slate-800 max-h-56 bg-slate-900">
                      {isVideoUrl(activeMediaUrl) ? (
                        <video src={activeMediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={activeMediaUrl} alt="Facebook media" className="w-full h-full object-cover" />
                      )}
                      {mediaUrls.length > 1 && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] text-white">
                          <LayersIcon className="w-3 h-3" />
                          {previewMediaIndex + 1}/{mediaUrls.length}
                        </span>
                      )}
                    </div>
                  )}

                  {mediaUrls.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      {mediaUrls.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPreviewMediaIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full ${i === previewMediaIndex ? "bg-indigo-400" : "bg-slate-700"}`}
                          title={`Show media ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>👍 86 · 💬 14 shares</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drafts Repository List */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saved Drafts ({drafts.length})
            </span>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {drafts.map((d) => (
                <div
                  key={d._id}
                  onClick={() => setActiveDraft(d)}
                  className={`p-3 rounded-md border text-xs cursor-pointer transition flex items-center justify-between ${
                    activeDraft?._id === d._id
                      ? "bg-indigo-950/40 border-indigo-500/50 text-white"
                      : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate">{d.title}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{d.body}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDraft(d._id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete Draft"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AIModal onInsert={(text) => setBody((prev) => (prev ? `${prev}\n\n${text}` : text))} />
    </div>
  );
}
