import { ArrowDown, ArrowLeft, ArrowRight, Ban, Check, Copy } from "@/lib/icons";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { StatusBadge } from "@/components/StatusBadge";
import type { AttackStage } from "@/types/investigation";

interface AttackChainProps {
  stages: AttackStage[];
  /** Jump to the Evidence & Sources section, highlighting this technique's evidence. */
  onOpenEvidence: (stage: AttackStage) => void;
  onCopyTechniqueId?: (id: string) => void;
}

const STAGES_PER_CHAIN = 4;

type ChainNode =
  | { kind: "stage"; key: string; stage: AttackStage }
  | { kind: "terminal"; key: string };

function StageCard({
  stage,
  onOpenEvidence,
  onCopyTechniqueId,
}: {
  stage: AttackStage;
  onOpenEvidence: (s: AttackStage) => void;
  onCopyTechniqueId?: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
    void navigator.clipboard?.writeText(stage.techniqueId).then(() => {
      toast.success(`Copied ${stage.techniqueId}`, {
        description: "Technique ID copied to clipboard.",
      });
    }).catch(() => {
      setCopied(false);
      toast.error("Copy failed", { description: "Clipboard access was denied." });
    });
    onCopyTechniqueId?.(stage.techniqueId);
  };

  return (
    <div className="syn-chain-stage" data-status={stage.status}>
      <div className="flex items-center justify-between gap-2">
        <span className="syn-technique-id">{stage.techniqueId}</span>
        {onCopyTechniqueId && (
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Copy technique ID ${stage.techniqueId}`}
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3 text-[var(--syntra-success)]" /> : <Copy className="size-3" />}
          </button>
        )}
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {stage.tactic}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onOpenEvidence(stage)}
        className="mt-auto text-left text-[13px] font-medium leading-snug text-foreground transition-colors hover:text-[var(--syntra-orange)]"
        title={`Jump to evidence for ${stage.techniqueId}`}
        aria-label={`${stage.techniqueName} — view evidence`}
      >
        {stage.techniqueName}
      </button>
      <StatusBadge status={stage.status} />
    </div>
  );
}

/** Terminal node rendered when evidence does not support further stages. */
function TerminalNode() {
  return (
    <div className="syn-chain-stage" data-status="terminal">
      <Ban className="size-4 shrink-0" aria-hidden="true" />
      <span>No Verified Evidence</span>
    </div>
  );
}

/**
 * The attack chain is SYNTRA's core analytical visual: it shows how far the
 * evidence actually supports the attack. Stages are presented in groups of
 * four, with arrow controls to move between sequences. Unsupported stages
 * never continue the chain past a "No Verified Evidence" terminal.
 */
export function AttackChain({ stages, onOpenEvidence, onCopyTechniqueId }: AttackChainProps) {
  const display = useMemo(() => {
    const verified = stages.filter((s) => s.status !== "unverified" && s.status !== "insufficient");
    const unverified = stages.filter((s) => s.status === "unverified" || s.status === "insufficient");
    const nodes: ChainNode[] = verified.map((stage) => ({
      kind: "stage" as const,
      key: stage.techniqueId,
      stage,
    }));
    if (unverified.length > 0) nodes.push({ kind: "terminal", key: "__terminal__" });
    const chains: ChainNode[][] = [];
    for (let i = 0; i < nodes.length; i += STAGES_PER_CHAIN) {
      chains.push(nodes.slice(i, i + STAGES_PER_CHAIN));
    }
    return { chains, unverified };
  }, [stages]);

  const [navigation, setNavigation] = useState<{
    stages: AttackStage[];
    chainIndex: number;
    direction: "forward" | "backward";
  }>({ stages, chainIndex: 0, direction: "forward" });
  if (stages.length === 0) return null;
  const chainIndex =
    navigation.stages === stages
      ? Math.min(navigation.chainIndex, display.chains.length - 1)
      : 0;
  const direction = navigation.stages === stages ? navigation.direction : "forward";
  const currentChain = display.chains[chainIndex] ?? [];
  const firstSequence = chainIndex * STAGES_PER_CHAIN + 1;
  const lastSequence = firstSequence + currentChain.length - 1;
  const linkedStages = currentChain.filter((node) => node.kind === "stage").length;

  const navigateTo = (nextIndex: number, nextDirection: "forward" | "backward") => {
    setNavigation({ stages, chainIndex: nextIndex, direction: nextDirection });
  };

  const showPrevious = () => navigateTo(chainIndex - 1, "backward");
  const showNext = () => navigateTo(chainIndex + 1, "forward");

  return (
    <div className="syn-attack-chain">
      <section className="syn-attack-chain-panel" aria-label={`Attack chain ${chainIndex + 1}`}>
        <header className="syn-attack-chain-header">
          <div className="syn-attack-chain-meta">
            <span className="syn-attack-chain-label">
              CHAIN {String(chainIndex + 1).padStart(2, "0")}
            </span>
            <span className="syn-attack-chain-count">
              {linkedStages} linked {linkedStages === 1 ? "stage" : "stages"}
            </span>
          </div>
          <div className="syn-attack-chain-controls">
            <span className="syn-attack-chain-sequence">
              SEQUENCE {firstSequence}–{lastSequence}
            </span>
            {display.chains.length > 1 && (
              <>
                <button
                  type="button"
                  className="syn-attack-chain-nav"
                  onClick={showPrevious}
                  disabled={chainIndex === 0}
                  aria-label="Show previous attack chain"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="syn-attack-chain-nav"
                  onClick={showNext}
                  disabled={chainIndex === display.chains.length - 1}
                  aria-label="Show next attack chain"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </header>

        <div
          key={chainIndex}
          className="syn-attack-chain-track"
          data-direction={direction}
          role="list"
          aria-label={`Attack chain sequence ${firstSequence} to ${lastSequence}`}
        >
          {currentChain.map((node, index) => (
            <div className="syn-attack-chain-item" key={node.key}>
              <div className="syn-attack-chain-node" role="listitem">
                {node.kind === "stage" ? (
                  <StageCard
                    stage={node.stage}
                    onOpenEvidence={onOpenEvidence}
                    onCopyTechniqueId={onCopyTechniqueId}
                  />
                ) : (
                  <TerminalNode />
                )}
              </div>
              {index < currentChain.length - 1 && (
                <div className="syn-chain-arrow" aria-hidden="true">
                  <ArrowRight className="size-4" />
                  <ArrowDown className="size-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {display.unverified.length > 0 && (
        <div className="syn-attack-chain-unverified" aria-label="Reported but unverified stages">
          <span className="text-xs font-medium text-muted-foreground">Reported but unverified</span>
          {display.unverified.map((stage) => (
            <div key={stage.techniqueId} className="syn-attack-chain-unverified-item">
              <span className="syn-technique-id">{stage.techniqueId}</span>
              <span className="text-xs text-muted-foreground">{stage.techniqueName}</span>
              <StatusBadge status={stage.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
