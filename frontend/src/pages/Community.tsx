import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MessageCircle, AlertTriangle, ExternalLink, UserPlus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

interface CommunityUser {
  id: string;
  username: string;
  full_name: string;
  field_of_study: string;
  bio: string;
  color: string;
}

const colors = [
  "from-primary to-glow-secondary",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

export default function Community() {
  const [people, setPeople] = useState<CommunityUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<CommunityUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await fetch("/api/v1/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = data.map((u: any, index: number) => ({
              id: u.id,
              username: u.username,
              full_name: u.full_name || u.username,
              field_of_study: u.field_of_study || "Student",
              bio: u.bio || "No bio provided.",
              color: colors[index % colors.length],
            }));
            setPeople(mapped);
          }
        }
      } catch (err) {
        console.error("Error fetching people:", err);
      }
    };
    fetchPeople();
  }, []);

  const filtered = people.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.field_of_study.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReport = async (userId: string, name: string) => {
    const reason = window.prompt(`Why are you reporting ${name}?`);
    if (!reason) return;

    try {
      const res = await fetch("/api/v1/reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          type: "user",
          target_id: userId,
          target_name: name,
          reason
        })
      });

      if (res.ok) {
        alert("Report submitted successfully. Our mod team will review it.");
        setSelected(null);
      } else {
        alert("Failed to report user.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reporting user.");
    }
  };

  const handleConnect = async () => {
    if (!selected) return;
    try {
      const res = await fetch("/api/v1/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ receiver_id: selected.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Connection request sent successfully!");
        setSelected(null);
      } else {
        alert(data.error || "Failed to send connection request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending request.");
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="heading-tight text-3xl font-bold text-foreground lg:text-4xl">Community</h1>
            <p className="mt-2 text-sm text-muted-foreground">Discover students, make friends, and find teammates.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-40 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((person, i) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", damping: 25 }}
              onClick={() => setSelected(person)}
              className="glass-card-hover cursor-pointer overflow-hidden p-5 flex flex-col items-center text-center"
            >
              <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${person.color} flex items-center justify-center mb-4 text-2xl font-bold`}>
                {person.full_name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="heading-tight text-lg font-semibold text-foreground truncate w-full">{person.full_name}</h3>
              <p className="mt-1 text-xs font-medium text-primary">@{person.username}</p>
              <span className="mt-2 rounded-full bg-secondary px-3 py-1 text-[10px] font-medium text-muted-foreground">
                {person.field_of_study}
              </span>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No students found matching your search.
            </div>
          )}
        </div>

        {/* User Detail Modal */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                onClick={() => setSelected(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none"
              >
                <div className="glass-card overflow-hidden border border-border/50 shadow-2xl w-full max-w-md pointer-events-auto flex flex-col items-center">
                  <div className={`w-full h-32 bg-gradient-to-br ${selected.color} relative`}>
                    <button onClick={() => setSelected(null)} className="absolute top-4 right-4 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 backdrop-blur-md">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-2xl font-bold">
                      {selected.full_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="p-6 pt-14 w-full text-center">
                    <h2 className="heading-tight text-2xl font-bold text-foreground">{selected.full_name}</h2>
                    <p className="text-sm font-medium text-primary mb-2">@{selected.username}</p>
                    <p className="text-xs text-muted-foreground px-3 py-1 bg-secondary/50 rounded-full inline-block mb-4">{selected.field_of_study}</p>
                    
                    <p className="text-sm text-muted-foreground mb-8 text-left p-4 bg-secondary/20 rounded-xl leading-relaxed">
                      {selected.bio}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button onClick={() => navigate(`/u/${selected.username}`)} className="glow-button flex flex-1 items-center justify-center gap-2 text-sm !py-2">
                        <ExternalLink className="h-4 w-4" /> View Portfolio
                      </button>
                      <button onClick={handleConnect} className="glow-button flex items-center justify-center gap-2 text-sm !py-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border-transparent">
                        <UserPlus className="h-4 w-4" /> Request
                      </button>
                      <button onClick={() => navigate('/messages')} className="glow-button-outline w-10 flex items-center justify-center text-sm !p-2 rounded-xl">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-6 border-t border-border/30 pt-4">
                       <button onClick={() => handleReport(selected.id, selected.full_name)} className="text-xs text-destructive hover:text-destructive/80 flex items-center justify-center gap-1 mx-auto transition-colors">
                          <AlertTriangle className="h-3 w-3" /> Report Person
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
}
