"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  profilePicture?: string | null;
}

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
  connections: User[];
}

export default function CreateGroupModal({ onClose, onSuccess, connections }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const filteredConnections = connections.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) {
      alert("Please enter a group name and select at least one member");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: description,
          memberIds: Array.from(selectedMembers),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("An error occurred while creating the group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Group</h2>
              <p className="text-sm text-slate-400 mt-1">Start a group conversation</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={200}
              placeholder="Enter group name..."
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What's this group about?"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Add Members * ({selectedMembers.size} selected)
            </label>
            
            {/* Search */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2 pl-10 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Member List */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-700/50 bg-slate-800/30">
              {filteredConnections.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No contacts found
                </div>
              ) : (
                filteredConnections.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0 ${
                      selectedMembers.has(user.id) ? "bg-cyan-500/10" : ""
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 ${
                      selectedMembers.has(user.id)
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                        : "bg-gradient-to-br from-slate-600 to-slate-700"
                    }`}>
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name || "User"} className="h-full w-full object-cover" />
                      ) : (
                        user.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{user.name || "Unknown"}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                      selectedMembers.has(user.id)
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-slate-600"
                    }`}>
                      {selectedMembers.has(user.id) && (
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-800 px-6 py-3 font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !groupName.trim() || selectedMembers.size === 0}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
