// ═══════════════════════════════════════════════════════════════════════════════
// SignBridge AI — Azure Infrastructure
// Microsoft Innovation Challenge, March 2026
//
// Naming convention : signbridge-{resource}-{env}
// Deploy            : az deployment sub create --location eastus2 --template-file main.bicep
// ═══════════════════════════════════════════════════════════════════════════════

targetScope = 'resourceGroup'

// ─── Parameters ───────────────────────────────────────────────────────────────

@description('Deployment environment. Controls SKU sizes and redundancy.')
@allowed(['dev', 'prod'])
param environment string = 'dev'

@description('Primary Azure region for all resources.')
param location string = 'eastus2'

@description('Entra Object ID of the deployment principal — used for Key Vault admin access.')
param deploymentPrincipalObjectId string

// ─── Variables ────────────────────────────────────────────────────────────────

var prefix = 'signbridge'
var env    = environment
var uniqueSuffix = toLower(take(uniqueString(resourceGroup().id), 6))

var tags = {
  project:   'signbridge-ai'
  challenge: 'inclusive-communication-hub'
  hackathon: 'microsoft-innovation-march-2026'
  env:       env
}

// Global-unique names for multi-account portability
// Storage account names: lowercase alphanumeric only and <= 24 chars
var storageAccountName = take('${prefix}st${env}${uniqueSuffix}', 24)
var funcStorageName    = take('${prefix}funcst${env}${uniqueSuffix}', 24)

// Global resources with DNS/name uniqueness requirements
var keyVaultName       = take('${prefix}-kv-${env}-${uniqueSuffix}', 24)
var signalRName        = take('${prefix}-signalr-${env}-${uniqueSuffix}', 63)
var functionAppName    = take('${prefix}-func-${env}-${uniqueSuffix}', 60)
var appServiceName     = take('${prefix}-app-${env}-${uniqueSuffix}', 60)
var cosmosAccountName  = take('${prefix}-cosmos-${env}-${uniqueSuffix}', 44)
var apimName           = take('${prefix}-apim-${env}-${uniqueSuffix}', 50)
var aiServicesName     = take('${prefix}-aisvc-${env}-${uniqueSuffix}', 64)
var foundryHubName     = take('${prefix}-hub-${env}-${uniqueSuffix}', 64)
var foundryProjectName = take('${prefix}-proj-${env}-${uniqueSuffix}', 64)
var foundryConnectionName = 'ai-services-default'
var foundryProjectEndpoint = 'https://${foundryProjectName}.services.ai.azure.com'

// ─── Built-in Role Definition IDs ─────────────────────────────────────────────

var roleKeyVaultSecretsUser      = '4633458b-17de-408a-b874-0445c86b69e6'
var roleStorageBlobDataContrib   = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
// Cosmos DB SQL built-in data contributor (data-plane RBAC, not ARM)
var cosmosBuiltinDataContrib     = '00000000-0000-0000-0000-000000000002'

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MONITORING — Log Analytics + Application Insights
// ═══════════════════════════════════════════════════════════════════════════════

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name:     '${prefix}-logs-${env}'
  location: location
  tags:     tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: environment == 'prod' ? 90 : 30
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name:     '${prefix}-insights-${env}'
  location: location
  tags:     tags
  kind:     'web'
  properties: {
    Application_Type:             'web'
    WorkspaceResourceId:          logAnalytics.id
    IngestionMode:                'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery:     'Enabled'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. KEY VAULT
// ═══════════════════════════════════════════════════════════════════════════════

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name:     keyVaultName
  location: location
  tags:     tags
  properties: {
    sku:            { family: 'A', name: 'standard' }
    tenantId:       subscription().tenantId
    enableRbacAuthorization:      true
    enableSoftDelete:             true
    softDeleteRetentionInDays:    environment == 'prod' ? 90 : 7
    enablePurgeProtection:        true
    publicNetworkAccess:          'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass:        'AzureServices'
    }
  }
}

// Grant deployment principal Key Vault Administrator during provisioning
resource kvAdminForDeployment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(keyVault.id, deploymentPrincipalObjectId, 'kvAdmin')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00482a5a-887f-4fb3-b363-3b7fe8e74483') // Key Vault Administrator
    principalId:      deploymentPrincipalObjectId
    principalType:    'User'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. STORAGE ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════════

resource mainStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name:     storageAccountName
  location: location
  tags:     tags
  sku:      { name: environment == 'prod' ? 'Standard_ZRS' : 'Standard_LRS' }
  kind:     'StorageV2'
  properties: {
    accessTier:             'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion:      'TLS1_2'
    allowBlobPublicAccess:  false
    networkAcls: {
      defaultAction: 'Allow'
      bypass:        'AzureServices'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: mainStorage
  name:   'default'
}

resource signbridgeContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name:   'signbridge-assets'
  properties: { publicAccess: 'None' }
}

// Separate storage for Function App runtime state
resource funcStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name:     funcStorageName
  location: location
  tags:     tags
  sku:      { name: 'Standard_LRS' }
  kind:     'StorageV2'
  properties: {
    accessTier:             'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion:      'TLS1_2'
    allowBlobPublicAccess:  false
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. COSMOS DB — Serverless, SQL API
// ═══════════════════════════════════════════════════════════════════════════════

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name:     cosmosAccountName
  location: location
  tags:     tags
  kind:     'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      { locationName: location, failoverPriority: 0, isZoneRedundant: false }
    ]
    capabilities: [
      { name: 'EnableServerless' }
    ]
    enableAutomaticFailover:        false
    enableMultipleWriteLocations:   false
    publicNetworkAccess:            'Enabled'
    enableFreeTier:                 environment == 'dev' ? true : false
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: { tier: 'Continuous7Days' }
    }
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name:   'signbridge'
  properties: {
    resource: { id: 'signbridge' }
  }
}

resource cosmosProfiles 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDb
  name:   'profiles'
  properties: {
    resource: {
      id:           'profiles'
      partitionKey: { paths: ['/userId'], kind: 'Hash', version: 2 }
      indexingPolicy: {
        indexingMode:  'consistent'
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    }
  }
}

resource cosmosConversations 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDb
  name:   'conversations'
  properties: {
    resource: {
      id:           'conversations'
      partitionKey: { paths: ['/roomId'], kind: 'Hash', version: 2 }
      defaultTtl:   environment == 'prod' ? 2592000 : 86400  // 30d prod / 1d dev
      indexingPolicy: {
        indexingMode:  'consistent'
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    }
  }
}

resource cosmosRooms 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDb
  name:   'rooms'
  properties: {
    resource: {
      id:           'rooms'
      partitionKey: { paths: ['/id'], kind: 'Hash', version: 2 }
      indexingPolicy: {
        indexingMode:  'consistent'
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. AZURE AI — Cognitive Services
// ═══════════════════════════════════════════════════════════════════════════════

// 5a. Unified AI Services account (Microsoft Foundry-compatible)
resource aiServices 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name:     aiServicesName
  location: location
  tags:     tags
  kind:     'AIServices'
  sku:      { name: 'S0' }
  properties: {
    customSubDomainName: aiServicesName
    publicNetworkAccess: 'Enabled'
    networkAcls:         { defaultAction: 'Allow' }
    disableLocalAuth:    true
  }
}

// 5b. OpenAI model deployment on unified AI Services
// resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
//   parent: aiServices
//   name:   'gpt-4o-mini'
//   sku: {
//     name:     'GlobalStandard'
//     capacity: 1
//   }
//   properties: {
//     model: {
//       format:  'OpenAI'
//       name:    'gpt-4o-mini'
//       version: '2024-07-18'
//     }
//     versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
//   }
// }

// 5c. Microsoft Foundry Hub
resource foundryHub 'Microsoft.MachineLearningServices/workspaces@2025-12-01' = {
  name:     foundryHubName
  location: location
  tags:     tags
  kind:     'Hub'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    friendlyName: '${prefix}-foundry-hub-${env}'
    description:  'Foundry Hub for SignBridge AI'
    keyVault:     keyVault.id
    storageAccount: mainStorage.id
    applicationInsights: appInsights.id
    publicNetworkAccess: 'Enabled'
  }
}

// 5d. Microsoft Foundry Project (linked to Hub)
resource foundryProject 'Microsoft.MachineLearningServices/workspaces@2025-12-01' = {
  name:     foundryProjectName
  location: location
  tags:     tags
  kind:     'Project'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    friendlyName: '${prefix}-foundry-project-${env}'
    description:  'Foundry Project for SignBridge AI workloads'
    hubResourceId: foundryHub.id
    publicNetworkAccess: 'Enabled'
  }
}

// 5e. Foundry Project connection to unified AI Services
resource foundryAiConnection 'Microsoft.MachineLearningServices/workspaces/connections@2025-12-01' = {
  parent: foundryProject
  name:   foundryConnectionName
  properties: {
    category: 'AIServices'
    target: aiServices.properties.endpoint
    authType: 'AAD'
    isSharedToAll: true
    metadata: {
      ResourceId: aiServices.id
      ApiType: 'AzureAI'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. AZURE SIGNALR SERVICE — Serverless mode
// ═══════════════════════════════════════════════════════════════════════════════

resource signalRService 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name:     signalRName
  location: location
  tags:     tags
  sku: {
    name:     environment == 'prod' ? 'Standard_S1' : 'Free_F1'
    capacity: environment == 'prod' ? 2 : 1
  }
  kind: 'SignalR'
  properties: {
    features: [
      { flag: 'ServiceMode',           value: 'Serverless' }
      { flag: 'EnableConnectivityLogs', value: 'True' }
      { flag: 'EnableMessagingLogs',    value: 'True' }
    ]
    cors: {
      allowedOrigins: environment == 'prod' ? [] : ['*']
    }
    publicNetworkAccess: 'Enabled'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. AZURE COMMUNICATION SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name:     '${prefix}-comm-${env}'
  location: 'global'       // ACS control plane is always global
  tags:     tags
  properties: {
    dataLocation: 'United States'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. COMPUTE — Hosting Plans
// ═══════════════════════════════════════════════════════════════════════════════

// Function App — Consumption plan (Y1)
resource funcPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name:     '${prefix}-funcplan-${env}'
  location: location
  tags:     tags
  sku:      { name: 'Y1', tier: 'Dynamic' }
  kind:     'functionapp'
  properties: {
    reserved: true   // Linux
  }
}

// App Service — B1 plan for Next.js
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name:     '${prefix}-asp-${env}'
  location: location
  tags:     tags
  sku: {
    name: environment == 'prod' ? 'P1v3' : 'B1'
    tier: environment == 'prod' ? 'PremiumV3' : 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true   // Linux
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. FUNCTION APP
// ═══════════════════════════════════════════════════════════════════════════════

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name:     functionAppName
  location: location
  tags:     tags
  kind:     'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: funcPlan.id
    httpsOnly:    true
    siteConfig: {
      linuxFxVersion:        'Node|20'
      minTlsVersion:         '1.2'
      ftpsState:             'Disabled'
      http20Enabled:         true
      functionAppScaleLimit: environment == 'prod' ? 200 : 10
      appSettings: [
        { name: 'AzureWebJobsStorage',        value: 'DefaultEndpointsProtocol=https;AccountName=${funcStorage.name};AccountKey=${funcStorage.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}' }
        { name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING', value: 'DefaultEndpointsProtocol=https;AccountName=${funcStorage.name};AccountKey=${funcStorage.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}' }
        { name: 'WEBSITE_CONTENTSHARE',       value: '${prefix}-func-${env}' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME',    value: 'node' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        // Foundry Project settings (Managed Identity + Project endpoint)
        { name: 'AZURE_AI_PROJECT_ENDPOINT', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-ai-project-endpoint)' }
        { name: 'AZURE_AI_PROJECT_CONNECTION_NAME', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-ai-project-connection)' }
        { name: 'AZURE_OPENAI_DEPLOYMENT',  value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-openai-deployment)' }
        { name: 'AZURE_FOUNDRY_AUTH_MODE',  value: 'ManagedIdentity' }
        { name: 'AZURE_SIGNALR_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-signalr-connection-string)' }
        { name: 'AZURE_COSMOS_ENDPOINT',    value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-cosmos-endpoint)' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-storage-connection-string)' }
      ]
      cors: { allowedOrigins: ['https://${appServiceName}.azurewebsites.net'] }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. APP SERVICE — Next.js
// ═══════════════════════════════════════════════════════════════════════════════

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name:     appServiceName
  location: location
  tags:     tags
  kind:     'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly:    true
    siteConfig: {
      linuxFxVersion:  'NODE|20-lts'
      minTlsVersion:   '1.2'
      ftpsState:       'Disabled'
      http20Enabled:   true
      alwaysOn:        environment == 'prod' ? true : false
      appCommandLine:  'node server.js'
      appSettings: [
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'NEXT_PUBLIC_SIGNALR_URL',  value: 'https://${signalRService.name}.service.signalr.net' }
        // Foundry Project settings (Managed Identity + Project endpoint)
        { name: 'AZURE_AI_PROJECT_ENDPOINT', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-ai-project-endpoint)' }
        { name: 'AZURE_AI_PROJECT_CONNECTION_NAME', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-ai-project-connection)' }
        { name: 'AZURE_OPENAI_DEPLOYMENT',  value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-openai-deployment)' }
        { name: 'AZURE_FOUNDRY_AUTH_MODE',  value: 'ManagedIdentity' }
        { name: 'WEBSITES_PORT',            value: '3000' }
        { name: 'AZURE_SIGNALR_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-signalr-connection-string)' }
        { name: 'AZURE_COMMUNICATION_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-comm-connection-string)' }
        { name: 'AZURE_COSMOS_ENDPOINT',    value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-cosmos-endpoint)' }
        { name: 'AZURE_COSMOS_KEY',         value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-cosmos-key)' }
        { name: 'AZURE_COSMOS_DATABASE',    value: 'signbridge' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=azure-storage-connection-string)' }
        { name: 'AZURE_STORAGE_CONTAINER',  value: 'signbridge-assets' }
      ]
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. API MANAGEMENT — Consumption tier
// ═══════════════════════════════════════════════════════════════════════════════

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name:     apimName
  location: location
  tags:     tags
  sku: {
    name:     'Consumption'
    capacity: 0
  }
  identity: { type: 'SystemAssigned' }
  properties: {
    publisherEmail: 'admin@signbridge.ai'
    publisherName:  'SignBridge AI'
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10':  'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11':  'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'False'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. KEY VAULT SECRETS — Store all service credentials
// ═══════════════════════════════════════════════════════════════════════════════

// resource secretOpenAiEndpoint 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
//   parent: keyVault
//   name:   'azure-ai-project-endpoint'
//   properties: { value: foundryProjectEndpoint }
// }

// resource secretOpenAiKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
//   parent: keyVault
//   name:   'azure-ai-project-connection'
//   properties: { value: foundryAiConnection.name }
// }

resource secretSpeechKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name:   'azure-openai-deployment'
  properties: { value: 'gpt-4o-mini' }
}

resource secretSignalRConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name:   'azure-signalr-connection-string'
  properties: { value: signalRService.listKeys().primaryConnectionString }
}

resource secretCommConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name:   'azure-comm-connection-string'
  properties: { value: communicationService.listKeys().primaryConnectionString }
}

resource secretCosmosEndpoint 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name:   'azure-cosmos-endpoint'
  properties: { value: cosmosAccount.properties.documentEndpoint }
}

resource secretCosmosKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name:   'azure-cosmos-key'
  properties: { value: cosmosAccount.listKeys().primaryMasterKey }
}

resource secretStorageConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name:   'azure-storage-connection-string'
  properties: { value: 'DefaultEndpointsProtocol=https;AccountName=${mainStorage.name};AccountKey=${mainStorage.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. RBAC — Function App managed identity
// ═══════════════════════════════════════════════════════════════════════════════

// Key Vault Secrets User → Function App
resource funcKvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(keyVault.id, functionApp.id, roleKeyVaultSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleKeyVaultSecretsUser)
    principalId:      functionApp.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// Storage Blob Data Contributor → Function App (main storage)
resource funcStorageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(mainStorage.id, functionApp.id, roleStorageBlobDataContrib)
  scope: mainStorage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleStorageBlobDataContrib)
    principalId:      functionApp.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// Cosmos DB Built-in Data Contributor → Function App (data-plane RBAC)
resource funcCosmosRole 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-02-15-preview' = {
  parent: cosmosAccount
  name:   guid(cosmosAccount.id, functionApp.id, cosmosBuiltinDataContrib)
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/${cosmosBuiltinDataContrib}'
    principalId:      functionApp.identity.principalId
    scope:            cosmosAccount.id
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. RBAC — App Service managed identity
// ═══════════════════════════════════════════════════════════════════════════════

// Key Vault Secrets User → App Service
resource appKvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(keyVault.id, appService.id, roleKeyVaultSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleKeyVaultSecretsUser)
    principalId:      appService.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// Storage Blob Data Contributor → App Service
resource appStorageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(mainStorage.id, appService.id, roleStorageBlobDataContrib)
  scope: mainStorage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleStorageBlobDataContrib)
    principalId:      appService.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// Cosmos DB Built-in Data Contributor → App Service (data-plane RBAC)
resource appCosmosRole 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-02-15-preview' = {
  parent: cosmosAccount
  name:   guid(cosmosAccount.id, appService.id, cosmosBuiltinDataContrib)
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/${cosmosBuiltinDataContrib}'
    principalId:      appService.identity.principalId
    scope:            cosmosAccount.id
  }
}

// APIM → Key Vault (so APIM named values can reference secrets)
resource apimKvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(keyVault.id, apim.id, roleKeyVaultSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleKeyVaultSecretsUser)
    principalId:      apim.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// Key Vault Secrets User → Foundry Hub
resource foundryHubKvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(keyVault.id, foundryHub.id, roleKeyVaultSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleKeyVaultSecretsUser)
    principalId:      foundryHub.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// Key Vault Secrets User → Foundry Project
resource foundryProjectKvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(keyVault.id, foundryProject.id, roleKeyVaultSecretsUser)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleKeyVaultSecretsUser)
    principalId:      foundryProject.identity.principalId
    principalType:    'ServicePrincipal'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUTS
// ═══════════════════════════════════════════════════════════════════════════════

@description('App Service URL for the Next.js frontend')
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'

@description('Function App URL for serverless API handlers')
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'

@description('Unified AI Services endpoint')
output openAiEndpoint string = aiServices.properties.endpoint

@description('GPT-4o-mini deployment name')
output openAiDeployment string = 'gpt-4o-mini'

@description('Foundry Project endpoint')
output foundryProjectEndpoint string = foundryProjectEndpoint

@description('Foundry Hub resource ID')
output foundryHubResourceId string = foundryHub.id

@description('Foundry Project resource ID')
output foundryProjectResourceId string = foundryProject.id

@description('SignalR Service URL for client connections')
output signalRUrl string = 'https://${signalRService.name}.service.signalr.net'

@description('Cosmos DB document endpoint')
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint

@description('Cosmos DB database name')
output cosmosDatabaseName string = cosmosDb.name

@description('Main storage account name')
output storageAccountName string = mainStorage.name

@description('Blob container name for assets')
output storageContainerName string = signbridgeContainer.name

@description('Key Vault URI — use for @Microsoft.KeyVault() references in app settings')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Application Insights connection string')
output appInsightsConnectionString string = appInsights.properties.ConnectionString

@description('API Management gateway URL')
output apimGatewayUrl string = apim.properties.gatewayUrl

@description('Function App system-assigned managed identity principal ID')
output functionAppPrincipalId string = functionApp.identity.principalId

@description('App Service system-assigned managed identity principal ID')
output appServicePrincipalId string = appService.identity.principalId
