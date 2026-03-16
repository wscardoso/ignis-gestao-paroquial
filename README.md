# Ignis - Sistema de Gestão Paroquial

Sistema completo de gestão sacramental e paroquial.

## Roadmap & Planejamento

### FASE 0 — FUNDAÇÃO ✅
- [x] Auth Supabase validado (login, logout, refresh token)
- [x] RLS policies revisadas
- [x] Tipografia Cinzel + Lato aplicada globalmente
- [x] React Query configurado
- [x] Schema Supabase atualizado

### FASE 1 — MVP MISSIO ✅
- [x] Visão Diária, Semanal e Mensal
- [x] Formulário de agendamento com máscara WhatsApp
- [x] Filtros por Comunidade
- [x] Modal de detalhes + permissões por perfil

### FASE 2 — EXPANSÃO ✅
- [x] Sacramenta conectado ao backend (Batismos/Matrimônios)
- [x] Pastoralis conectado ao backend (Diretório de Pessoas)
- [x] Polimento visual contínuo

### FASE 3 — PRODUÇÃO ✅
- [x] Responsividade mobile (sidebar mobile, grids adaptativos)
- [x] Acessibilidade (focus-visible, prefers-reduced-motion, sr-only)
- [x] Error boundaries globais
- [x] Toast notifications estilizadas
- [x] Triggers e dados seed no banco
- [ ] CI/CD (GitHub Actions)
- [ ] Testes E2E (Playwright)

---

## Stack
- Vite + React + TypeScript
- @tanstack/react-query
- lucide-react (Icons)
- Lovable Cloud / Supabase (Auth, RLS, Database, Edge Functions)
- date-fns · recharts · react-hot-toast

## Banco de Dados
Tabelas com RLS ativo:
- `tenants` — Paróquias
- `sub_tenants` — Comunidades / Capelas
- `profiles` — Perfis de usuário (auto-criados no signup)
- `appointments` — Agendamentos (Missio)
- `sacraments` — Batismos, Matrimônios, Crismas (Sacramenta)
- `people` — Diretório de fiéis (Pastoralis)
