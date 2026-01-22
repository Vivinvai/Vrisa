"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import EmojiPicker from "@/components/EmojiPicker";
import CreateGroupModal from "@/components/CreateGroupModal";
import {
  decryptWithAes,
  encryptWithAes,
  generateAesKey,
  exportRsaPublicKey,
  exportRsaPrivateKey,
  generateRsaKeyPair,
  deriveConversationKey,
} from "@/lib/crypto";
import { deriveGroupConversationKey } from "@/lib/groupCrypto";

interface User {
  id: string;
  email: string;
  name: string | null;
  publicKey: string;
  profilePicture?: string | null;
  uniqueId?: string;
  bio?: string | null;
}

interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  requester: User;
  addressee: User;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  content?: string;
  plaintext?: string;
  decryptError?: boolean;
  messageType?: string;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  deleted?: boolean;
}

interface GroupChat {
  id: string;
  name: string;
  description?: string | null;
  groupPicture?: string | null;
  members: Array<{
    user: User;
    role: string;
  }>;
}

interface DecryptedGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  content?: string;
  plaintext?: string;
  decryptError?: boolean;
  messageType?: string;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  fileType?: string | null;
  deleted?: boolean;
  sender: {
    id: string;
    name: string | null;
    email: string;
    profilePicture?: string | null;
  };
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [uniqueIdSearch, setUniqueIdSearch] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [groupMessages, setGroupMessages] = useState<DecryptedGroupMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [viewMode, setViewMode] = useState<'dm' | 'group'>('dm');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string; isMine: boolean } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profileCardUser, setProfileCardUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'blue' | 'light'>('blue');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme') as 'dark' | 'blue' | 'light';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save theme to localStorage
  const changeTheme = (newTheme: 'dark' | 'blue' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('chat-theme', newTheme);
  };

  // Theme configurations
  const themeConfig = {
    dark: {
      bg: 'bg-gradient-to-br from-black via-zinc-950 to-black',
      sidebar: 'bg-black/80',
      card: 'bg-zinc-950/70',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      border: 'border-zinc-800',
      accent: 'from-blue-500 to-blue-600',
      button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      input: 'bg-zinc-950 border-zinc-800',
      tabActive: 'from-blue-500 to-blue-600',
      tabInactive: 'bg-zinc-900 hover:bg-zinc-800',
    },
    blue: {
      bg: 'from-slate-950 via-purple-950/20 to-slate-950',
      sidebar: 'bg-slate-900/60',
      card: 'bg-slate-800/50',
      text: 'text-white',
      textSecondary: 'text-slate-400',
      border: 'border-slate-700/50',
      accent: 'from-cyan-500 to-blue-600',
      button: 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
      input: 'bg-slate-800 border-slate-700',
      tabActive: 'from-cyan-500 to-blue-600',
      tabInactive: 'bg-slate-800/50 hover:bg-slate-700/50',
    },
    light: {
      bg: 'bg-white',
      sidebar: 'bg-white',
      card: 'bg-blue-50',
      text: 'text-black',
      textSecondary: 'text-gray-700',
      border: 'border-blue-300',
      accent: 'from-blue-500 to-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      input: 'bg-white border-blue-300',
      tabActive: 'bg-blue-600',
      tabInactive: 'bg-blue-100 hover:bg-blue-200',
    },
  };

  const currentTheme = themeConfig[theme];

  // Diagnostic function for testing encryption (accessible from browser console)
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser && selectedUser) {
      (window as any).testEncryption = async () => {
        console.log("🔐 Testing encryption between", currentUser.id, "and", selectedUser.id);
        const key = await deriveConversationKey(currentUser.id, selectedUser.id);
        const testMsg = "Test message: " + new Date().toISOString();
        const { ciphertext, iv } = await encryptWithAes(key, testMsg);
        console.log("✓ Encrypted:", ciphertext.substring(0, 50) + "...");
        const decrypted = await decryptWithAes(key, ciphertext, iv);
        console.log("✓ Decrypted:", decrypted);
        console.log("✓ Match:", testMsg === decrypted ? "SUCCESS" : "FAILED");
        return { success: testMsg === decrypted, original: testMsg, decrypted };
      };
      console.log("💡 Type 'testEncryption()' in console to test encryption");
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      initializeKeys();
    }
  }, [status]);

  const initializeKeys = async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        console.error("Failed to fetch user data");
        setInitializing(false);
        router.push("/login");
        return;
      }

      const user = await res.json();
      setCurrentUser(user);

      // Generate keys on first use if not exists
      if (!user.publicKey || !user.encryptedPrivateKey) {
        const keyPair = await generateRsaKeyPair();
        const publicKey = await exportRsaPublicKey(keyPair.publicKey);
        const privateKey = await exportRsaPrivateKey(keyPair.privateKey);

        const keysRes = await fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey,
            encryptedPrivateKey: privateKey,
          }),
        });

        if (!keysRes.ok) {
          console.error("Failed to store keys");
          setInitializing(false);
          return;
        }
      }

      // Don't generate a session key here - we'll use conversation-specific keys
      loadConnections();
      loadPendingRequests();
      loadAllUsers();
      loadGroups();
      setInitializing(false);
    } catch (error) {
      console.error("Initialization failed:", error);
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'dm' && selectedUser && currentUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    } else if (viewMode === 'group' && selectedGroup && currentUser) {
      loadGroupMessages();
      const interval = setInterval(loadGroupMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, selectedGroup, currentUser, viewMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages]);

  const loadConnections = async () => {
    const res = await fetch("/api/connections?status=accepted");
    if (res.ok) {
      const data = await res.json();
      setConnections(data);
    }
  };

  const loadPendingRequests = async () => {
    const res = await fetch("/api/connections?status=pending");
    if (res.ok) {
      const data = await res.json();
      // Only show requests where current user is the addressee
      setPendingRequests(data.filter((c: Connection) => c.addresseeId === session?.user?.id));
    }
  };

  const loadAllUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const loadGroups = async () => {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const data = await res.json();
      setGroups(data);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser || !currentUser) {
      console.log("Cannot load messages: missing user data");
      return;
    }

    try {
      const res = await fetch(`/api/messages?userId=${selectedUser.id}`);
      if (!res.ok) {
        console.error("Failed to fetch messages:", res.status);
        return;
      }

      const data = await res.json();
      console.log(`Loading ${data.length} messages between ${currentUser.id} and ${selectedUser.id}`);

      // Derive the same conversation-specific key that was used for encryption
      const conversationKey = await deriveConversationKey(currentUser.id, selectedUser.id);

      const decrypted = await Promise.all(
        data.map(async (msg: any) => {
          try {
            // Decrypt the message with the conversation key
            const plaintext = await decryptWithAes(conversationKey, msg.ciphertext, msg.iv);
            return { ...msg, plaintext, decryptError: false };
          } catch (error) {
            console.error(`Decryption failed for message ${msg.id}:`, error);
            // Mark message as having decryption error
            return { 
              ...msg, 
              plaintext: "[Unable to decrypt message]", 
              decryptError: true 
            };
          }
        }),
      );

      setMessages(decrypted);
      console.log(`Successfully processed ${decrypted.length} messages`);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const loadGroupMessages = async () => {
    if (!selectedGroup || !currentUser) {
      console.log("Cannot load group messages: missing data");
      return;
    }

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/messages`);
      if (!res.ok) {
        console.error("Failed to fetch group messages:", res.status);
        return;
      }

      const data = await res.json();
      console.log(`Loading ${data.length} group messages for group ${selectedGroup.id}`);

      // Derive group conversation key
      const memberIds = selectedGroup.members.map(m => m.user.id);
      const groupKey = await deriveGroupConversationKey(selectedGroup.id, memberIds);

      const decrypted = await Promise.all(
        data.map(async (msg: any) => {
          try {
            const plaintext = await decryptWithAes(groupKey, msg.ciphertext, msg.iv);
            return { ...msg, plaintext, decryptError: false };
          } catch (error) {
            console.error(`Decryption failed for group message ${msg.id}:`, error);
            return { 
              ...msg, 
              plaintext: "[Unable to decrypt message]", 
              decryptError: true 
            };
          }
        }),
      );

      setGroupMessages(decrypted);
      console.log(`Successfully processed ${decrypted.length} group messages`);
    } catch (error) {
      console.error("Error loading group messages:", error);
      setGroupMessages([]);
    }
  };

  const sendMessage = async () => {
    if ((!draft.trim() && !selectedFile) || !currentUser) {
      console.log("Cannot send: missing data");
      return;
    }

    if (viewMode === 'dm' && !selectedUser) return;
    if (viewMode === 'group' && !selectedGroup) return;

    try {
      setLoading(true);
      
      let conversationKey;
      if (viewMode === 'dm' && selectedUser) {
        console.log(`Sending DM from ${currentUser.id} to ${selectedUser.id}`);
        conversationKey = await deriveConversationKey(currentUser.id, selectedUser.id);
      } else if (viewMode === 'group' && selectedGroup) {
        console.log(`Sending group message to ${selectedGroup.id}`);
        const memberIds = selectedGroup.members.map(m => m.user.id);
        conversationKey = await deriveGroupConversationKey(selectedGroup.id, memberIds);
      } else {
        return;
      }
      
      let messageType = "text";
      let fileName = null;
      let fileSize = null;
      let fileUrl = null;
      let textToEncrypt = draft;

      // Handle file upload
      if (selectedFile) {
        const file = selectedFile;
        
        // Check file size limits
        const maxSize = file.type.startsWith("image/") || file.type.startsWith("video/") 
          ? 120 * 1024 * 1024 // 120MB for images/videos
          : 150 * 1024 * 1024; // 150MB for other files
        
        if (file.size > maxSize) {
          alert(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
          setLoading(false);
          return;
        }

        // Convert file to base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        messageType = file.type.startsWith("image/") ? "image" 
          : file.type.startsWith("video/") ? "video" 
          : "file";
        fileName = file.name;
        fileSize = file.size;
        fileUrl = fileData;
        // Don't show filename/URL in message text for files/images
        textToEncrypt = draft || " "; // Empty space if no text
      }

      console.log(`Encrypting message of type: ${messageType}`);
      
      // Encrypt with the conversation key
      const { ciphertext, iv } = await encryptWithAes(conversationKey, textToEncrypt);
      
      console.log(`Encrypted successfully, sending to API...`);

      let res;
      if (viewMode === 'dm' && selectedUser) {
        res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverId: selectedUser.id,
            ciphertext,
            iv,
            messageType,
            fileName,
            fileSize,
            fileUrl,
          }),
        });
      } else if (viewMode === 'group' && selectedGroup) {
        res = await fetch(`/api/groups/${selectedGroup.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ciphertext,
            iv,
            messageType,
            fileName,
            fileSize,
            fileUrl,
          }),
        });
      }

      if (res && res.ok) {
        console.log("Message sent successfully");
        setDraft("");
        setSelectedFile(null);
        setFilePreview(null);
        if (viewMode === 'dm') {
          await loadMessages();
        } else {
          await loadGroupMessages();
        }
      } else {
        const error = await res?.json();
        console.error("Failed to send message:", error);
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert("Error sending message: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    try {
      // For base64 data URLs, create a proper download
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For regular URLs, open in new tab
        window.open(fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(fileUrl, "_blank");
    }
  };

  const unsendMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to unsend this message?")) return;
    
    try {
      const endpoint = viewMode === 'dm' ? `/api/messages/${messageId}` : `/api/groups/${selectedGroup?.id}/messages`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (res.ok) {
        if (viewMode === 'dm') {
          setMessages(messages.filter(m => m.id !== messageId));
        } else {
          setGroupMessages(groupMessages.filter(m => m.id !== messageId));
        }
      } else {
        alert("Failed to unsend message");
      }
    } catch (error) {
      console.error("Failed to unsend:", error);
      alert("An error occurred");
    }
    setContextMenu(null);
  };

  const startEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditDraft(currentContent);
    setContextMenu(null);
  };

  const saveEditMessage = async (messageId: string) => {
    if (!editDraft.trim()) return;
    
    try {
      const endpoint = viewMode === 'dm' ? `/api/messages/${messageId}` : `/api/groups/${selectedGroup?.id}/messages`;
      
      // Encrypt the new content
      let encryptedContent;
      if (viewMode === 'dm' && selectedUser) {
        const key = await deriveConversationKey(currentUser.id, selectedUser.id);
        encryptedContent = await encryptWithAes(key, editDraft);
      } else if (viewMode === 'group' && selectedGroup) {
        const memberIds = selectedGroup.members?.map(m => m.user.id) || [];
        const key = await deriveGroupConversationKey(selectedGroup.id, memberIds);
        encryptedContent = await encryptWithAes(key, editDraft);
      }

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, ...encryptedContent }),
      });

      if (res.ok) {
        if (viewMode === 'dm') {
          setMessages(messages.map(m => 
            m.id === messageId ? { ...m, plaintext: editDraft, content: editDraft } : m
          ));
        } else {
          setGroupMessages(groupMessages.map(m => 
            m.id === messageId ? { ...m, plaintext: editDraft, content: editDraft } : m
          ));
        }
        setEditingMessageId(null);
        setEditDraft("");
      } else {
        alert("Failed to edit message");
      }
    } catch (error) {
      console.error("Failed to edit:", error);
      alert("An error occurred");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string, isMine: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId, isMine });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Mobile: Handle contact/group selection
  const handleMobileSelect = (user: User | null, group: GroupChat | null) => {
    if (user) {
      setSelectedUser(user);
      setSelectedGroup(null);
      setViewMode('dm');
    } else if (group) {
      setSelectedGroup(group);
      setSelectedUser(null);
      setViewMode('group');
    }
    setShowMobileChat(true);
  };

  // Mobile: Close chat and return to contacts
  const closeMobileChat = () => {
    setShowMobileChat(false);
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: userId }),
      });

      if (res.ok) {
        alert("Connection request sent!");
        setShowAddContact(false);
        setUniqueIdSearch("");
        setSearchResult(null);
        loadConnections();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Failed to send connection request:", error);
    }
  };

  const searchByUniqueId = async () => {
    if (!uniqueIdSearch.trim()) return;
    
    setSearching(true);
    try {
      const res = await fetch("/api/search-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: uniqueIdSearch.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        const error = await res.json();
        alert(error.error || "User not found");
        setSearchResult(null);
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const respondToRequest = async (connectionId: string, status: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status }),
      });

      if (res.ok) {
        loadConnections();
        loadPendingRequests();
      }
    } catch (error) {
      console.error("Failed to respond to request:", error);
    }
  };

  const getConnectedUsers = (): User[] => {
    if (!session?.user?.id) return [];
    
    return connections
      .map((conn) => {
        // Return the other user in the connection
        if (conn.requesterId === session.user.id) {
          return conn.addressee;
        } else {
          return conn.requester;
        }
      })
      .filter((user): user is User => user !== null);
  };

  const isConnected = (userId: string): boolean => {
    return connections.some(
      (c) =>
        (c.requesterId === session?.user?.id && c.addresseeId === userId) ||
        (c.addresseeId === session?.user?.id && c.requesterId === userId)
    );
  };

  const getUserDisplayName = (user: User | null) => {
    if (!user) return "Unknown";
    return user.name || user.email.split("@")[0];
  };

  const getUserInitials = (user: NonNullable<typeof session>['user']) => {
    if (!user) return "?";
    if (user.name) {
      const parts = user.name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "?";
  };

  if (status === "loading" || initializing) {
    return (
      <div className={`flex h-screen items-center justify-center ${currentTheme.bg}`}>
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className={currentTheme.textSecondary}>Initializing secure chat...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const connectedUsers = getConnectedUsers();

  return (
    <div className={`flex h-screen ${currentTheme.bg} overflow-hidden`}>
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onSuccess={() => {
            loadGroups();
            setShowCreateGroup(false);
          }}
          connections={connectedUsers}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className={`fixed z-50 ${currentTheme.card} backdrop-blur-xl rounded-lg shadow-2xl border ${currentTheme.border} py-2 min-w-[180px]`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isMine && (
            <>
              <button
                onClick={() => {
                  const msg = viewMode === 'dm' 
                    ? messages.find(m => m.id === contextMenu.messageId)
                    : groupMessages.find(m => m.id === contextMenu.messageId);
                  if (msg?.plaintext) startEditMessage(contextMenu.messageId, msg.plaintext);
                }}
                className={`w-full px-4 py-2 text-left text-sm ${currentTheme.text} hover:opacity-80 flex items-center gap-3 transition-colors`}
              >
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Message
              </button>
              <button
                onClick={() => unsendMessage(contextMenu.messageId)}
                className={`w-full px-4 py-2 text-left text-sm ${currentTheme.text} hover:opacity-80 flex items-center gap-3 transition-colors`}
              >
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Unsend Message
              </button>
            </>
          )}
          <button
            onClick={() => {
              const msg = viewMode === 'dm' 
                ? messages.find(m => m.id === contextMenu.messageId)
                : groupMessages.find(m => m.id === contextMenu.messageId);
              if (msg?.plaintext) {
                setDraft(msg.plaintext);
                setContextMenu(null);
              }
            }}
            className={`w-full px-4 py-2 text-left text-sm ${currentTheme.text} hover:opacity-80 flex items-center gap-3 transition-colors`}
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Forward Message
          </button>
        </div>
      )}

      {/* Profile Card Modal */}
      {showProfileCard && profileCardUser && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center ${theme === 'light' ? 'bg-white/80' : 'bg-black/70'} backdrop-blur-sm p-4`}
          onClick={() => setShowProfileCard(false)}
        >
          <div 
            className={`${theme === 'light' ? 'bg-white' : 'bg-gradient-to-br from-slate-900 to-slate-800'} rounded-2xl shadow-2xl border ${currentTheme.border} max-w-md w-full overflow-hidden relative`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowProfileCard(false)}
              className={`absolute top-4 right-4 z-10 rounded-lg p-1.5 ${currentTheme.card} ${currentTheme.text} hover:opacity-80 transition-colors`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Profile Picture */}
            <div className="flex justify-center pt-8 px-6">
              <div className="relative">
                <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white text-3xl shadow-2xl ring-4 ${(profileCardUser as any).isOnline ? 'ring-green-500' : 'ring-gray-500'} overflow-hidden`}>
                  {profileCardUser.profilePicture ? (
                    <img
                      src={profileCardUser.profilePicture}
                      alt={getUserDisplayName(profileCardUser)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getUserInitials(profileCardUser as any)
                  )}
                </div>
                {/* Online/Offline Badge */}
                <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-slate-900'} ${(profileCardUser as any).isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 pt-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Name and Status */}
              <div className="text-center">
                <h2 className={`text-xl font-bold ${currentTheme.text} mb-1`}>
                  {getUserDisplayName(profileCardUser)}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${(profileCardUser as any).isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <p className={`text-xs font-medium ${(profileCardUser as any).isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                    {(profileCardUser as any).isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Unique ID */}
              {profileCardUser.uniqueId && (
                <div className={`${currentTheme.card} rounded-xl p-3 border ${currentTheme.border}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textSecondary}`}>Unique ID</span>
                  </div>
                  <p className={`text-sm font-mono ${currentTheme.text} break-all`}>{profileCardUser.uniqueId}</p>
                </div>
              )}

              {/* Bio */}
              <div className={`${currentTheme.card} rounded-xl p-3 border ${currentTheme.border}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textSecondary}`}>Bio</span>
                </div>
                <p className={`text-sm ${currentTheme.text} leading-relaxed`}>
                  {profileCardUser.bio || <span className={`${currentTheme.textSecondary} italic`}>No bio added yet</span>}
                </p>
              </div>

              {/* Hobbies */}
              <div className={`${currentTheme.card} rounded-xl p-3 border ${currentTheme.border}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textSecondary}`}>Hobbies</span>
                </div>
                <p className={`text-sm ${currentTheme.text} leading-relaxed`}>
                  {(profileCardUser as any).hobby || <span className={`${currentTheme.textSecondary} italic`}>No hobbies added yet</span>}
                </p>
              </div>

              {/* Interests */}
              <div className={`${currentTheme.card} rounded-xl p-3 border ${currentTheme.border}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textSecondary}`}>Interests</span>
                </div>
                <p className={`text-sm ${currentTheme.text} leading-relaxed`}>
                  {(profileCardUser as any).interests || <span className={`${currentTheme.textSecondary} italic`}>No interests added yet</span>}
                </p>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-2">
                {(profileCardUser as any).dateOfBirth && (
                  <div className={`${currentTheme.card} rounded-xl p-3 border ${currentTheme.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-xs ${currentTheme.textSecondary}`}>Birthday</span>
                    </div>
                    <p className={`text-sm ${currentTheme.text}`}>
                      {new Date((profileCardUser as any).dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {(profileCardUser as any).gender && (
                  <div className={`${currentTheme.card} rounded-xl p-3 border ${currentTheme.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className={`text-xs ${currentTheme.textSecondary}`}>Gender</span>
                    </div>
                    <p className={`text-sm ${currentTheme.text} capitalize`}>{(profileCardUser as any).gender}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowProfileCard(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30"
                >
                  Start Chat
                </button>
                <button
                  onClick={() => setShowProfileCard(false)}
                  className={`rounded-xl ${currentTheme.card} px-4 py-2.5 text-sm font-semibold ${currentTheme.text} hover:opacity-80 transition-all border ${currentTheme.border}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar - Hidden on mobile when chat is open */}
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r ${currentTheme.border} ${currentTheme.sidebar} backdrop-blur-xl shadow-2xl`}>
        {/* Profile Section */}
        <div className={`border-b ${currentTheme.border} ${currentTheme.card} p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${currentTheme.accent} font-bold ${currentTheme.text} text-xl shadow-xl overflow-hidden ring-2 ring-cyan-400/20`}>
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                session?.user && getUserInitials(session.user)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-xl font-bold ${currentTheme.text} truncate`}>{currentUser?.name || "User"}</h1>
              <p className={`text-xs ${currentTheme.textSecondary} truncate flex items-center gap-1`}>
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                {session?.user?.email}
              </p>
            </div>
          </div>
          
          {/* Theme Switcher */}
          <div className="flex gap-2 mb-3">
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
                  : theme === 'blue' ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/40' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              ☀️ Light
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/profile")}
              className={`flex-1 rounded-xl bg-gradient-to-br ${currentTheme.accent.replace('from-', 'from-').replace('to-', 'to-')}/20 px-4 py-2.5 text-sm font-medium transition-all border border-current/30 shadow-lg`}
              style={{ color: theme === 'light' ? '#3b82f6' : '#67e8f9' }}
            >
              Profile
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`flex-1 rounded-xl ${currentTheme.card} px-4 py-2.5 text-sm font-medium ${currentTheme.textSecondary} hover:opacity-80 transition-all border ${currentTheme.border}`}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className={`flex gap-2 p-3 border-b ${currentTheme.border} ${currentTheme.card}`}>
          <button
            onClick={() => {
              setViewMode('dm');
              setSelectedGroup(null);
              setGroupMessages([]);
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'dm'
                ? `bg-gradient-to-r ${currentTheme.tabActive} text-white shadow-lg`
                : `${currentTheme.tabInactive} ${currentTheme.textSecondary}`
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Direct Messages
          </button>
          <button
            onClick={() => {
              setViewMode('group');
              setSelectedUser(null);
              setMessages([]);
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'group'
                ? `bg-gradient-to-r ${theme === 'dark' ? 'from-blue-500 to-blue-600' : currentTheme.tabActive} text-white shadow-lg`
                : `${currentTheme.tabInactive} ${currentTheme.textSecondary}`
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Groups
          </button>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className={`border-b ${currentTheme.border} bg-cyan-500/10 p-3`}>
            <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Pending Requests ({pendingRequests.length})
            </h2>
            {pendingRequests.map((req) => (
              <div key={req.id} className={`mb-2 rounded-lg ${currentTheme.card} p-3 border border-cyan-500/30`}>
                <p className={`text-sm ${currentTheme.text} mb-2`}>{getUserDisplayName(req.requester)} wants to connect</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToRequest(req.id, "accepted")}
                    className="flex-1 rounded bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, "rejected")}
                    className={`flex-1 rounded ${currentTheme.card} px-3 py-1.5 text-xs font-medium ${currentTheme.textSecondary} hover:opacity-80 transition-colors`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts/Groups List */}
        <div className="flex-1 overflow-y-auto p-3">
          {viewMode === 'dm' ? (
            <>
              <div className="flex items-center justify-between mb-3 px-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex-shrink-0">
                  Contacts ({connectedUsers.length})
                </h2>
                <button
                  onClick={() => {
                    setShowAddContact(!showAddContact);
                    if (!showAddContact) {
                      setUniqueIdSearch("");
                      setSearchResult(null);
                    }
                  }}
                  className="flex-shrink-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all border border-cyan-500/30 flex items-center gap-2 shadow-lg shadow-cyan-500/10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Contact
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 px-3">
                <h2 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textSecondary} flex-shrink-0`}>
                  Groups ({groups.length})
                </h2>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="flex-shrink-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 text-xs font-semibold text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all border border-purple-500/30 flex items-center gap-2 shadow-lg shadow-purple-500/10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Group
                </button>
              </div>
            </>
          )}

          {viewMode === 'dm' && showAddContact && (
            <div className={`mb-3 mx-3 rounded-lg ${currentTheme.card} p-3 border ${currentTheme.border}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-medium ${currentTheme.text}`}>Search by Unique ID</p>
                <button
                  onClick={() => setShowAddContact(false)}
                  className={`${currentTheme.textSecondary} hover:opacity-80 transition-colors`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={uniqueIdSearch}
                  onChange={(e) => setUniqueIdSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchByUniqueId()}
                  placeholder="e.g. vrisa_abc12345"
                  className={`w-full rounded-lg ${currentTheme.input} px-3 py-2 text-sm ${currentTheme.text} placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                />
                <button
                  onClick={searchByUniqueId}
                  disabled={searching || !uniqueIdSearch.trim()}
                  className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search User
                    </>
                  )}
                </button>
              </div>
              
              {searchResult && (
                <div className={`rounded-lg ${currentTheme.card} p-3 border ${currentTheme.border}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white text-sm shadow-lg overflow-hidden">
                      {searchResult.user.profilePicture ? (
                        <img
                          src={searchResult.user.profilePicture}
                          alt={searchResult.user.name || "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        searchResult.user.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${currentTheme.text} truncate`}>{searchResult.user.name || "Unknown"}</p>
                      <p className={`text-xs ${currentTheme.textSecondary} font-mono break-all`}>{searchResult.user.uniqueId}</p>
                    </div>
                  </div>
                  {searchResult.user.bio && (
                    <p className={`text-xs ${currentTheme.textSecondary} mb-3 line-clamp-2`}>{searchResult.user.bio}</p>
                  )}
                  {searchResult.connectionStatus === "accepted" ? (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Already connected
                    </div>
                  ) : searchResult.connectionStatus === "pending" ? (
                    <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/30">
                      <svg className="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Request pending
                    </div>
                  ) : (
                    <button
                      onClick={() => sendConnectionRequest(searchResult.user.id)}
                      className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Send Connection Request
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DM Contacts */}
          {viewMode === 'dm' && (
            connectedUsers.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <div className="mb-2 text-3xl">💬</div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>No contacts yet</p>
                <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>Click &quot;Add Contact&quot; to connect</p>
              </div>
            ) : (
              connectedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedGroup(null);
                    setViewMode('dm');
                    setShowMobileChat(true);
                  }}
                  className={`group mb-2 w-full rounded-xl p-3 text-left transition-all ${
                    selectedUser?.id === user.id
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                      : `${currentTheme.card} hover:opacity-80 border ${currentTheme.border}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-white text-sm overflow-hidden ${
                      selectedUser?.id === user.id
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50"
                        : `bg-gradient-to-br ${currentTheme.accent}`
                    }`}>
                      {(user as any).profilePicture ? (
                        <img
                          src={(user as any).profilePicture}
                          alt={getUserDisplayName(user)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getUserInitials(user as any)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${currentTheme.text} truncate`}>{getUserDisplayName(user)}</p>
                      <p className={`text-xs ${currentTheme.textSecondary} truncate`}>{user.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )
          )}

          {/* Groups List */}
          {viewMode === 'group' && (
            groups.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <div className="mb-2 text-3xl">👥</div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>No groups yet</p>
                <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>Click &quot;New Group&quot; to create one</p>
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedUser(null);
                    setViewMode('group');
                    setShowMobileChat(true);
                  }}
                  className={`group mb-2 w-full rounded-xl p-3 text-left transition-all ${
                    selectedGroup?.id === group.id
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 shadow-lg shadow-purple-500/20"
                      : `${currentTheme.card} hover:opacity-80 border ${currentTheme.border}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-white text-sm overflow-hidden ${
                      selectedGroup?.id === group.id
                        ? "bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50"
                        : `bg-gradient-to-br ${currentTheme.accent}`
                    }`}>
                      {group.groupPicture ? (
                        <img
                          src={group.groupPicture}
                          alt={group.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        group.name[0]?.toUpperCase() || "G"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${currentTheme.text} truncate`}>{group.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {group.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* Chat Area - Full screen on mobile */}
      <div className={`${!showMobileChat && '!hidden md:!flex'} flex flex-1 flex-col`}>
        {!selectedUser && !selectedGroup ? (
          <div className={`flex flex-1 items-center justify-center ${currentTheme.bg}`}>
            <div className="text-center px-4">
              <div className="mb-6 text-7xl animate-bounce">💬</div>
              <h2 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>Welcome to Vrisa</h2>
              <p className={`${currentTheme.textSecondary} mb-4`}>Secure end-to-end encrypted messaging</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AES-256 Encrypted</span>
              </div>
            </div>
          </div>
        ) : selectedUser ? (
          <>
            {/* DM Chat Header with Mobile Back Button */}
            <div className={`flex items-center border-b ${currentTheme.border} ${currentTheme.card} backdrop-blur-xl p-4 shadow-lg`}>
              {/* Mobile Back Button */}
              <button
                onClick={closeMobileChat}
                className="md:hidden mr-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <svg className={`w-5 h-5 ${currentTheme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  setProfileCardUser(selectedUser);
                  setShowProfileCard(true);
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white shadow-lg shadow-cyan-500/30 overflow-hidden ring-2 ring-cyan-500/30 hover:ring-4 hover:ring-cyan-500/50 transition-all cursor-pointer"
              >
                {selectedUser.profilePicture ? (
                  <img
                    src={selectedUser.profilePicture}
                    alt={getUserDisplayName(selectedUser)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getUserInitials(selectedUser as any)
                )}
              </button>
              <div className="ml-3 flex-1">
                <h2 className={`font-bold ${currentTheme.text} text-lg`}>{getUserDisplayName(selectedUser)}</h2>
                <p className={`text-xs ${currentTheme.textSecondary}`}>{selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1.5 border border-green-500/30">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-green-400">Encrypted</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-6 ${theme === 'light' ? 'bg-white' : theme === 'dark' ? 'bg-gradient-to-br from-black via-zinc-950/50 to-black ring-1 ring-inset ring-blue-500/10' : 'bg-gradient-to-br from-slate-950/30 to-cyan-950/10'}`}>
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-3 text-5xl">👋</div>
                    <p className={`${currentTheme.textSecondary}`}>Start the conversation</p>
                    <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>Send your first encrypted message</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((msg, idx) => {
                    const isMine = msg.senderId === session?.user?.id;
                    const showTime = idx === 0 || 
                      new Date(msg.createdAt).getTime() - new Date(messages[idx - 1].createdAt).getTime() > 300000;
                    
                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className={`text-xs ${currentTheme.textSecondary} ${currentTheme.card} px-3 py-1 rounded-full`}>
                              {new Date(msg.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && (
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${currentTheme.accent} text-xs font-semibold text-white overflow-hidden`}>
                              {selectedUser.profilePicture ? (
                                <img
                                  src={selectedUser.profilePicture}
                                  alt={getUserDisplayName(selectedUser)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getUserInitials(selectedUser as any)
                              )}
                            </div>
                          )}
                          <div
                            className={`group relative max-w-md rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? `bg-gradient-to-r ${theme === 'dark' ? 'from-blue-500 to-blue-600' : 'from-cyan-500 to-blue-600'} text-white shadow-lg ${theme === 'dark' ? 'shadow-blue-500/30' : 'shadow-cyan-500/30'}`
                                : 'bg-gradient-to-r from-blue-300 to-blue-400 text-white shadow-lg shadow-blue-300/30'
                            }`}
                            onContextMenu={(e) => handleContextMenu(e, msg.id, isMine)}
                          >
                            {/* Image Preview */}
                            {msg.messageType === "image" && msg.fileUrl && (
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || "Image"}
                                className="max-w-sm rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => downloadFile(msg.fileUrl!, msg.fileName || "image.jpg")}
                                title="Click to download"
                              />
                            )}

                            {/* Video Preview */}
                            {msg.messageType === "video" && msg.fileUrl && (
                              <video
                                src={msg.fileUrl}
                                controls
                                className="max-w-sm rounded-lg mb-2"
                              />
                            )}

                            {/* File Attachment */}
                            {msg.messageType === "file" && msg.fileName && (
                              <div
                                onClick={() => downloadFile(msg.fileUrl!, msg.fileName!)}
                                className={`flex items-center gap-2 ${theme === 'light' ? 'bg-blue-100/50 hover:bg-blue-200/50' : 'bg-black/20 hover:bg-black/30'} rounded-lg px-3 py-2 mb-2 cursor-pointer`}
                              >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                  <p className="text-xs opacity-70">{(msg.fileSize! / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </div>
                            )}

                            {/* Decryption Error Warning */}
                            {msg.decryptError && (
                              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 mb-2">
                                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-xs text-red-300">Failed to decrypt this message</span>
                              </div>
                            )}

                            {/* Only show text if not a file-only message */}
                            {msg.plaintext && msg.plaintext.trim() !== "" && msg.messageType === "text" && (
                              <p className={`break-words leading-relaxed ${msg.decryptError ? 'text-red-300 italic' : ''}`}>
                                {msg.plaintext}
                              </p>
                            )}
                            {msg.plaintext && msg.plaintext.trim() !== "" && msg.messageType !== "text" && !msg.messageType?.startsWith("image") && !msg.messageType?.startsWith("video") && msg.messageType !== "file" && (
                              <p className={`break-words leading-relaxed ${msg.decryptError ? 'text-red-300 italic' : ''}`}>
                                {msg.plaintext}
                              </p>
                            )}
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className={`text-xs ${isMine ? "text-cyan-100/60" : "text-white/70"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {isMine && (
                                <button
                                  onClick={() => unsendMessage(msg.id)}
                                  className={`opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 rounded ${theme === 'light' ? 'bg-blue-100 hover:bg-blue-200' : 'bg-black/20 hover:bg-black/40'} transition-all`}
                                  title="Unsend message"
                                >
                                  Unsend
                                </button>
                              )}
                            </div>
                          </div>
                          {isMine && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/50 overflow-hidden">
                              {currentUser?.profilePicture ? (
                                <img
                                  src={currentUser.profilePicture}
                                  alt={currentUser.name || "You"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                session?.user && getUserInitials(session.user)
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className={`border-t ${currentTheme.border} ${currentTheme.card} backdrop-blur-xl p-4 ${theme === 'dark' ? 'ring-1 ring-blue-500/20' : theme === 'light' ? 'ring-1 ring-blue-200' : 'ring-1 ring-slate-700/50'}`}>
              {/* File Preview */}
              {(selectedFile || filePreview) && (
                <div className={`mb-3 p-3 ${currentTheme.card} rounded-lg border ${currentTheme.border}`}>
                  <div className="flex items-start gap-3">
                    {filePreview && (
                      <img src={filePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${currentTheme.text} truncate`}>{selectedFile?.name}</p>
                      <p className={`text-xs ${currentTheme.textSecondary}`}>
                        {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className={`${currentTheme.textSecondary} hover:opacity-80 transition-colors`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${currentTheme.card} border ${currentTheme.border} transition-all hover:opacity-80 hover:scale-105`}
                  title="Attach file"
                >
                  <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Emoji Picker */}
                <div className="flex-shrink-0">
                  <EmojiPicker onEmojiSelect={(emoji) => setDraft(draft + emoji)} />
                </div>

                <div className="flex-1 relative">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message... 😊"
                    className={`w-full rounded-2xl ${currentTheme.input} px-5 py-3 ${currentTheme.text} placeholder:text-gray-500 focus:outline-none resize-none max-h-32 min-h-[48px] ${theme === 'light' ? 'border-2 border-blue-400 ring-2 ring-blue-200 focus:ring-blue-400' : theme === 'dark' ? 'border-2 border-blue-500/30 ring-1 ring-blue-500/20 focus:ring-cyan-500/50' : 'focus:ring-2 focus:ring-cyan-500/50'}`}
                    rows={1}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={(!draft.trim() && !selectedFile) || loading}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-all hover:shadow-cyan-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : selectedGroup ? (
          <>
            {/* Group Chat Header with Mobile Back Button */}
            <div className={`flex items-center border-b ${currentTheme.border} ${currentTheme.card} backdrop-blur-xl p-4 shadow-lg`}>
              {/* Mobile Back Button */}
              <button
                onClick={closeMobileChat}
                className="md:hidden mr-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <svg className={`w-5 h-5 ${currentTheme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 font-bold text-white shadow-lg shadow-purple-500/30 overflow-hidden ring-2 ring-purple-500/30">
                {selectedGroup.groupPicture ? (
                  <img
                    src={selectedGroup.groupPicture}
                    alt={selectedGroup.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  selectedGroup.name[0]?.toUpperCase() || "G"
                )}
              </div>
              <div className="ml-3 flex-1">
                <h2 className={`font-bold ${currentTheme.text} text-lg`}>{selectedGroup.name}</h2>
                <p className={`text-xs ${currentTheme.textSecondary}`}>{selectedGroup.members?.length || 0} members</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1.5 border border-purple-500/30">
                  <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-purple-400">Group Encrypted</span>
                </div>
              </div>
            </div>

            {/* Group Messages */}
            <div className={`flex-1 overflow-y-auto p-6 ${theme === 'light' ? 'bg-white' : theme === 'dark' ? 'bg-gradient-to-br from-black via-zinc-950/50 to-black ring-1 ring-inset ring-blue-500/10' : 'bg-gradient-to-br from-slate-950/30 to-purple-950/10'}`}>
              {groupMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-3 text-5xl">👥</div>
                    <p className={`${currentTheme.textSecondary}`}>Start the group conversation</p>
                    <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>Send your first group message</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {groupMessages.map((msg, idx) => {
                    const isMine = msg.senderId === session?.user?.id;
                    const showTime = idx === 0 || 
                      new Date(msg.createdAt).getTime() - new Date(groupMessages[idx - 1].createdAt).getTime() > 300000;
                    
                    // Get sender info from group members
                    const sender = selectedGroup.members?.find(m => m.user.id === msg.senderId)?.user;
                    
                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className={`text-xs ${currentTheme.textSecondary} ${currentTheme.card} px-3 py-1 rounded-full`}>
                              {new Date(msg.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 font-semibold text-white text-xs overflow-hidden flex-shrink-0">
                              {sender?.profilePicture ? (
                                <img
                                  src={sender.profilePicture}
                                  alt={sender.name || "User"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                sender?.name?.[0]?.toUpperCase() || "?"
                              )}
                            </div>
                          )}
                          
                          <div className={`flex flex-col max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                            {!isMine && (
                              <span className={`text-xs ${currentTheme.textSecondary} mb-1 px-2`}>
                                {sender?.name || "Unknown User"}
                              </span>
                            )}
                            
                            <div
                              className={`group relative rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? `bg-gradient-to-r ${theme === 'dark' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-pink-600'} text-white shadow-lg ${theme === 'dark' ? 'shadow-blue-500/30' : 'shadow-purple-500/30'}`
                                  : 'bg-gradient-to-r from-blue-300 to-blue-400 text-white shadow-lg shadow-blue-300/30'
                              }`}
                              onContextMenu={(e) => handleContextMenu(e, msg.id, isMine)}
                            >
                              {/* Only show text content if it's not just a file placeholder */}
                              {msg.content && msg.content.trim() !== "" && !msg.fileUrl && (
                                <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              )}
                              
                              {/* Show text with file if user added a caption */}
                              {msg.content && msg.content.trim() !== "" && msg.fileUrl && msg.content.trim() !== " " && (
                                <p className="break-words text-sm leading-relaxed whitespace-pre-wrap mb-2">
                                  {msg.content}
                                </p>
                              )}

                              {msg.fileUrl && (
                                <div className="mt-2">
                                  {msg.fileType?.startsWith("image/") ? (
                                    <div className="rounded-lg overflow-hidden max-w-xs">
                                      <img
                                        src={msg.fileUrl}
                                        alt={msg.fileName || "Image"}
                                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => downloadFile(msg.fileUrl!, msg.fileName || "image")}
                                      />
                                    </div>
                                  ) : msg.fileType?.startsWith("video/") ? (
                                    <video
                                      src={msg.fileUrl}
                                      controls
                                      className="rounded-lg max-w-xs"
                                    />
                                  ) : (
                                    <button
                                      onClick={() => downloadFile(msg.fileUrl!, msg.fileName || "file")}
                                      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                                        isMine
                                          ? "bg-white/20 hover:bg-white/30"
                                          : `${currentTheme.card} hover:opacity-80`
                                      }`}
                                    >
                                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div className="text-left">
                                        <p className="text-sm font-medium">{msg.fileName || "Download file"}</p>
                                        {msg.fileSize && (
                                          <p className="text-xs opacity-75">
                                            {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  )}
                                </div>
                              )}

                              <span className={`mt-1 block text-[10px] ${isMine ? "text-purple-200" : "text-white/70"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          
                          {isMine && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 font-semibold text-white text-xs overflow-hidden flex-shrink-0 shadow-lg shadow-purple-500/50">
                              {currentUser?.profilePicture ? (
                                <img
                                  src={currentUser.profilePicture}
                                  alt={currentUser.name || "You"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                currentUser?.name?.[0]?.toUpperCase() || session?.user?.name?.[0]?.toUpperCase() || "?"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Group Message Input */}
            <div className={`border-t ${currentTheme.border} ${currentTheme.card} backdrop-blur-xl p-4 ${theme === 'dark' ? 'ring-1 ring-blue-500/20' : theme === 'light' ? 'ring-1 ring-blue-200' : 'ring-1 ring-slate-700/50'}`}>
              {selectedFile && (
                <div className={`mb-3 rounded-lg ${currentTheme.card} p-3 border ${currentTheme.border}`}>
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith("image/") && filePreview && (
                      <img src={filePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${currentTheme.text} truncate`}>{selectedFile?.name}</p>
                      <p className={`text-xs ${currentTheme.textSecondary}`}>
                        {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className={`${currentTheme.textSecondary} hover:opacity-80 transition-colors`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${currentTheme.card} border ${currentTheme.border} transition-all hover:opacity-80 hover:scale-105`}
                  title="Attach file"
                >
                  <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Emoji Picker */}
                <div className="flex-shrink-0">
                  <EmojiPicker onEmojiSelect={(emoji) => setDraft(draft + emoji)} />
                </div>

                <div className="flex-1 relative">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a group message... 😊"
                    className={`w-full rounded-2xl ${currentTheme.input} px-5 py-3 ${currentTheme.text} placeholder:text-gray-500 focus:outline-none resize-none max-h-32 min-h-[48px] ${theme === 'light' ? 'border-2 border-blue-400 ring-2 ring-blue-200 focus:ring-blue-400' : theme === 'dark' ? 'border-2 border-blue-500/30 ring-1 ring-blue-500/20 focus:ring-purple-500/50' : 'focus:ring-2 focus:ring-purple-500/50'}`}
                    rows={1}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={(!draft.trim() && !selectedFile) || loading}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
