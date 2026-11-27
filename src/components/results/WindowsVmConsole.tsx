import React, { useState } from "react";
import {
  FileText,
  Folder,
  Globe,
  Minus,
  Search,
  Square,
  Terminal,
  Trash2,
  Volume2,
  Wifi,
  X,
} from "@/lib/icons";

interface WindowsVmConsoleProps {
  isRunning: boolean;
  techniqueId?: string;
  techniqueName?: string;
  onStart?: () => void;
  onStop?: () => void;
}

export function WindowsVmConsole({
  isRunning,
  techniqueId = "T1059",
  techniqueName = "Command and Scripting Interpreter",
}: WindowsVmConsoleProps) {
  const [activeWindow, setActiveWindow] = useState<"powershell" | "none">(
    isRunning ? "powershell" : "none",
  );
  const [terminalLogs, setTerminalLogs] = useState<string[]>(() =>
    isRunning
      ? [
          "Windows PowerShell",
          "Copyright (C) Microsoft Corporation. All rights reserved.",
          "",
          `PS C:\\Users\\LabUser> # Target: ${techniqueId} - ${techniqueName}`,
          "PS C:\\Users\\LabUser> Set-ExecutionPolicy Bypass -Scope Process -Force",
          "[+] Telemetry listener active on 127.0.0.1:8080",
          "[+] Sysmon Event ID 1: Process Creation detected (powershell.exe PID: 4912)",
          "[+] Command line execution verified against MITRE baseline",
          "[✓] Technique behavior confirmed in isolated environment",
        ]
      : [],
  );
  const [inputCommand, setInputCommand] = useState("");

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;
    const cmd = inputCommand.trim();
    setInputCommand("");
    setTerminalLogs((prev) => [
      ...prev,
      `PS C:\\Users\\LabUser> ${cmd}`,
      cmd.toLowerCase().includes("powershell") || cmd.toLowerCase().includes("cmd")
        ? `[+] Telemetry captured: Event ID 4688 / Sysmon Event 1 for '${cmd}'`
        : `[+] Command completed with exit code 0`,
    ]);
  };

  return (
    <div className="relative aspect-[4/3] w-full min-h-[210px] overflow-hidden rounded-md border border-[color-mix(in_oklab,var(--syntra-orange)_35%,var(--syntra-border))] bg-black shadow-inner select-none font-sans">
      {/* Windows 10 Radiant Background Wallpaper */}
      <div
        className="absolute inset-0 bg-[#000d1e]"
        style={{
          background:
            "radial-gradient(ellipse at 78% 46%, #0078d7 0%, #004e9a 28%, #00224d 55%, #001226 80%, #000612 100%)",
        }}
      >
        {/* Angled Glowing Window Panes (Hero Wallpaper Effect) */}
        <div
          className="absolute right-[14%] top-[24%] w-[38%] h-[48%] opacity-35 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(0,180,255,0.3) 50%, transparent 80%)",
            clipPath:
              "polygon(18% 0%, 100% 12%, 100% 48%, 18% 42%, 18% 54%, 100% 60%, 100% 98%, 18% 88%)",
            filter: "blur(0.5px)",
          }}
        />
      </div>

      {/* Desktop Icons */}
      <div className="relative z-10 p-2.5 flex flex-col gap-3 w-20">
        {/* Recycle Bin */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="size-8 flex items-center justify-center rounded group-hover:bg-white/20 transition-colors">
            <Trash2 className="size-6 text-sky-200 drop-shadow" />
          </div>
          <span className="text-[9px] text-white text-center leading-tight drop-shadow font-medium">
            Recycle Bin
          </span>
        </div>

        {/* Microsoft Edge */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="size-8 flex items-center justify-center rounded group-hover:bg-white/20 transition-colors">
            <div className="size-6 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-400 to-blue-600 flex items-center justify-center shadow">
              <Globe className="size-3.5 text-white" />
            </div>
          </div>
          <span className="text-[9px] text-white text-center leading-tight drop-shadow font-medium">
            Microsoft Edge
          </span>
        </div>

        {/* Tools */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="size-8 flex items-center justify-center rounded group-hover:bg-white/20 transition-colors">
            <Folder className="size-6 text-amber-300 drop-shadow fill-amber-300/40" />
          </div>
          <span className="text-[9px] text-white text-center leading-tight drop-shadow font-medium">
            Tools
          </span>
        </div>

        {/* Documentation */}
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="size-8 flex items-center justify-center rounded group-hover:bg-white/20 transition-colors">
            <FileText className="size-6 text-slate-100 drop-shadow" />
          </div>
          <span className="text-[9px] text-white text-center leading-tight drop-shadow font-medium">
            Documentation
          </span>
        </div>
      </div>

      {/* Floating PowerShell Window (When Lab is Running) */}
      {activeWindow === "powershell" && (
        <div className="absolute inset-x-3 inset-y-7 z-20 flex flex-col rounded-md border border-[var(--syntra-orange)] bg-[#011b3d] shadow-2xl overflow-hidden syn-console-enter">
          {/* PowerShell Titlebar */}
          <div className="h-6 bg-[#00132b] px-2 flex items-center justify-between text-white text-[11px] select-none border-b border-[color-mix(in_oklab,var(--syntra-orange)_40%,transparent)]">
            <div className="flex items-center gap-1.5 font-medium">
              <Terminal className="size-3 text-[var(--syntra-orange)]" />
              <span>Administrator: Windows PowerShell</span>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveWindow("none")}
                className="size-6 flex items-center justify-center hover:bg-white/10"
              >
                <Minus className="size-2.5" />
              </button>
              <button
                type="button"
                className="size-6 flex items-center justify-center hover:bg-white/10"
              >
                <Square className="size-2" />
              </button>
              <button
                type="button"
                onClick={() => setActiveWindow("none")}
                className="size-6 flex items-center justify-center hover:bg-red-600"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>

          {/* PowerShell Terminal Screen */}
          <div className="flex-1 p-2 font-mono text-[10px] text-slate-100 overflow-y-auto leading-tight space-y-1 bg-[#01142b]/95">
            {terminalLogs.map((line, idx) => (
              <p
                key={idx}
                className={
                  line.startsWith("[✓]")
                    ? "text-emerald-400 font-semibold"
                    : line.startsWith("[+]")
                      ? "text-[var(--syntra-orange)]"
                      : line.startsWith("PS")
                        ? "text-white font-medium"
                        : "text-slate-300"
                }
              >
                {line}
              </p>
            ))}
            <form onSubmit={handleRunCommand} className="flex items-center gap-1 pt-1">
              <span className="text-[var(--syntra-orange)] font-medium">PS C:\Users\LabUser&gt;</span>
              <input
                type="text"
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                placeholder="type command & press enter..."
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-[10px] p-0 focus:ring-0 placeholder:text-slate-500"
              />
            </form>
          </div>
        </div>
      )}

      {/* Windows 10 Taskbar */}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-[#0a0d14]/95 backdrop-blur-md z-30 flex items-center justify-between px-1.5 border-t border-[var(--syntra-border)] text-white text-[10px]">
        {/* Left: Windows Start Logo + Search + Cortana */}
        <div className="flex items-center gap-1.5 h-full">
          {/* Windows Start Button */}
          <button
            type="button"
            className="h-full px-1.5 flex items-center justify-center hover:bg-white/10 transition-colors"
            title="Start"
          >
            <div className="grid grid-cols-2 gap-[1.5px] size-3">
              <div className="bg-[var(--syntra-orange)] rounded-[0.5px]" />
              <div className="bg-[var(--syntra-orange)] rounded-[0.5px]" />
              <div className="bg-[var(--syntra-orange)] rounded-[0.5px]" />
              <div className="bg-[var(--syntra-orange)] rounded-[0.5px]" />
            </div>
          </button>

          {/* Search Box */}
          <div className="h-[18px] bg-white/10 rounded-sm px-1.5 flex items-center gap-1 text-[9px] text-slate-300 w-28 border border-white/5">
            <Search className="size-2.5 text-slate-400" />
            <span className="truncate">Type here to search</span>
          </div>

          {/* Task View */}
          <button
            type="button"
            className="size-5 rounded flex items-center justify-center hover:bg-white/10"
            title="Task View"
          >
            <div className="size-2.5 rounded-full border border-slate-300" />
          </button>

          {/* PowerShell Taskbar Icon (if active) */}
          {isRunning && (
            <button
              type="button"
              onClick={() => setActiveWindow((w) => (w === "powershell" ? "none" : "powershell"))}
              className={`h-full px-1.5 flex items-center justify-center border-b-2 ${
                activeWindow === "powershell"
                  ? "border-[var(--syntra-orange)] bg-white/15"
                  : "border-slate-400 hover:bg-white/10"
              }`}
            >
              <Terminal className="size-3 text-[var(--syntra-orange)]" />
            </button>
          )}
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-2 text-[9px] text-slate-300 pr-1">
          <Wifi className="size-2.5" />
          <Volume2 className="size-2.5" />
          <div className="flex flex-col items-end leading-none text-[8px] font-sans">
            <span>10:24 AM</span>
            <span className="text-slate-400">9/14/2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
