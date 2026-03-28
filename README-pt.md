![SignBridge AI Banner](./assets/imgs/banner.png)

# SignBridge AI 🤟

**Microsoft Innovation Challenge — Março 2026 | Hub de Comunicação Inclusiva**

SignBridge AI é uma plataforma de comunicação bidirecional em tempo real que elimina a barreira entre pessoas surdas/com deficiência auditiva e pessoas ouvintes — alimentada por mais de 15 serviços Azure AI, um avatar 3D de sinais e rastreamento de mãos por visão computacional. Construída para o desafio executivo **Inclusive Communication Hub**.

---

## 🎯 Problema e Visão

**1,5 bilhão de pessoas no mundo vivem com perda auditiva** (OMS, 2025), mas a infraestrutura para apoiá-las permanece criticamente subfinanciada e inacessível:

- O custo econômico da perda auditiva não tratada supera **$980 bilhões anualmente**.
- Somente na Colômbia, **mais de 500.000 surdos** dependem de menos de **300 intérpretes certificados de língua de sinais**.
- **Menos de 20%** das pessoas que precisam de assistência auditiva realmente a recebem.
- As ferramentas existentes trabalham com texto — não com língua de sinais —, deixando o idioma principal da comunidade surda sem suporte em ambientes de trabalho e educação.

A lacuna não é tecnológica. É de acessibilidade.

**SignBridge AI** preenche essa lacuna com um hub de comunicação de IA multimodal que suporta transcrição de fala para texto em tempo real, tradução bidirecional entre linguagem falada e língua de sinais via avatar 3D, e resumos de reuniões acessíveis automatizados — tudo integrado diretamente no Microsoft Teams.

---

## 💡 Capacidades Principais

### 🎙️ Fala → Língua de Sinais
Um usuário ouvinte fala naturalmente. O Azure AI Speech transcreve o áudio em tempo real com alta precisão. O Azure OpenAI (GPT-4o) simplifica o texto transcrito em frases adequadas para sinais. Um avatar 3D — construído com Three.js e Avaturn — executa os sinais correspondentes de ASL ou LSC, incluindo soletração completa de A a Z para qualquer palavra que não esteja no dicionário de sinais. A latência é mantida abaixo de 2 segundos de ponta a ponta.

### 🤟 Língua de Sinais → Texto / Fala
Um usuário surdo sinaliza frente à câmera. O MediaPipe Hands detecta 21 pontos de referência da mão a 30 FPS. Um classificador baseado em regras identifica o sinal a partir da geometria dos pontos e emite a palavra reconhecida como legenda em tempo real visível para os participantes ouvintes. Não é necessário servidor externo de inferência — a inferência é executada completamente no navegador.

### ⌨️ Texto → Língua de Sinais
Os usuários podem digitar qualquer mensagem e tê-la instantaneamente traduzida em animação de língua de sinais, permitindo comunicação assíncrona e de baixa largura de banda pelo mesmo pipeline de avatar 3D.

### 📝 Resumos de Reuniões Acessíveis
O Azure OpenAI gera notas de reunião estruturadas e acessíveis a partir da transcrição completa da conversa ao final de cada sessão. Os resumos são exportados como Markdown e podem ser compartilhados diretamente pelo Microsoft Teams — garantindo que os participantes surdos tenham o mesmo acesso aos resultados da reunião que os ouvintes.

### 🛡️ Painel de IA Responsável
Cada decisão de IA é registrada e apresentada ao usuário em um painel de transparência. O Azure AI Content Safety filtra cada mensagem em tempo real. O Azure AI Language detecta e redige PII antes que chegue a qualquer modelo de IA. Os usuários podem visualizar, auditar e controlar seus dados a qualquer momento.

### 🫂 Integração com Microsoft Teams
O SignBridge AI pode ser instalado como um **aplicativo de aba do Teams**, trazendo a tradução bidirecional de língua de sinais diretamente para as reuniões do dia a dia — sem necessidade de adotar uma nova ferramenta ou abrir uma aba separada do navegador.

---

## 🏗️ Arquitetura

![Diagrama de Arquitetura](./assets/imgs/architecture.png)

SignBridge AI é uma **aplicação Next.js 15** (App Router, React 18, TypeScript 5) implantada no **Azure Container Apps**. O frontend executa todo o pipeline de rastreamento de mãos e avatar no lado do cliente para minimizar a latência. As rotas de API do backend e Azure Functions orquestram o pipeline de serviços de IA.

### Visão Geral dos Componentes

1. **Interface do Usuário (Next.js + Three.js + MediaPipe)**
   O navegador captura a entrada do microfone e os quadros da câmera simultaneamente. O Three.js renderiza o avatar Avaturn 3D em um canvas WebGL. O MediaPipe Hands processa os quadros da câmera a 30 FPS completamente no cliente — nenhum vídeo é enviado a nenhum servidor.

2. **Azure AI Speech**
   O áudio em streaming é enviado ao Azure AI Speech via WebSocket para transcrição de fala para texto em tempo real. O mesmo serviço fornece reprodução de texto para fala quando o sistema lê a mensagem sinalizada de um usuário surdo para um participante ouvinte.

3. **Azure AI Content Safety**
   Cada mensagem transcrita ou digitada passa pelo Content Safety antes de chegar a qualquer serviço posterior. Conteúdo prejudicial ou inadequado é bloqueado e sinalizado imediatamente, com a decisão registrada no painel de IA Responsável.

4. **Azure AI Language**
   Entidades PII (nomes, números de telefone, e-mails, endereços) são detectadas e redigidas do fluxo de texto antes de passá-lo ao pipeline do avatar ou armazená-lo. A análise de sentimento fornece métricas de qualidade de conversa ao nível da sessão.

5. **Azure OpenAI Service (GPT-4o)**
   Texto simplificado e adequado para sinais é gerado a partir de transcrições brutas. O GPT-4o também mapeia o texto simplificado ao dicionário de sinais, lida com palavras fora do dicionário com sequências de soletração, e gera o resumo de reunião acessível ao final da sessão.

6. **Azure AI Translator**
   Tradução automática entre inglês, espanhol e português permite sessões entre idiomas. Um falante hispânico ouvinte e um sinalizador surdo de ASL podem se comunicar sem um intérprete humano em qualquer um dos idiomas.

7. **Dicionário de Sinais e Pipeline do Avatar**
   Um dicionário de sinais baseado em banco de dados (Azure Cosmos DB) mapeia palavras a sequências de quadros-chave de animação. O avatar 3D (Avaturn + Three.js) interpola entre quadros-chave para uma sinalização fluida e natural. Novos sinais são adicionados por meio de um painel de administração sem alterações de código.

8. **Azure SignalR Service**
   A mensageria bidirecional em tempo real sincroniza fluxos de legendas, comandos do avatar e notificações de IA Responsável entre todos os participantes de uma sessão.

9. **Azure Communication Services**
   A infraestrutura de videochamadas possibilita sessões presenciais. O ACS lida com sinalização de chamadas, retransmissão de mídia e gerenciamento de participantes, mantendo toda a comunicação dentro do limite de conformidade da Microsoft.

10. **Azure Cosmos DB**
    Armazena perfis de usuário, histórico de sessões, o dicionário de língua de sinais (ASL e LSC), e o registro de decisões de IA para o painel de IA Responsável. O dicionário é flexível em esquema para suportar novas línguas de sinais sem migrações.

11. **Azure Blob Storage**
    Hospeda ativos do avatar 3D, dados de quadros-chave de animação e arquivos de resumo de reuniões exportados. A mídia é servida via endpoints respaldados por CDN para entrega global de baixa latência.

12. **Azure Container Apps + Azure Container Registry**
    A aplicação é empacotada como um contêiner Docker, publicada no Azure Container Registry e implantada no Azure Container Apps com escalamento automático horizontal. Zero gerenciamento de infraestrutura necessário.

13. **Azure Application Insights**
    Telemetria, rastreamentos e métricas personalizadas (precisão do reconhecimento de sinais, latência de transcrição, taxa de quadros do avatar) fluem para o Application Insights para observabilidade e alertas em tempo real.

14. **Azure Key Vault**
    Todas as chaves de API, strings de conexão e segredos são armazenados no Key Vault e acessados em tempo de execução via Managed Identity — sem credenciais em arquivos de ambiente ou imagens de contêiner.

15. **Azure Bicep (Infraestrutura como Código)**
    Toda a infraestrutura é definida como templates Bicep, possibilitando implantações reproduzíveis com um único comando em qualquer assinatura do Azure. Ideal para adoção empresarial e recuperação de desastres.

---

## ⚙️ Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework Web | Next.js 15 (App Router) |
| UI | React 18 + TypeScript 5 |
| Estilos | Tailwind CSS 3 |
| Animações | Framer Motion |
| Avatar 3D | Three.js + Avaturn |
| Rastreamento de Mãos | MediaPipe Hands (lado do cliente) |
| Orquestração de IA | Azure OpenAI Service (GPT-4o) |
| Fala | Azure AI Speech (STT + TTS) |
| Moderação de Conteúdo | Azure AI Content Safety |
| Linguagem / PII | Azure AI Language |
| Tradução | Azure AI Translator |
| Visão Computacional | Azure AI Vision |
| Mensageria em Tempo Real | Azure SignalR Service |
| Videochamadas | Azure Communication Services |
| Banco de Dados | Azure Cosmos DB |
| Armazenamento | Azure Blob Storage |
| Hospedagem | Azure Container Apps |
| Registro | Azure Container Registry |
| Observabilidade | Azure Application Insights |
| Segredos | Azure Key Vault |
| Infraestrutura | Azure Bicep (IaC) |
| Integração com Teams | Microsoft Teams Tab App |
| Acessibilidade | WCAG 2.1 AA |

---

## 📊 Métricas e Impacto de Negócio

> Os números marcados como *(ilustrativos)* refletem metas realistas baseadas em pesquisas publicadas e implantações piloto em ferramentas de acessibilidade comparáveis. São apresentados para fins demonstrativos durante o hackathon.

- **Mais de 500.000 colombianos surdos** que atualmente têm acesso a menos de 300 intérpretes certificados — a base de usuários principal apenas no mercado doméstico *(dados OMS / INSOR)*.
- **< 2 segundos de latência de ponta a ponta** para o pipeline Fala → Avatar em condições de rede típicas, dentro do limiar para interação conversacional natural.
- **Detecção de pontos de mão a 30 FPS** executando completamente no navegador via MediaPipe, sem dados de vídeo saindo do dispositivo do cliente *(privacidade por design)*.
- **3 línguas de sinais suportadas** no lançamento: ASL (Língua de Sinais Americana), LSC (Língua de Sinais Colombiana), e extensível a outras por meio do painel de administração do dicionário de sinais.
- **5 princípios de IA Responsável implementados** com controles mensuráveis: monitoramento de equidade, segurança de conteúdo em tempo real, redação de PII, conformidade com WCAG 2.1 AA, e um registro completo de transparência de decisões de IA.
- **Custo zero de intérprete por sessão** para organizações que adotam o SignBridge AI para reuniões internas, em comparação com $50–150/hora para intérpretes humanos certificados *(ilustrativo, baseado em tarifas da indústria)*.

---

## 🤝 IA Responsável

SignBridge AI implementa todos os cinco princípios de IA Responsável da Microsoft com controles concretos e verificáveis — não apenas declarações de política.

| Princípio | Implementação |
|---|---|
| **Equidade** | Precisão do reconhecimento de sinais monitorada por sinal; painel exibe sinais de baixa confiança para melhoria |
| **Confiabilidade e Segurança** | Azure Content Safety filtra cada mensagem em tempo real antes que chegue a qualquer participante |
| **Privacidade e Segurança** | PII detectada e redigida pelo Azure AI Language; nenhum quadro de vídeo enviado a servidores; dados criptografados em repouso e em trânsito |
| **Inclusividade** | Três idiomas, três modalidades de comunicação, WCAG 2.1 AA: alto contraste, fontes ajustáveis, navegação por teclado, movimento reduzido |
| **Transparência** | Registro completo de decisões de IA — qual modelo foi executado, qual entrada recebeu, o que retornou — visível aos usuários no painel de IA Responsável |

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js `>= 20.9.0` (Node 22 LTS recomendado)
- npm `>= 10`
- Uma assinatura do Azure com os serviços necessários provisionados (ver `infrastructure/` para templates Bicep)
- Um arquivo `.env.local` preenchido a partir de `.env.example`

### Desenvolvimento Local

```bash
# Clonar o repositório
git clone https://github.com/your-org/Azure-SignBridge-Multimodal.git
cd Azure-SignBridge-Multimodal

# Instalar dependências
npm install

# Copiar e configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas chaves de serviços do Azure

# Iniciar o servidor de desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) no navegador.

### Implantar Infraestrutura (Azure Bicep)

```bash
# Fazer login no Azure
az login

# Implantar toda a infraestrutura em um grupo de recursos
az deployment group create \
  --resource-group rg-signbridge \
  --template-file infrastructure/main.bicep \
  --parameters @infrastructure/parameters.json
```

### Construir e Implantar Contêiner

```bash
# Construir a imagem Docker
docker build -t signbridge-ai .

# Marcar e enviar para o Azure Container Registry
az acr build \
  --registry <seu-registro>.azurecr.io \
  --image signbridge-ai:latest .
```

### Aplicativo Microsoft Teams (Carregamento Lateral para Desenvolvimento)

```bash
# Empacotar o manifesto do aplicativo Teams
cd teams-app
npm install
npm run build

# Carregar teams-app/build/SignBridgeAI.zip pelo Centro de Administração do Teams
# ou carregar lateralmente diretamente no Portal do Desenvolvedor do Teams
```

---

## 🗺️ Próximos Passos

- **Expandir o dicionário de sinais** — Fazer parceria com organizações da comunidade surda (FENASCOL na Colômbia, NAD nos EUA) para validar e expandir os dicionários de ASL e LSC além do vocabulário atual com contribuição de sinalizadores nativos.
- **Treinar um modelo neural de reconhecimento de sinais** — Substituir o classificador atual baseado em regras de pontos de referência por um modelo CNN/LSTM leve treinado em conjuntos de dados de vídeo de sinais reais, melhorando a precisão entre sinalizadores com diferentes tamanhos de mãos, tons de pele e estilos de sinalização.
- **Integração de Reunião ao Vivo do Microsoft Teams** — Estender de um aplicativo de aba para uma extensão de reunião ao vivo que sobreponha legendas e sinais do avatar diretamente na grade da reunião do Teams sem precisar de uma aba separada.
- **Modo offline / baixa largura de banda** — Armazenar em cache o dicionário de sinais e os ativos do avatar localmente com um service worker para que a ferramenta permaneça funcional em áreas com má conectividade — um requisito crítico para implantações rurais e em mercados em desenvolvimento.
- **Portal de administração empresarial** — Construir um painel de gerenciamento multi-tenant para que as organizações adicionem vocabulário de domínio personalizado (termos médicos, terminologia jurídica, jargão específico da empresa) ao dicionário de sinais sem envolvimento de engenharia.

---

## 👥 Equipe

| Nome | Função |
|---|---|
| Fabio Alberto Urrea Ballesteros | — |
| Juan Pablo Enriquez | — |
| Jose Luis Martinez Chavez | — |
| Lenin Alberto Herrera Macanchi | — |

---

Construído para o **Microsoft Innovation Challenge — Março 2026**, trilha do Hub de Comunicação Inclusiva.
SignBridge AI demonstra que a tradução bidirecional em tempo real de língua de sinais não é uma capacidade futura — está disponível hoje, construída no Azure, e pronta para escalar.
