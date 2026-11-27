type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | Record<string, unknown>;

export function cn(...inputs: ClassValue[]) {
  const classes = new Set<string>();
  const add = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      classes.add(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([name, enabled]) => enabled && classes.add(name));
    }
  };
  inputs.forEach(add);
  return [...classes].join(" ");
}
