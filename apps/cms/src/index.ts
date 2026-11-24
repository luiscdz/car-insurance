import type { Core } from '@strapi/strapi';
import { disableSelfRegistration, restrictPublicRole } from './bootstrap/public-permissions';
import { seedWhenEmpty } from './seed';

export default {
  register() {},

  /**
   * Runs before the server starts: leaves the public role with only the read permissions the
   * wizard needs, turns off self-registration and seeds both countries on an empty database.
   * Every step is idempotent (docs/architecture.md).
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await restrictPublicRole(strapi);
    await disableSelfRegistration(strapi);
    await seedWhenEmpty(strapi);
  },
};
