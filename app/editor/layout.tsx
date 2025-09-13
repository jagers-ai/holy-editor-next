"use client";

import type { ReactNode } from "react";
import { EditorProvider } from "@/contexts/EditorContext";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      {children}
    </EditorProvider>
  );
}

