export default function PrivacyPolicy() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "3rem 1.5rem",
        fontFamily: "Segoe UI, sans-serif",
        color: "#e2e8f0",
        background: "#0f172a",
        minHeight: "100vh",
        lineHeight: 1.7,
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#06B6D4", marginBottom: "0.5rem" }}>
        Privacy Policy
      </h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Last updated: March 2026 · SignBridge AI · Microsoft Innovation Challenge 2026
      </p>

      <Section title="1. Overview">
        SignBridge AI (&quot;the App&quot;) is an inclusive communication platform that provides
        real-time speech-to-sign language translation. This Privacy Policy explains what data
        we collect, how we use it, and your rights.
      </Section>

      <Section title="2. Data We Collect">
        <ul>
          <li><strong>Speech audio</strong> — processed in real-time by Azure Speech Services to produce text transcripts. Audio is not stored.</li>
          <li><strong>Text transcripts</strong> — conversation text used to generate ASL sign sequences. Optionally stored in Azure Cosmos DB if you enable session saving.</li>
          <li><strong>Camera video</strong> — processed locally in your browser for sign recognition via MediaPipe. No video frames leave your device.</li>
          <li><strong>Session metadata</strong> — duration, sign count, and language preference stored per session if saving is enabled.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Data">
        <ul>
          <li>Generate ASL sign sequences from speech or typed text via Azure OpenAI (GPT-4o)</li>
          <li>Detect and redact Personally Identifiable Information (PII) before AI processing</li>
          <li>Screen content for safety using Azure Content Safety</li>
          <li>Generate accessible meeting summaries at session end</li>
        </ul>
      </Section>

      <Section title="4. Azure AI Services">
        Your text is processed by the following Azure Cognitive Services, all operating under
        Microsoft&apos;s enterprise data protection commitments:
        <ul>
          <li>Azure OpenAI Service (GPT-4o) — sign translation and summaries</li>
          <li>Azure Speech — speech-to-text recognition</li>
          <li>Azure Content Safety — harmful content detection</li>
          <li>Azure Language (PII Detection) — privacy protection</li>
          <li>Azure Translator — multi-language support</li>
        </ul>
        Data sent to Azure services is not used to train Microsoft AI models.
      </Section>

      <Section title="5. Data Retention">
        <ul>
          <li>Speech audio: never stored — processed in real-time only</li>
          <li>Camera video: never leaves your device</li>
          <li>Session data: stored only if you explicitly enable &quot;Save Conversation&quot; in the app</li>
          <li>You can delete all your data at any time using the &quot;Delete my data&quot; button in the Responsible AI panel</li>
        </ul>
      </Section>

      <Section title="6. GDPR / CCPA Compliance">
        <ul>
          <li><strong>Right to access</strong> — request a copy of your stored data</li>
          <li><strong>Right to deletion</strong> — delete all session data via the app or by contacting us</li>
          <li><strong>Right to portability</strong> — export your conversation history</li>
          <li><strong>PII auto-redaction</strong> — names, emails, phone numbers, and other personal identifiers are automatically detected and redacted before AI processing</li>
        </ul>
      </Section>

      <Section title="7. Third-Party Sharing">
        We do not sell or share your data with third parties. Data is processed exclusively
        within your Azure subscription&apos;s tenant boundary.
      </Section>

      <Section title="8. Contact">
        This app was built for the Microsoft Innovation Challenge 2026 (Hackathon context).
        For privacy questions, please use the feedback channel provided by the event organizers.
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.75rem" }}>
        {title}
      </h2>
      <div style={{ color: "#94a3b8" }}>{children}</div>
    </section>
  );
}
