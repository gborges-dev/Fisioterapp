import { expect, test } from '@playwright/test'

// Smoke: não depende da API.
test('a página /login exibe E-mail, Senha e Entrar desabilitado até preencher', async ({ page }) => {
  await page.goto('/login')

  const email = page.getByLabel('E-mail')
  const senha = page.getByLabel('Senha', { exact: true })
  const entrar = page.getByRole('button', { name: 'Entrar' })

  await expect(email).toBeVisible()
  await expect(senha).toBeVisible()
  await expect(entrar).toBeDisabled()

  await email.fill('teste@exemplo.com')
  await senha.fill('senha-qualquer')
  await expect(entrar).toBeEnabled()
})
