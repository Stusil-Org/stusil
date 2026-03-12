import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Search, Users, MessageCircle, Hash, ArrowLeft,
  User, Loader2, Plus, Smile
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

// ==================== Types ====================

interface DirectConversation {
  id: string;
  type: "direct";
  userId: string;
  user: {
    id: string;
    full_name: string;
    username: string;
    email?: string;
  };
  name: string;
  lastMessage: string | null;
  timestamp: string;
}

interface ProjectConversation {
  id: string;
  type: "group";
  name: string;
  description: string;
  memberCount: number;
  lastMessage: string | null;
  lastSender: string | null;
  timestamp: string;
  members: { id: string; full_name: string; username: string; role: string }[];
}

type Conversation = DirectConversation | ProjectConversation;

interface ChatMessage {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    username: string;
  };
}

interface ConnectedUser {
  id: string;
  full_name: string;
  username: string;
}

// ==================== Helpers ====================
const colors = [
  "from-primary to-glow-secondary",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==================== Component ====================

export default function Messages() {
  const [searchParams] = useSearchParams();
  const preSelectedUserId = searchParams.get("user");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [chatFilter, setChatFilter] = useState<"all" | "direct" | "group">("all");
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = localStorage.getItem("token");

  // ---- Fetch current user ----
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUser(await res.json());
      } catch (err) {
        console.error("Error fetching user", err);
      }
    };
    fetchUser();
  }, [token]);

  // ---- Socket setup ----
  useEffect(() => {
    if (!user) return;

    const socket = io({
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_personal", user.id);
    });

    // Direct messages
    socket.on("receive_direct_message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Project messages
    socket.on("receive_project_message", (data: { projectId: string; message: ChatMessage }) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    });

    // Typing
    socket.on("user_typing", (data: { userName: string }) => {
      setTypingUser(data.userName);
    });
    socket.on("user_stop_typing", () => {
      setTypingUser(null);
    });

    // Auto-join project group chat when application is accepted
    socket.on("auto_join_project", (data: { projectId: string; projectTitle: string; role: string }) => {
      // Join the project room immediately
      socket.emit("join_project", data.projectId);
      // Refresh conversations to show the new group chat
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // ---- Join project rooms ----
  useEffect(() => {
    if (!socketRef.current) return;
    conversations
      .filter((c) => c.type === "group")
      .forEach((c) => {
        socketRef.current?.emit("join_project", c.id);
      });
  }, [conversations]);

  // ---- Fetch conversations ----
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [directRes, projectRes] = await Promise.all([
        fetch("/api/v1/messages/conversations", { headers }),
        fetch("/api/v1/messages/projects", { headers }),
      ]);

      let allConvs: Conversation[] = [];
      if (directRes.ok) {
        const direct: DirectConversation[] = await directRes.json();
        allConvs = [...allConvs, ...direct];
      }
      if (projectRes.ok) {
        const projects: ProjectConversation[] = await projectRes.json();
        allConvs = [...allConvs, ...projects];
      }

      // Sort by timestamp
      allConvs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setConversations(allConvs);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ---- Handle preselected user from URL ----
  useEffect(() => {
    if (!preSelectedUserId || loading || !token) return;

    // Check if already in conversations
    const existing = conversations.find(
      (c) => c.type === "direct" && (c as DirectConversation).userId === preSelectedUserId
    );
    if (existing) {
      setActiveConv(existing);
      return;
    }

    // Fetch user info and create a temporary conversation
    const fetchTargetUser = async () => {
      try {
        const res = await fetch("/api/v1/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const users = await res.json();
          const target = users.find((u: any) => u.id === preSelectedUserId);
          if (target) {
            const tempConv: DirectConversation = {
              id: target.id,
              type: "direct",
              userId: target.id,
              user: target,
              name: target.full_name,
              lastMessage: null,
              timestamp: new Date().toISOString(),
            };
            setConversations((prev) => [tempConv, ...prev]);
            setActiveConv(tempConv);
          }
        }
      } catch (err) {
        console.error("Error fetching target user:", err);
      }
    };
    fetchTargetUser();
  }, [preSelectedUserId, loading, token, conversations]);

  // ---- Fetch messages for active conversation ----
  useEffect(() => {
    if (!activeConv || !token) return;
    setMsgsLoading(true);
    setMessages([]);

    const fetchMessages = async () => {
      try {
        let url = "";
        if (activeConv.type === "direct") {
          url = `/api/v1/messages/direct/${(activeConv as DirectConversation).userId}`;
        } else {
          url = `/api/v1/messages/project/${activeConv.id}`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMessages(await res.json());
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setMsgsLoading(false);
      }
    };

    fetchMessages();
  }, [activeConv, token]);

  // ---- Auto scroll ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- Fetch connected users for new chat ----
  useEffect(() => {
    if (!showNewChat || !token) return;
    const fetchConnections = async () => {
      try {
        const res = await fetch("/api/v1/connections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConnectedUsers(data.connectedUsers || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConnections();
  }, [showNewChat, token]);

  // ---- Send message ----
  const handleSend = async () => {
    if (!newMsg.trim() || !activeConv || !token || sending) return;
    setSending(true);

    try {
      let url = "";
      let body: any = {};

      if (activeConv.type === "direct") {
        url = "/api/v1/messages/send";
        body = {
          receiver_id: (activeConv as DirectConversation).userId,
          message_text: newMsg.trim(),
        };
      } else {
        url = `/api/v1/messages/project/${activeConv.id}`;
        body = { message_text: newMsg.trim() };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const msg = await res.json();

        // Emit via socket
        if (activeConv.type === "direct") {
          socketRef.current?.emit("send_direct_message", {
            receiverId: (activeConv as DirectConversation).userId,
            message: msg,
          });
        } else {
          socketRef.current?.emit("send_project_message", {
            projectId: activeConv.id,
            message: msg,
          });
        }

        // Add to local messages (avoid duplicates from socket)
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        setNewMsg("");

        // Stop typing
        if (activeConv.type === "direct") {
          socketRef.current?.emit("typing_stop", {
            userId: user?.id,
            receiverId: (activeConv as DirectConversation).userId,
          });
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  // ---- Typing indicator ----
  const handleTyping = () => {
    if (!activeConv || !socketRef.current || !user) return;

    const data: any = { userId: user.id, userName: user.full_name };
    if (activeConv.type === "direct") {
      data.receiverId = (activeConv as DirectConversation).userId;
    } else {
      data.projectId = activeConv.id;
    }
    socketRef.current.emit("typing_start", data);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing_stop", data);
    }, 2000);
  };

  // ---- Start a new direct chat ----
  const startDirectChat = (targetUser: ConnectedUser) => {
    const existing = conversations.find(
      (c) => c.type === "direct" && (c as DirectConversation).userId === targetUser.id
    );
    if (existing) {
      setActiveConv(existing);
    } else {
      const newConv: DirectConversation = {
        id: targetUser.id,
        type: "direct",
        userId: targetUser.id,
        user: { ...targetUser, email: "" },
        name: targetUser.full_name,
        lastMessage: null,
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConv(newConv);
    }
    setShowNewChat(false);
  };

  // ---- Filter conversations ----
  const filteredConvs = conversations.filter((c) => {
    if (chatFilter === "direct" && c.type !== "direct") return false;
    if (chatFilter === "group" && c.type !== "group") return false;
    if (searchQuery) {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (!user) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="heading-tight text-3xl font-bold text-foreground lg:text-4xl">
            Messages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat with connections or collaborate in project groups.
          </p>
        </div>

        <div className="glass-card flex h-[calc(100vh-12rem)] overflow-hidden border border-border/50">
          {/* ==================== SIDEBAR ==================== */}
          <div
            className={`${
              activeConv ? "hidden md:flex" : "flex"
            } w-full md:w-80 shrink-0 flex-col border-r border-border/30`}
          >
            {/* Search + New Chat */}
            <div className="p-3 border-b border-border/20 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-xl bg-secondary/30 px-3 py-2 border border-border/30">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex gap-1">
                {(["all", "direct", "group"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setChatFilter(f)}
                    className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-all ${
                      chatFilter === f
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "All" : f === "direct" ? "Direct" : "Groups"}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No matching chats" : "No conversations yet"}
                  </p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5 p-2">
                  {filteredConvs.map((conv, i) => {
                    const isActive = activeConv?.id === conv.id && activeConv?.type === conv.type;
                    return (
                      <button
                        key={`${conv.type}-${conv.id}`}
                        onClick={() => setActiveConv(conv)}
                        className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            conv.type === "group"
                              ? "bg-primary/20 text-primary"
                              : `bg-gradient-to-br ${colors[i % colors.length]}`
                          } text-xs font-bold text-white`}
                        >
                          {conv.type === "group" ? (
                            <Hash className="h-4 w-4" />
                          ) : (
                            conv.name?.substring(0, 2).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {conv.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                              {conv.timestamp ? formatTime(conv.timestamp) : ""}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {conv.type === "group" && conv.lastSender
                              ? `${(conv as ProjectConversation).lastSender}: `
                              : ""}
                            {conv.lastMessage || "No messages yet"}
                          </p>
                        </div>

                        {conv.type === "group" && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                            <Users className="h-3 w-3" />
                            {(conv as ProjectConversation).memberCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ==================== CHAT AREA ==================== */}
          <div
            className={`${
              activeConv ? "flex" : "hidden md:flex"
            } flex-1 flex-col relative`}
          >
            {!activeConv ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Choose a chat from the sidebar or start a new conversation with your connections.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="border-b border-border/30 px-4 md:px-6 py-3 bg-card/80 backdrop-blur flex items-center gap-3 z-10">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                      activeConv.type === "group"
                        ? "bg-primary/20 text-primary"
                        : "bg-gradient-to-br from-primary to-glow-secondary"
                    } text-xs font-bold text-white`}
                  >
                    {activeConv.type === "group" ? (
                      <Hash className="h-4 w-4" />
                    ) : (
                      activeConv.name?.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {activeConv.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {activeConv.type === "group"
                        ? `${(activeConv as ProjectConversation).memberCount} members · Project group`
                        : `@${(activeConv as DirectConversation).user.username}`}
                    </p>
                  </div>
                  {activeConv.type === "group" && (
                    <div className="flex -space-x-1.5">
                      {(activeConv as ProjectConversation).members.slice(0, 4).map((m, i) => (
                        <div
                          key={m.id}
                          className={`h-7 w-7 rounded-full bg-gradient-to-br ${
                            colors[i % colors.length]
                          } border-2 border-card flex items-center justify-center text-[9px] font-bold text-white`}
                          title={m.full_name}
                        >
                          {m.full_name.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {(activeConv as ProjectConversation).members.length > 4 && (
                        <div className="h-7 w-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                          +{(activeConv as ProjectConversation).members.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1">
                  {msgsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Smile className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No messages yet. Say hello! 👋
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === user.id;
                        const showAvatar =
                          index === 0 ||
                          messages[index - 1]?.sender_id !== msg.sender_id;
                        const showTimestamp =
                          index === messages.length - 1 ||
                          messages[index + 1]?.sender_id !== msg.sender_id;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
                              showAvatar ? "mt-3" : "mt-0.5"
                            }`}
                          >
                            <div
                              className={`flex items-end gap-2 max-w-[75%] ${
                                isOwn ? "flex-row-reverse" : ""
                              }`}
                            >
                              {/* Avatar (only for group or first in chain) */}
                              {!isOwn && activeConv.type === "group" && showAvatar ? (
                                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground">
                                  {msg.sender.full_name.substring(0, 2).toUpperCase()}
                                </div>
                              ) : !isOwn && activeConv.type === "group" ? (
                                <div className="w-7 flex-shrink-0" />
                              ) : null}

                              <div>
                                {/* Sender name for group chats */}
                                {!isOwn && activeConv.type === "group" && showAvatar && (
                                  <p className="text-[10px] font-medium text-muted-foreground mb-1 ml-1">
                                    {msg.sender.full_name}
                                  </p>
                                )}
                                <div
                                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground rounded-br-md"
                                      : "bg-secondary text-foreground rounded-bl-md"
                                  }`}
                                >
                                  <p>{msg.message_text}</p>
                                </div>
                                {showTimestamp && (
                                  <p
                                    className={`mt-1 text-[10px] ${
                                      isOwn
                                        ? "text-right text-muted-foreground/60"
                                        : "text-muted-foreground/60 ml-1"
                                    }`}
                                  >
                                    {formatMessageTime(msg.created_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}

                  {/* Typing indicator */}
                  {typingUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      {typingUser} is typing...
                    </motion.div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-border/30 p-3 md:p-4 bg-card/80 backdrop-blur z-10">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-3"
                  >
                    <input
                      value={newMsg}
                      onChange={(e) => {
                        setNewMsg(e.target.value);
                        handleTyping();
                      }}
                      placeholder={
                        activeConv.type === "group"
                          ? `Message #${activeConv.name.toLowerCase().replace(/\s+/g, "-")}...`
                          : `Message ${activeConv.name}...`
                      }
                      className="flex-1 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newMsg.trim() || sending}
                      className="glow-button flex h-11 w-11 items-center justify-center !rounded-xl !p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ==================== NEW CHAT MODAL ==================== */}
      <AnimatePresence>
        {showNewChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowNewChat(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">New Conversation</h2>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Start a direct message with one of your connections.
                </p>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {connectedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No connections yet. Connect with people first!
                      </p>
                    </div>
                  ) : (
                    connectedUsers.map((cu, i) => (
                      <button
                        key={cu.id}
                        onClick={() => startDirectChat(cu)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary/50 border border-transparent hover:border-primary/20 transition-all"
                      >
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                            colors[i % colors.length]
                          } flex items-center justify-center text-xs font-bold text-white`}
                        >
                          {cu.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {cu.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">@{cu.username}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
