import { factories } from '@strapi/strapi';

// Read-only content API: the wizard only reads plans (P4, docs/architecture.md).
export default factories.createCoreRouter('api::plan.plan', {
  only: ['find', 'findOne'],
});
