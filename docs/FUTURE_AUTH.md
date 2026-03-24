# Fase futura: autenticação e multi-tenant

Este protótipo corre **sem login**. Antes de dados reais em produção:

1. Ativar **Supabase Auth** (email, magic link ou OAuth).
2. Substituir políticas RLS permissivas para `anon` por regras baseadas em `auth.uid()`.
3. Associar `patients`, `form_templates` e restantes tabelas a um `therapist_id` / `user_id`.
4. Adicionar **guards** nas rotas React e remover o acesso anónimo à API.

Consulte o plano do produto e o ficheiro SQL de migração para a evolução do esquema.
