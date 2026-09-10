import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { AppResetPasswordView } from 'src/sections/app-account';

// ----------------------------------------------------------------------

const metadata = { title: `Nueva contraseña | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AppResetPasswordView />
    </>
  );
}
