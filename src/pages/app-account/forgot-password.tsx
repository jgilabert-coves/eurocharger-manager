import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { AppForgotPasswordView } from 'src/sections/app-account';

// ----------------------------------------------------------------------

const metadata = { title: `Recuperar contraseña | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AppForgotPasswordView />
    </>
  );
}
