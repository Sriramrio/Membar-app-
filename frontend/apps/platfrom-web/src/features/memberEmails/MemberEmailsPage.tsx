import { useCallback, useEffect, useState } from "react";
import { PageHeader, Card, Pill, Loading } from "@/components/Ui";
import { API_BASE, runQuery } from "@/services/api";
import { QUERY_IDS } from "@/contracts/catalogue";
import type { TemplateDefinition } from "@/contracts/platform";

type EmailTemplate = {
  templateCode: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
  updatedAt?: string;
};

type TemplateSummary = {
  templateCode: string;
  name: string;
  subject: string;
  channel: string;
  isActive: boolean;
};

type BatchSummary = {
  batchId: string;
  chapterId: string;
  state: string;
  expectedCount: number;
  activated: number;
  held: number;
};

type BatchMember = {
  membershipId: string;
  email: string;
  fullName: string;
  status: string;
  lastSentAt?: string;
  lastStatus?: string;
  temporaryPassword?: string;
  phoneNumber?: string;
  isContactVerified?: boolean;
  chapterName?: string;
};

type DispatchItem = {
  membershipId: string;
  email: string;
  fullName: string;
  status: string;
  errorMessage?: string;
  sentAt?: string;
};

type DispatchResult = {
  batchId: string;
  totalMembers: number;
  sentCount: number;
  failedCount: number;
  items: DispatchItem[];
};

type DispatchLogItem = {
  id: string;
  batchId?: string;
  membershipId: string;
  email: string;
  fullName: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
};

const targetBase = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
const endpoint = targetBase ? `${targetBase}/api/platform/member-emails` : "/api/platform/member-emails";

async function request<T>(
  url: string,
  method = "GET",
  body?: object,
): Promise<T> {
  const token = sessionStorage.getItem('sethu:token') || localStorage.getItem('sethu:token');
  if (!token) throw new Error('Authentication required. Please sign in again.');

  const fullUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${targetBase}${url.startsWith('/') ? '' : '/'}${url}`;

  const response = await fetch(fullUrl, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const errText = await response.text();
    let errDetail = errText || `Server response ${response.status}`;
    try {
      const parsed = JSON.parse(errText);
      errDetail = parsed.detail || parsed.message || parsed.title || errDetail;
    } catch {}
    throw new Error(errDetail);
  }

  if (contentType.includes("text/html")) {
    throw new Error(`API endpoint returned HTML instead of JSON. Ensure backend API is reachable at ${targetBase || 'https://sethudbnapi.dharmicbusines.com'}`);
  }

  return response.json();
}

export function MemberEmailsPage() {
  const [activeTab, setActiveTab] = useState<"dispatch" | "template" | "logs">("dispatch");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Template state
  const [availableTemplates, setAvailableTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("MEMBER_WELCOME_CREDENTIALS");
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  // Members & Dispatch state
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [members, setMembers] = useState<BatchMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [singleBusyId, setSingleBusyId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [dispatchBusy, setDispatchBusy] = useState(false);

  // Pagination state for Members Directory
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Password visibility & clipboard state
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [revealAllPasswords, setRevealAllPasswords] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Logs state & Pagination
  const [logs, setLogs] = useState<DispatchLogItem[]>([]);
  const [logsCurrentPage, setLogsCurrentPage] = useState<number>(1);
  const [logsPageSize, setLogsPageSize] = useState<number>(10);

  // Load Templates List
  const loadTemplatesList = useCallback(async () => {
    const combined: TemplateSummary[] = [];
    const seen = new Set<string>();

    // 1. Fetch from platform query (sethu_platform_templates)
    try {
      const res = await runQuery<{ items: TemplateDefinition[] }>({
        queryId: QUERY_IDS.templateList,
        pagination: { pageSize: 100 },
      });
      if (res?.data?.items) {
        res.data.items.forEach((item) => {
          const key = item.code.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            combined.push({
              templateCode: item.code,
              name: item.name,
              subject: item.subject || item.name,
              channel: item.channel,
              isActive: item.status === "Published",
            });
          }
        });
      }
    } catch (e) {
      console.warn("Platform templates query failed", e);
    }

    // 2. Also try fetching from Member Emails API (email_templates)
    try {
      const list = await request<TemplateSummary[]>(`${endpoint}/templates`);
      if (Array.isArray(list)) {
        list.forEach((t) => {
          const key = t.templateCode.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(t);
          }
        });
      }
    } catch (e) {
      console.warn("Member emails API templates list not available yet", e);
    }

    if (combined.length === 0) {
      combined.push({
        templateCode: "MEMBER_WELCOME_CREDENTIALS",
        name: "Member Welcome & Credentials",
        subject: "Welcome to SETHU — Your Account Credentials & Portal Access",
        channel: "EMAIL",
        isActive: true,
      });
    }

    setAvailableTemplates(combined);
    if (!selectedTemplateCode || !combined.some((c) => c.templateCode.toLowerCase() === selectedTemplateCode.toLowerCase())) {
      setSelectedTemplateCode(combined[0].templateCode);
    }
  }, [selectedTemplateCode]);

  // Load Template
  const loadTemplate = useCallback(async (codeToLoad?: string) => {
    setLoading(true);
    try {
      const code = codeToLoad || selectedTemplateCode || "MEMBER_WELCOME_CREDENTIALS";

      // 1. Try from Member Emails API
      try {
        const data = await request<EmailTemplate>(`${endpoint}/template?templateCode=${encodeURIComponent(code)}`);
        if (data && data.bodyHtml) {
          setTemplate(data);
          setSubject(data.subject);
          setBodyHtml(data.bodyHtml);
          setErrorMessage("");
          return;
        }
      } catch (err) {
        console.warn("API /template failed, falling back to platform query", err);
      }

      // 2. Fallback: Query platform templates catalog
      const res = await runQuery<{ items: TemplateDefinition[] }>({
        queryId: QUERY_IDS.templateList,
        pagination: { pageSize: 100 },
      });
      const found = res?.data?.items?.find((i) => i.code.toLowerCase() === code.toLowerCase());
      if (found) {
        setTemplate({
          templateCode: found.code,
          name: found.name,
          subject: found.subject || found.name,
          bodyHtml: found.body,
          variables: found.variables || [],
        });
        setSubject(found.subject || found.name);
        setBodyHtml(found.body);
        setErrorMessage("");
      }
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateCode]);

  // Load Batches
  const loadBatches = useCallback(async () => {
    try {
      const data = await request<BatchSummary[]>(`${endpoint}/batches`);
      setBatches(data);
    } catch (e) {
      console.warn("Could not load batches", e);
    }
  }, []);

  // Load Members for selected batch or all batches
  const loadBatchMembers = useCallback(async (batchId?: string) => {
    setLoading(true);
    try {
      const url = batchId ? `${endpoint}/members?batchId=${encodeURIComponent(batchId)}` : `${endpoint}/members`;
      const data = await request<BatchMember[]>(url);
      setMembers(data);
      // Default: select active members
      const activeIds = data.filter((m) => m.status === "ACTIVE" || m.status === "ALREADY_ACTIVE").map((m) => m.membershipId);
      setSelectedMemberIds(activeIds);
    } catch (e) {
      console.warn("Could not load batch members", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Logs
  const loadLogs = useCallback(async () => {
    try {
      const data = await request<DispatchLogItem[]>(`${endpoint}/logs`);
      setLogs(data);
    } catch (e) {
      console.warn("Could not load dispatch logs", e);
    }
  }, []);

  useEffect(() => {
    void loadTemplatesList();
    void loadTemplate();
    void loadBatches();
    void loadLogs();
  }, [loadTemplatesList, loadTemplate, loadBatches, loadLogs]);

  useEffect(() => {
    void loadBatchMembers(selectedBatch);
  }, [selectedBatch, loadBatchMembers]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBatch, memberSearch, statusFilter, pageSize]);

  // Save template
  const handleSaveTemplate = async () => {
    setLoading(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const code = selectedTemplateCode || template?.templateCode || "MEMBER_WELCOME_CREDENTIALS";
      const name = template?.name || availableTemplates.find(t => t.templateCode === code)?.name || "Member Welcome & Credentials";
      const saved = await request<EmailTemplate>(`${endpoint}/template`, "PUT", {
        templateCode: code,
        name,
        subject,
        bodyHtml,
      });
      setTemplate(saved);
      setStatusMessage(`Template "${name}" saved successfully!`);
      void loadTemplatesList();
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setErrorMessage("Please enter a valid recipient email address for testing.");
      return;
    }
    setTestBusy(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await request<{ success: boolean; message: string }>(
        `${endpoint}/test-send`,
        "POST",
        {
          recipientEmail: testEmail,
          templateCode: selectedTemplateCode || template?.templateCode || "MEMBER_WELCOME_CREDENTIALS",
          subject,
          bodyHtml,
        }
      );
      if (res.success) {
        setStatusMessage(res.message || "Test email dispatched successfully!");
      } else {
        setErrorMessage(res.message || "Test email failed to send.");
      }
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setTestBusy(false);
    }
  };

  // Dispatch to Selected Members or All
  const handleDispatch = async (targetIds?: string[]) => {
    const idsToSend = targetIds ?? selectedMemberIds;
    if (idsToSend.length === 0) {
      setErrorMessage("Please select at least one member to send credentials.");
      return;
    }

    const countText = idsToSend.length === 1 ? "1 member" : `${idsToSend.length} members`;
    if (!confirm(`Are you sure you want to send credentials to ${countText} using existing database passwords?`)) {
      return;
    }

    setDispatchBusy(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await request<DispatchResult>(`${endpoint}/dispatch`, "POST", {
        batchId: selectedBatch || null,
        templateCode: selectedTemplateCode || template?.templateCode || "MEMBER_WELCOME_CREDENTIALS",
        generateNewPassword: false,
        membershipIds: idsToSend,
      });
      setDispatchResult(res);
      if (res.failedCount === 0) {
        setStatusMessage(
          `Dispatched successfully! All ${res.sentCount} credentials sent directly using stored database passwords!`
        );
      } else if (res.sentCount === 0) {
        const firstErr = res.items.find((x) => x.status === "FAILED")?.errorMessage;
        setErrorMessage(
          `All ${res.failedCount} emails failed to send. Reason: ${firstErr ?? "Check delivery logs"}`
        );
      } else {
        setStatusMessage(
          `Partially dispatched: ${res.sentCount} sent, ${res.failedCount} failed.`
        );
      }
      void loadBatchMembers(selectedBatch);
      void loadLogs();
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setDispatchBusy(false);
    }
  };

  // Dispatch Single Member
  const handleDispatchSingle = async (member: BatchMember) => {
    if (!confirm(`Send login credentials to ${member.fullName} (${member.email}) using their database password?`)) {
      return;
    }
    setSingleBusyId(member.membershipId);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await request<DispatchResult>(`${endpoint}/dispatch`, "POST", {
        batchId: selectedBatch || null,
        templateCode: selectedTemplateCode || template?.templateCode || "MEMBER_WELCOME_CREDENTIALS",
        generateNewPassword: false,
        membershipIds: [member.membershipId],
      });
      if (res.sentCount > 0) {
        setStatusMessage(`Credentials sent successfully to ${member.fullName} (${member.email})!`);
      } else {
        setErrorMessage(`Failed to send email to ${member.fullName}: ${res.items[0]?.errorMessage ?? "Unknown error"}`);
      }
      void loadBatchMembers(selectedBatch);
      void loadLogs();
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setSingleBusyId(null);
    }
  };

  // Clipboard copy
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredMembers.length === 0) return;
    const headers = [
      "Membership ID",
      "Full Name",
      "Email",
      "Phone Number",
      "Chapter",
      "Status",
      "Contact Verified",
      "Temporary Password",
      "Email Delivery",
      "Last Sent At",
    ];
    const rows = filteredMembers.map((m) => [
      `"${m.membershipId || ""}"`,
      `"${(m.fullName || "").replace(/"/g, '""')}"`,
      `"${m.email || ""}"`,
      `"${m.phoneNumber || ""}"`,
      `"${(m.chapterName || "").replace(/"/g, '""')}"`,
      `"${m.status || ""}"`,
      m.isContactVerified ? "TRUE" : "FALSE",
      `"${m.temporaryPassword || ""}"`,
      `"${m.lastStatus || "NOT_SENT"}"`,
      `"${m.lastSentAt || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sethu_members_roster_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle single member checkbox
  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle Select All (Filtered members)
  const toggleSelectAll = () => {
    const filtered = filteredMembers.map((m) => m.membershipId);
    if (selectedMemberIds.length === filtered.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filtered);
    }
  };

  // Toggle Select Current Page only
  const toggleSelectCurrentPage = () => {
    const pageIds = paginatedMembers.map((m) => m.membershipId);
    const allPageSelected = pageIds.every((id) => selectedMemberIds.includes(id));
    if (allPageSelected) {
      setSelectedMemberIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const insertVariable = (varName: string) => {
    setBodyHtml((prev) => prev + ` {{${varName}}}`);
  };

  // Filter members by search and status
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (m.fullName || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.membershipId || "").toLowerCase().includes(q) ||
      (m.phoneNumber || "").toLowerCase().includes(q) ||
      (m.chapterName || "").toLowerCase().includes(q) ||
      (m.temporaryPassword || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") {
      return m.status === "ACTIVE" || m.status === "ALREADY_ACTIVE";
    }
    if (statusFilter === "SENT") {
      return m.lastStatus === "SENT";
    }
    if (statusFilter === "UNSENT") {
      return !m.lastStatus || m.lastStatus !== "SENT";
    }
    return true;
  });

  // Pagination calculations for Member Directory
  const totalItems = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Pagination calculations for Logs
  const totalLogs = logs.length;
  const totalLogsPages = Math.max(1, Math.ceil(totalLogs / logsPageSize));
  const safeLogsPage = Math.min(Math.max(logsCurrentPage, 1), totalLogsPages);
  const startLogsIndex = (safeLogsPage - 1) * logsPageSize;
  const endLogsIndex = Math.min(startLogsIndex + logsPageSize, totalLogs);
  const paginatedLogs = logs.slice(startLogsIndex, endLogsIndex);

  // Render preview HTML with sample values
  const getSampleRenderedHtml = () => {
    return bodyHtml
      .replace(/{{FullName}}/gi, "Murugan Ramanathan")
      .replace(/{{Email}}/gi, "murugan@example.com")
      .replace(/{{MembershipId}}/gi, "SETHU-2026-0042")
      .replace(/{{TemporaryPassword}}/gi, "Sethu@7891K")
      .replace(/{{LoginUrl}}/gi, "https://membersethu.dharmicbusines.com/login")
      .replace(/{{ChapterName}}/gi, "Chennai Chapter");
  };

  // Statistics
  const activeCount = members.filter((m) => m.status === "ACTIVE" || m.status === "ALREADY_ACTIVE").length;
  const verifiedCount = members.filter((m) => m.isContactVerified).length;
  const withPasswordCount = members.filter((m) => Boolean(m.temporaryPassword)).length;
  const sentCount = members.filter((m) => m.lastStatus === "SENT").length;

  return (
    <div className="stack" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Member Directory, Credentials & Email Dispatch"
        description="Comprehensive member overview with login passwords, contact verification status, onboarding email dispatch, and template editor."
      />

      {statusMessage && (
        <div className="notice success" role="status" style={{ padding: "12px", borderRadius: "6px" }}>
          <strong>Success:</strong> {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="notice error" role="alert" style={{ padding: "12px", borderRadius: "6px" }}>
          <strong>Notice:</strong> {errorMessage}
        </div>
      )}

      {/* Overview KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Members</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{members.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{activeCount} active & ready to login</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Passwords Ready</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0284c7", marginTop: "4px" }}>{withPasswordCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#0284c7", marginTop: "2px" }}>Auto-generated on migration</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Contact Verified</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>{verifiedCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "2px" }}>isContactVerified = true</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Credentials Dispatched</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#8b5cf6", marginTop: "4px" }}>{sentCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#8b5cf6", marginTop: "2px" }}>{members.length - sentCount} pending dispatch</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>
        <button
          type="button"
          className={`btn ${activeTab === "dispatch" ? "" : "secondary"}`}
          onClick={() => {
            setActiveTab("dispatch");
            void loadBatches();
          }}
        >
          👥 Member Directory & Passwords ({members.length})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === "template" ? "" : "secondary"}`}
          onClick={() => setActiveTab("template")}
        >
          ✉️ Email Template & Editor
        </button>
        <button
          type="button"
          className={`btn ${activeTab === "logs" ? "" : "secondary"}`}
          onClick={() => {
            setActiveTab("logs");
            void loadLogs();
          }}
        >
          📋 Delivery Logs ({logs.length})
        </button>
      </div>

      {loading && <Loading label="Loading member information and credentials..." />}

      {/* TAB 1: Member Directory & Passwords */}
      {activeTab === "dispatch" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Controls & Filter Bar */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  Filter by Member Batch:
                </span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "0.9rem",
                    minWidth: "360px",
                  }}
                >
                  <option value="">-- All Batches (All Registered Members: {members.length}) --</option>
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} — [{b.state}] ({b.activated} active / {b.expectedCount} total)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  Email Template for Dispatch:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <select
                    value={selectedTemplateCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedTemplateCode(code);
                      void loadTemplate(code);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      minWidth: "280px",
                    }}
                  >
                    {availableTemplates.map((t) => (
                      <option key={t.templateCode} value={t.templateCode}>
                        {t.name} [{t.channel}]
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                    onClick={() => setActiveTab("template")}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="🔍 Search name, email, phone, legacy ID, chapter, password..."
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    width: "320px",
                  }}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="SENT">Sent Only</option>
                  <option value="UNSENT">Unsent Only</option>
                </select>

                <button
                  type="button"
                  className="btn secondary"
                  style={{ padding: "7px 12px", fontSize: "0.85rem" }}
                  onClick={() => setRevealAllPasswords((prev) => !prev)}
                >
                  {revealAllPasswords ? "🙈 Mask All Passwords" : "👁️ Reveal All Passwords"}
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  style={{ padding: "7px 12px", fontSize: "0.85rem" }}
                  onClick={() => handleExportCsv()}
                  title="Download all members and passwords as CSV"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* Bulk Dispatch Actions */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Selected: <strong>{selectedMemberIds.length}</strong> / {filteredMembers.length}
                </span>

                <button
                  type="button"
                  className="btn secondary"
                  disabled={dispatchBusy || paginatedMembers.length === 0}
                  onClick={() => toggleSelectCurrentPage()}
                  title={`Select or deselect all ${paginatedMembers.length} members on this page`}
                >
                  {paginatedMembers.every((m) => selectedMemberIds.includes(m.membershipId))
                    ? "Deselect Page"
                    : `Select Page (${paginatedMembers.length})`}
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  disabled={dispatchBusy || filteredMembers.length === 0}
                  onClick={() => toggleSelectAll()}
                >
                  {selectedMemberIds.length === filteredMembers.length ? "Deselect All" : "Select All"}
                </button>

                <button
                  type="button"
                  className="btn"
                  disabled={dispatchBusy || selectedMemberIds.length === 0}
                  onClick={() => void handleDispatch(selectedMemberIds)}
                >
                  {dispatchBusy
                    ? "Sending..."
                    : `🚀 Send Credentials to Selected (${selectedMemberIds.length})`}
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  disabled={dispatchBusy || filteredMembers.length === 0}
                  onClick={() => void handleDispatch(filteredMembers.map((m) => m.membershipId))}
                  title="Send to all filtered members"
                >
                  Send to All Filtered ({filteredMembers.length})
                </button>
              </div>
            </div>
          </Card>

          {/* Members Table */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                  Member Directory & Credentials Roster
                </h3>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  (Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} members)
                </span>
              </div>

              {/* Rows Per Page (Page Size) Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                  Rows per page:
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <p className="muted" style={{ padding: "20px 0", textAlign: "center", fontSize: "0.9rem" }}>
                No members found matching your search or filters.
              </p>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                        <th style={{ padding: "10px 10px", width: "36px" }}>
                          <input
                            type="checkbox"
                            checked={
                              paginatedMembers.length > 0 &&
                              paginatedMembers.every((m) => selectedMemberIds.includes(m.membershipId))
                            }
                            onChange={() => toggleSelectCurrentPage()}
                            title="Select all on this page"
                          />
                        </th>
                        <th style={{ padding: "10px 12px" }}>Legacy ID</th>
                        <th style={{ padding: "10px 12px" }}>Full Name</th>
                        <th style={{ padding: "10px 12px" }}>Email / Username</th>
                        <th style={{ padding: "10px 12px" }}>Phone & Verification</th>
                        <th style={{ padding: "10px 12px" }}>Temporary Password</th>
                        <th style={{ padding: "10px 12px" }}>Status</th>
                        <th style={{ padding: "10px 12px" }}>Email Delivery</th>
                        <th style={{ padding: "10px 12px", textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.map((m) => {
                        const isSelected = selectedMemberIds.includes(m.membershipId);
                        const isSingleBusy = singleBusyId === m.membershipId;
                        const isPasswordShown = revealAllPasswords || Boolean(showPasswords[m.membershipId]);
                        const isCopied = copiedId === m.membershipId;

                        return (
                          <tr
                            key={m.membershipId}
                            style={{
                              borderBottom: "1px solid #e2e8f0",
                              background: isSelected ? "#f8fafc" : "#ffffff",
                            }}
                          >
                            <td style={{ padding: "8px 10px" }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleMemberSelection(m.membershipId)}
                              />
                            </td>
                            <td style={{ padding: "8px 12px", fontWeight: 700, fontFamily: "monospace", color: "#1e293b" }}>
                              {m.membershipId}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{m.fullName}</div>
                              {m.chapterName && (
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{m.chapterName}</div>
                              )}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <a href={`mailto:${m.email}`} style={{ color: "#0284c7", textDecoration: "none" }}>
                                {m.email}
                              </a>
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <div style={{ fontSize: "0.85rem", color: "#334155" }}>{m.phoneNumber || "—"}</div>
                              <div style={{ marginTop: "2px" }}>
                                {m.isContactVerified ? (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      backgroundColor: "#dcfce7",
                                      color: "#15803d",
                                    }}
                                  >
                                    ✓ Contact Verified
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "0.7rem",
                                      backgroundColor: "#f1f5f9",
                                      color: "#64748b",
                                    }}
                                  >
                                    Unverified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              {m.temporaryPassword ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <code
                                    style={{
                                      display: "inline-block",
                                      padding: "3px 8px",
                                      borderRadius: "4px",
                                      backgroundColor: "#f1f5f9",
                                      border: "1px solid #e2e8f0",
                                      fontFamily: "monospace",
                                      fontSize: "0.85rem",
                                      fontWeight: 700,
                                      color: isPasswordShown ? "#0f172a" : "#94a3b8",
                                      letterSpacing: isPasswordShown ? "0.5px" : "2px",
                                      minWidth: "115px",
                                    }}
                                  >
                                    {isPasswordShown ? m.temporaryPassword : "••••••••••••"}
                                  </code>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPasswords((prev) => ({
                                        ...prev,
                                        [m.membershipId]: !prev[m.membershipId],
                                      }))
                                    }
                                    title={isPasswordShown ? "Hide password" : "Show password"}
                                    style={{
                                      background: "none",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      padding: "2px 6px",
                                      fontSize: "0.75rem",
                                      lineHeight: "1",
                                    }}
                                  >
                                    {isPasswordShown ? "🙈" : "👁️"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => void copyToClipboard(m.temporaryPassword!, m.membershipId)}
                                    title="Copy password to clipboard"
                                    style={{
                                      background: isCopied ? "#dcfce7" : "#f8fafc",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      padding: "2px 8px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      color: isCopied ? "#15803d" : "#334155",
                                    }}
                                  >
                                    {isCopied ? "✓ Copied!" : "📋 Copy"}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>
                                  None (Not generated)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <Pill tone={m.status === "ACTIVE" || m.status === "ALREADY_ACTIVE" ? "good" : "warn"}>
                                {m.status}
                              </Pill>
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              {m.lastStatus ? (
                                <Pill tone={m.lastStatus === "SENT" ? "good" : "bad"}>
                                  {m.lastStatus}{" "}
                                  {m.lastSentAt
                                    ? `(${new Date(m.lastSentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
                                    : ""}
                                </Pill>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Not sent yet</span>
                              )}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn secondary"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "0.8rem",
                                  minHeight: "30px",
                                  whiteSpace: "nowrap",
                                }}
                                disabled={dispatchBusy || isSingleBusy}
                                onClick={() => void handleDispatchSingle(m)}
                              >
                                {isSingleBusy ? "Sending..." : "✉️ Send Email"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION NAVIGATION CONTROLS */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px solid #e2e8f0",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Showing <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> to{" "}
                    <strong>{endIndex}</strong> of <strong>{totalItems}</strong> members
                    {totalPages > 1 && (
                      <span style={{ marginLeft: "6px" }}>
                        (Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>)
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {/* First Page */}
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", minHeight: "32px" }}
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(1)}
                      title="Go to First Page"
                    >
                      « First
                    </button>

                    {/* Previous Page */}
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", minHeight: "32px" }}
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      title="Go to Previous Page"
                    >
                      ‹ Prev
                    </button>

                    {/* Numeric Page Buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                      .map((p, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && p - prevPage > 1;

                        return (
                          <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            {showEllipsis && <span style={{ padding: "0 4px", color: "#94a3b8" }}>...</span>}
                            <button
                              type="button"
                              className={`btn ${p === safePage ? "" : "secondary"}`}
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.8rem",
                                minHeight: "32px",
                                minWidth: "32px",
                                fontWeight: p === safePage ? 700 : 500,
                                backgroundColor: p === safePage ? "#2563eb" : undefined,
                                color: p === safePage ? "#ffffff" : undefined,
                              }}
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </button>
                          </span>
                        );
                      })}

                    {/* Next Page */}
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", minHeight: "32px" }}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      title="Go to Next Page"
                    >
                      Next ›
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", minHeight: "32px" }}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      title="Go to Last Page"
                    >
                      Last »
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Results table if bulk dispatched */}
          {dispatchResult && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
                  Recent Dispatch Execution Summary
                </h3>
                <Pill tone={dispatchResult.failedCount === 0 ? "good" : "warn"}>
                  {dispatchResult.sentCount} / {dispatchResult.totalMembers} Sent
                </Pill>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                      <th style={{ padding: "10px 12px" }}>Legacy ID</th>
                      <th style={{ padding: "10px 12px" }}>Member Name</th>
                      <th style={{ padding: "10px 12px" }}>Email</th>
                      <th style={{ padding: "10px 12px" }}>Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchResult.items.map((item) => (
                      <tr key={item.membershipId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{item.membershipId}</td>
                        <td style={{ padding: "8px 12px" }}>{item.fullName}</td>
                        <td style={{ padding: "8px 12px" }}>{item.email}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <Pill tone={item.status === "SENT" ? "good" : "bad"}>
                            {item.status}
                          </Pill>
                          {item.errorMessage && (
                            <span style={{ color: "#ef4444", fontSize: "0.8rem", marginLeft: "8px" }}>
                              {item.errorMessage}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: Template Editor & Preview */}
      {activeTab === "template" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Editor Column */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 2px 0" }}>
                  Edit Email Template
                </h2>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  Customize subject and HTML layout for any notification or credential email.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Template:</span>
                <select
                  value={selectedTemplateCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedTemplateCode(code);
                    void loadTemplate(code);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    maxWidth: "280px",
                  }}
                >
                  {availableTemplates.map((t) => (
                    <option key={t.templateCode} value={t.templateCode}>
                      {t.name} [{t.channel}] ({t.templateCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 600 }}>
                <span>Email Subject Line</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                  }}
                />
              </label>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  Insert Dynamic Placeholders:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["FullName", "Email", "MembershipId", "TemporaryPassword", "LoginUrl", "ChapterName"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="btn secondary"
                      style={{ padding: "3px 8px", fontSize: "0.75rem", borderRadius: "4px" }}
                      onClick={() => insertVariable(v)}
                    >
                      + {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 600 }}>
                <span>Email Body Template (HTML / Text)</span>
                <textarea
                  rows={16}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    lineHeight: "1.4",
                  }}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn"
                  disabled={loading || !subject || !bodyHtml}
                  onClick={() => void handleSaveTemplate()}
                >
                  Save Template Changes
                </button>
              </div>

              <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

              {/* Test Sender */}
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>
                  Send Test Email to Preview
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter your email to receive test..."
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={testBusy || !testEmail}
                    onClick={() => void handleSendTest()}
                  >
                    {testBusy ? "Sending..." : "Send Test"}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Live Preview Column */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                  Live Member Email Preview
                </h2>
                <Pill tone="good">Sample Data</Pill>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  className={`btn ${previewMode === "visual" ? "" : "secondary"}`}
                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  onClick={() => setPreviewMode("visual")}
                >
                  👁️ Visual Preview
                </button>
                <button
                  type="button"
                  className={`btn ${previewMode === "html" ? "" : "secondary"}`}
                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  onClick={() => setPreviewMode("html")}
                >
                  &lt;/&gt; HTML Source
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ background: "#f1f5f9", padding: "10px 14px", borderBottom: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                <div><strong>Subject:</strong> {subject}</div>
                <div><strong>To:</strong> Murugan Ramanathan &lt;murugan@example.com&gt;</div>
              </div>
              {previewMode === "visual" ? (
                <div
                  style={{
                    padding: "0",
                    background: "#f8fafc",
                    minHeight: "450px",
                    maxHeight: "650px",
                    overflowY: "auto",
                  }}
                  dangerouslySetInnerHTML={{ __html: getSampleRenderedHtml() }}
                />
              ) : (
                <pre
                  style={{
                    padding: "16px",
                    background: "#ffffff",
                    minHeight: "450px",
                    maxHeight: "650px",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8rem",
                    fontFamily: "monospace",
                    margin: 0,
                  }}
                >
                  {getSampleRenderedHtml()}
                </pre>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Delivery Logs */}
      {activeTab === "logs" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Recent Member Credentials Email Dispatches
              </h2>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                ({totalLogs} records)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                value={logsPageSize}
                onChange={(e) => {
                  setLogsPageSize(Number(e.target.value));
                  setLogsCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <button type="button" className="btn secondary" onClick={() => void loadLogs()}>
                Refresh Logs
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="muted" style={{ padding: "16px 0", fontSize: "0.9rem" }}>
              No email dispatch history found. Select a batch in Tab 1 to dispatch credentials.
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                      <th style={{ padding: "10px 12px" }}>Member Name</th>
                      <th style={{ padding: "10px 12px" }}>Email</th>
                      <th style={{ padding: "10px 12px" }}>Legacy ID</th>
                      <th style={{ padding: "10px 12px" }}>Batch</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{log.fullName || "—"}</td>
                        <td style={{ padding: "8px 12px" }}>{log.email}</td>
                        <td style={{ padding: "8px 12px" }}>{log.membershipId}</td>
                        <td style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#64748b" }}>
                          {log.batchId || "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <Pill tone={log.status === "SENT" ? "good" : "bad"}>
                            {log.status}
                          </Pill>
                          {log.errorMessage && (
                            <div style={{ color: "#ef4444", fontSize: "0.75rem" }}>{log.errorMessage}</div>
                          )}
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#64748b" }}>
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Logs Pagination Controls */}
              {totalLogsPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "14px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e2e8f0",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Showing <strong>{startLogsIndex + 1}</strong> to <strong>{endLogsIndex}</strong> of <strong>{totalLogs}</strong> logs
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      disabled={safeLogsPage <= 1}
                      onClick={() => setLogsCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      ‹ Prev
                    </button>
                    <span style={{ fontSize: "0.85rem", padding: "4px 8px", fontWeight: 600 }}>
                      Page {safeLogsPage} of {totalLogsPages}
                    </span>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      disabled={safeLogsPage >= totalLogsPages}
                      onClick={() => setLogsCurrentPage((p) => Math.min(totalLogsPages, p + 1))}
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
