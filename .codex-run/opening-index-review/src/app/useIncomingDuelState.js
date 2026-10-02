import { useState } from "react";

export function initialIncomingDuelState() {
  return null;
}

export function useIncomingDuelState() {
  const [incomingDuel, setIncomingDuel] = useState(initialIncomingDuelState);

  return { incomingDuel, setIncomingDuel };
}
