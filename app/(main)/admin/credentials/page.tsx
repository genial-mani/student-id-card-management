"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import CredentialsModal from "@/components/CredentialsModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  Search01Icon, 
  ArrowLeft01Icon, 
  LockIcon 
} from "@hugeicons/core-free-icons";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Student {
  id: string;
}

interface Class {
  id: string;
}

interface School {
  id: string;
  name: string;
  caption: string;
  address: string;
  phone: string;
  logoUrl: string;
  classes: Class[];
  students: Student[];
}

interface CredsState {
  [schoolId: string]: {
    username: string;
    loading: boolean;
    error?: string;
  };
}

export default function CredentialsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [credsData, setCredsData] = useState<CredsState>({});

  // Modal State
  const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string } | null>(null);

  const fetchSchoolsAndCredentials = async () => {
    try {
      setDataLoading(true);
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data: School[] = await response.json();
        setSchools(data);
        
        // Initialize loading state for all credentials
        const initialCreds: CredsState = {};
        data.forEach((s) => {
          initialCreds[s.id] = { username: "", loading: true };
        });
        setCredsData(initialCreds);

        // Fetch credentials for each school in parallel
        await Promise.all(
          data.map(async (school) => {
            try {
              const res = await fetch(`/api/schools/${school.id}/credentials`);
              if (res.ok) {
                const creds = await res.json();
                setCredsData((prev) => ({
                  ...prev,
                  [school.id]: { username: creds.users ? `${creds.users.length} Accounts` : "No account", loading: false },
                }));
              } else {
                setCredsData((prev) => ({
                  ...prev,
                  [school.id]: { username: "No account", loading: false, error: "Not found" },
                }));
              }
            } catch {
              setCredsData((prev) => ({
                ...prev,
                [school.id]: { username: "Error", loading: false, error: "Network error" },
              }));
            }
          })
        );
      }
    } catch (error) {
      console.error("Error fetching credentials overview:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Auth and Admin restriction hook
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    
    // REDIRECT non-admins immediately
    if (user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchSchoolsAndCredentials();
  }, [user, authLoading, router]);

  // Filter schools list based on search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [schools, searchQuery]);

  const isLoading = authLoading || dataLoading;
  const isAdmin = user?.role === "admin";

  // If loading or not an admin, show a loading placeholder (prevents flashing credentials info)
  if (authLoading || (!isAdmin && user)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <LoadingSpinner message="Verifying access credentials..." />
      </div>
    );
  }

  return (
    <>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Link href="/" className="hover:underline flex items-center gap-1">
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={12} strokeWidth={2.5} />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <HugeiconsIcon icon={LockIcon} size={26} className="text-violet-600 shrink-0" strokeWidth={2} />
                <span>Manage School Credentials</span>
              </h1>
              <p className="text-slate-550 text-xs sm:text-sm">
                Centralized panel to view usernames and securely reset passwords for educational user accounts.
              </p>
            </div>
          </div>

          {/* Search bar & list wrapper */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Active User Accounts</h2>
              
              {/* Search input */}
              <div className="relative flex items-center min-w-0 w-full sm:w-64">
                <span className="absolute left-3 text-slate-400 flex items-center">
                  <HugeiconsIcon icon={Search01Icon} size={15} color="currentColor" strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all h-9"
                />
              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="py-8">
                <LoadingSpinner message="Loading accounts information..." />
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-150 border-dashed">
                <p className="text-slate-400 text-sm">No schools registered matching search query.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/20">
                {filteredSchools.map((school) => {
                  const creds = credsData[school.id];
                  const username = creds?.username || "—";
                  const loadingCreds = creds?.loading;

                  return (
                    <div 
                      key={school.id} 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/30 transition-all"
                    >
                      {/* Left: School Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center shadow-xs">
                          {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-slate-400">{school.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate" title={school.name}>
                            {school.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate" title={school.address}>{school.address}</p>
                        </div>
                      </div>

                      {/* Center: Username Info */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">Username:</span>
                        {loadingCreds ? (
                          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <code className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 font-semibold select-all">
                            {username}
                          </code>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <button
                        onClick={() => setSelectedSchool({ id: school.id, name: school.name })}
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-4.5 bg-slate-50 hover:bg-violet-600 text-slate-650 hover:text-white border border-slate-200 hover:border-violet-600 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                      >
                        <HugeiconsIcon icon={LockIcon} size={13} className="shrink-0" strokeWidth={2} />
                        <span>Manage Account</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      {/* Credentials Modal */}
      {selectedSchool && (
        <CredentialsModal
          schoolId={selectedSchool.id}
          schoolName={selectedSchool.name}
          onClose={() => {
            setSelectedSchool(null);
            fetchSchoolsAndCredentials(); // Refresh data to sync usernames if reset
          }}
        />
      )}
    </>
  );
}
