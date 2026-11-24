import type { Core } from '@strapi/strapi';
import { describe, expect, it } from 'vitest';
import { disableSelfRegistration, PUBLIC_ACTIONS, restrictPublicRole } from './public-permissions';

interface Permission {
  id: number;
  action: string;
  role: number;
}

/** Defaults the users-permissions plugin gives the public role on a fresh start. */
const PLUGIN_DEFAULTS = [
  'plugin::users-permissions.auth.callback',
  'plugin::users-permissions.auth.connect',
  'plugin::users-permissions.auth.forgotPassword',
  'plugin::users-permissions.auth.resetPassword',
  'plugin::users-permissions.auth.register',
  'plugin::users-permissions.auth.emailConfirmation',
  'plugin::users-permissions.auth.sendEmailConfirmation',
  'plugin::users-permissions.auth.refresh',
];

const PUBLIC_ROLE_ACTIONS = [
  'api::country.country.find',
  'api::country.country.findOne',
  'api::form-field.form-field.find',
  'api::form-field.form-field.findOne',
  'api::plan.plan.find',
  'api::plan.plan.findOne',
  'api::quote.quote.price',
  'api::wizard-step.wizard-step.find',
  'api::wizard-step.wizard-step.findOne',
];

function fakeStrapi(permissions: Permission[], publicRole: { id: number } | null = { id: 2 }) {
  let nextId = permissions.length + 1;
  const query = (uid: string) => ({
    findOne: async () => (uid.endsWith('.role') ? publicRole : null),
    findMany: async ({ where }: { where: { role: number } }) =>
      permissions.filter((p) => p.role === where.role),
    create: async ({ data }: { data: Omit<Permission, 'id'> }) => {
      const created = { ...data, id: nextId++ };
      permissions.push(created);
      return created;
    },
    delete: async ({ where }: { where: { id: number } }) => {
      const index = permissions.findIndex((p) => p.id === where.id);
      return index === -1 ? null : permissions.splice(index, 1)[0];
    },
  });
  return { db: { query } } as unknown as Core.Strapi;
}

function fakeStore(initial: Record<string, unknown> | null) {
  const saved: { value: Record<string, unknown> | null; writes: number } = {
    value: initial,
    writes: 0,
  };
  const strapi = {
    store: () => ({
      get: async () => saved.value,
      set: async ({ value }: { value: Record<string, unknown> }) => {
        saved.value = value;
        saved.writes += 1;
      },
    }),
  } as unknown as Core.Strapi;
  return { strapi, saved };
}

const actionsOf = (permissions: Permission[], role = 2) =>
  permissions
    .filter((p) => p.role === role)
    .map((p) => p.action)
    .sort();

describe('public role permissions', () => {
  it('AC-001 AC-004 AC-066 the public role ends with exactly the read actions of the wizard content, plans included, and the price quote', async () => {
    const permissions: Permission[] = [];

    await restrictPublicRole(fakeStrapi(permissions));

    expect(actionsOf(permissions)).toEqual(PUBLIC_ROLE_ACTIONS);
  });

  it('AC-001 AC-066 removes the users-permissions defaults and any other public permission, plan writes included', async () => {
    const permissions: Permission[] = [
      ...PLUGIN_DEFAULTS,
      'api::country.country.find',
      'api::country.country.create',
      'api::plan.plan.create',
      'api::plan.plan.update',
      'api::plan.plan.delete',
    ].map((action, index) => ({ id: index + 1, action, role: 2 }));
    permissions.push({ id: 99, action: 'plugin::users-permissions.user.me', role: 1 });

    await restrictPublicRole(fakeStrapi(permissions));

    expect(actionsOf(permissions)).toEqual(PUBLIC_ROLE_ACTIONS);
    expect(actionsOf(permissions, 1)).toEqual(['plugin::users-permissions.user.me']);
  });

  it('AC-001 AC-066 is idempotent when the bootstrap runs again', async () => {
    const permissions: Permission[] = [];
    const strapi = fakeStrapi(permissions);

    await restrictPublicRole(strapi);
    const afterFirst = [...permissions];
    await restrictPublicRole(strapi);

    expect(permissions).toEqual(afterFirst);
    expect(permissions).toHaveLength(PUBLIC_ACTIONS.length);
  });

  it('AC-001 fails clearly when the public role is missing', async () => {
    await expect(restrictPublicRole(fakeStrapi([], null))).rejects.toThrow(/public role/);
  });

  it('AC-001 turns off self-registration and keeps the other advanced settings', async () => {
    const { strapi, saved } = fakeStore({ allow_register: true, unique_email: true });

    await disableSelfRegistration(strapi);

    expect(saved.value).toEqual({ allow_register: false, unique_email: true });
  });

  it('AC-001 disabling self-registration is idempotent and works without stored settings', async () => {
    const disabled = fakeStore({ allow_register: false });
    await disableSelfRegistration(disabled.strapi);
    expect(disabled.saved.writes).toBe(0);

    const missing = fakeStore(null);
    await disableSelfRegistration(missing.strapi);
    expect(missing.saved.value).toEqual({ allow_register: false });
  });
});
