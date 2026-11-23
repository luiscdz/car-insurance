import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    // Only the web application's origin may call the API from a browser.
    name: 'strapi::cors',
    config: {
      origin: env.array('CORS_ORIGIN', ['http://localhost:4200', 'http://localhost:8080']),
      methods: ['GET', 'POST', 'OPTIONS'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
