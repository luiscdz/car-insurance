/**
 * The stateless custom endpoints (docs/architecture.md): the price quote, `POST /api/quote/price`
 * (plan D1 of CHG-002), and the simulated payment, `POST /api/quote/pay` (plan D1 of CHG-003).
 * Inputs travel in the JSON body, never in the address the request logger writes (AC-046,
 * AC-079). The public role is granted exactly these two actions, `api::quote.quote.price` and
 * `api::quote.quote.pay` (AC-082).
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
    {
      method: 'POST',
      path: '/quote/pay',
      handler: 'api::quote.quote.pay',
      config: { policies: [], middlewares: [] },
    },
  ],
};
