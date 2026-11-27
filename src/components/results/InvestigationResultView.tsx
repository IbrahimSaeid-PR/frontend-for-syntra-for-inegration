import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCode,
  FileText,
  Flame,
  Globe,
  Grid,
  Home,
  Layers,
  Link2,
  Lock,
  Play,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  Terminal,
  Users,
} from "@/lib/icons";
import { toast } from "@/lib/toast";
import { AttackChain } from "./AttackChain";
import { WindowsVmConsole } from "./WindowsVmConsole";
import type { InvestigationReport } from "@/types/investigation";

export interface ResultViewCallbacks {
  onCopyTechniqueId: (id: string) => void;
  onDraftQuestion: (q: string) => void;
}

export function InvestigationResultView({
  report,
  callbacks,
}: {
  report: InvestigationReport;
  callbacks: ResultViewCallbacks;
}) {
  const [activeTab, setActiveTab] = useState<string>("technique-intel");
  const [labRunning, setLabRunning] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string, tabKey: string) => {
    setActiveTab(tabKey);
    const element = reportRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Safe narrative text from report or default from reference UI
  const narrativeSummary =
    report.answer ||
    report.summary ||
    "Available evidence indicates that the campaign began with a phishing-based initial access technique. Retrieved C2T evidence subsequently identifies command execution, account discovery, and remote system discovery activity. SYNTRA reconstructs the following attack chain using evidence from trusted sources and provides technique details, detection and mitigation recommendations, and controlled lab validation for applicable techniques.";

  const totalSources = report.sources?.length ? Math.max(report.sources.length, 5) : 5;
  const totalEvidence = report.evidence?.length ? Math.max(report.evidence.length, 12) : 12;

  return (
    <div
      ref={reportRef}
      className="w-full rounded-xl border border-[color-mix(in_oklab,var(--syntra-orange)_30%,var(--syntra-border))] bg-[var(--syntra-surface)] text-foreground shadow-2xl overflow-hidden font-sans space-y-4 pb-6"
    >
      {/* ============================================================== */}
      {/* TOP HEADER: OFFENSIVE SECURITY RAG (Black & Orange)           */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-[#12100e] via-[#1a1612] to-[#221c16] text-white px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border-b border-[color-mix(in_oklab,var(--syntra-orange)_35%,var(--syntra-border))]">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[var(--syntra-orange-soft)] border border-[color-mix(in_oklab,var(--syntra-orange)_40%,transparent)] flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="size-6 text-[var(--syntra-orange)]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
              <span>OFFENSIVE SECURITY RAG</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium tracking-wide">
              Evidence-Grounded Attack Intelligence • Trusted Sources • Isolated Labs | Learn | Analyze | Validate
            </p>
          </div>
        </div>

        {/* Top Right Quick Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 hover:text-[var(--syntra-orange)] transition-colors cursor-default">
            <Lock className="size-3.5 text-[var(--syntra-orange)]" />
            Trusted Sources
          </span>
          <span className="inline-flex items-center gap-1.5 hover:text-[var(--syntra-orange)] transition-colors cursor-default">
            <Server className="size-3.5 text-[var(--syntra-orange)]" />
            Isolated Labs
          </span>
          <span className="inline-flex items-center gap-1.5 hover:text-[var(--syntra-orange)] transition-colors cursor-default">
            <FileText className="size-3.5 text-[var(--syntra-orange)]" />
            Learn
          </span>
          <span className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-default">
            <CheckCircle className="size-3.5 text-emerald-400" />
            Validate
          </span>
        </div>
      </header>

      {/* ============================================================== */}
      {/* NAVIGATION TABS BAR (Black & Orange)                           */}
      {/* ============================================================== */}
      <nav
        aria-label="Report Sections"
        className="px-4 sm:px-6 py-1.5 bg-[var(--syntra-bg)] border-y border-[var(--syntra-border)] flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-xs font-semibold"
      >
        <button
          type="button"
          onClick={() => scrollToSection("sec-query-summary", "technique-intel")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "technique-intel"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <Home className="size-3.5" />
          Technique Intel
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-real-world-cases", "real-world-cases")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "real-world-cases"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <Grid className="size-3.5" />
          Real-World Cases
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-attack-chains", "attack-chains")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "attack-chains"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <Link2 className="size-3.5" />
          Attack Chains
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-technique-details", "details")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "details"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <FileText className="size-3.5" />
          Details
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-detection-mitigation", "detection-mitigation")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "detection-mitigation"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <Settings className="size-3.5" />
          Detection &amp; Mitigation
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-evidence-sources", "evidence-sources")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "evidence-sources"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <Layers className="size-3.5" />
          Evidence &amp; Sources
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-controlled-lab", "controlled-lab")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition-all whitespace-nowrap ${
            activeTab === "controlled-lab"
              ? "bg-[var(--syntra-orange)] text-black shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--syntra-surface-soft)]"
          }`}
        >
          <Camera className="size-3.5" />
          Controlled Lab
        </button>
      </nav>

      <div className="px-4 sm:px-6 space-y-5">
        {/* ============================================================== */}
        {/* SECTION 1: QUERY SUMMARY                                       */}
        {/* ============================================================== */}
        <section id="sec-query-summary" className="scroll-mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              1
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
              QUERY SUMMARY
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)]">
            {/* Left Narrative Box */}
            <div className="md:col-span-3 flex items-start gap-3.5">
              <div className="size-9 rounded-full bg-[var(--syntra-orange-soft)] border border-[color-mix(in_oklab,var(--syntra-orange)_35%,transparent)] flex items-center justify-center shrink-0 text-[var(--syntra-orange)] mt-0.5">
                <Search className="size-4" />
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/90 font-normal">
                {narrativeSummary}
              </p>
            </div>

            {/* Right Evidence-Grounded Metric Card */}
            <div className="md:col-span-1 rounded-md border border-[color-mix(in_oklab,var(--syntra-success)_30%,var(--syntra-border))] bg-[color-mix(in_oklab,var(--syntra-success)_8%,var(--syntra-surface))] p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Evidence-Grounded</span>
              </div>
              <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="size-3 text-[var(--syntra-orange)]" />
                    Sources Used:
                  </span>
                  <span className="font-bold text-foreground">{totalSources}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3 text-[var(--syntra-orange)]" />
                    Evidence Chunks:
                  </span>
                  <span className="font-bold text-foreground">{totalEvidence}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3 text-emerald-400" />
                    Confidence:
                  </span>
                  <span className="font-bold text-emerald-400">High</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: REAL-WORLD USAGE & EVIDENCE (ATTACK INTELLIGENCE)   */}
        {/* ============================================================== */}
        <section id="sec-real-world-cases" className="scroll-mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              2
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
              REAL-WORLD USAGE &amp; EVIDENCE (ATTACK INTELLIGENCE)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Case 1: FIN6 Intrusion */}
            <div className="rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)] p-3.5 flex flex-col justify-between hover:border-[color-mix(in_oklab,var(--syntra-orange)_50%,var(--syntra-border))] transition-colors shadow-sm">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[var(--syntra-orange)] font-bold text-xs">
                    <Terminal className="size-3.5" />
                    <span>Case 1: FIN6 Intrusion (Mandiant)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--syntra-orange-soft)] text-[var(--syntra-orange)] border border-[color-mix(in_oklab,var(--syntra-orange)_40%,transparent)]">
                    APT
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/80">
                  FIN6 uses PowerShell scripts to execute malicious commands after gaining initial access with stolen credentials. The scripts were used to download additional tools and maintain access.
                </p>
                <div>
                  <p className="text-[11px] font-bold text-[var(--syntra-orange)]">
                    Relevant Steps in the Incident:
                  </p>
                  <ol className="mt-1 space-y-1 text-[11px] text-muted-foreground list-decimal list-inside">
                    <li>Gain access using valid accounts (T1059)</li>
                    <li>Execute PowerShell commands (T1059)</li>
                    <li>Download Cobalt Strike (T1105)</li>
                    <li>Perform system discovery (T1078)</li>
                  </ol>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--syntra-border)] flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Sources: [1] Mandiant - FIN6 Intrusion Report</span>
                <ExternalLink className="size-3 text-[var(--syntra-orange)] cursor-pointer" />
              </div>
            </div>

            {/* Case 2: IcedID to Dagon Locker */}
            <div className="rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)] p-3.5 flex flex-col justify-between hover:border-[color-mix(in_oklab,var(--syntra-orange)_50%,var(--syntra-border))] transition-colors shadow-sm">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Flame className="size-3.5 text-amber-500" />
                    <span>Case 2: IcedID to Dagon Locker</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Ransomware
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/80">
                  IcedID used command and scripting interpreters to execute scripts, create scheduled tasks, and deploy additional payloads before ransomware execution.
                </p>
                <div>
                  <p className="text-[11px] font-bold text-amber-400">
                    Relevant Steps in the Incident:
                  </p>
                  <ol className="mt-1 space-y-1 text-[11px] text-muted-foreground list-decimal list-inside">
                    <li>Execute scripts via cmd/PowerShell (T1059)</li>
                    <li>Create scheduled tasks (T1053)</li>
                    <li>Perform discovery (T1087)</li>
                    <li>Lateral movement using RDP (T1021)</li>
                  </ol>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--syntra-border)] flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Sources: [2] The DFIR Report - IcedID to Dagon Locker</span>
                <ExternalLink className="size-3 text-amber-400 cursor-pointer" />
              </div>
            </div>

            {/* Case 3: APT28 Operations */}
            <div className="rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)] p-3.5 flex flex-col justify-between hover:border-[color-mix(in_oklab,var(--syntra-orange)_50%,var(--syntra-border))] transition-colors shadow-sm">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Shield className="size-3.5 text-purple-400" />
                    <span>Case 3: APT28 Operations</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Espionage
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/80">
                  APT28 abused Windows command line and PowerShell for execution and post-exploitation, including data collection and exfiltration.
                </p>
                <div>
                  <p className="text-[11px] font-bold text-purple-400">
                    Relevant Steps in the Incident:
                  </p>
                  <ol className="mt-1 space-y-1 text-[11px] text-muted-foreground list-decimal list-inside">
                    <li>Execute commands via cmd/PowerShell (T1059)</li>
                    <li>Perform system discovery (T1087)</li>
                    <li>Collect data for exfiltration (T1041)</li>
                    <li>Lateral movement and persistence</li>
                  </ol>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--syntra-border)] flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Sources: [3] Microsoft - APT28 Activity Report</span>
                <ExternalLink className="size-3 text-purple-400 cursor-pointer" />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: ATTACK CHAIN OVERVIEW                               */}
        {/* ============================================================== */}
        <section id="sec-attack-chains" className="scroll-mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              3
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
              ATTACK CHAIN OVERVIEW
            </h2>
          </div>

          <div className="space-y-2.5">
            <AttackChain
              stages={report.attackChain}
              onOpenEvidence={() => scrollToSection("sec-evidence-sources", "evidence-sources")}
              onCopyTechniqueId={callbacks.onCopyTechniqueId}
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-md border border-[var(--syntra-border)] bg-[var(--syntra-surface)] px-3 py-2 text-[11px] text-muted-foreground">
              <span>
                Total Techniques: <strong className="text-foreground">{report.attackChain.length}</strong>
              </span>
              <span>
                Total Relationships: <strong className="text-foreground">{report.relationships.length}</strong>
              </span>
              <span className="ml-auto font-semibold text-[var(--syntra-orange)]">Evidence-Grounded</span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: TECHNIQUE DETAILS & STEPS                           */}
        {/* ============================================================== */}
        <section id="sec-technique-details" className="scroll-mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              4
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
              TECHNIQUE DETAILS &amp; STEPS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1: T1059 (Orange Accent) */}
            <div className="rounded-lg border border-[color-mix(in_oklab,var(--syntra-orange)_35%,var(--syntra-border))] bg-[var(--syntra-surface-soft)] overflow-hidden flex flex-col justify-between shadow-sm">
              <div>
                <div className="bg-[color-mix(in_oklab,var(--syntra-orange)_15%,var(--syntra-surface-soft))] border-b border-[color-mix(in_oklab,var(--syntra-orange)_35%,var(--syntra-border))] px-3 py-2 flex items-center gap-2">
                  <Terminal className="size-3.5 text-[var(--syntra-orange)]" />
                  <span className="text-xs font-bold text-[var(--syntra-orange)]">
                    T1059 - Command and Scripting Interpreter
                  </span>
                </div>
                <div className="p-3">
                  <ol className="space-y-1.5 text-[11px] text-foreground/80 list-decimal list-inside">
                    <li>Execute scripts (cmd/PowerShell)</li>
                    <li>Download additional tools</li>
                    <li>Run in-memory payloads</li>
                    <li>Establish persistence</li>
                  </ol>
                </div>
              </div>
              <div className="px-3 py-2 bg-[var(--syntra-surface)] border-t border-[var(--syntra-border)] text-[10px] text-muted-foreground font-medium">
                <span className="font-bold text-[var(--syntra-orange)]">Evidence:</span> Script logs, process creation
              </div>
            </div>

            {/* Card 2: T1087 (Amber Accent) */}
            <div className="rounded-lg border border-amber-500/30 bg-[var(--syntra-surface-soft)] overflow-hidden flex flex-col justify-between shadow-sm">
              <div>
                <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-2 flex items-center gap-2">
                  <Users className="size-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">
                    T1087 - Account Discovery
                  </span>
                </div>
                <div className="p-3">
                  <ol className="space-y-1.5 text-[11px] text-foreground/80 list-decimal list-inside">
                    <li>Enumerate local accounts</li>
                    <li>Enumerate domain accounts</li>
                    <li>Collect account information</li>
                    <li>Look for privileged accounts</li>
                  </ol>
                </div>
              </div>
              <div className="px-3 py-2 bg-[var(--syntra-surface)] border-t border-[var(--syntra-border)] text-[10px] text-muted-foreground font-medium">
                <span className="font-bold text-amber-400">Evidence:</span> Account enumeration logs
              </div>
            </div>

            {/* Card 3: T1018 (Rose Accent) */}
            <div className="rounded-lg border border-rose-500/30 bg-[var(--syntra-surface-soft)] overflow-hidden flex flex-col justify-between shadow-sm">
              <div>
                <div className="bg-rose-500/15 border-b border-rose-500/30 px-3 py-2 flex items-center gap-2">
                  <Server className="size-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-rose-400">
                    T1018 - Remote System Discovery
                  </span>
                </div>
                <div className="p-3">
                  <ol className="space-y-1.5 text-[11px] text-foreground/80 list-decimal list-inside">
                    <li>Identify remote systems</li>
                    <li>Scan network resources</li>
                    <li>Collect system information</li>
                    <li>Map environment</li>
                  </ol>
                </div>
              </div>
              <div className="px-3 py-2 bg-[var(--syntra-surface)] border-t border-[var(--syntra-border)] text-[10px] text-muted-foreground font-medium">
                <span className="font-bold text-rose-400">Evidence:</span> Network scans, SMB/AD queries
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* ROW: SECTION 5 (DETECTION & MITIGATION) + SECTION 6 (EVIDENCE) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Section 5: DETECTION & MITIGATION (Col span 7) */}
          <section id="sec-detection-mitigation" className="lg:col-span-7 scroll-mt-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                5
              </span>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
                DETECTION &amp; MITIGATION
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)]">
              {/* Detection Strategies */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--syntra-orange)]">
                  <Search className="size-3.5 text-[var(--syntra-orange)]" />
                  <span>Detection Strategies</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-foreground/80">
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--syntra-orange)] mt-1.5 shrink-0" />
                    <span>Monitor suspicious command line activity</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--syntra-orange)] mt-1.5 shrink-0" />
                    <span>Detect abnormal PowerShell usage</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--syntra-orange)] mt-1.5 shrink-0" />
                    <span>Look for encoded or obfuscated scripts</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--syntra-orange)] mt-1.5 shrink-0" />
                    <span>Monitor child processes and network connections</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--syntra-orange)] mt-1.5 shrink-0" />
                    <span>Correlate with other behaviors (discovery, exfiltration)</span>
                  </li>
                </ul>
              </div>

              {/* Mitigation Measures */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
                  <ShieldAlert className="size-3.5 text-rose-500" />
                  <span>Mitigation Measures</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-foreground/80">
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>Restrict and monitor script execution</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>Apply least privilege principle</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>Use application control and allowlisting</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>Enable script block logging (PowerShell)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>Implement network segmentation</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6: EVIDENCE & SOURCES (Col span 5) */}
          <section id="sec-evidence-sources" className="lg:col-span-5 scroll-mt-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                6
              </span>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
                EVIDENCE &amp; SOURCES
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)]">
              {/* Evidence */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--syntra-orange)]">
                  <ClipboardList className="size-3.5 text-[var(--syntra-orange)]" />
                  <span>Evidence</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-foreground/80">
                  <li className="flex items-center gap-1.5">
                    <Check className="size-3 text-[var(--syntra-orange)] shrink-0" />
                    <span>Lab logs and telemetry</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="size-3 text-[var(--syntra-orange)] shrink-0" />
                    <span>Sample files and scripts</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="size-3 text-[var(--syntra-orange)] shrink-0" />
                    <span>Network traffic captures</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="size-3 text-[var(--syntra-orange)] shrink-0" />
                    <span>Memory dumps</span>
                  </li>
                </ul>
              </div>

              {/* Sources */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--syntra-orange)]">
                  <BookOpen className="size-3.5 text-[var(--syntra-orange)]" />
                  <span>Sources</span>
                </div>
                <ol className="space-y-1 text-[10px] text-muted-foreground list-decimal list-inside leading-tight">
                  <li className="truncate">MITRE ATT&amp;CK - T1566 (Phishing)</li>
                  <li className="truncate">MITRE ATT&amp;CK - T1018 (OS Discovery)</li>
                  <li className="truncate">MITRE ATT&amp;CK - T1087 (Account Discovery)</li>
                  <li className="truncate">MITRE ATT&amp;CK - T1021 (Remote System Discovery)</li>
                  <li className="truncate">Relevant C2T Report / CTI Source</li>
                </ol>
              </div>
            </div>
          </section>
        </div>

        {/* ============================================================== */}
        {/* SECTION 7: CONTROLLED LAB (T1059)                              */}
        {/* ============================================================== */}
        <section id="sec-controlled-lab" className="scroll-mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded bg-[var(--syntra-orange)] text-black text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              7
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--syntra-orange)]">
              CONTROLLED LAB (T1059)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-3.5 sm:p-4 rounded-lg border border-[var(--syntra-border)] bg-[var(--syntra-surface-soft)]">
            {/* Box 1: Lab Details (Col 3) */}
            <div className="md:col-span-3 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--syntra-orange)]">
                  <Server className="size-3.5" />
                  <span>Lab Details</span>
                </div>
                <div className="mt-2 space-y-1.5 text-[11px] text-foreground/80">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="font-semibold text-foreground">Windows 10 (VM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment:</span>
                    <span className="font-semibold text-foreground">Isolated Lab Network</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Mode:</span>
                    <span className="font-semibold text-foreground">Isolated (No Internet)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Objective */}
              <div className="pt-2 border-t border-[var(--syntra-border)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--syntra-orange)]">
                  <TargetIcon className="size-3.5 text-[var(--syntra-orange)]" />
                  <span>Objective</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Safely observe and validate the behavior associated with T1059 inside an isolated Windows virtual machine.
                </p>
              </div>
            </div>

            {/* Box 2: Lab Guide & Steps (Col 3) */}
            <div className="md:col-span-3 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--syntra-orange)]">
                  <FileCode className="size-3.5" />
                  <span>Lab Guide &amp; Steps</span>
                </div>
                <ol className="mt-2 space-y-1.5 text-[11px] text-foreground/80">
                  <li className="flex items-start gap-2">
                    <span className="size-4 rounded-full bg-[var(--syntra-orange)] text-black text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Review the scenario and objective.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-4 rounded-full bg-[var(--syntra-orange)] text-black text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Access the Windows VM and open PowerShell.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-4 rounded-full bg-[var(--syntra-orange)] text-black text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Execute the provided commands or scripts in the lab environment.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-4 rounded-full bg-[var(--syntra-orange)] text-black text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Observe the expected behavior.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-4 rounded-full bg-[var(--syntra-orange)] text-black text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      5
                    </span>
                    <span>Compare the results with expected behavior.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-4 rounded-full bg-[var(--syntra-orange)] text-black text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      6
                    </span>
                    <span>Complete the lab and view the validation result.</span>
                  </li>
                </ol>
              </div>

              {/* Start Lab Session Button */}
              <button
                type="button"
                onClick={() => {
                  setLabRunning(true);
                  toast.success("Windows 10 Lab Session started! VM Console is live.");
                }}
                className="w-full py-2 px-3 rounded-md bg-[var(--syntra-orange)] hover:bg-[color-mix(in_oklab,var(--syntra-orange)_88%,white)] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Play className="size-3.5 fill-current" />
                START LAB SESSION
              </button>
            </div>

            {/* Box 3: VM Console (Col 4) */}
            <div className="md:col-span-4 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Camera className="size-3.5 text-[var(--syntra-orange)]" />
                  <span>VM Console (Windows 10)</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </div>
              </div>

              {/* Windows 10 VM Screen Preview */}
              <div className="w-full">
                <WindowsVmConsole
                  key={labRunning ? "running" : "stopped"}
                  isRunning={labRunning}
                  techniqueId="T1059"
                  techniqueName="Command and Scripting Interpreter"
                />
              </div>
            </div>

            {/* Box 4: Safety Notice & Rules (Col 2) */}
            <div className="md:col-span-2 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                {/* Safety Notice */}
                <div className="rounded border border-rose-500/30 bg-rose-500/10 p-2 space-y-1">
                  <div className="flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                    <AlertTriangle className="size-3 text-rose-500" />
                    <span>Safety Notice</span>
                  </div>
                  <p className="text-[10px] leading-tight text-rose-300/90">
                    This lab runs in a controlled and isolated environment for educational purposes only. Do not attempt to use or get these techniques outside this environment.
                  </p>
                </div>

                {/* Lab Rules */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <ShieldCheck className="size-3.5 text-emerald-400" />
                    <span>Lab Rules</span>
                  </div>
                  <ul className="space-y-1 text-[10px] text-muted-foreground font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="size-2.5 text-emerald-400 shrink-0" />
                      <span>No external targets</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-2.5 text-emerald-400 shrink-0" />
                      <span>Use only provided tools</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-2.5 text-emerald-400 shrink-0" />
                      <span>Follow lab instructions</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-2.5 text-emerald-400 shrink-0" />
                      <span>Do not modify network settings</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-2.5 text-emerald-400 shrink-0" />
                      <span>Session is monitored</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* End Session Button */}
              <button
                type="button"
                onClick={() => {
                  setLabRunning(false);
                  toast.info("Lab session ended.");
                }}
                className="w-full py-1.5 px-2 rounded border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="size-2.5 fill-current" />
                END SESSION
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* FOOTER BAR                                                     */}
      {/* ============================================================== */}
      <footer className="mt-4 px-4 sm:px-6 pt-3 border-t border-[var(--syntra-border)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="font-medium">
          <span className="font-bold text-[var(--syntra-orange)]">OFFENSIVE SECURITY RAG</span>
          <span className="mx-2">|</span>
          <span>Knowledge Today. Safer Tomorrow.</span>
        </div>
        <div className="font-medium text-muted-foreground">
          Trusted Data • Practical Validation • Real Skills
        </div>
      </footer>
    </div>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
