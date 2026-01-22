"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [hobby, setHobby] = useState("");
  const [interests, setInterests] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [theme, setTheme] = useState<'dark' | 'blue' | 'light'>('blue');

  useEffect(() => {
    fetchProfile();
    const savedTheme = localStorage.getItem('chatTheme') as 'dark' | 'blue' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: 'dark' | 'blue' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('chatTheme', newTheme);
    window.dispatchEvent(new Event('storage'));
  };

  const themeConfig = {
    dark: {
      bg: 'bg-gradient-to-br from-black via-zinc-950 to-black',
      card: 'bg-zinc-950/70',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      border: 'border-zinc-800',
      input: 'bg-zinc-950 border-zinc-800',
      button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    },
    blue: {
      bg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950',
      card: 'bg-slate-900/40',
      text: 'text-white',
      textSecondary: 'text-slate-400',
      border: 'border-slate-700/50',
      input: 'bg-slate-900/50 border-slate-700/50',
      button: 'from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700',
    },
    light: {
      bg: 'bg-white',
      card: 'bg-blue-50',
      text: 'text-black',
      textSecondary: 'text-gray-700',
      border: 'border-blue-300',
      input: 'bg-white border-blue-300',
      button: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    },
  };

  const currentTheme = themeConfig[theme];

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setProfilePicture(data.profilePicture || "");
        setPreviewImage(data.profilePicture || "");
        setHobby(data.hobby || "");
        setInterests(data.interests || "");
        setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "");
        setGender(data.gender || "");
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "Image must be less than 5MB", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfilePicture(result);
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          bio, 
          profilePicture,
          hobby,
          interests,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setToast({ message: "Profile updated successfully! ✓", type: "success" });
      } else {
        setToast({ message: "Failed to update profile", type: "error" });
      }
    } catch (error) {
      console.error("Save error:", error);
      setToast({ message: "An error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const copyUniqueId = () => {
    if (profile?.uniqueId) {
      navigator.clipboard.writeText(profile.uniqueId);
      setCopied(true);
      setToast({ message: "Unique ID copied to clipboard!", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className={`${currentTheme.textSecondary} text-lg`}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} p-6`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Your Profile
            </h1>
            <p className={currentTheme.textSecondary}>Manage your personal information and settings</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className={`group flex items-center gap-2 rounded-xl ${currentTheme.card} px-6 py-3 ${currentTheme.text} hover:opacity-80 transition-all border ${currentTheme.border}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </button>
        </div>

        {/* Theme Switcher */}
        <div className={`mb-6 rounded-xl ${currentTheme.card} border ${currentTheme.border} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h3 className={`text-sm font-semibold ${currentTheme.text}`}>Color Theme</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => changeTheme('dark')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : `${theme === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => changeTheme('blue')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                theme === 'blue'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : `${theme === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`
              }`}
            >
              💙 Blue
            </button>
            <button
              onClick={() => changeTheme('light')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : `${theme === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`
              }`}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Picture */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl border ${currentTheme.border} ${currentTheme.card} backdrop-blur-xl p-6`}>
              <h2 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Profile Picture</h2>
              
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-cyan-500/30 ${theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-slate-800 to-slate-900'} shadow-2xl shadow-cyan-500/20">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center text-5xl font-bold bg-gradient-to-br from-cyan-500 to-purple-600 text-white`}>
                        {name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  {/* Online Status Indicator */}
                  <div className="absolute bottom-2 right-2 flex items-center justify-center">
                    <div className={`h-6 w-6 rounded-full border-4 ${theme === 'light' ? 'border-white' : 'border-slate-900'} ${
                      profile?.isOnline ? 'bg-green-500' : 'bg-slate-500'
                    }`}>
                      <div className={`h-full w-full rounded-full ${
                        profile?.isOnline ? 'bg-green-400 animate-pulse' : ''
                      }`}></div>
                    </div>
                  </div>
                </div>

                {/* Online Status Badge */}
                <div className={`mb-4 px-4 py-2 rounded-full text-sm font-semibold ${
                  profile?.isOnline 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : `${theme === 'light' ? 'bg-gray-200 text-gray-500 border border-gray-300' : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'}`
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      profile?.isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-400'
                    }`}></div>
                    {profile?.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                
                <label className="cursor-pointer group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-white font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50">
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className={`mt-3 text-xs ${currentTheme.textSecondary}`}>PNG, JPG up to 5MB</p>
              </div>

              {/* Unique ID Section */}
              <div className={`mt-6 rounded-xl ${theme === 'light' ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10'} p-4 border ${theme === 'light' ? 'border-blue-200' : 'border-cyan-500/20'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-5 w-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-blue-600' : 'text-cyan-400'}`}>Unique ID (Permanent)</h3>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={profile?.uniqueId || ""}
                    readOnly
                    className={`w-full rounded-lg border ${currentTheme.border} ${theme === 'light' ? 'bg-white text-blue-600' : 'bg-slate-900/70 text-cyan-300'} px-3 py-2 font-mono text-sm cursor-not-allowed`}
                  />
                  <button
                    onClick={copyUniqueId}
                    className={`w-full rounded-lg px-4 py-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      copied
                        ? "bg-green-500 text-white"
                        : `${theme === 'light' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Unique ID
                      </>
                    )}
                  </button>
                </div>
                <p className={`text-xs ${currentTheme.textSecondary} mt-3`}>
                  🔒 Share this ID with friends to connect • Cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Information */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border ${currentTheme.border} ${currentTheme.card} backdrop-blur-xl p-8`}>
              <h2 className={`text-2xl font-bold ${currentTheme.text} mb-6`}>Personal Information</h2>

              {/* Email (Read-only) */}
              <div className="mb-6">
                <label className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                  <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Address (Linked)
                </label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  readOnly
                  className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.textSecondary} cursor-not-allowed`}
                />
                <p className={`mt-2 text-xs ${currentTheme.textSecondary}`}>🔒 Your email is permanently linked to this account</p>
              </div>

              {/* Name */}
              <div className="mb-6">
                <label htmlFor="name" className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                  <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Display Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.text} placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all`}
                  placeholder="Enter your display name"
                />
                <div className="mt-2 flex justify-between text-xs">
                  <span className={currentTheme.textSecondary}>How others will see you</span>
                  <span className={currentTheme.textSecondary}>{name.length}/50</span>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label htmlFor="bio" className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                  <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.text} placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none`}
                  placeholder="Tell us about yourself... 💬"
                />
                <div className="mt-2 flex justify-between text-xs">
                  <span className={currentTheme.textSecondary}>Share a bit about yourself</span>
                  <span className={`${bio.length >= 500 ? "text-cyan-400" : currentTheme.textSecondary}`}>
                    {bio.length}/500
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Date of Birth - Editable ONLY if not set */}
                <div>
                  <label className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                    <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date of Birth {!profile?.dateOfBirth && <span className="text-xs text-yellow-400">(Set Once)</span>}
                  </label>
                  {profile?.dateOfBirth ? (
                    <input
                      type="text"
                      value={new Date(profile.dateOfBirth).toLocaleDateString()}
                      readOnly
                      className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.textSecondary} cursor-not-allowed`}
                    />
                  ) : (
                    <div>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                        className={`w-full rounded-xl border border-cyan-500/50 ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.text} focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all`}
                      />
                      <p className="mt-1 text-xs text-yellow-400">⚠️ Can only be set once (13+ years)</p>
                    </div>
                  )}
                </div>

                {/* Gender - Editable ONLY if not set */}
                <div>
                  <label className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                    <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Gender {!profile?.gender && <span className="text-xs text-yellow-400">(Set Once)</span>}
                  </label>
                  {profile?.gender ? (
                    <input
                      type="text"
                      value={profile.gender}
                      readOnly
                      className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.textSecondary} cursor-not-allowed`}
                    />
                  ) : (
                    <div>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={`w-full rounded-xl border border-cyan-500/50 ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.text} focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <p className="mt-1 text-xs text-yellow-400">⚠️ Can only be set once</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hobby */}
              <div className="mb-6">
                <label htmlFor="hobby" className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                  <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hobby
                </label>
                <input
                  id="hobby"
                  type="text"
                  value={hobby}
                  onChange={(e) => setHobby(e.target.value)}
                  maxLength={200}
                  className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.text} placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all`}
                  placeholder="Photography, Gaming, Reading..."
                />
                <p className={`mt-2 text-xs ${currentTheme.textSecondary}`}>Your favorite hobby or pastime</p>
              </div>

              {/* Interests */}
              <div className="mb-8">
                <label htmlFor="interests" className={`mb-2 block text-sm font-medium ${currentTheme.textSecondary} flex items-center gap-2`}>
                  <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Interests
                </label>
                <textarea
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  rows={3}
                  className={`w-full rounded-xl border ${currentTheme.border} ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'} px-4 py-3 ${currentTheme.text} placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none`}
                  placeholder="Technology, Travel, Music, Sports, Art..."
                />
                <p className={`mt-2 text-xs ${currentTheme.textSecondary}`}>What you're passionate about (separate with commas)</p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-6 py-4 font-semibold text-white hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </span>
              </button>

              {/* Security Note */}
              <div className={`mt-6 rounded-xl ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-slate-800/30 border-slate-700/30'} p-4 border`}>
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${currentTheme.text}`}>Your data is encrypted</p>
                    <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>All information is securely stored with end-to-end encryption. Your unique ID and email cannot be changed once created.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
