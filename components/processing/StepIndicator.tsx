// StepIndicator — three-step pipeline progress row.
// Active step uses accent (#E8FF47 bg, canvas text).
// Done step uses best-green tint. Pending is surface-colored.
// Connector line turns green once a step is done.

type StepState = "pending" | "active" | "done";

export interface Step {
  label: string;
  state: StepState;
}

interface Props {
  steps: Step[];
}

export default function StepIndicator({ steps }: Props) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          {/* Circle + label */}
          <div className="flex flex-col items-center gap-2">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              text-[13px] font-bold border
              transition-all duration-300 ease-out
              ${step.state === "active"
                ? "bg-accent text-canvas border-accent"
                : step.state === "done"
                ? "bg-best/15 text-best border-best/30"
                : "bg-surface text-lo border-edge"}
            `}>
              {step.state === "done" ? "✓" : i + 1}
            </div>
            <span className={`
              text-[11px] font-semibold uppercase tracking-[0.07em] whitespace-nowrap
              transition-colors duration-300
              ${step.state === "active" ? "text-accent"
                : step.state === "done" ? "text-best"
                : "text-lo"}
            `}>
              {step.label}
            </span>
          </div>

          {/* Connector */}
          {i < steps.length - 1 && (
            <div className={`
              w-20 h-px mx-3 mb-5 transition-colors duration-300
              ${step.state === "done" ? "bg-best/35" : "bg-edge"}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}
