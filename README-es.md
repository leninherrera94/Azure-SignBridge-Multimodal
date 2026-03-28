![SignBridge AI Banner](./assets/imgs/banner.png)

# SignBridge AI 🤟

**Microsoft Innovation Challenge — Marzo 2026 | Hub de Comunicación Inclusiva**

SignBridge AI es una plataforma de comunicación bidireccional en tiempo real que elimina la barrera entre personas sordas/con discapacidad auditiva y personas oyentes — impulsada por más de 15 servicios de Azure AI, un avatar 3D de señas y seguimiento de manos por visión computacional. Construida para el reto ejecutivo **Inclusive Communication Hub**.

---

## 🎯 Problema y Visión

**1.500 millones de personas en el mundo viven con pérdida auditiva** (OMS, 2025), pero la infraestructura para apoyarlas sigue siendo críticamente insuficiente e inaccesible:

- El costo económico de la pérdida auditiva no atendida supera los **$980 mil millones anuales**.
- Solo en Colombia, **más de 500.000 personas sordas** dependen de menos de **300 intérpretes certificados de lengua de señas**.
- **Menos del 20%** de las personas que necesitan asistencia auditiva la reciben.
- Las herramientas existentes trabajan con texto — no con lengua de señas —, dejando el idioma principal de la comunidad sorda sin soporte en entornos laborales y educativos.

La brecha no es tecnológica. Es de accesibilidad.

**SignBridge AI** cierra esta brecha con un hub de comunicación de IA multimodal que soporta transcripción de voz a texto en tiempo real, traducción bidireccional entre lenguaje hablado y lengua de señas mediante un avatar 3D, y resúmenes de reuniones accesibles automatizados — todo integrado directamente en Microsoft Teams.

---

## 💡 Capacidades Principales

### 🎙️ Voz → Lengua de Señas
Un usuario oyente habla con naturalidad. Azure AI Speech transcribe el audio en tiempo real con alta precisión. Azure OpenAI (GPT-4o) simplifica el texto transcrito en frases aptas para la señas. Un avatar 3D — construido con Three.js y Avaturn — ejecuta las señas correspondientes de ASL o LSC, incluido el deletreo completo de A a Z para cualquier palabra que no esté en el diccionario de señas. La latencia se mantiene por debajo de 2 segundos de extremo a extremo.

### 🤟 Lengua de Señas → Texto / Voz
Un usuario sordo seña frente a su cámara. MediaPipe Hands detecta 21 puntos de referencia de la mano a 30 FPS. Un clasificador basado en reglas identifica la seña a partir de la geometría de los puntos y emite la palabra reconocida como subtítulo en tiempo real visible para los participantes oyentes. No se requiere servidor externo de inferencia — la inferencia se ejecuta completamente en el navegador.

### ⌨️ Texto → Lengua de Señas
Los usuarios pueden escribir cualquier mensaje y tenerlo traducido instantáneamente en animación de lengua de señas, permitiendo comunicación asíncrona y de bajo ancho de banda mediante el mismo pipeline de avatar 3D.

### 📝 Resúmenes de Reuniones Accesibles
Azure OpenAI genera notas de reunión estructuradas y accesibles a partir de la transcripción completa de la conversación al final de cada sesión. Los resúmenes se exportan como Markdown y pueden compartirse directamente a través de Microsoft Teams — asegurando que los participantes sordos tengan el mismo acceso a los resultados de la reunión que los oyentes.

### 🛡️ Panel de IA Responsable
Cada decisión de IA se registra y se presenta al usuario en un panel de transparencia. Azure AI Content Safety filtra cada mensaje en tiempo real. Azure AI Language detecta y redacta PII antes de que llegue a cualquier modelo de IA. Los usuarios pueden ver, auditar y controlar sus datos en cualquier momento.

### 🫂 Integración con Microsoft Teams
SignBridge AI se puede instalar como una **aplicación de pestaña de Teams**, llevando la traducción bidireccional de lengua de señas directamente a las reuniones cotidianas — sin necesidad de adoptar una nueva herramienta ni abrir una pestaña separada del navegador.

---

## 🏗️ Arquitectura

![Diagrama de Arquitectura](./assets/imgs/architecture.png)

SignBridge AI es una **aplicación Next.js 15** (App Router, React 18, TypeScript 5) desplegada en **Azure Container Apps**. El frontend ejecuta todo el pipeline de seguimiento de manos y avatar en el lado del cliente para minimizar la latencia. Las rutas de API del backend y Azure Functions orquestan el pipeline de servicios de IA.

### Descripción de Componentes

1. **Interfaz de Usuario (Next.js + Three.js + MediaPipe)**
   El navegador captura la entrada del micrófono y los fotogramas de la cámara simultáneamente. Three.js renderiza el avatar Avaturn 3D en un canvas WebGL. MediaPipe Hands procesa los fotogramas de la cámara a 30 FPS completamente en el cliente — no se envía ningún video a ningún servidor.

2. **Azure AI Speech**
   El audio en streaming se envía a Azure AI Speech a través de WebSocket para la transcripción de voz a texto en tiempo real. El mismo servicio proporciona la reproducción de texto a voz cuando el sistema lee el mensaje señado de un usuario sordo a un participante oyente.

3. **Azure AI Content Safety**
   Cada mensaje transcrito o escrito pasa por Content Safety antes de llegar a cualquier servicio posterior. El contenido dañino o inapropiado se bloquea y marca inmediatamente, con la decisión registrada en el panel de IA Responsable.

4. **Azure AI Language**
   Las entidades PII (nombres, números de teléfono, correos electrónicos, direcciones) son detectadas y redactadas del flujo de texto antes de pasarlo al pipeline del avatar o almacenarlo. El análisis de sentimiento proporciona métricas de calidad de conversación a nivel de sesión.

5. **Azure OpenAI Service (GPT-4o)**
   Se genera texto simplificado y apto para señas a partir de transcripciones en bruto. GPT-4o también mapea el texto simplificado al diccionario de señas, gestiona las palabras fuera del diccionario con secuencias de deletreo, y genera el resumen de reunión accesible al final de la sesión.

6. **Azure AI Translator**
   La traducción automática entre inglés, español y portugués permite sesiones entre idiomas. Un hablante hispano oyente y un señante sordo de ASL pueden comunicarse sin un intérprete humano en cualquiera de los idiomas.

7. **Diccionario de Señas y Pipeline del Avatar**
   Un diccionario de señas basado en base de datos (Azure Cosmos DB) mapea palabras a secuencias de fotogramas clave de animación. El avatar 3D (Avaturn + Three.js) interpola entre fotogramas para una seña fluida y natural. Se agregan nuevas señas a través de un panel de administración sin cambios de código.

8. **Azure SignalR Service**
   La mensajería bidireccional en tiempo real sincroniza flujos de subtítulos, comandos del avatar y notificaciones de IA Responsable entre todos los participantes en una sesión.

9. **Azure Communication Services**
   La infraestructura de videollamadas permite sesiones cara a cara. ACS maneja la señalización de llamadas, la retransmisión de medios y la gestión de participantes, manteniendo toda la comunicación dentro del límite de cumplimiento de Microsoft.

10. **Azure Cosmos DB**
    Almacena perfiles de usuario, historial de sesiones, el diccionario de lengua de señas (ASL y LSC), y el registro de decisiones de IA para el panel de IA Responsable. El diccionario es flexible en esquema para soportar nuevas lenguas de señas sin migraciones.

11. **Azure Blob Storage**
    Aloja activos del avatar 3D, datos de fotogramas clave de animación y archivos de resumen de reuniones exportados. Los medios se sirven a través de endpoints respaldados por CDN para entrega global de baja latencia.

12. **Azure Container Apps + Azure Container Registry**
    La aplicación se empaqueta como un contenedor Docker, se publica en Azure Container Registry y se despliega en Azure Container Apps con escalado automático horizontal. Sin gestión de infraestructura requerida.

13. **Azure Application Insights**
    La telemetría, los rastros y las métricas personalizadas (precisión del reconocimiento de señas, latencia de transcripción, tasa de fotogramas del avatar) fluyen hacia Application Insights para observabilidad y alertas en tiempo real.

14. **Azure Key Vault**
    Todas las claves de API, cadenas de conexión y secretos se almacenan en Key Vault y se acceden en tiempo de ejecución a través de Managed Identity — sin credenciales en archivos de entorno o imágenes de contenedor.

15. **Azure Bicep (Infraestructura como Código)**
    Toda la infraestructura está definida como plantillas Bicep, lo que permite despliegues reproducibles con un solo comando a cualquier suscripción de Azure. Ideal para adopción empresarial y recuperación ante desastres.

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework Web | Next.js 15 (App Router) |
| UI | React 18 + TypeScript 5 |
| Estilos | Tailwind CSS 3 |
| Animaciones | Framer Motion |
| Avatar 3D | Three.js + Avaturn |
| Seguimiento de Manos | MediaPipe Hands (lado del cliente) |
| Orquestación de IA | Azure OpenAI Service (GPT-4o) |
| Voz | Azure AI Speech (STT + TTS) |
| Moderación de Contenido | Azure AI Content Safety |
| Lenguaje / PII | Azure AI Language |
| Traducción | Azure AI Translator |
| Visión Computacional | Azure AI Vision |
| Mensajería en Tiempo Real | Azure SignalR Service |
| Videollamadas | Azure Communication Services |
| Base de Datos | Azure Cosmos DB |
| Almacenamiento | Azure Blob Storage |
| Alojamiento | Azure Container Apps |
| Registro | Azure Container Registry |
| Observabilidad | Azure Application Insights |
| Secretos | Azure Key Vault |
| Infraestructura | Azure Bicep (IaC) |
| Integración con Teams | Microsoft Teams Tab App |
| Accesibilidad | WCAG 2.1 AA |

---

## 📊 Métricas e Impacto de Negocio

> Los números marcados como *(ilustrativos)* reflejan objetivos realistas basados en investigaciones publicadas y despliegues piloto en herramientas de accesibilidad comparables. Se presentan con fines demostrativos durante el hackathon.

- **Más de 500.000 colombianos sordos** que actualmente tienen acceso a menos de 300 intérpretes certificados — la base de usuarios principal solo en el mercado local *(datos OMS / INSOR)*.
- **< 2 segundos de latencia de extremo a extremo** para el pipeline Voz → Avatar en condiciones de red típicas, dentro del umbral para la interacción conversacional natural.
- **Detección de puntos de mano a 30 FPS** ejecutándose completamente en el navegador a través de MediaPipe, sin datos de video saliendo del dispositivo del cliente *(privacidad por diseño)*.
- **3 lenguas de señas soportadas** en el lanzamiento: ASL (Lengua de Señas Americana), LSC (Lengua de Señas Colombiana), y extensible a otras a través del panel de administración del diccionario de señas.
- **5 principios de IA Responsable implementados** con controles medibles: monitoreo de equidad, seguridad de contenido en tiempo real, redacción de PII, cumplimiento de WCAG 2.1 AA, y un registro completo de transparencia de decisiones de IA.
- **Costo cero de intérprete por sesión** para organizaciones que adopten SignBridge AI para reuniones internas, en comparación con $50–150/hora para intérpretes humanos certificados *(ilustrativo, basado en tarifas de la industria)*.

---

## 🤝 IA Responsable

SignBridge AI implementa los cinco principios de IA Responsable de Microsoft con controles concretos y verificables — no solo declaraciones de política.

| Principio | Implementación |
|---|---|
| **Equidad** | Precisión del reconocimiento de señas monitoreada por seña; el panel muestra señas de baja confianza para mejora |
| **Fiabilidad y Seguridad** | Azure Content Safety filtra cada mensaje en tiempo real antes de que llegue a cualquier participante |
| **Privacidad y Seguridad** | PII detectada y redactada por Azure AI Language; no se envían fotogramas de video a servidores; datos cifrados en reposo y en tránsito |
| **Inclusividad** | Tres idiomas, tres modalidades de comunicación, WCAG 2.1 AA: alto contraste, fuentes ajustables, navegación por teclado, movimiento reducido |
| **Transparencia** | Registro completo de decisiones de IA — qué modelo se ejecutó, qué entrada recibió, qué devolvió — visible para los usuarios en el panel de IA Responsable |

---

## 🚀 Cómo Ejecutar

### Requisitos Previos

- Node.js `>= 20.9.0` (Node 22 LTS recomendado)
- npm `>= 10`
- Una suscripción de Azure con los servicios requeridos aprovisionados (ver `infrastructure/` para plantillas Bicep)
- Un archivo `.env.local` completado a partir de `.env.example`

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/your-org/Azure-SignBridge-Multimodal.git
cd Azure-SignBridge-Multimodal

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las claves de sus servicios de Azure

# Iniciar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Desplegar Infraestructura (Azure Bicep)

```bash
# Iniciar sesión en Azure
az login

# Desplegar toda la infraestructura en un grupo de recursos
az deployment group create \
  --resource-group rg-signbridge \
  --template-file infrastructure/main.bicep \
  --parameters @infrastructure/parameters.json
```

### Construir y Desplegar Contenedor

```bash
# Construir la imagen Docker
docker build -t signbridge-ai .

# Etiquetar y enviar a Azure Container Registry
az acr build \
  --registry <su-registro>.azurecr.io \
  --image signbridge-ai:latest .
```

### Aplicación de Microsoft Teams (Carga Lateral para Desarrollo)

```bash
# Empaquetar el manifiesto de la aplicación de Teams
cd teams-app
npm install
npm run build

# Cargar teams-app/build/SignBridgeAI.zip a través del Centro de Administración de Teams
# o cargar lateralmente directamente en el Portal de Desarrolladores de Teams
```

---

## 🗺️ Próximos Pasos

- **Expandir el diccionario de señas** — Asociarse con organizaciones de la comunidad sorda (FENASCOL en Colombia, NAD en EE. UU.) para validar y expandir los diccionarios de ASL y LSC más allá del vocabulario actual con aportaciones de señantes nativos.
- **Entrenar un modelo neuronal de reconocimiento de señas** — Reemplazar el clasificador actual basado en reglas de puntos de referencia con un modelo CNN/LSTM liviano entrenado en conjuntos de datos de video de señas reales, mejorando la precisión entre señantes con diferentes tamaños de manos, tonos de piel y estilos de señas.
- **Integración de Reunión en Vivo de Microsoft Teams** — Extender de una aplicación de pestaña a una extensión de reunión en vivo que superponga subtítulos y señas del avatar directamente en la cuadrícula de la reunión de Teams sin necesitar una pestaña separada.
- **Modo sin conexión / bajo ancho de banda** — Almacenar en caché el diccionario de señas y los activos del avatar localmente con un service worker para que la herramienta siga siendo funcional en áreas con mala conectividad — un requisito crítico para despliegues rurales y en mercados en desarrollo.
- **Portal de administración empresarial** — Construir un panel de gestión multiinquilino para que las organizaciones agreguen vocabulario de dominio personalizado (términos médicos, terminología legal, jerga específica de la empresa) al diccionario de señas sin intervención de ingeniería.

---

## 👥 Equipo

| Nombre | Rol |
|---|---|
| Fabio Alberto Urrea Ballesteros | — |
| Juan Pablo Enriquez | — |
| Jose Luis Martinez Chavez | — |
| Lenin Alberto Herrera Macanchi | — |

---

Construido para el **Microsoft Innovation Challenge — Marzo 2026**, pista de Hub de Comunicación Inclusiva.
SignBridge AI demuestra que la traducción bidireccional en tiempo real de lengua de señas no es una capacidad futura — está disponible hoy, construida sobre Azure, y lista para escalar.
