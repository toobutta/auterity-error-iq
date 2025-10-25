// Kiro Module Registration
import { onErrorEvent } from "./hooks/error-intelligence.hook";

export interface KiroModule {
  name: string;
  hook: typeof onErrorEvent;
  enabled: boolean;
}

export const kiroModules: KiroModule[] = [
  {
    name: "error-intelligence",
    hook: onErrorEvent,
    enabled: true,
  },
];

export const getEnabledKiroModules = (): KiroModule[] => {
  return kiroModules.filter((module) => module.enabled);
};


