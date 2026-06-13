"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Search01Icon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon,
  LockIcon
} from "@hugeicons/core-free-icons";

interface LogEntry {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: string;
  schoolId: string | null;
  schoolName: string | null;
  timestamp: string;
}

export default function SessionLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Search input debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset page on new search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLogs = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await fetch(
        `/api/admin/logs?search=${encodeURIComponent(debouncedSearch)}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
      } else {
        console.error("Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setDataLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  // Auth and Admin check
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchLogs();
  }, [user, authLoading, router, fetchLogs]);

  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE) || 1;
  const isLoading = authLoading || dataLoading;
  const isAdmin = user?.role === "admin";

  const formatTimestamp = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  if (authLoading || (!isAdmin && user)) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-550 text-sm">Verifying access authorization…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <Sidebar 
        onCreateSchool={() => {}} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6 mt-3">
          
          {/* Breadcrumb & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-450">
              <Link href="/" className="hover:underline flex items-center gap-1">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={12} strokeWidth={2.5} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <svg className="w-7 h-7 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Session Audit Logs</span>
            </h1>
            <p className="text-slate-550 text-xs sm:text-sm">
              Real-time audit history of system logins and logouts for both administrators and user accounts.
            </p>
          </div>

          {/* Logs View Card */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Activity Log History 
                {totalLogs > 0 && (
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {totalLogs} record{totalLogs !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
              
              {/* Search bar */}
              <div className="relative flex items-center min-w-0 w-full sm:w-72">
                <span className="absolute left-3 text-slate-400 flex items-center">
                  <HugeiconsIcon icon={Search01Icon} size={15} color="currentColor" strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search user, school or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-9"
                />
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-semibold">Loading session log entries…</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-slate-150 border-dashed">
                <p className="text-slate-400 text-sm">No session logs found matching the filter criteria.</p>
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">Timestamp</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">Username</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">Account Role</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">School Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider select-none text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors align-middle">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800">
                            {log.username}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize tracking-wide ${
                              log.role === "admin"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>
                              {log.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-650 font-semibold max-w-[200px] truncate" title={log.schoolName || ""}>
                            {log.schoolName || <span className="text-slate-350 font-normal">—</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-block w-20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border text-center ${
                              log.action === "LOGIN"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                : "bg-rose-50 text-rose-700 border-rose-150"
                            }`}>
                              {log.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !isLoading && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">
                  Showing <span className="text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="text-slate-800">{Math.min(totalLogs, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
                  <span className="text-slate-800">{totalLogs}</span> entries
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="currentColor" strokeWidth={2.5} />
                    <span>Prev</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const isVisible =
                      totalPages <= 5 ||
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!isVisible) {
                      if (page === 2 || page === totalPages - 1) {
                        return (
                          <span key={`ellipsis-${page}`} className="px-2 text-slate-400 text-xs select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
