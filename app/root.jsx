import {useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';

export function links() {
  return [
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

/**
 * @param {{children?: React.ReactNode}}
 */
export function Layout({children}) {
  const nonce = useNonce();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  // Single-purpose app: render the active route directly, no storefront layout.
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div style={{minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#04060d', color: '#eaf1ff', fontFamily: 'system-ui, sans-serif'}}>
      <div style={{textAlign: 'center'}}>
        <h1 style={{fontSize: 48, margin: 0, opacity: 0.5}}>{errorStatus}</h1>
        <p style={{color: '#8ea3c6'}}>{errorMessage}</p>
        <a href="/" style={{color: '#54b6ff'}}>← Back to the ledger</a>
      </div>
    </div>
  );
}
