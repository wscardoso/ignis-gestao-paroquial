# 🔥 IGNIS — Audit Completo do Projeto

**Data:** 2026-03-11  
**Versão:** SPA React + Supabase (Lovable Cloud)

---

## 1. Páginas / Rotas

O projeto é **SPA sem React Router** — usa tabs no Sidebar + level switcher. Não há rotas URL, apenas estados internos.

| Tab / Visão | Componente | Conectado ao Banco? |
|---|---|---|
| **Login** | `Login.tsx` | ✅ Supabase Auth |
| **Home (Super Admin)** | `SystemHealth` + `ParishesTable` | ✅ Lê `tenants` |
| **Home (Matriz)** | `MatrizDashboard` + `ClergyManager` + `StaffDirectory` | ⚠️ Parcial (`ClergyManager` e `StaffDirectory` = hardcoded) |
| **Home (Comunidade)** | `LocalTriagem` | ⚠️ Parcial |
| **Home (Fiel)** | `FielHome` | ❌ Visual apenas |
| **Agenda do Padre** (`priest-agenda`) | `PriestAgenda` | ✅ Lê/atualiza `appointments` |
| **Missio** (`missio`) | `MatrizDashboard` → `SchedulingGrid` | ✅ CRUD `appointments` |
| **Sacramenta** (`sacramenta`) | `SacramentRegistry` | ✅ Lê/cria `sacraments` |
| **Pastoralis** (`pastoralis`) | `PeopleDirectory` | ✅ CRUD `people` |
| **Relatórios** (`reports`) | `ReportsPanel` | ❌ Dados 100% mock |
| **Mapa Global** (`global-map`) | `GlobalPastoralMap` | ✅ Lê `tenants` + stats |

---

## 2. Gerenciamento de Usuários

| Funcionalidade | Existe? | Conectado ao Banco? |
|---|---|---|
| Página de listagem de usuários | ❌ | — |
| Formulário criar usuário | ❌ (apenas signup) | — |
| Formulário editar usuário/role | ❌ | — |
| Formulário deletar usuário | ❌ | — |
| Login / Signup | ✅ | ✅ Supabase Auth |
| Perfil do usuário logado | ✅ (lê `profiles`) | ✅ |

---

## 3. Gerenciamento de Sacramentos

| Funcionalidade | Existe? | Conectado ao Banco? |
|---|---|---|
| Página de listagem | ✅ `SacramentRegistry` | ✅ Lê `sacraments` |
| Formulário criar | ✅ `SacramentForm` | ✅ `ignisApi.sacraments.create` |
| Formulário editar | ❌ | — |
| Deletar sacramento | ❌ | — |
| Busca / filtro | ✅ | ✅ `ignisApi.sacraments.search` |
| Certidão / Preview | ✅ `CertificatePreview` | ✅ (dados do registro) |

---

## 4. Gerenciamento de Agendamentos

| Funcionalidade | Existe? | Conectado ao Banco? |
|---|---|---|
| Grid de agendamentos | ✅ `SchedulingGrid` | ✅ CRUD `appointments` |
| Agenda do padre (visão diária) | ✅ `PriestAgenda` | ✅ Lê/atualiza status |
| Criar agendamento | ✅ `AppointmentModal` + `AppointmentWizard` | ✅ |
| Editar agendamento | ✅ `AppointmentModal` | ✅ `ignisApi.appointments.update` |
| Cancelar / deletar | ✅ | ✅ `ignisApi.appointments.delete` |
| Detecção de conflito de horário | ✅ | ✅ |
| Notificação WhatsApp | ✅ | ✅ Edge Function `send-whatsapp` |

---

## 5. Gerenciamento de Comunidades

| Funcionalidade | Existe? | Conectado ao Banco? |
|---|---|---|
| Página de listagem | ✅ `CommunitiesManager` | ✅ Lê `sub_tenants` |
| Criar comunidade | ✅ `UnitSettingsModal` | ✅ `ignisApi.communities.create` |
| Editar comunidade | ✅ `UnitSettingsModal` | ✅ `ignisApi.communities.update` |
| Deletar comunidade | ⚠️ Botão existe, **sem handler implementado** | ❌ |

---

## 6. Relatórios e Estatísticas

| Funcionalidade | Existe? | Conectado ao Banco? |
|---|---|---|
| Página de relatórios | ✅ `ReportsPanel` | ❌ Dados 100% mock |
| Dashboard analytics | ✅ `AnalyticsDashboard` | ❌ Dados 100% mock |
| KPIs do header | ✅ `useDashboardKPIs` | ✅ Queries reais ao banco |
| Exportar / Imprimir | ⚠️ `window.print()` apenas | Imprime dados mock |

---

## 7. Resumo Geral

| Área | Status |
|---|---|
| 🔐 Autenticação (Login/Signup) | ✅ Funcional |
| 👥 Gestão de Usuários | ❌ **Não existe** |
| ⛪ Sacramentos | ✅ Criar + Listar · ❌ Editar/Deletar |
| 📅 Agendamentos | ✅ **CRUD completo** |
| 🏘️ Comunidades | ✅ Criar/Editar · ❌ Deletar sem handler |
| 📊 Relatórios | ❌ **Tudo mock** |
| 🧑‍💼 Staff / Clero | ❌ **Hardcoded** |
| 🏠 Fiel Home | ❌ **Visual apenas** |

---

## 8. Estrutura de Banco de Dados

### Tabelas existentes:
- `tenants` — Paróquias
- `sub_tenants` — Comunidades/Capelas
- `profiles` — Perfis de usuários (linked to `auth.users`)
- `roles` — Roles separados
- `appointments` — Agendamentos
- `sacraments` — Registros sacramentais
- `people` — Diretório de pessoas/fiéis

### Funções de banco:
- `get_my_role()` — Retorna role do usuário autenticado (security definer)
- `get_my_tenant_id()` — Retorna tenant_id do usuário autenticado (security definer)
- `handle_new_user()` — Trigger que cria profile ao signup
- `update_updated_at_column()` — Trigger de timestamp

### Edge Functions:
- `create-parish-admin` — Onboarding de nova paróquia + admin
- `send-whatsapp` — Envio de confirmação WhatsApp

---

## 9. Próximos Passos Recomendados

1. **Criar gestão de usuários** — Listagem, criação, edição de roles e exclusão
2. **Completar CRUD de sacramentos** — Adicionar edição e exclusão
3. **Conectar relatórios ao banco** — Substituir dados mock por queries reais
4. **Implementar exclusão de comunidades** — Handler no botão de delete
5. **Conectar Staff/Clero ao banco** — Substituir dados hardcoded
6. **Implementar Fiel Home funcional** — Histórico sacramental, próximos agendamentos
