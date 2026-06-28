"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { classNames } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col divide-y divide-border border border-border rounded-lg overflow-hidden">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-surface hover:bg-surface-secondary transition-colors duration-150 cursor-pointer"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-text-primary">
                {item.question}
              </span>
              <ChevronDown
                size={16}
                className={classNames(
                  "text-text-muted shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={classNames(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-48" : "max-h-0"
              )}
            >
              <p className="px-5 pb-4 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}