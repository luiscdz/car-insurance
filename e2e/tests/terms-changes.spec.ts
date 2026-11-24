import { expect, test } from './fixtures.js';
import { type PublishedTerms, StrapiAdmin } from './support/strapi-admin.js';
import {
  reachSummary,
  SEEDED_SUMMARY_COPY,
  SEEDED_TERMS,
  SUMMARY_STEP,
  heading,
  viewTermsButton,
} from './support/wizard.js';

/**
 * AC-074: a terms change published in Strapi shows on the next load, with no code change or
 * deployment, and a draft never shows. Runs alone after the plan changes because it changes the
 * seeded terms; the changed entry is restored and the created draft deleted afterwards, so the
 * seed is left as it was.
 */
test.describe.configure({ mode: 'serial' });

const ADDED = 'Cambio publicado por el equipo de negocio: este párrafo nuevo se ve al recargar.';
const DRAFT = 'Borrador de los términos que nunca debe mostrarse.';

let admin: StrapiAdmin;
let original: PublishedTerms;
const drafts: string[] = [];

test.beforeAll(async () => {
  admin = await StrapiAdmin.connect();
  const [terms] = await StrapiAdmin.publishedTerms('cl');
  if (!terms) {
    throw new Error('Chile has no published terms');
  }
  original = terms;
});

test.afterAll(async () => {
  for (const id of drafts) {
    await admin.deleteTerms(id);
  }
  if (original) {
    await admin.publishTerms(original.documentId, { text: original.text });
  }
});

test('AC-074 a terms change published in Strapi is shown after a reload', async ({ page }) => {
  const copy = SEEDED_SUMMARY_COPY.cl;
  await reachSummary(page, 'cl');

  await admin.publishTerms(original.documentId, { text: `${original.text}\n\n${ADDED}` });
  await page.reload();
  await expect(heading(page)).toHaveText(SUMMARY_STEP);
  await viewTermsButton(page, 'cl').click();

  const dialog = page.getByRole('dialog', { name: copy.termsTitle });
  const paragraphs = dialog.locator('p');
  await expect(paragraphs).toHaveCount(SEEDED_TERMS.cl.paragraphs + 1);
  await expect(paragraphs.first()).toHaveText(SEEDED_TERMS.cl.first);
  await expect(paragraphs.last()).toHaveText(ADDED);
});

test('AC-074 a draft terms entry is never shown and the country stays available', async ({
  page,
}) => {
  const copy = SEEDED_SUMMARY_COPY.co;
  drafts.push(await admin.createTerms(await StrapiAdmin.countryId('co'), DRAFT, false));
  expect(await StrapiAdmin.publishedTerms('co')).toHaveLength(1);

  await reachSummary(page, 'co');
  await viewTermsButton(page, 'co').click();

  const dialog = page.getByRole('dialog', { name: copy.termsTitle });
  await expect(dialog.locator('p').first()).toHaveText(SEEDED_TERMS.co.first);
  await expect(dialog).not.toContainText(DRAFT);
});
