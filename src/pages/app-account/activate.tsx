import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { AppActivateView } from 'src/sections/app-account';

// ----------------------------------------------------------------------

const metadata = { title: `Activar cuenta | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AppActivateView />
    </>
  );
}
