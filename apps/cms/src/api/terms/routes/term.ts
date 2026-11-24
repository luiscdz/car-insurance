import { factories } from '@strapi/strapi';

// Read-only content API: the wizard only reads the terms of a country (P4, docs/architecture.md).
export default factories.createCoreRouter('api::terms.term', {
  only: ['find', 'findOne'],
});
