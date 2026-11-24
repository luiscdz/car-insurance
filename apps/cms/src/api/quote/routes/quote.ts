/**
 * The price-quote endpoint (docs/architecture.md, plan D1): `POST /api/quote/price`. Inputs travel
 * in the JSON body, never in the address the request logger writes (AC-046). The public role is
 * granted exactly this action, `api::quote.quote.price` (AC-066).
 */
export default {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/quote/price',
      handler: 'api::quote.quote.price',
      config: { policies: [], middlewares: [] },
    },
  ],
};
