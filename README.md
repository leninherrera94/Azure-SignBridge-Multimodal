# Azure-SignBridge-Multimodal
Plataforma de comunicación inclusiva que integra Azure AI Services para traducción bidireccional en tiempo real entre voz, texto y lengua de señas (LSC). Incluye videollamadas con ACS, moderación de contenido y generación de resúmenes accesibles. Diseñado para transformar la accesibilidad en entornos laborales y educativos.

## Runtime prerequisites

- Node.js `>= 20.9.0` (recommended: Node 22 LTS)
- npm `>= 10`

Node 16 is not supported by this project because `next@16` and multiple dependencies require Node 20+.

## Getting Started

## 🎯 Problema que Resolvemos

Las personas sordas y con pérdida auditiva enfrentan barreras de comunicación significativas en lugares de trabajo, aulas y servicios públicos. La falta de intérpretes de lengua de señas y herramientas de comunicación accesibles limita su participación plena en la sociedad.

## 💡 Nuestra Solución: SignBridge AI

**SignBridge AI** es un centro de comunicación con IA multimodal que permite una participación fluida a través del habla, texto y lengua de señas, integrándose perfectamente en herramientas de colaboración cotidianas.

### Características Principales

- **🎙️ Transcripción en Tiempo Real**: Conversión de voz a texto con alta precisión usando Azure AI Speech
- **🤟 Traducción Bidireccional**: Traducción entre lenguaje hablado y representaciones visuales en lengua de señas mediante clips animados
- **🛡️ Filtrado de Contenido**: Moderación automática con Azure AI Content Safety para garantizar comunicaciones seguras e inclusivas
- **📝 Resúmenes Automáticos**: Generación de notas de reunión accesibles en formato Markdown exportable
- **📹 Videollamada Integrada**: Comunicación en tiempo real mediante Azure Communication Services

### Arquitectura de Servicios Azure

| Servicio | Función |
|----------|---------|
| Azure AI Speech | Speech-to-Text y Text-to-Speech |
| Azure AI Content Safety | Filtrado de lenguaje dañino |
| Azure Communication Services | Videollamadas en tiempo real |
| Azure Blob Storage | Almacenamiento de clips de señas y archivos |
| Azure AI Foundry | Orquestación de modelos de IA |

## 🔄 Flujos del Sistema

### Flujo 1: Persona Oyente → Persona Sorda
1. Captura de audio del hablante
2. Transcripción voz a texto (Azure AI Speech)
3. Filtrado de contenido dañino (Content Safety)
4. Traducción a secuencia de clips de lengua de señas
5. Presentación visual al usuario sordo
