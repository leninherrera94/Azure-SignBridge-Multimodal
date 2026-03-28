# SignBridge AI — Microsoft Teams Integration

## How to install

1. Open **Microsoft Teams**
2. Go to **Apps** → **Manage your apps** → **Upload a custom app**
3. Select the file: `SignBridgeAI.zip`
4. Click **Add** to install
5. Open SignBridge AI from your Apps sidebar
6. Or add it as a **Tab** in any channel or meeting

## Features in Teams

- 🤟 Real-time speech-to-sign language translation
- 🧑‍💻 3D avatar with ASL signs and fingerspelling
- 🌍 Multi-language support (English, Español, Português)
- 📝 Accessible meeting summaries powered by GPT-4o
- 🛡️ Responsible AI compliant (Content Safety + PII Detection)
- 🎥 Works as a meeting side panel and meeting stage

## How to add to a meeting

1. Start or join a Teams meeting
2. Click **Apps** in the meeting toolbar
3. Search for **SignBridge AI**
4. Click **Add** → it appears as a side panel tab
5. Click **Open in stage** to share the view with all participants

## Architecture

SignBridge AI runs as a **Teams Tab App**, embedding the web application
directly into the Teams interface via a secure iframe.

The app communicates with 15+ Azure AI services:

| Service | Purpose |
|---|---|
| Azure OpenAI (GPT-4o) | Sign sequence translation |
| Azure Speech | Speech-to-text recognition |
| Azure Content Safety | Input moderation |
| Azure Language (PII) | Privacy protection |
| Azure Translator | Multi-language support |
| Azure Cosmos DB | Session persistence |
| Azure SignalR | Real-time communication |
| Azure Communication Services | Video calling |

## Building the package

```bash
npm run package-teams
```

This generates `teams-app/SignBridgeAI.zip` ready to upload to Teams.
