"use client";

import { useEffect, useState } from "react";

const APP_URL =
  "https://signbridge-app.lemondesert-0957a79b.eastus2.azurecontainerapps.io";

export default function TeamsConfig() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://res.cdn.office.net/teams-js/2.21.0/js/MicrosoftTeams.min.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams = (window as any).microsoftTeams;
      if (!teams) return;
      teams.app.initialize().then(() => {
        // Register save handler — called when user clicks "Save" in Teams
        teams.pages.config.registerOnSaveHandler((saveEvent: { notifySuccess: () => void }) => {
          teams.pages.config.setConfig({
            contentUrl: `${APP_URL}/room/demo?inTeams=true`,
            websiteUrl: `${APP_URL}/room/demo`,
            suggestedDisplayName: "SignBridge AI",
            entityId: "signbridge-room",
          });
          saveEvent.notifySuccess();
        });
        // Unlock the Save button immediately — no extra config needed
        teams.pages.config.setValidityState(true);
        setReady(true);
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Segoe UI, sans-serif",
        color: "#fff",
        background: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: "3rem" }}>🤟</div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
        SignBridge AI
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: 480,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Add real-time sign language translation to your Teams meetings. Click{" "}
        <strong style={{ color: "#06B6D4" }}>Save</strong> to add SignBridge AI
        to this channel.
      </p>

      {/* Feature list */}
      <div
        style={{
          padding: "1.25rem 1.75rem",
          background: "#1e293b",
          borderRadius: 12,
          border: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          minWidth: 300,
        }}
      >
        {[
          "Speech-to-Sign Language Translation",
          "3D Avatar with ASL Signs",
          "Multi-language Support (EN / ES / PT)",
          "Accessible Meeting Summaries",
          "Responsible AI Compliant",
        ].map((f) => (
          <p key={f} style={{ margin: 0, fontSize: "0.95rem" }}>
            ✅ {f}
          </p>
        ))}
      </div>

      {/* Status */}
      <p
        style={{
          fontSize: "0.8rem",
          color: ready ? "#22c55e" : "#64748b",
          margin: 0,
        }}
      >
        {ready ? "● Ready — click Save to continue" : "● Initializing Teams SDK…"}
      </p>
    </div>
  );
}
