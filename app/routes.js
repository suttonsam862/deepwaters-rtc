import {hydrogenRoutes} from '@shopify/hydrogen';
import {index, route} from '@react-router/dev/routes';

// This site is a single-purpose management app — no storefront.
// Only the ledger (at "/") and a catch-all 404 are registered. The
// storefront route files from the template remain on disk but are
// intentionally not wired up, so they're never built or reachable.
export default hydrogenRoutes([
  index('routes/_index.jsx'),
  route('*', 'routes/$.jsx'),
]);

/** @typedef {import('@react-router/dev/routes').RouteConfig} RouteConfig */
