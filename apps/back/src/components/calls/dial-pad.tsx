"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

interface DialPadProps {
  value: string;
  onChange: (value: string) => void;
}

export function DialPad({ value, onChange }: DialPadProps) {
  const handleKey = (key: string) => {
    onChange(value + key);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter phone number"
          className="text-center text-lg font-mono pr-10"
        />
        {value && (
          <button
            onClick={handleBackspace}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <Delete className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {KEYS.flat().map((key) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className="h-10 text-lg font-medium"
            onClick={() => handleKey(key)}
          >
            {key}
          </Button>
        ))}
      </div>
    </div>
  );
}
