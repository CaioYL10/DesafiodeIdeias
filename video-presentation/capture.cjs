// Capturas reais do protótipo em um contexto descartável do navegador.
const { chromium } = require('playwright');
const path = require('node:path');

const output = path.join(__dirname, 'public', 'captures');
const base = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const capture = async (name) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(output, name + '.png'), animations: 'disabled' });
    console.log(name, await page.title(), page.url());
  };

  await page.goto(base, { waitUntil: 'networkidle' });
  await capture('01-public');
  await page.goto(base + '/login', { waitUntil: 'networkidle' });
  await page.locator('input[name=email]').fill('demo@cti.local');
  await page.locator('input[name=password]').fill('demonstracao');
  await page.locator('#login-form button').click();
  await page.getByText('Conheça cada cliente').waitFor();
  await capture('02-overview');

  await page.goto(base + '/clientes', { waitUntil: 'networkidle' });
  await capture('03-clients');
  await page.locator('[data-action=profile]').first().click();
  await capture('04-profile');
  await page.locator('[data-action=close]').first().click();

  await page.goto(base + '/feedbacks', { waitUntil: 'networkidle' });
  await capture('05-feedbacks');
  await page.locator('#sentiment-filter').selectOption('Negativo');
  await page.locator('[data-action=filter]').click();
  await capture('06-feedbacks-filtered');

  await page.goto(base + '/triagem', { waitUntil: 'networkidle' });
  await capture('07-triage');
  await page.locator('[data-action=analyze]').first().click();
  await capture('08-triage-review');
  await page.locator('[data-action=use-suggestion]').click();
  await page.locator('#decision-note').fill('Relatos conferidos pela equipe; acompanhar a resposta ao cliente.');
  await capture('09-human-decision');
  await page.locator('[data-action=accept]').click();

  await page.goto(base + '/acoes', { waitUntil: 'networkidle' });
  await capture('10-actions');
  await page.locator('[data-action=action]').first().click();
  await page.locator('#action-status').selectOption('Em andamento');
  await page.locator('#action-note').fill('Responsável definido para revisar os prazos de retorno.');
  await capture('11-action-followup');
  await page.locator('[data-action=save-action]').click();
  await capture('12-action-updated');

  await page.goto(base + '/dashboard', { waitUntil: 'networkidle' });
  await capture('13-dashboard-feedbacks');
  await page.locator('[data-action=dashboard-relations]').click();
  await capture('14-dashboard-relations');
  await page.locator('[data-action=dashboard-financial]').click();
  await capture('15-dashboard-financial');
  await context.close();
  await browser.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
