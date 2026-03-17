import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, User, Search, MessageCircle, UserMinus, UserPlus, Users, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

interface PendingRequest {
  id: string;
  sender: {
    id: string;
    username: string;
    full_name: string;
    profile_image: string | null;
    field_of_study: string | null;
  };
  created_at: string;
}

interface Connection {
  id: string;
  username: string;
  full_name: string;
  profile_image: string | null;
  connectionId?: string;
}

interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  field_of_study: string | null;
  bio: string | null;
}

const colors = [
  "from-primary to-glow-secondary",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

export default function Connections() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allUsers, setAllUsers] = useState<SuggestedUser[]>([]);
  const [pendingRequestsSent, setPendingRequestsSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"connections" | "pending" | "discover">("connections");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchConnectionsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [pRes, cRes, uRes] = await Promise.all([
        fetch("/api/v1/connections/pending", { headers }),
        fetch("/api/v1/connections", { headers }),
        fetch("/api/v1/users", { headers }),
      ]);

      if (pRes.ok) setPendingRequests(await pRes.json());
      if (cRes.ok) {
        const data = await cRes.json();
        const connectedUsers = (data.connectedUsers || []).map((u: any, i: number) => ({
          ...u,
          connectionId: data.connections?.[i]?.id || null,
        }));
        setConnections(connectedUsers);
        setPendingRequestsSent(data.pendingRequestsSent || []);
      }
      if (uRes.ok) {
        const users = await uRes.json();
        setAllUsers(users);
      }
    } catch (err) {
      console.error("Error fetching connections data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionsData();
  }, []);

  const handleAction = async (requestId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/v1/connections/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchConnectionsData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing request.");
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!window.confirm("Remove this connection?")) return;
    try {
      const res = await fetch(`/api/v1/connections/${connectionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        fetchConnectionsData();
      } else {
        alert("Failed to remove connection.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing connection.");
    }
  };

  const handleConnect = async (receiverId: string) => {
    setConnectingId(receiverId);
    try {
      const res = await fetch("/api/v1/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ receiver_id: receiverId }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchConnectionsData();
      } else {
        alert(data.error || "Failed to send request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending request.");
    } finally {
      setConnectingId(null);
    }
  };

  const connectedIds = new Set(connections.map((c) => c.id));
  const pendingReceivedIds = new Set(pendingRequests.map((p) => p.sender.id));
  const pendingSentIds = new Set(pendingRequestsSent.map((p) => p.receiver?.id || p.receiver_id));
  
  const discoverUsers = allUsers.filter(
    (u) =>
      !connectedIds.has(u.id) &&
      !pendingReceivedIds.has(u.id) &&
      !pendingSentIds.has(u.id) &&
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.field_of_study?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredConnections = connections.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { key: "connections" as const, label: "My Connections", count: connections.length, icon: Users },
    { key: "pending" as const, label: "Pending", count: pendingRequests.length, icon: User },
    { key: "discover" as const, label: "Discover People", count: null, icon: UserPlus },
  ];

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="heading-tight text-3xl font-bold text-foreground lg:text-4xl">
            Connections
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Grow your network — connect, collaborate, and message your peers.
          </p>
        </div>

        {/* Tabs + Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-secondary/30 p-1 border border-border/30">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count !== null && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      tab === t.key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="w-44 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* My Connections Tab */}
            {tab === "connections" && (
              <motion.div
                key="connections"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {filteredConnections.length === 0 ? (
                  <div className="glass-card p-12 border border-border/50 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No connections yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start discovering people and grow your network!
                    </p>
                    <button
                      onClick={() => setTab("discover")}
                      className="glow-button inline-flex items-center gap-2 text-sm"
                    >
                      <UserPlus className="h-4 w-4" /> Discover People
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredConnections.map((user, i) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass-card p-5 border border-border/50 group hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br ${
                              colors[i % colors.length]
                            } flex items-center justify-center text-sm font-bold text-white`}
                          >
                            {user.full_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-sm font-bold text-foreground truncate">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/messages?user=${user.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-2 text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Message
                          </button>
                          <button
                            onClick={() => navigate(`/u/${user.username}`)}
                            className="flex items-center justify-center rounded-xl bg-secondary/50 text-foreground px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => user.connectionId && handleRemoveConnection(user.connectionId)}
                            className="flex items-center justify-center rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-xs font-medium hover:bg-destructive/20 transition-colors"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Pending Requests Tab */}
            {tab === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {pendingRequests.length === 0 ? (
                  <div className="glass-card p-12 border border-border/50 text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No pending requests</h3>
                    <p className="text-sm text-muted-foreground">
                      When someone sends you a connection request, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((req, i) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-4 flex items-center justify-between border border-border/50 hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${
                              colors[i % colors.length]
                            } flex items-center justify-center text-sm font-bold text-white`}
                          >
                            {req.sender.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              {req.sender.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground">@{req.sender.username}</div>
                            {req.sender.field_of_study && (
                              <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {req.sender.field_of_study}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(req.id, "accept")}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 px-4 py-2 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "reject")}
                            className="flex items-center gap-1.5 rounded-xl bg-destructive/15 text-destructive px-4 py-2 text-xs font-medium hover:bg-destructive/25 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" /> Decline
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Discover Tab */}
            {tab === "discover" && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {discoverUsers.length === 0 ? (
                  <div className="glass-card p-12 border border-border/50 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search to discover more people.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {discoverUsers.map((user, i) => {
                      const isPending = pendingReceivedIds.has(user.id) || pendingSentIds.has(user.id);
                      const isConnected = connectedIds.has(user.id);
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="glass-card p-5 border border-border/50 flex flex-col items-center text-center hover:border-primary/20 transition-all"
                        >
                          <div
                            className={`h-16 w-16 rounded-full bg-gradient-to-br ${
                              colors[i % colors.length]
                            } flex items-center justify-center text-lg font-bold text-white mb-3`}
                          >
                            {user.full_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <h3 className="text-sm font-bold text-foreground truncate w-full">
                            {user.full_name}
                          </h3>
                          <p className="text-xs text-primary mt-0.5">@{user.username}</p>
                          {user.field_of_study && (
                            <span className="mt-2 rounded-full bg-secondary px-3 py-1 text-[10px] font-medium text-muted-foreground">
                              {user.field_of_study}
                            </span>
                          )}
                          <div className="mt-4 w-full flex gap-2">
                            {isConnected ? (
                              <span className="flex-1 text-center rounded-xl bg-emerald-500/10 text-emerald-500 px-3 py-2 text-xs font-medium">
                                ✓ Connected
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConnect(user.id)}
                                disabled={connectingId === user.id}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-2 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                {connectingId === user.id ? "Sending..." : "Connect"}
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/u/${user.username}`)}
                              className="flex items-center justify-center rounded-xl bg-secondary/50 text-foreground px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </AppLayout>
  );
}
