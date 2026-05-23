// StepIndicator — shows the three pipeline steps with active/done/pending states.
// Steps: Preprocessing → AI Analysis → Done.
// Renders a numbered circle (active=accent, done=green, pending=surface) with
// a label below and a connecting line between steps.

type StepState = "pending" | "active" | "done";

interface Step {
  label: string;
  state: StepState;
}

interface Props {
  steps: Step[];
}

const STATE_STYLES: Record<StepState, string> = {
  pending: "bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]",
  active:  "bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent)]",
  done:    "bg-emerald-600 text-white",
};

export default function StepIndicator({ steps }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${STATE_STYLES[step.state]}`}>
              {step.state === "done" ? "✓" : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${step.state === "active" ? "text-white" : "text-[var(--text-secondary)]"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-px mx-2 mb-4 ${step.state === "done" ? "bg-emerald-600" : "bg-[var(--border)]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
