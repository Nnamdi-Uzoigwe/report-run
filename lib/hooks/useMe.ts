"use client";

// Re-export from the queries layer so existing imports don't break.
// The implementation now lives in lib/queries/auth.ts.
export { useMe } from "@/lib/queries/auth";