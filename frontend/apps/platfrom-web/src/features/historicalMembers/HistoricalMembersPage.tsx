import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Pill } from "@/components/Ui";
import { API_BASE } from "@/services/api";
import {
  chapterWorkflowApi,
  type ChapterDto,
} from "@/services/chapterWorkflowApi";

type Item = {
  membershipId: string;
  email: string;
  status: string;
  paymentStatus: string;
  provisionalPaymentId: string;
  memberId?: string;
  errorCode?: string;
  version: number;
};

type Summary = {
  batchId: string;
  state: string;
  total: number;
  activated: number;
  held: number;
  items: Item[];
};

type BatchSummary = {
  batchId: string;
  chapterId: string;
  state: string;
  expectedCount: number;
  activated: number;
  held: number;
};

const targetBase = API_BASE ? API_BASE.replace(/\/+$/, "") : "";
const endpoint = targetBase
  ? `${targetBase}/api/platform/historical-members`
  : "/api/platform/historical-members";

function getAuthHeaders(): Record<string, string> {
  const xsrf = document.cookie
    .split("; ")
    .find((x) => x.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
  const sethuToken =
    sessionStorage.getItem("sethu:token") ||
    localStorage.getItem("sethu:token");

  const headers: Record<string, string> = {};
  if (xsrf) headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);
  if (sethuToken) headers["Authorization"] = `Bearer ${sethuToken}`;
  return headers;
}

async function request<T>(
  url: string,
  method = "GET",
  body?: object,
): Promise<T> {
  const authHeaders = getAuthHeaders();
  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const msg =
      errData?.code || errData?.detail || `Server response ${response.status}`;
    throw new Error(msg);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export function HistoricalMembersPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [chapter, setChapter] = useState("");
  const [preview, setPreview] = useState<Array<{
    membershipId: string;
    fullName: string;
    email: string;
    status: string;
  }> | null>(null);
  const [batch, setBatch] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState("EC-APPROVAL-2026-11-02");
  const [digest, setDigest] = useState("");
  const [chapters, setChapters] = useState<ChapterDto[]>([]);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [attestations, setAttestations] = useState<string[]>([]);

  const loadChapters = useCallback(async () => {
    try {
      const data = await chapterWorkflowApi.getChapters();
      if (Array.isArray(data) && data.length > 0) {
        setChapters(data);
        const chennai = data.find((c) =>
          c.name.toLowerCase().includes("chennai"),
        );
        if (chennai) {
          setChapter((prev) => prev || chennai.id);
        } else {
          setChapter((prev) => prev || data[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed loading chapters:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!batch) {
      setData(null);
      setAttestations([]);
      return;
    }
    try {
      const summary = await request<Summary>(
        `${endpoint}/${encodeURIComponent(batch)}`,
      );
      setData(summary);

      // Automatically sync canonical roster digest and preview
      try {
        const p = await request<{
          rosterSha256: string;
          rows: Array<{
            membershipId: string;
            fullName: string;
            email: string;
            status: string;
          }>;
        }>(`${endpoint}/${encodeURIComponent(batch)}/preview`);
        if (p?.rosterSha256) {
          setDigest(p.rosterSha256);
          if (p.rows) setPreview(p.rows);
        }
      } catch {
        // Non-blocking if preview is not yet available
      }

      // Automatically sync signed attestations
      try {
        const att = await request<string[]>(
          `${endpoint}/${encodeURIComponent(batch)}/attestations`,
        );
        setAttestations(att || []);
      } catch {
        setAttestations([]);
      }

      setError("");
    } catch {
      setData(null);
      setAttestations([]);
    }
  }, [batch]);

  useEffect(() => {
    void loadBatches();
    void loadChapters();
  }, [loadChapters]);

  useEffect(() => {
    if (batch) void refresh();
    else setData(null);
  }, [refresh, batch]);

  async function upload() {
    if (!file || !chapter) {
      setError("Please select a CSV file and a Target Chapter");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("chapterId", chapter);
      const authHeaders = getAuthHeaders();
      const res = await fetch(`${endpoint}/upload`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders,
        body: form,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.code || errJson?.detail || `Upload failed: ${res.status}`,
        );
      }
      const result = await res.json();
      setBatch(result.batchId);
      setDigest(result.rosterSha256);
      setPreview(null);
      setError("");
      await loadBatches();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadBatches() {
    try {
      const list = await request<BatchSummary[]>(`${endpoint}/batches`);
      setBatches(list);
      if (list && list.length > 0) {
        if (!batch || !list.some((b) => b.batchId === batch)) {
          setBatch(list[0].batchId);
        }
      } else {
        setBatch("");
        setData(null);
      }
      setError("");
    } catch {
      setBatches([]);
    }
  }

  async function loadPreview() {
    if (!batch) return;
    try {
      const d = await request<{
        rosterSha256: string;
        rows: Array<{
          membershipId: string;
          fullName: string;
          email: string;
          status: string;
        }>;
      }>(`${endpoint}/${encodeURIComponent(batch)}/preview`);
      setPreview(d.rows);
      setDigest(d.rosterSha256);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }

  async function action(path: string, body?: object) {
    setBusy(true);
    try {
      await request(
        `${endpoint}/${encodeURIComponent(batch)}/${path}`,
        "POST",
        body,
      );
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function switchOperator(email: string) {
    setBusy(true);
    try {
      const loginUrl = targetBase
        ? `${targetBase}/api/auth/login`
        : "/api/auth/login";
      const res = await fetch(loginUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password: "Sethu@123456" }),
      });
      if (!res.ok) throw new Error(`Could not switch operator to ${email}`);
      const data = await res.json().catch(() => ({}));
      if (data?.token) {
        sessionStorage.setItem("sethu:token", data.token);
        localStorage.setItem("sethu:token", data.token);
      }
      sessionStorage.setItem("sethu:operator", email);
      localStorage.setItem("sethu:operator", email);
      await refresh();
      setError("");
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    setBusy(true);
    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch(`${endpoint}/template`, {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Could not download template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sethu_historical_member_template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Failed to download template");
    } finally {
      setBusy(false);
    }
  }

  async function payment(item: Item) {
    const reference = window.prompt(
      "Actual external receipt/reference (leave blank to cancel)",
    );
    if (!reference) return;
    const amount = window.prompt("Actual reconciled amount (INR)");
    if (!amount) return;
    const evidenceReference = window.prompt("Finance evidence reference");
    if (!evidenceReference) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Valid positive amount required");
      return;
    }
    setBusy(true);
    try {
      await request(
        `${endpoint}/${encodeURIComponent(batch)}/members/${encodeURIComponent(item.membershipId)}/payment`,
        "PUT",
        {
          reference,
          amount: value,
          evidenceReference,
          expectedVersion: item.version,
        },
      );
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: "20px" }}>
      <PageHeader
        title="Historical Member Migration"
        description="Stage, validate, ratify (Chapter & Finance attestation), and activate historical legacy membership batches."
      />

      {error && (
        <div className="notice error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: Upload and Stage */}
      <Card>
        <h2
          style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}
        >
          1. Upload & Stage Members CSV
        </h2>
        <p
          className="muted"
          style={{ marginBottom: "16px", fontSize: "0.875rem" }}
        >
          Upload member roster CSV file against an active chapter. Provisional
          payment UUIDs are generated during staging.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <span>Roster CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "0.85rem",
              fontWeight: 600,
              minWidth: "320px",
            }}
          >
            <span>Target Chapter</span>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                background: "white",
              }}
            >
              {chapters.length === 0 ? (
                <option value="">
                  -- Loading Chapters from Database... --
                </option>
              ) : (
                chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.status ? `(${c.status})` : ""}
                  </option>
                ))
              )}
            </select>
          </label>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
              marginTop: "18px",
            }}
          >
            <button
              type="button"
              className="btn"
              disabled={busy || !file || !chapter}
              onClick={() => void upload()}
            >
              Upload and stage
            </button>
            <button
              type="button"
              className="btn secondary"
              style={{ textDecoration: "none" }}
              disabled={busy}
              onClick={() => void downloadTemplate()}
            >
              Download Template
            </button>
          </div>
        </div>
      </Card>

      {/* Step 2: Batch Management & Preview */}
      <Card>
        <h2
          style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}
        >
          2. Batch Selection & Validation
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "0.85rem",
              fontWeight: 600,
              minWidth: "300px",
            }}
          >
            <span>Active Batch ID</span>
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value.trim())}
              placeholder="e.g. LEGACY-xxxxxxxx or SETHU-CSV-..."
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
              marginTop: "18px",
            }}
          >
            <button
              type="button"
              className="btn secondary"
              disabled={busy || !batch}
              onClick={() => void refresh()}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={busy || !batch}
              onClick={() => void loadPreview()}
            >
              Validate & preview
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={() => void loadBatches()}
            >
              Browse batches
            </button>
          </div>
        </div>

        {batches.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "0.85rem",
                fontWeight: 600,
                maxWidth: "500px",
              }}
            >
              <span>Existing Batches in Tenant</span>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                }}
              >
                <option value="">-- Select a batch --</option>
                {batches.map((x) => (
                  <option key={x.batchId} value={x.batchId}>
                    {x.batchId} — [{x.state}] ({x.activated}/{x.expectedCount}{" "}
                    active)
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </Card>

      {/* Preview Table if loaded */}
      {preview && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
              Staged Roster Preview ({preview.length} members)
            </h3>
            <Pill tone="good">Validated</Pill>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>Legacy ID</th>
                  <th style={{ padding: "10px 12px" }}>Full Name</th>
                  <th style={{ padding: "10px 12px" }}>Email Address</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr
                    key={r.membershipId}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                      {r.membershipId}
                    </td>
                    <td style={{ padding: "8px 12px" }}>{r.fullName}</td>
                    <td style={{ padding: "8px 12px" }}>{r.email}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <Pill tone={r.status === "ACTIVE" ? "good" : ""}>
                        {r.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Step 3: Dual Ratification & Activation */}
      {data && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                3. Attestations & Activation
              </h2>
              <p className="muted" style={{ fontSize: "0.875rem" }}>
                State: <strong>{data.state}</strong> · Total:{" "}
                <strong>{data.total}</strong> · Activated:{" "}
                <strong>{data.activated}</strong> · On Hold:{" "}
                <strong>{data.held}</strong>
              </p>
            </div>
            <Pill
              tone={
                data.state === "COMPLETE"
                  ? "good"
                  : data.state === "CERTIFIED"
                    ? "warn"
                    : ""
              }
            >
              {data.state}
            </Pill>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <span>Attestation Evidence Reference</span>
              <input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="e.g. EC-MINUTES-2026-11-02"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <span>Computed Roster Digest (SHA-256)</span>
              <input
                value={digest}
                onChange={(e) => setDigest(e.target.value)}
                placeholder="64-character hex digest"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontFamily: "monospace",
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              Attestations Status:
            </span>
            <Pill tone={attestations.includes("CHAPTER") ? "good" : "warn"}>
              {attestations.includes("CHAPTER")
                ? "✓ Chapter Attested"
                : "⏳ Chapter Pending"}
            </Pill>
            <Pill tone={attestations.includes("FINANCE") ? "good" : "warn"}>
              {attestations.includes("FINANCE")
                ? "✓ Finance Attested"
                : "⏳ Finance Pending"}
            </Pill>
          </div>

          {attestations.includes("CHAPTER") &&
            !attestations.includes("FINANCE") && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  color: "#1e40af",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  ℹ️ <strong>Chapter Attestation Completed!</strong> Dual
                  Control policy requires a different officer (Treasurer) to
                  sign Finance Attest.
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                  disabled={busy}
                  onClick={() => void switchOperator("treasurer@sethu.local")}
                >
                  🔑 Switch Operator to Treasurer (treasurer@sethu.local)
                </button>
              </div>
            )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              className="btn secondary"
              disabled={
                busy ||
                attestations.includes("CHAPTER") ||
                !evidence ||
                !/^[a-f0-9]{64}$/i.test(digest)
              }
              onClick={() =>
                void action("chapter-attest", {
                  evidenceReference: evidence,
                  rosterSha256: digest,
                })
              }
            >
              {attestations.includes("CHAPTER")
                ? "✓ Chapter Attested"
                : "Chapter Attest"}
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={
                busy ||
                attestations.includes("FINANCE") ||
                !evidence ||
                !/^[a-f0-9]{64}$/i.test(digest)
              }
              onClick={() =>
                void action("finance-attest", {
                  evidenceReference: evidence,
                  rosterSha256: digest,
                })
              }
            >
              {attestations.includes("FINANCE")
                ? "✓ Finance Attested"
                : "Finance Attest"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy || !["CERTIFIED", "PARTIAL"].includes(data.state)}
              onClick={() => void action("activate")}
            >
              Activate Eligible Members
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>Legacy ID</th>
                  <th style={{ padding: "10px 12px" }}>Email</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px" }}>Payment Status</th>
                  <th style={{ padding: "10px 12px" }}>
                    Provisional Payment UUID
                  </th>
                  <th style={{ padding: "10px 12px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.membershipId}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                      {item.membershipId}
                    </td>
                    <td style={{ padding: "8px 12px" }}>{item.email}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <Pill
                        tone={
                          item.status === "ACTIVE"
                            ? "good"
                            : item.status === "HOLD"
                              ? "bad"
                              : "warn"
                        }
                      >
                        {item.status}
                        {item.errorCode && ` (${item.errorCode})`}
                      </Pill>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <Pill
                        tone={item.paymentStatus === "RECONCILED" ? "good" : ""}
                      >
                        {item.paymentStatus}
                      </Pill>
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      {item.provisionalPaymentId}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{
                          minHeight: "32px",
                          minWidth: "auto",
                          padding: "4px 10px",
                          fontSize: "0.8rem",
                        }}
                        disabled={busy}
                        onClick={() => void payment(item)}
                      >
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
