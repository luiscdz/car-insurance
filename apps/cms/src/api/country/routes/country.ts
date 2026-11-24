import { factories } from '@strapi/strapi';

// Read-only content API: the wizard only reads this content (P4, docs/architecture.md).
export default factories.createCoreRouter('api::country.country', {
  only: ['find', 'findOne'],
});
