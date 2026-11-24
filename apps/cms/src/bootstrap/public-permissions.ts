import type { Core } from '@strapi/strapi';

/**
 * Content types the wizard reads through the public role. The public role ends every bootstrap
 * with exactly `find` and `findOne` on these types, as listed in docs/architecture.md (P4).
 */
export const PUBLIC_READ_CONTENT_TYPES = [
  'api::country.country',
  'api::wizard-step.wizard-step',
  'api::form-field.form-field',
  'api::plan.plan',
] as const;

/** Custom endpoints the browser calls without a token: the price quote (AC-066). */
export const PUBLIC_ENDPOINT_ACTIONS = ['api::quote.quote.price'] as const;

const READ_ACTIONS = ['find', 'findOne'] as const;

/** Every action of the public role: the read actions plus the custom endpoints, nothing else. */
export const PUBLIC_ACTIONS: readonly string[] = [
  ...PUBLIC_READ_CONTENT_TYPES.flatMap((uid) => READ_ACTIONS.map((action) => `${uid}.${action}`)),
  ...PUBLIC_ENDPOINT_ACTIONS,
];

const ROLE_UID = 'plugin::users-permissions.role';
const PERMISSION_UID = 'plugin::users-permissions.permission';

interface StoredPermission {
  readonly id: number;
  readonly action: string;
}

/**
 * Leaves the public role with exactly the actions of {@link PUBLIC_ACTIONS}: any other
 * permission, including the users-permissions defaults (register, callback, connect, password
 * reset, email confirmation, refresh), is removed, and missing actions are added. Running it
 * again changes nothing (idempotent).
 */
export async function restrictPublicRole(strapi: Core.Strapi): Promise<void> {
  const publicRole = await strapi.db.query(ROLE_UID).findOne({ where: { type: 'public' } });
  if (!publicRole) {
    throw new Error('The users-permissions public role does not exist');
  }
  const existing: StoredPermission[] = await strapi.db
    .query(PERMISSION_UID)
    .findMany({ where: { role: publicRole.id } });
  for (const permission of existing) {
    if (!PUBLIC_ACTIONS.includes(permission.action)) {
      await strapi.db.query(PERMISSION_UID).delete({ where: { id: permission.id } });
    }
  }
  const granted = new Set(existing.map((permission) => permission.action));
  for (const action of PUBLIC_ACTIONS) {
    if (!granted.has(action)) {
      await strapi.db.query(PERMISSION_UID).create({ data: { action, role: publicRole.id } });
    }
  }
}

interface AdvancedSettings {
  readonly allow_register?: boolean;
  readonly [setting: string]: unknown;
}

/**
 * Turns off end-user self-registration in the users-permissions advanced settings: the wizard
 * has no user accounts, so nobody may create one through the public API (P4). Idempotent.
 */
export async function disableSelfRegistration(strapi: Core.Strapi): Promise<void> {
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = (await store.get({ key: 'advanced' })) as AdvancedSettings | null | undefined;
  if (advanced?.allow_register !== false) {
    await store.set({ key: 'advanced', value: { ...(advanced ?? {}), allow_register: false } });
  }
}
