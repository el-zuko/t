import { HardwareProductDefinition, ASTRA_PIPE_PRODUCT, synthesizeHardwareFromPrompt, HARDWARE_CATALOG } from "./hardware-archetypes";

let currentActiveProduct: HardwareProductDefinition = ASTRA_PIPE_PRODUCT;
const listeners = new Set<(prod: HardwareProductDefinition) => void>();

export function getActiveProduct(): HardwareProductDefinition {
  return currentActiveProduct;
}

export function setActiveProduct(prod: HardwareProductDefinition): void {
  currentActiveProduct = prod;
  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("no_active_hardware_id", prod.id);
      sessionStorage.setItem("no_active_hardware_name", prod.name);
    }
  } catch {
    // ignore storage errors
  }
  listeners.forEach((listener) => {
    try {
      listener(prod);
    } catch (e) {
      console.error("Error in active product listener", e);
    }
  });
}

export function synthesizeAndSetActive(prompt: string): HardwareProductDefinition {
  const synthesized = synthesizeHardwareFromPrompt(prompt);
  setActiveProduct(synthesized);
  return synthesized;
}

export function subscribeActiveProduct(cb: (prod: HardwareProductDefinition) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getCatalogProducts(): HardwareProductDefinition[] {
  return HARDWARE_CATALOG;
}
