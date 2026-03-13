"use client";

import { useMemo } from "react";
import type { TradeType } from "@fieldservice/api-types/constants";
import { TradeTypeContext, buildTradeTypeValue } from "@/lib/hooks/use-trade-type";

export function TradeTypeProvider({
  tradeType,
  children,
}: {
  tradeType?: TradeType;
  children: React.ReactNode;
}) {
  const value = useMemo(() => buildTradeTypeValue(tradeType), [tradeType]);

  return (
    <TradeTypeContext value={value}>
      {children}
    </TradeTypeContext>
  );
}
