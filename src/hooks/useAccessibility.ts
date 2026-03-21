// useAccessibility hook
// Loads and persists the user's accessibility profile from Cosmos DB via the
// /api/profile route. Provides reactive settings: sign language variant,
// caption size/position/color, high-contrast mode, and avatar preferences.

"use client";

import { useState, useEffect } from "react";

export interface AccessibilityProfile {
  signLanguage: "ASL" | "BSL" | "LSE";
  captionSize: "sm" | "md" | "lg" | "xl";
  highContrast: boolean;
  showAvatar: boolean;
  captionPosition: "top" | "bottom";
}

const defaults: AccessibilityProfile = {
  signLanguage: "ASL",
  captionSize: "md",
  highContrast: false,
  showAvatar: true,
  captionPosition: "bottom",
};

export function useAccessibility() {
  const [profile, setProfile] = useState<AccessibilityProfile>(defaults);

  useEffect(() => {
    // TODO: Fetch profile from /api/profile, merge with defaults
  }, []);

  async function updateProfile(updates: Partial<AccessibilityProfile>) {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    // TODO: PUT to /api/profile to persist changes
  }

  return { profile, updateProfile };
}
