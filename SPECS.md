# SPECS — SaaS BYOS (Supabase por Cliente) + Atualizações via Edge Function

## 1. Arquitetura
### 1.1 Separação de Planos
- Control Plane (CP): Supabase do SaaS (seu), armazena clientes, status, metadados, versões.
- Data Plane (DP): Supabase dedicado por cliente (criado pelo superadmin), armazena dados do produto e funções locais (Edge).

### 1.2 Objetivo técnico
- CP nunca guarda credenciais root do cliente.
- DP executa migrações localmente via Edge Function e registra estado em tabela de controle.

## 2. Modelo de Dados — Control Plane
### 2.1 Tabela: clients
Campos sugeridos:
- id (uuid)
- name (text)
- status (enum: provisioning | connected | error | suspended)
- created_at (timestamptz)
- updated_at (timestamptz)

### 2.2 Tabela: client_connections
- client_id (uuid FK clients.id)
- supabase_url (text)
- anon_key (text)
- migrations_endpoint (text)  # URL da Edge Function
- current_version (text)      # cache opcional
- last_check_at (timestamptz)
- connection_status (enum: ok | needs_attention | invalid)
- created_at, updated_at

Observação:
- anon_key é “publicável”, mas tratar como dado operacional. Evitar logs e exposição desnecessária.

### 2.3 Tabela: releases
- version (text, ex: 1.0.0)
- released_at (timestamptz)
- notes_md (text)            # changelog resumido para UI
- migrations_manifest (jsonb) # lista ordenada de migrações e checksums
- is_latest (bool)

## 3. Modelo de Dados — Data Plane (Supabase do Cliente)
### 3.1 Tabela: app_migrations
- version (text PK)          # ex: 1.0.0, 1.0.1...
- name (text)
- checksum (text)
- applied_at (timestamptz)
- applied_by (text)          # user id/email (se disponível)
- status (enum: applied | failed)
- error_message (text, nullable)

### 3.2 Tabelas do produto (V1 - Módulo Pacientes)

#### 3.2.1 Tabela: patients
- id (uuid PK)
- full_name (text)
- document_id (text, CPF/RG)
- birth_date (date)
- contact_phone (text)
- contact_email (text)
- created_at, updated_at

#### 3.2.2 Tabela: clinical_records (Anamneses)
- id (uuid PK)
- patient_id (uuid FK patients.id)
- type (enum: 'anamnesis', 'certificate', 'exam_upload')
- content (jsonb) -- Para flexibilidade de formulários de anamnese
- created_at
- created_by (user_id)

#### 3.2.3 Tabela: budgets
- id (uuid PK)
- patient_id (uuid FK patients.id)
- status (enum: 'draft', 'presented', 'approved', 'rejected')
- total_value (numeric)
- items (jsonb) -- Array de procedimentos [{name, value, obs}]
- created_at, updated_at

#### 3.2.4 Tabela: patient_documents
- id (uuid PK)
- patient_id (uuid FK patients.id)
- name (text)
- storage_path (text)
- file_type (text)
- uploaded_at

## 4. Migrations: formato e idempotência
### 4.1 Manifest de migrações
- Em CP, para cada release, manter `migrations_manifest`:
  - [{ version, name, checksum, sql }]
- O DP aplica em ordem crescente (sem pular).

### 4.2 Regras de idempotência
- Cada migração deve ser segura para reexecução sempre que possível:
  - CREATE TABLE IF NOT EXISTS
  - CREATE INDEX IF NOT EXISTS
  - ALTER TABLE ADD COLUMN IF NOT EXISTS
  - Para casos sem IF NOT EXISTS, usar checks (information_schema / pg_catalog).
- Antes de aplicar migração, verificar em `app_migrations` se version já está aplicada.
- Se a migração falhar:
  - registrar status=failed e error_message
  - não registrar como applied

## 5. Edge Function (Data Plane): apply_migrations
### 5.1 Endpoint
- POST /functions/v1/apply_migrations

### 5.2 Entrada (JSON)
- target_version: string | null (se null, aplicar até latest conhecido pelo CP)
- dry_run: boolean (V1 = false, futuro)
- request_id: string (gerado no CP/front para rastreio)

### 5.3 Saída (JSON)
- ok: boolean
- applied: [{ version, name }]
- skipped: [{ version, reason }]
- failed: { version, error } | null
- current_version: string
- logs_ref: string | null

### 5.4 Autorização (V1)
Escolha V1 recomendada:
- exigir que o cliente esteja logado no DP (JWT)
- permitir apenas usuários com role "admin" (via claims/metadados + RLS/policy)
- alternativa futura: token server-to-server

## 6. Fluxo “Atualização disponível” no Front
### 6.1 Detecção de update
- CP mantém latest_version.
- App consulta DP para current_version:
 R: ler `app_migrations` (última versão applied).
- Se current_version < latest_version: exibir banner.

### 6.2 Execução
- Clique “Atualizar” chama apply_migrations no DP.
- O front só muda estado para “Atualizado” se ok=true e current_version == latest_version.
- Se ok=false:
  - exibir erro resumido
  - exibir logs_ref/request_id

## 7. Integração com n8n (DP)
- n8n do cliente escreve no DP (mesmas tabelas).
- Front lê do DP.
- Realtime é opcional (fora do escopo V1).

## 8. Observabilidade e auditoria
- Todas as chamadas de update devem gerar request_id.
- CP registra:
  - client_id, requested_version, request_id, started_at, finished_at, result
- DP registra em app_migrations:
  - status, error_message
- Logs:
  - nunca logar tokens/keys
  - logar request_id e versão

## 9. Regras anti-alucinação (produto e agente)
- “Sem evidência, sem afirmação”: nunca afirmar update concluído sem retorno ok=true.
- Todas as ações com efeito persistente devem passar por tool/endpoint e retornar confirmação.
- Saídas estruturadas validadas (JSON) para operações críticas.

## 10. Segurança
- Nunca armazenar service_role do DP no CP.
- Segregar CP e DP, não misturar dados.
- Princípio do menor privilégio no DP.
