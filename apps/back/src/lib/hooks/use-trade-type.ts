"use client";

import { createContext, useContext } from "react";
import type { TradeType } from "@fieldservice/api-types/constants";

interface TradeTypeContextValue {
  tradeType: TradeType | undefined;
  isLandscaping: boolean;
  isHvac: boolean;
  isPlumbing: boolean;
  isElectrical: boolean;
  isGeneral: boolean;
}

export const TradeTypeContext = createContext<TradeTypeContextValue>({
  tradeType: undefined,
  isLandscaping: false,
  isHvac: false,
  isPlumbing: false,
  isElectrical: false,
  isGeneral: false,
});

export function useTradeType(): TradeTypeContextValue {
  return useContext(TradeTypeContext);
}

export function buildTradeTypeValue(tradeType?: TradeType): TradeTypeContextValue {
  return {
    tradeType,
    isLandscaping: tradeType === "landscaping",
    isHvac: tradeType === "hvac",
    isPlumbing: tradeType === "plumbing",
    isElectrical: tradeType === "electrical",
    isGeneral: tradeType === "general",
  };
}
