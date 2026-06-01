import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { JwtForgotPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `Recuperar contraseña | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <JwtForgotPasswordView />
    </>
  );
}
