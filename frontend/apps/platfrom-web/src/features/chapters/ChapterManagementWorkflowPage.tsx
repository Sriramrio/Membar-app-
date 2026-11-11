import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader, Card, Pill, Loading } from "@/components/Ui";
import { LucideIcon } from "@/components/LucideIcon";
import { fileToWebpBase64 } from "@/utils/imageToWebp";
import { brandingService } from "@/services/brandingService";
import {
  chapterWorkflowApi,
  type ChapterDto,
  type CoordinatorQueueItemDto,
  type ExecutiveQueueItemDto,
  type ChapterGroupMemberDto,
  type MemberRoleAssignmentDto,
  type OnboardingStatusDetailDto,
  type VerifiedMemberDto,
  type ChapterLeaderDto,
} from "@/services/chapterWorkflowApi";

type Tab = "chapters" | "roles" | "coordinator" | "executive" | "register";

const INDIAN_STATES = [
  "Tamil Nadu",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Delhi",
  "Gujarat",
  "Rajasthan",
  "Punjab",
  "Haryana",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "West Bengal",
  "Bihar",
  "Odisha",
  "Assam",
  "Goa",
  "Chhattisgarh",
  "Jharkhand",
  "Himachal Pradesh",
  "Uttarakhand",
  "Puducherry",
  "Jammu and Kashmir",
  "Chandigarh",
  "Tripura",
  "Meghalaya",
  "Manipur",
  "Nagaland",
  "Mizoram",
  "Arunachal Pradesh",
  "Sikkim",
];

const ORG_LOGIN_URL =
  (import.meta.env.VITE_ORGANISATION_PORTAL_URL as string | undefined) ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:5175/org/login"
    : "https://orgsethu.dharmicbusines.com/org/login");

function getInitials(name: string): string {
  if (!name) return "L";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #059669 0%, #047857 100%)",
  "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
  "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
];

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function ChapterManagementWorkflowPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chapters");
  const [chapters, setChapters] = useState<ChapterDto[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "good" | "bad" | "warn";
    msg: string;
  } | null>(null);

  // Chapter Creation State
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterRegion, setNewChapterRegion] = useState("Tamil Nadu West");
  const [newChapterState, setNewChapterState] = useState("Tamil Nadu");
  const [newChapterStatus, setNewChapterStatus] = useState("ACTIVE");
  const [newChapterLogo, setNewChapterLogo] = useState("");
  const [convertingImage, setConvertingImage] = useState(false);
  const [creatingChapter, setCreatingChapter] = useState(false);

  // Chapter Members inspection
  const [chapterMembers, setChapterMembers] = useState<ChapterGroupMemberDto[]>(
    [],
  );
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inspectingChapterName, setInspectingChapterName] =
    useState<string>("");

  // Role Hierarchy State
  const [chapterRoles, setChapterRoles] = useState<MemberRoleAssignmentDto[]>(
    [],
  );
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("President");
  const [assigningRole, setAssigningRole] = useState(false);
  const [verifiedMembers, setVerifiedMembers] = useState<VerifiedMemberDto[]>(
    [],
  );
  const [loadingVerifiedMembers, setLoadingVerifiedMembers] = useState(false);

  // Platform Admin Leadership Credential Management State
  const [leaders, setLeaders] = useState<ChapterLeaderDto[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [leaderFullName, setLeaderFullName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("+91 98840 98765");
  const [leaderPosition, setLeaderPosition] = useState<"Trustee" | "Trust">(
    "Trustee",
  );
  const [creatingLeader, setCreatingLeader] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    temporaryPassword: string;
    mustChangePassword: boolean;
    scope: string;
    position: string;
  } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [resettingLeaderId, setResettingLeaderId] = useState<string | null>(
    null,
  );

  // Only Trustee and Trust accounts are displayed in Platform Admin Governed Leaders
  const governedLeaders = useMemo(() => {
    return leaders.filter(
      (l) => l.position === "Trustee" || l.position === "Trust",
    );
  }, [leaders]);

  // Coordinator Queue
  const [coordQueue, setCoordQueue] = useState<CoordinatorQueueItemDto[]>([]);
  const [selectedCoordItem, setSelectedCoordItem] =
    useState<CoordinatorQueueItemDto | null>(null);
  const [kycDocUrl, setKycDocUrl] = useState(
    "https://documents.sethu.network/kyc/business_license.pdf",
  );
  const [kycNotes, setKycNotes] = useState(
    "Business license & GSTIN verified on portal.",
  );
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  // Executive Queue
  const [execQueue, setExecQueue] = useState<ExecutiveQueueItemDto[]>([]);
  const [selectedExecItem, setSelectedExecItem] =
    useState<ExecutiveQueueItemDto | null>(null);
  const [execRole, setExecRole] = useState<"President" | "Vice President">(
    "President",
  );
  const [execRemarks, setExecRemarks] = useState(
    "Approved by Chapter Leadership for active chapter membership.",
  );
  const [executingApproval, setExecutingApproval] = useState(false);

  // Registration & Payment Gate
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("+91 98840 12345");
  const [regBusiness, setRegBusiness] = useState("");
  const [regCategory, setRegCategory] = useState("Manufacturing & Engineering");
  const [submittingReg, setSubmittingReg] = useState(false);
  const [activeRegId, setActiveRegId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(6000);
  const [paymentRef, setPaymentRef] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [statusDetail, setStatusDetail] =
    useState<OnboardingStatusDetailDto | null>(null);

  const notify = (msg: string, tone: "good" | "bad" | "warn" = "good") => {
    setFeedback({ msg, tone });
    setTimeout(() => setFeedback(null), 6000);
  };

  const loadChapters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chapterWorkflowApi.getChapters();
      setChapters(data);
      for (const ch of data) {
        if (ch.logo || ch.image) {
          brandingService.saveChapterBranding({
            chapterId: ch.id,
            name: ch.name,
            image: ch.image || ch.logo,
            logo: ch.logo || ch.image,
          });
        }
      }
      if (data.length > 0 && !selectedChapterId) {
        setSelectedChapterId(data[0].id);
      }
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to fetch chapters",
        "bad",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedChapterId]);

  const loadChapterRoles = useCallback(async (chId: string) => {
    if (!chId) return;
    try {
      const roles = await chapterWorkflowApi.getChapterRoles(chId);
      setChapterRoles(roles);
    } catch {
      setChapterRoles([]);
    }
  }, []);

  const loadVerifiedMembers = useCallback(async (chId: string) => {
    if (!chId) {
      setVerifiedMembers([]);
      setAssignMemberId("");
      return;
    }
    setLoadingVerifiedMembers(true);
    setAssignMemberId(""); // Reset selected member when chapter changes
    try {
      const data = await chapterWorkflowApi.getVerifiedMembers(chId);
      setVerifiedMembers(data);
      if (data.length > 0) {
        setAssignMemberId(data[0].memberIdentifier);
      }
    } catch {
      setVerifiedMembers([]);
    } finally {
      setLoadingVerifiedMembers(false);
    }
  }, []);

  const loadChapterMembers = async (chId: string, chName: string) => {
    setLoadingMembers(true);
    setInspectingChapterName(chName);
    try {
      const members = await chapterWorkflowApi.getChapterMembers(chId);
      setChapterMembers(members);
    } catch {
      setChapterMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadQueues = useCallback(async () => {
    try {
      const [cQ, eQ] = await Promise.all([
        chapterWorkflowApi.getCoordinatorQueue().catch(() => []),
        chapterWorkflowApi.getExecutiveQueue().catch(() => []),
      ]);
      setCoordQueue(cQ);
      setExecQueue(eQ);
    } catch {
      // ignore
    }
  }, []);

  const loadLeaders = useCallback(async () => {
    setLoadingLeaders(true);
    try {
      const data = await chapterWorkflowApi.getLeaders();
      setLeaders(data);
    } catch {
      setLeaders([]);
    } finally {
      setLoadingLeaders(false);
    }
  }, []);

  useEffect(() => {
    void loadChapters();
    void loadQueues();
    void loadLeaders();
  }, [loadChapters, loadQueues, loadLeaders]);

  useEffect(() => {
    if (selectedChapterId) {
      void loadChapterRoles(selectedChapterId);
      void loadVerifiedMembers(selectedChapterId);
    }
  }, [selectedChapterId, loadChapterRoles, loadVerifiedMembers]);

  // Handle Platform Admin Leadership Creation
  const handleCreateLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderFullName.trim() || !leaderEmail.trim()) {
      notify("Full Name and Email are required.", "bad");
      return;
    }
    const isTrust = leaderPosition === "Trust" || leaderPosition === "Trustee";
    if (!isTrust && !selectedChapterId) {
      notify(
        "Chapter is required for chapter-level leadership positions.",
        "bad",
      );
      return;
    }
    setCreatingLeader(true);
    try {
      const res = await chapterWorkflowApi.createLeader({
        fullName: leaderFullName.trim(),
        email: leaderEmail.trim(),
        phone: leaderPhone.trim(),
        position: leaderPosition,
        organizationId: "11111111-1111-1111-1111-111111111111",
        chapterId: isTrust ? null : selectedChapterId,
      });

      setCreatedCredentials({
        fullName: res.leader.fullName,
        username: res.credentials.username,
        temporaryPassword: res.credentials.temporaryPassword,
        mustChangePassword: res.credentials.mustChangePassword,
        scope: res.credentials.scope,
        position: res.leader.position,
      });

      notify(
        `Leadership account created for ${res.leader.fullName} (${res.leader.position})!`,
        "good",
      );
      setLeaderFullName("");
      setLeaderEmail("");
      await loadLeaders();
      if (selectedChapterId) {
        await loadChapterRoles(selectedChapterId);
      }
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Failed to create leadership account",
        "bad",
      );
    } finally {
      setCreatingLeader(false);
    }
  };

  const handleResetPassword = async (leaderId: string, leaderName: string) => {
    setResettingLeaderId(leaderId);
    try {
      const res = await chapterWorkflowApi.resetLeaderPassword(leaderId);
      setCreatedCredentials({
        fullName: leaderName,
        username: res.credentials.username,
        temporaryPassword: res.credentials.temporaryPassword,
        mustChangePassword: res.credentials.mustChangePassword,
        scope: "Leadership Access",
        position: "Password Reset",
      });
      notify(
        `Password reset to default (Leader@123) for ${leaderName}. Must change password is true.`,
        "good",
      );
      await loadLeaders();
      if (selectedChapterId) {
        await loadChapterRoles(selectedChapterId);
      }
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Password reset failed",
        "bad",
      );
    } finally {
      setResettingLeaderId(null);
    }
  };

  const handleToggleLeaderActive = async (leader: ChapterLeaderDto) => {
    try {
      if (leader.isActive) {
        await chapterWorkflowApi.deactivateLeader(leader.id);
        notify(`Leader ${leader.fullName} deactivated.`, "warn");
      } else {
        await chapterWorkflowApi.updateLeader(leader.id, { isActive: true });
        notify(`Leader ${leader.fullName} reactivated.`, "good");
      }
      await loadLeaders();
      if (selectedChapterId) {
        await loadChapterRoles(selectedChapterId);
      }
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Status update failed",
        "bad",
      );
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setConvertingImage(true);
      const base64Webp = await fileToWebpBase64(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
      });
      setNewChapterLogo(base64Webp);
      notify("Chapter logo selected.", "good");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to process chapter logo.",
        "bad",
      );
    } finally {
      setConvertingImage(false);
    }
  };

  // Handle Chapter Creation
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim()) {
      notify("Chapter Name is required.", "bad");
      return;
    }
    setCreatingChapter(true);
    try {
      const created = await chapterWorkflowApi.createChapter({
        name: newChapterName.trim(),
        regionId: newChapterRegion.trim(),
        stateId: newChapterState.trim(),
        status: newChapterStatus,
        image: newChapterLogo,
        logo: newChapterLogo,
        chapterImage: newChapterLogo,
        chapterLogo: newChapterLogo,
      });

      // Synchronize chapter branding to database & localStorage so Member Web reflects it
      brandingService.saveChapterBranding({
        chapterId: created.id,
        name: created.name || newChapterName.trim(),
        image: newChapterLogo || created.image,
        logo: newChapterLogo || created.logo,
      });

      notify(`Chapter "${created.name}" created successfully!`, "good");
      setNewChapterName("");
      setNewChapterLogo("");
      await loadChapters();
      setSelectedChapterId(created.id);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to create chapter",
        "bad",
      );
    } finally {
      setCreatingChapter(false);
    }
  };

  // Handle Role Assignment
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMemberId.trim() || !selectedChapterId) {
      notify("Please specify Member ID and select a Chapter.", "bad");
      return;
    }
    setAssigningRole(true);
    try {
      await chapterWorkflowApi.assignRole({
        memberId: assignMemberId.trim(),
        chapterId: selectedChapterId,
        roleId: assignRoleId,
      });
      notify(
        `Assigned ${assignRoleId} role to ${assignMemberId} successfully!`,
        "good",
      );
      setAssignMemberId("");
      await loadChapterRoles(selectedChapterId);
      await loadLeaders();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Role assignment failed",
        "bad",
      );
    } finally {
      setAssigningRole(false);
    }
  };

  // Handle Coordinator Doc Verification
  const handleVerifyDoc = async (isApproved: boolean) => {
    if (!selectedCoordItem) return;
    setVerifyingDoc(true);
    try {
      await chapterWorkflowApi.verifyDocument({
        registrationId: selectedCoordItem.registrationId,
        documentUrl: kycDocUrl,
        verifiedBy: "Platform Admin / Member Coordinator",
        isApproved,
        notes: kycNotes,
      });
      notify(
        isApproved
          ? `Document verified for ${selectedCoordItem.fullName}. Promoted to Executive Approval Queue!`
          : `Candidate ${selectedCoordItem.fullName} was rejected.`,
        isApproved ? "good" : "warn",
      );
      setSelectedCoordItem(null);
      await loadQueues();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Verification failed", "bad");
    } finally {
      setVerifyingDoc(false);
    }
  };

  // Handle Executive Final Approval
  const handleExecutiveApprove = async (isApproved: boolean) => {
    if (!selectedExecItem) return;
    setExecutingApproval(true);
    try {
      await chapterWorkflowApi.executiveApprove({
        registrationId: selectedExecItem.registrationId,
        approvedBy: `Platform Admin (${execRole})`,
        roleAtApproval: execRole,
        isApproved,
        remarks: execRemarks,
      });
      notify(
        isApproved
          ? `Approved! ${selectedExecItem.fullName} is now an ACTIVE member in the chapter!`
          : `Application rejected by ${execRole}.`,
        isApproved ? "good" : "warn",
      );
      setSelectedExecItem(null);
      await loadQueues();
      await loadChapters();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Executive approval failed",
        "bad",
      );
    } finally {
      setExecutingApproval(false);
    }
  };

  // Handle Register Candidate
  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !selectedChapterId) {
      notify("Full name, email, and chapter are required.", "bad");
      return;
    }
    setSubmittingReg(true);
    try {
      const reg = await chapterWorkflowApi.registerMember({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        businessName: regBusiness.trim() || `${regFullName} Enterprises`,
        categoryId: regCategory,
        chapterId: selectedChapterId,
      });
      setActiveRegId(reg.id);
      setPaymentRef(`PAY-${Date.now().toString().slice(-6)}`);
      notify(
        `Applicant ${reg.fullName} registered! Registration ID: ${reg.id}`,
        "good",
      );
      const detail = await chapterWorkflowApi.getOnboardingStatus(reg.id);
      setStatusDetail(detail);
      await loadQueues();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Registration failed", "bad");
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Payment Verification
  const handleVerifyPayment = async () => {
    if (!activeRegId) return;
    setVerifyingPayment(true);
    try {
      await chapterWorkflowApi.verifyPayment({
        registrationId: activeRegId,
        amount: paymentAmount,
        paymentRef: paymentRef || `PAY-${Date.now()}`,
      });
      notify(
        "Payment verified! Candidate promoted to Coordinator Document Queue.",
        "good",
      );
      const detail = await chapterWorkflowApi.getOnboardingStatus(activeRegId);
      setStatusDetail(detail);
      await loadQueues();
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Payment verification failed",
        "bad",
      );
    } finally {
      setVerifyingPayment(false);
    }
  };

  const refreshStatus = async (regId: string) => {
    try {
      const detail = await chapterWorkflowApi.getOnboardingStatus(regId);
      setStatusDetail(detail);
    } catch {
      // ignore
    }
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    {
      key: "chapters",
      label: "1. Parivar Registry & Creation",
      badge: chapters.length,
    },
    {
      key: "roles",
      label: "2. Leadership Hierarchy",
      badge: governedLeaders.length,
    },
    {
      key: "coordinator",
      label: "3. Coordinator KYC Queue",
      badge: coordQueue.length,
    },
    {
      key: "executive",
      label: "4. Executive Approval Queue",
      badge: execQueue.length,
    },
    { key: "register", label: "5. Applicant Onboarding Gate" },
  ];

  return (
    <div className="stack">
      {/* Executive Clean Header */}
      <header className="exec-header-row">
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Chapter Governance & Hierarchy
            </h1>
            <span
              className="pill good"
              style={{ fontWeight: 700, fontSize: "11px", padding: "1px 8px" }}
            >
              Live Network
            </span>
          </div>
          <p
            className="muted"
            style={{ margin: "2px 0 0 0", fontSize: "13px", lineHeight: "1.4" }}
          >
            Territory boundaries, leadership assignment, and verification
            workflow.
          </p>
        </div>

        <button
          type="button"
          className="btn secondary"
          style={{
            flexShrink: 0,
            minHeight: "34px",
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "8px",
            borderColor: "#cbd5e1",
          }}
          onClick={() => {
            void loadChapters();
            void loadQueues();
            void loadLeaders();
          }}
          title="Refresh chapters and leadership queues"
        >
          <LucideIcon name="refresh-cw" size={13} />
          <span>Refresh</span>
        </button>
      </header>

      {feedback && (
        <div
          className={`notice ${feedback.tone === "good" ? "success" : feedback.tone === "bad" ? "error" : ""}`}
        >
          <strong>{feedback.msg}</strong>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav
        className="exec-tabs-bar"
        aria-label="Parivar governance workflow tabs"
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`exec-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="exec-tab-badge">{t.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Executive KPI Stats Strip (Shown across Governance Tabs) */}
      <div className="exec-kpi-grid">
        <div className="exec-kpi-card">
          <div
            className="exec-kpi-icon"
            style={{ background: "#eff6ff", color: "#2563eb" }}
          >
            <LucideIcon name="network" size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="exec-kpi-val">{chapters.length}</div>
            <div className="exec-kpi-title">
              Chapters ({chapters.filter((c) => c.status === "ACTIVE").length}{" "}
              Active)
            </div>
          </div>
        </div>

        <div className="exec-kpi-card">
          <div
            className="exec-kpi-icon"
            style={{ background: "#ecfdf5", color: "#059669" }}
          >
            <LucideIcon name="activity" size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="exec-kpi-val">
              {new Set(chapters.map((c) => c.regionId).filter(Boolean)).size ||
                1}{" "}
              Regions
            </div>
            <div className="exec-kpi-title">Territory Coverage</div>
          </div>
        </div>

        <div className="exec-kpi-card">
          <div
            className="exec-kpi-icon"
            style={{ background: "#f5f3ff", color: "#7c3aed" }}
          >
            <LucideIcon name="shield" size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="exec-kpi-val">{governedLeaders.length} Leaders</div>
            <div className="exec-kpi-title">Governed Trustees</div>
          </div>
        </div>

        <div className="exec-kpi-card">
          <div
            className="exec-kpi-icon"
            style={{ background: "#fffbeb", color: "#d97706" }}
          >
            <LucideIcon name="users" size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="exec-kpi-val"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {chapters.find((c) => c.id === selectedChapterId)?.name ??
                "All Units"}
            </div>
            <div className="exec-kpi-title">Selected Parivar</div>
          </div>
        </div>
      </div>

      {loading && <Loading label="Loading chapters…" />}

      {/* TAB 1: CHAPTERS REGISTRY & CREATION */}
      {activeTab === "chapters" && (
        <div className="grid grid-2" style={{ alignItems: "stretch" }}>
          {/* Create Chapter Form */}
          <section className="exec-card">
            <div className="exec-card-header">
              <h2 className="exec-card-title">
                <span
                  className="exec-badge-icon"
                  style={{ background: "#eff6ff", color: "#2563eb" }}
                >
                  <LucideIcon name="plus" size={18} />
                </span>
                <span>Create New Parivar</span>
              </h2>
              <span className="exec-status-pill active">
                <span className="exec-status-dot" />
                Platform Authority
              </span>
            </div>

            <p
              className="muted"
              style={{ marginBottom: "16px", fontSize: "13px" }}
            >
              Platform Administrator exclusively initiates new Chapter
              boundaries in the enterprise network.
            </p>

            <form
              onSubmit={handleCreateChapter}
              className="stack"
              style={{ gap: "14px" }}
            >
              <div>
                <label
                  className="label"
                  style={{ fontWeight: "600", marginBottom: "6px" }}
                >
                  Parivar Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Salem West Parivar"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div className="form-row-2">
                <div>
                  <label
                    className="label"
                    style={{ fontWeight: "600", marginBottom: "6px" }}
                  >
                    Region
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newChapterRegion}
                    onChange={(e) => setNewChapterRegion(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="label"
                    style={{ fontWeight: "600", marginBottom: "6px" }}
                  >
                    State
                  </label>
                  <select
                    className="select"
                    value={newChapterState}
                    onChange={(e) => setNewChapterState(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="label"
                  style={{ fontWeight: "600", marginBottom: "6px" }}
                >
                  Operational Status
                </label>
                <select
                  value={newChapterStatus}
                  onChange={(e) => setNewChapterStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#fff",
                    fontSize: "14px",
                  }}
                >
                  <option value="ACTIVE">
                    ACTIVE (Ready for onboarding and leadership)
                  </option>
                  <option value="DRAFT">
                    DRAFT (Territory setup in progress)
                  </option>
                  <option value="INACTIVE">
                    INACTIVE (Temporarily decommissioned)
                  </option>
                </select>
              </div>

              {/* Chapter Logo Field */}
              <div
                style={{
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <label
                    className="label"
                    style={{ fontWeight: "600", margin: 0, fontSize: "13px" }}
                  >
                    Chapter Logo
                  </label>
                  {newChapterLogo && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#059669",
                        background: "#ecfdf5",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: "600",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      ✓ Logo Selected
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Reflects on Member Web Featured &amp; Discover top image based
                  on member's chapter.
                </p>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {newChapterLogo ? (
                    <div
                      style={{
                        position: "relative",
                        width: "56px",
                        height: "56px",
                        borderRadius: "8px",
                        border: "2px solid #2563eb",
                        padding: "2px",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={newChapterLogo}
                        alt="Logo preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          borderRadius: "6px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setNewChapterLogo("")}
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                        title="Remove logo"
                      >
                        <LucideIcon name="x" size={12} />
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        border: "1px dashed #94a3b8",
                        background: "#ffffff",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#334155",
                      }}
                    >
                      <LucideIcon name="upload" size={14} />
                      <span>
                        {convertingImage
                          ? "Processing…"
                          : "Upload Chapter Logo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={convertingImage}
                        onChange={handleLogoUpload}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn"
                disabled={creatingChapter}
                style={{
                  marginTop: "6px",
                  width: "100%",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  color: "#ffffff",
                  minHeight: "44px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <LucideIcon name="check" size={16} />
                {creatingChapter
                  ? "Creating Chapter…"
                  : "Create & Register Chapter"}
              </button>
            </form>

            {/* Platform Boundary Governance Guidelines (Fills dead whitespace neatly) */}
            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#1e293b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LucideIcon
                  name="shield"
                  size={14}
                  style={{ color: "#2563eb" }}
                />
                <span>Parivar Governance Guidelines</span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#475569",
                  lineHeight: "1.6",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ color: "#10b981", fontWeight: "bold" }}>
                    ✓
                  </span>
                  <span>
                    <strong>District Authority:</strong> Parivar defines
                    regional boundary for weekly meetings.
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ color: "#2563eb", fontWeight: "bold" }}>
                    ✓
                  </span>
                  <span>
                    <strong>Trustee Provisioning:</strong> Parivar leaders are
                    assigned by Org Trustees.
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                    ✓
                  </span>
                  <span>
                    <strong>Lifecycle State:</strong> ACTIVE status unlocks
                    onboarding application gates.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Chapters List */}
          <section className="exec-card">
            <div className="exec-card-header">
              <h2 className="exec-card-title">
                <span
                  className="exec-badge-icon"
                  style={{ background: "#ecfdf5", color: "#059669" }}
                >
                  <LucideIcon name="network" size={18} />
                </span>
                <span>Registered Parivars</span>
              </h2>
              <span className="pill good" style={{ fontWeight: "700" }}>
                {chapters.length} Total
              </span>
            </div>

            <div
              className="table-wrap"
              style={{ width: "100%", overflowX: "auto" }}
            >
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>Parivar</th>
                    <th>Region / State</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((ch) => {
                    const isSelected = selectedChapterId === ch.id;
                    return (
                      <tr
                        key={ch.id}
                        className={isSelected ? "selected-row" : ""}
                        style={{
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onClick={() => {
                          setSelectedChapterId(ch.id);
                          void loadChapterMembers(ch.id, ch.name);
                        }}
                      >
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                background: isSelected ? "#1e3a8a" : "#f1f5f9",
                                color: isSelected ? "#ffffff" : "#64748b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: "bold",
                                overflow: "hidden",
                              }}
                            >
                              {ch.logo ? (
                                <img
                                  src={ch.logo}
                                  alt={ch.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <LucideIcon name="network" size={14} />
                              )}
                            </div>
                            <strong
                              style={{
                                color: isSelected ? "#1d4ed8" : "#0f172a",
                              }}
                            >
                              {ch.name}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "500" }}>
                            {ch.regionId || "—"}
                          </div>
                          <div className="muted" style={{ fontSize: "11px" }}>
                            {ch.stateId}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`exec-status-pill ${ch.status === "ACTIVE" ? "active" : "draft"}`}
                          >
                            <span className="exec-status-dot" />
                            {ch.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn secondary"
                            style={{
                              minHeight: "34px",
                              padding: "4px 10px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background:
                                isSelected && inspectingChapterName === ch.name
                                  ? "#1e3a8a"
                                  : "#f8fafc",
                              color:
                                isSelected && inspectingChapterName === ch.name
                                  ? "#ffffff"
                                  : "#334155",
                              borderColor: "#cbd5e1",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChapterId(ch.id);
                              void loadChapterMembers(ch.id, ch.name);
                            }}
                          >
                            <LucideIcon name="users" size={13} />
                            <span>Members</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {chapters.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          padding: "32px",
                          color: "#64748b",
                        }}
                      >
                        No chapters registered. Use the form on the left to
                        create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected Chapter Members View */}
            {inspectingChapterName && (
              <div
                style={{
                  marginTop: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      className="exec-badge-icon"
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        width: "26px",
                        height: "26px",
                      }}
                    >
                      <LucideIcon name="users" size={14} />
                    </span>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                      Inducted Members · {inspectingChapterName} (
                      {chapterMembers.length})
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{
                      minHeight: "28px",
                      padding: "2px 8px",
                      fontSize: "11px",
                    }}
                    onClick={() => setInspectingChapterName("")}
                  >
                    Close
                  </button>
                </div>
                {loadingMembers ? (
                  <Loading label="Fetching members…" />
                ) : (
                  <div
                    className="exec-scroll-list"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    {chapterMembers.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderBottom: "1px solid #f1f5f9",
                          background: "#ffffff",
                          borderRadius: "6px",
                          marginBottom: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            className="exec-avatar-circle"
                            style={{
                              background: getAvatarBg(m.fullName),
                              width: "28px",
                              height: "28px",
                              fontSize: "11px",
                            }}
                          >
                            {getInitials(m.fullName)}
                          </div>
                          <div>
                            <strong
                              style={{ fontSize: "13px", color: "#0f172a" }}
                            >
                              {m.fullName}
                            </strong>
                            {m.businessName && (
                              <div
                                className="muted"
                                style={{ fontSize: "11px" }}
                              >
                                {m.businessName}
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className="exec-status-pill active"
                          style={{ fontSize: "11px", padding: "2px 8px" }}
                        >
                          {m.role || "Member"}
                        </span>
                      </div>
                    ))}
                    {chapterMembers.length === 0 && (
                      <p
                        className="muted"
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          textAlign: "center",
                        }}
                      >
                        No active group members in this chapter yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: LEADERSHIP HIERARCHY & CREDENTIAL MANAGEMENT */}
      {activeTab === "roles" && (
        <div className="stack" style={{ gap: "20px" }}>
          {/* One-Time Credentials Modal / Banner */}
          {createdCredentials && (
            <div
              style={{
                background: "linear-gradient(135deg, #090d16 0%, #1e293b 100%)",
                color: "#fff",
                padding: "22px",
                borderRadius: "14px",
                border: "1px solid #38bdf8",
                boxShadow: "0 12px 28px -5px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: "#0284c7",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      letterSpacing: "0.05em",
                    }}
                  >
                    NEW CREDENTIALS PROVISIONED
                  </span>
                  <strong
                    style={{
                      fontSize: "15px",
                      color: "#38bdf8",
                      wordBreak: "break-word",
                    }}
                  >
                    {createdCredentials.fullName} ({createdCredentials.position}
                    )
                  </strong>
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  style={{
                    minHeight: "32px",
                    fontSize: "12px",
                    color: "#94a3b8",
                    borderColor: "#475569",
                  }}
                  onClick={() => setCreatedCredentials(null)}
                >
                  Dismiss
                </button>
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                ⚠️ Save these login credentials now. Passwords are securely
                hashed with PBKDF2/SHA256 and will not be displayed again in
                plaintext. First sign in will require changing the temporary
                password.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                  background: "rgba(15, 23, 42, 0.85)",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Username / Email
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#f8fafc",
                      marginTop: "3px",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {createdCredentials.username}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Temporary Password
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#38bdf8",
                      marginTop: "3px",
                      fontFamily: "monospace",
                    }}
                  >
                    {createdCredentials.temporaryPassword}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Position & Scope
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#f8fafc",
                      marginTop: "3px",
                    }}
                  >
                    {createdCredentials.position} · {createdCredentials.scope}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Forced Password Change
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#fbbf24",
                      marginTop: "3px",
                      fontWeight: "500",
                    }}
                  >
                    {createdCredentials.mustChangePassword
                      ? "Mandatory on first login"
                      : "Optional"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={{
                    background:
                      "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    borderColor: "#0284c7",
                    color: "#fff",
                    fontSize: "13px",
                    minHeight: "40px",
                    padding: "8px 16px",
                    fontWeight: "600",
                  }}
                  onClick={() => {
                    const text = `SETHU Organization Leadership Portal Credentials:\nPortal: ${ORG_LOGIN_URL}\nFull Name: ${createdCredentials.fullName}\nPosition: ${createdCredentials.position}\nScope: ${createdCredentials.scope}\nUsername: ${createdCredentials.username}\nTemporary Password: ${createdCredentials.temporaryPassword}\nNote: You will be required to change your password immediately upon first login.`;
                    void navigator.clipboard.writeText(text);
                    setCopiedNotification(true);
                    setTimeout(() => setCopiedNotification(false), 3000);
                  }}
                >
                  <LucideIcon name="clipboard-check" size={15} />
                  {copiedNotification
                    ? "Copied to Clipboard!"
                    : "Copy Credentials to Clipboard"}
                </button>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    wordBreak: "break-all",
                  }}
                >
                  Login Portal URL:{" "}
                  <strong style={{ color: "#38bdf8" }}>{ORG_LOGIN_URL}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Form and Governed Leaders Grid */}
          <div className="grid grid-2" style={{ alignItems: "stretch" }}>
            {/* Create Leader Form */}
            <section className="exec-card">
              <div className="exec-card-header">
                <h2 className="exec-card-title">
                  <span
                    className="exec-badge-icon"
                    style={{ background: "#f5f3ff", color: "#7c3aed" }}
                  >
                    <LucideIcon name="shield" size={18} />
                  </span>
                  <span>Create Organization Trustee / Trust Account</span>
                </h2>
                <span className="exec-status-pill active">Org Level</span>
              </div>

              <p
                className="muted"
                style={{ marginBottom: "16px", fontSize: "13px" }}
              >
                Platform Admin creates Trustee & Trust accounts at the
                organization level. Chapter leadership (President, Vice
                President, Secretary, Member Coordinator) is governed and
                assigned by Trustees via the Organisation Portal.
              </p>

              <form
                onSubmit={handleCreateLeader}
                className="stack"
                style={{ gap: "14px" }}
              >
                <div>
                  <label
                    className="label"
                    style={{ fontWeight: "600", marginBottom: "6px" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Meena Sundaram"
                    value={leaderFullName}
                    onChange={(e) => setLeaderFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div>
                    <label
                      className="label"
                      style={{ fontWeight: "600", marginBottom: "6px" }}
                    >
                      Email (Username) *
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="trustee@dbn.network"
                      value={leaderEmail}
                      onChange={(e) => setLeaderEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="label"
                      style={{ fontWeight: "600", marginBottom: "6px" }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="+91 98840 98765"
                      value={leaderPhone}
                      onChange={(e) => setLeaderPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="label"
                    style={{ fontWeight: "600", marginBottom: "6px" }}
                  >
                    Position *
                  </label>
                  <select
                    value={leaderPosition}
                    onChange={(e) => setLeaderPosition(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    <option value="Trustee">
                      Trustee (Org-Wide · Governance & Appointments)
                    </option>
                    <option value="Trust">
                      Trust (Tenant-Level · Payment Verification)
                    </option>
                  </select>
                </div>

                {/* Chapter Field Behavior: Organization-wide authority callout */}
                <div
                  style={{
                    background:
                      leaderPosition === "Trustee" ? "#f0f9ff" : "#fffbeb",
                    border: `1px solid ${leaderPosition === "Trustee" ? "#bae6fd" : "#fde68a"}`,
                    borderRadius: "10px",
                    padding: "14px",
                    fontSize: "13px",
                    color: leaderPosition === "Trustee" ? "#0369a1" : "#92400e",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <LucideIcon
                    name="shield"
                    size={18}
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  />
                  <div>
                    <strong>Organization-Wide Authority:</strong>
                    <div style={{ marginTop: "3px", lineHeight: "1.5" }}>
                      {leaderPosition === "Trustee"
                        ? "Trustees operate across all chapters with sole authority to assign, relieve, and suspend Chapter Leaders from registered members in the Organisation Portal. Multiple Trustees can be created."
                        : "Trust administrators operate at tenant level to verify member registration payments. Multiple Trust accounts can be created."}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn"
                  disabled={creatingLeader}
                  style={{
                    marginTop: "6px",
                    width: "100%",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    color: "#ffffff",
                    minHeight: "44px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                  }}
                >
                  <LucideIcon name="key-round" size={16} />
                  {creatingLeader
                    ? "Creating Account…"
                    : `Create ${leaderPosition} & Auto-Generate Credentials`}
                </button>
              </form>
            </section>

            {/* Governed Leaders Directory */}
            <section className="exec-card">
              <div className="exec-card-header">
                <div>
                  <h2 className="exec-card-title">
                    <span
                      className="exec-badge-icon"
                      style={{ background: "#f5f3ff", color: "#7c3aed" }}
                    >
                      <LucideIcon name="users" size={18} />
                    </span>
                    <span>Platform Admin Governed Leaders</span>
                  </h2>
                  <p
                    className="muted"
                    style={{ fontSize: "12px", marginTop: "2px" }}
                  >
                    Active Trustee & Trust credentials across entire
                    organization
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span className="pill good" style={{ fontWeight: "700" }}>
                    {governedLeaders.length} Active
                  </span>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{
                      minHeight: "34px",
                      fontSize: "12px",
                      padding: "4px 10px",
                    }}
                    onClick={() => void loadLeaders()}
                  >
                    <LucideIcon name="refresh-cw" size={13} /> Refresh
                  </button>
                </div>
              </div>

              {loadingLeaders ? (
                <Loading label="Fetching leadership accounts…" />
              ) : (
                <div
                  className="table-wrap exec-scroll-list"
                  style={{
                    maxHeight: "440px",
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <table className="exec-table">
                    <thead>
                      <tr>
                        <th>Leader & Position</th>
                        <th>Scope</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {governedLeaders.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                className="exec-avatar-circle"
                                style={{ background: getAvatarBg(l.fullName) }}
                              >
                                {getInitials(l.fullName)}
                              </div>
                              <div>
                                <strong style={{ color: "#0f172a" }}>
                                  {l.fullName}
                                </strong>
                                <div
                                  className="muted"
                                  style={{ fontSize: "11px" }}
                                >
                                  {l.email}
                                </div>
                                <div style={{ marginTop: "3px" }}>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 8px",
                                      borderRadius: "10px",
                                      fontWeight: "700",
                                      background:
                                        l.position === "Trustee"
                                          ? "#e0f2fe"
                                          : "#fef3c7",
                                      color:
                                        l.position === "Trustee"
                                          ? "#0369a1"
                                          : "#92400e",
                                    }}
                                  >
                                    {l.position}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color:
                                  l.position === "Trustee"
                                    ? "#0369a1"
                                    : "#b45309",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              🌐 Tenant-Wide
                            </span>
                            <div className="muted" style={{ fontSize: "11px" }}>
                              (
                              {l.position === "Trustee"
                                ? "Governance"
                                : "Payment"}
                              )
                            </div>
                            {l.mustChangePassword && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#e11d48",
                                  marginTop: "2px",
                                  fontWeight: "600",
                                }}
                              >
                                Must Change Password: Yes
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`exec-status-pill ${l.isActive ? "active" : "inactive"}`}
                            >
                              <span className="exec-status-dot" />
                              {l.isActive ? "Active" : "Deactivated"}
                            </span>
                            {l.isLocked && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#e11d48",
                                  marginTop: "2px",
                                  fontWeight: "bold",
                                }}
                              >
                                🔒 Locked
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                alignItems: "flex-end",
                              }}
                            >
                              <button
                                type="button"
                                className="btn secondary"
                                style={{
                                  minHeight: "30px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                disabled={resettingLeaderId === l.id}
                                onClick={() =>
                                  handleResetPassword(l.id, l.fullName)
                                }
                                title="Reset password to default (Leader@123)"
                              >
                                <LucideIcon name="key-round" size={11} /> Reset
                                Pwd
                              </button>
                              <button
                                type="button"
                                className="btn secondary"
                                style={{
                                  minHeight: "30px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  color: l.isActive ? "#e11d48" : "#0284c7",
                                }}
                                onClick={() => handleToggleLeaderActive(l)}
                              >
                                {l.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {governedLeaders.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              textAlign: "center",
                              padding: "32px",
                              color: "#64748b",
                            }}
                          >
                            No Trustee or Trust accounts registered yet. Use
                            form on the left to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Secondary Section: Chapter Leadership Governance Notice & Interactive Chapter Hierarchy */}
          <div className="grid grid-2" style={{ alignItems: "stretch" }}>
            <section className="exec-card">
              <div className="exec-card-header">
                <h2 className="exec-card-title">
                  <span
                    className="exec-badge-icon"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <LucideIcon name="shield" size={18} />
                  </span>
                  <span>Parivar Leadership Governance</span>
                </h2>
                <span className="pill good">Role Policy</span>
              </div>

              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "12px",
                  padding: "18px",
                  color: "#0369a1",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    marginBottom: "8px",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Managed Exclusively by Trustees</span>
                </div>
                <p style={{ margin: "0 0 12px 0" }}>
                  Chapter leadership positions (<strong>President</strong>,{" "}
                  <strong>Vice President</strong>, <strong>Secretary</strong>,{" "}
                  <strong>Member Coordinator</strong>) are governed and
                  appointed exclusively by <strong>Trustees</strong> inside the
                  Organisation Web Portal.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e0f2fe",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        color: "#1e3a8a",
                        fontSize: "12px",
                      }}
                    >
                      1. President
                    </div>
                    <div className="muted" style={{ fontSize: "11px" }}>
                      Parivar Executive
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "8px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e0f2fe",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        color: "#2563eb",
                        fontSize: "12px",
                      }}
                    >
                      2. Vice President
                    </div>
                    <div className="muted" style={{ fontSize: "11px" }}>
                      Operations & Approval
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "8px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e0f2fe",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        color: "#7c3aed",
                        fontSize: "12px",
                      }}
                    >
                      3. Secretary
                    </div>
                    <div className="muted" style={{ fontSize: "11px" }}>
                      Minutes & Registry
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "8px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e0f2fe",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        color: "#059669",
                        fontSize: "12px",
                      }}
                    >
                      4. Coordinator
                    </div>
                    <div className="muted" style={{ fontSize: "11px" }}>
                      KYC & Verification
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e0f2fe",
                    fontSize: "12px",
                    marginBottom: "14px",
                  }}
                >
                  📌 <strong>Pre-condition:</strong> Positions can strictly only
                  be assigned to members who are already registered and
                  payment-verified.
                </div>

                <a
                  href={ORG_LOGIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    textDecoration: "none",
                    fontWeight: "600",
                    color: "#0369a1",
                    background: "#ffffff",
                    borderColor: "#bae6fd",
                    minHeight: "38px",
                    padding: "6px 14px",
                  }}
                >
                  <LucideIcon
                    name="log-out"
                    size={13}
                    style={{ transform: "rotate(180deg)" }}
                  />
                  <span>Open Organisation Portal Login (/org/login)</span>
                </a>
              </div>
            </section>

            <section className="exec-card">
              <div className="exec-card-header">
                <div>
                  <h2 className="exec-card-title">
                    <span
                      className="exec-badge-icon"
                      style={{ background: "#ecfdf5", color: "#059669" }}
                    >
                      <LucideIcon name="network" size={18} />
                    </span>
                    <span>Current Parivar Hierarchy</span>
                  </h2>
                  <p
                    className="muted"
                    style={{ fontSize: "12px", marginTop: "2px" }}
                  >
                    Inspect leadership roster by chapter
                  </p>
                </div>

                {/* Interactive Chapter Selector Dropdown */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <label htmlFor="chapter-hierarchy-select" className="sr-only">
                    Select Parivar
                  </label>
                  <select
                    id="chapter-hierarchy-select"
                    className="select"
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      minHeight: "36px",
                    }}
                  >
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className="table-wrap"
                style={{ width: "100%", overflowX: "auto" }}
              >
                <table className="exec-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Leader / Member</th>
                      <th>Email / ID</th>
                      <th>Assigned At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterRoles.map((r) => {
                      const isPres = r.roleId === "President";
                      const isVp = r.roleId === "Vice President";
                      const isSec = r.roleId === "Secretary";
                      const roleColor = isPres
                        ? "#1e3a8a"
                        : isVp
                          ? "#2563eb"
                          : isSec
                            ? "#7c3aed"
                            : "#059669";
                      const roleBg = isPres
                        ? "#eff6ff"
                        : isVp
                          ? "#eff6ff"
                          : isSec
                            ? "#f5f3ff"
                            : "#ecfdf5";
                      return (
                        <tr key={r.id}>
                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 10px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "700",
                                color: roleColor,
                                background: roleBg,
                                border: `1px solid ${roleColor}30`,
                              }}
                            >
                              {r.roleId}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "#0f172a" }}>
                              {r.fullName || r.memberId}
                            </strong>
                          </td>
                          <td
                            style={{
                              fontSize: "12px",
                              fontFamily: "monospace",
                              color: "#64748b",
                            }}
                          >
                            {r.email || r.memberId}
                          </td>
                          <td style={{ fontSize: "12px", color: "#64748b" }}>
                            {new Date(r.assignedAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className="exec-status-pill active"
                              style={{ fontSize: "11px", padding: "2px 8px" }}
                            >
                              <span className="exec-status-dot" />
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {chapterRoles.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "#64748b",
                          }}
                        >
                          <LucideIcon
                            name="shield"
                            size={24}
                            style={{
                              color: "#94a3b8",
                              margin: "0 auto 8px auto",
                              display: "block",
                            }}
                          />
                          <div>
                            No leadership roles assigned to this chapter yet.
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                              marginTop: "4px",
                            }}
                          >
                            Trustees assign President, Vice President, Secretary
                            & Coordinator via the Organisation Portal.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 3: COORDINATOR KYC QUEUE */}
      {activeTab === "coordinator" && (
        <Card>
          <div className="topbar">
            <div>
              <h2 className="page-title" style={{ fontSize: "18px" }}>
                Stage 1: Coordinator Document & KYC Queue ({coordQueue.length})
              </h2>
              <p className="muted">
                Candidates with verified payments waiting for Member Coordinator
                KYC & Document verification.
              </p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() => void loadQueues()}
            >
              <LucideIcon name="refresh-cw" size={14} /> Refresh Queue
            </button>
          </div>

          <div
            className="table-wrap"
            style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}
          >
            <table
              className="table"
              style={{ width: "100%", minWidth: "460px" }}
            >
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Business & Category</th>
                  <th>Parivar</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {coordQueue.map((item) => (
                  <tr key={item.registrationId}>
                    <td>
                      <strong>{item.fullName}</strong>
                      <div className="muted">
                        {item.email} · {item.phone}
                      </div>
                    </td>
                    <td>
                      <div>{item.businessName}</div>
                      <span className="pill">
                        {item.categoryId || "General"}
                      </span>
                    </td>
                    <td>{item.chapterName}</td>
                    <td>
                      <Pill tone="good">
                        ₹{item.payment?.amount ?? 6000} Verified
                      </Pill>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        style={{ minHeight: "32px", fontSize: "12px" }}
                        onClick={() => setSelectedCoordItem(item)}
                      >
                        Review KYC
                      </button>
                    </td>
                  </tr>
                ))}
                {coordQueue.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "32px" }}
                    >
                      <LucideIcon name="check" size={24} />
                      <div style={{ marginTop: "8px" }}>
                        No candidates pending KYC verification. All clear!
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* KYC Review Modal */}
          {selectedCoordItem && (
            <div className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  Review Document: {selectedCoordItem.fullName} ·{" "}
                  {selectedCoordItem.businessName}
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setSelectedCoordItem(null)}
                >
                  Cancel
                </button>
              </div>

              <div
                className="stack"
                style={{ width: "100%", maxWidth: "100%" }}
              >
                <div style={{ width: "100%", maxWidth: "100%" }}>
                  <label className="label">Submitted Document Proof URL</label>
                  <input
                    type="text"
                    value={kycDocUrl}
                    onChange={(e) => setKycDocUrl(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>

                <div style={{ width: "100%", maxWidth: "100%" }}>
                  <label className="label">Verification Notes</label>
                  <textarea
                    rows={2}
                    value={kycNotes}
                    onChange={(e) => setKycNotes(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>

                <div className="detail-card-actions">
                  <button
                    type="button"
                    className="btn"
                    disabled={verifyingDoc}
                    onClick={() => void handleVerifyDoc(true)}
                  >
                    <LucideIcon name="check" size={16} />
                    {verifyingDoc
                      ? "Verifying…"
                      : "Approve Document & Send to Executive Queue"}
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={verifyingDoc}
                    onClick={() => void handleVerifyDoc(false)}
                    style={{ background: "#dc2626", color: "#fff" }}
                  >
                    Reject KYC
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: EXECUTIVE APPROVAL QUEUE */}
      {activeTab === "executive" && (
        <Card>
          <div className="topbar">
            <div>
              <h2 className="page-title" style={{ fontSize: "18px" }}>
                Stage 2: Executive Committee Final Approval Queue (
                {execQueue.length})
              </h2>
              <p className="muted">
                Candidates with verified payments and approved KYC documents
                waiting for Chapter President / VP induction.
              </p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() => void loadQueues()}
            >
              <LucideIcon name="refresh-cw" size={14} /> Refresh Queue
            </button>
          </div>

          <div
            className="table-wrap"
            style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}
          >
            <table
              className="table"
              style={{ width: "100%", minWidth: "460px" }}
            >
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Business & Parivar</th>
                  <th>KYC Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {execQueue.map((item) => (
                  <tr key={item.registrationId}>
                    <td>
                      <strong>{item.fullName}</strong>
                      <div className="muted">
                        {item.email} · {item.phone}
                      </div>
                    </td>
                    <td>
                      <strong>{item.businessName}</strong>
                      <div className="muted">{item.chapterName}</div>
                    </td>
                    <td>
                      <Pill tone="good">
                        KYC Approved by{" "}
                        {item.documentVerification?.verifiedBy ?? "Coordinator"}
                      </Pill>
                    </td>
                    <td>
                      <Pill tone="good">
                        ₹{item.payment?.amount ?? 6000} Paid
                      </Pill>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        style={{ minHeight: "32px", fontSize: "12px" }}
                        onClick={() => setSelectedExecItem(item)}
                      >
                        Executive Decision
                      </button>
                    </td>
                  </tr>
                ))}
                {execQueue.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "32px" }}
                    >
                      <LucideIcon name="check" size={24} />
                      <div style={{ marginTop: "8px" }}>
                        No candidates pending executive committee approval.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Executive Decision Modal */}
          {selectedExecItem && (
            <div className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  Executive Committee Approval: {selectedExecItem.fullName} (
                  {selectedExecItem.businessName})
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setSelectedExecItem(null)}
                >
                  Cancel
                </button>
              </div>

              <div
                className="stack"
                style={{ width: "100%", maxWidth: "100%" }}
              >
                <div className="form-row-2">
                  <div style={{ width: "100%", maxWidth: "100%" }}>
                    <label className="label">Approver Authority Role</label>
                    <select
                      value={execRole}
                      onChange={(e) =>
                        setExecRole(
                          e.target.value as "President" | "Vice President",
                        )
                      }
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="President">
                        Dharma Dhara (Parivar President)
                      </option>
                      <option value="Vice President">
                        Parivar Vice President
                      </option>
                    </select>
                  </div>
                  <div style={{ width: "100%", maxWidth: "100%" }}>
                    <label className="label">Target Parivar</label>
                    <input
                      type="text"
                      disabled
                      value={selectedExecItem.chapterName}
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                      }}
                    />
                  </div>
                </div>

                <div style={{ width: "100%", maxWidth: "100%" }}>
                  <label className="label">
                    Decision Remarks / Inducting Resolution
                  </label>
                  <textarea
                    rows={2}
                    value={execRemarks}
                    onChange={(e) => setExecRemarks(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>

                <div className="detail-card-actions">
                  <button
                    type="button"
                    className="btn"
                    disabled={executingApproval}
                    onClick={() => void handleExecutiveApprove(true)}
                  >
                    <LucideIcon name="clipboard-check" size={16} />
                    {executingApproval
                      ? "Approving…"
                      : "Approve & Induct into Chapter Membership (ACTIVE)"}
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={executingApproval}
                    onClick={() => void handleExecutiveApprove(false)}
                    style={{ background: "#dc2626", color: "#fff" }}
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: APPLICANT ONBOARDING GATE */}
      {activeTab === "register" && (
        <div
          className="grid grid-2"
          style={{ alignItems: "start", width: "100%", maxWidth: "100%" }}
        >
          <Card>
            <h2 className="section-title">New Member Registration Intake</h2>
            <p className="muted" style={{ marginBottom: "14px" }}>
              Simulate or manually register candidate into chapter onboarding
              lifecycle.
            </p>

            <form
              onSubmit={handleRegisterCandidate}
              className="stack"
              style={{ width: "100%", maxWidth: "100%" }}
            >
              <div style={{ width: "100%", maxWidth: "100%" }}>
                <label className="label">Target Parivar</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: "100%", maxWidth: "100%" }}>
                <label className="label">Applicant Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anandha Kumar"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                />
              </div>

              <div className="form-row-2">
                <div style={{ width: "100%", maxWidth: "100%" }}>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    placeholder="anand@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                    required
                  />
                </div>
                <div style={{ width: "100%", maxWidth: "100%" }}>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
              </div>

              <div style={{ width: "100%", maxWidth: "100%" }}>
                <label className="label">Business / Firm Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Precision Tech"
                  value={regBusiness}
                  onChange={(e) => setRegBusiness(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn"
                disabled={submittingReg}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <LucideIcon name="users" size={16} />
                {submittingReg
                  ? "Registering…"
                  : "Step 1: Register Candidate in DB"}
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="section-title">
              Payment Gate & Lifecycle Inspection
            </h2>
            {activeRegId ? (
              <div
                className="stack"
                style={{ width: "100%", maxWidth: "100%" }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="muted" style={{ fontSize: "11px" }}>
                    ACTIVE REGISTRATION ID
                  </div>
                  <strong
                    className="code"
                    style={{ fontSize: "13px", wordBreak: "break-all" }}
                  >
                    {activeRegId}
                  </strong>
                  <div style={{ marginTop: "4px" }}>
                    Status:{" "}
                    <Pill tone="warn">
                      {statusDetail?.registration.onboardingStatus ??
                        "PENDING_PAYMENT"}
                    </Pill>
                  </div>
                </div>

                {statusDetail?.registration.onboardingStatus ===
                  "PENDING_PAYMENT" && (
                  <div
                    className="stack"
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      paddingTop: "10px",
                      width: "100%",
                      maxWidth: "100%",
                    }}
                  >
                    <div className="form-row-2">
                      <div style={{ width: "100%", maxWidth: "100%" }}>
                        <label className="label">Payment Amount (₹)</label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) =>
                            setPaymentAmount(Number(e.target.value))
                          }
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                          }}
                        />
                      </div>
                      <div style={{ width: "100%", maxWidth: "100%" }}>
                        <label className="label">Bank / Gateway Ref</label>
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      disabled={verifyingPayment}
                      onClick={() => void handleVerifyPayment()}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <LucideIcon name="file-text" size={16} />
                      {verifyingPayment
                        ? "Verifying…"
                        : "Step 2: Confirm Payment & Advance Gate"}
                    </button>
                  </div>
                )}

                {statusDetail && (
                  <div style={{ marginTop: "10px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong>Onboarding Trail</strong>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ minHeight: "28px", fontSize: "11px" }}
                        onClick={() => void refreshStatus(activeRegId)}
                      >
                        Refresh
                      </button>
                    </div>
                    <div
                      style={{ marginTop: "6px", fontSize: "12px" }}
                      className="stack"
                    >
                      <div>
                        Payment:{" "}
                        {statusDetail.payment ? (
                          <Pill tone="good">
                            PAID ₹{statusDetail.payment.amount}
                          </Pill>
                        ) : (
                          <Pill tone="warn">PENDING</Pill>
                        )}
                      </div>
                      <div>
                        KYC Docs:{" "}
                        {statusDetail.documentVerification ? (
                          <Pill tone="good">
                            {statusDetail.documentVerification.status}
                          </Pill>
                        ) : (
                          <Pill tone="warn">NOT VERIFIED</Pill>
                        )}
                      </div>
                      <div>
                        Approvals:{" "}
                        {statusDetail.approvals.length > 0 ? (
                          <Pill tone="good">APPROVED</Pill>
                        ) : (
                          <Pill tone="warn">IN REVIEW</Pill>
                        )}
                      </div>
                      <div>
                        Induction:{" "}
                        {statusDetail.groupMembership ? (
                          <Pill tone="good">ACTIVE MEMBER</Pill>
                        ) : (
                          <Pill tone="warn">NOT INDUCTED</Pill>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="muted" style={{ padding: "24px 0" }}>
                Register a candidate on the left to activate payment gate
                simulation and track real-time DB state transitions.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
export default ChapterManagementWorkflowPage;
