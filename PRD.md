# PRD — SaaS Multi-tenant BYOS (Supabase por Cliente)

## 1. Visão
Construir um SaaS onde cada cliente possui seu próprio projeto Supabase (banco isolado), provisionado pelo superadmin. O cliente usa o sistema no dia a dia, e o produto consegue evoluir com novas funcionalidades via atualizações de schema controladas, aplicadas com 1 clique (Atualização disponível → Atualizar).

## 2. Problema
- Preciso administrar vários clientes com isolamento total de dados (cada um com seu banco).
- Preciso atualizar o schema do banco de cada cliente quando o produto evoluir (novas tabelas/colunas/policies), sem “refazer” o que já foi aplicado.
- Preciso evitar comportamento enganoso: o sistema não pode dizer que atualizou se não atualizou.

## 3. Objetivos
- Provisionar clientes com Supabase dedicado (Data Plane).
- Garantir que o app (Front) e automações (n8n do cliente) compartilhem o mesmo banco do cliente.
- Manter um mecanismo de atualização incremental e idempotente.
- Reduzir risco de “alucinação” em operações (principalmente update e dados).

## 4. Usuários
### 4.1 Superadmin (você)
- Cria clientes e provisiona Supabase de cada um.
- Faz setup inicial.
- Acompanha status/versão dos clientes.
- Suporte e auditoria no Control Plane.

### 4.2 Cliente final
- Usa o sistema (ex.: CRM odontologia).
- Pode ver “Atualização disponível” e aplicar com 1 clique (dependendo do nível de permissão definido).

## 5. Escopo V1
### 5.1 Provisionamento e Conexão
- Criar cliente no Control Plane.
- Associar cliente a um Supabase dedicado (criado pelo superadmin).
- Registrar no Control Plane: supabase_url, anon_key, endpoints de funções, status.

### 5.2 Funcionalidade Principal (MVP V1: Gestão de Pacientes)
- **Cadastro de Pacientes**: Identificação completa.
- **Prontuário Digital**:
  - **Orçamentos**: Criação e gestão de orçamentos para tratamentos.
  - **Anamnese**: Fichas de histórico clínico personalizáveis.
  - **Atestados**: Geração de documentos padrão.
  - **Anexos**: Upload de documentos/exames do paciente.

### 5.3 Atualizações de banco (V1)
- Tabela `app_migrations` no Supabase do cliente para versionamento.
- Edge Function `apply_migrations` no Supabase do cliente.
- UI no app: banner “Atualização disponível” no topo.
- Botão “Atualizar”: aplica migrações pendentes.

### 5.4 Design System & UX
- **Estilo**: Clean & High-End ("Apple-like").
- **Visual**: Fundo branco predominante, muito espaço negativo (breathable), tipografia fina e refinada (Inter ou similar premium).
- **Sensação**: Sofisticação e organização. Evitar poluição visual.

## 6. Fora do escopo (V1)
- Agendamento complexo (apenas básico se necessário).
- Financeiro avançado (apenas orçamentos).

## 7. Requisitos de Segurança (alto nível)
- Não armazenar service_role do cliente no Control Plane.
- Não expor segredos em logs.
- O botão “Atualizar” deve exigir autorização (definir em SPECS).

## 8. Métricas de Sucesso
- Conversão: % clientes ativados (provisionados + setup concluído).
- Escalabilidade: suportar crescimento para 10k clientes com isolamento total.
- Confiabilidade de update: taxa de updates bem-sucedidos / falhas.
- Suporte: tempo médio para diagnosticar falha de update (com logs).

## 9. Critérios de Aceitação (V1)
1) Criar cliente e associar Supabase dedicado com status “Conectado”.
2) O Supabase do cliente deve ter `app_migrations` e Edge Function de migração disponíveis.
3) Quando existir nova versão, aparece “Atualização disponível”.
4) Ao clicar “Atualizar”, o sistema aplica somente migrações pendentes.
5) Se falhar, o sistema:
   - não marca como atualizado
   - mostra erro técnico resumido e um ID de log
6) O sistema nunca afirma que atualizou sem retorno positivo da função.
