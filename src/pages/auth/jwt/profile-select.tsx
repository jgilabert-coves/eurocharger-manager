import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { JwtProfileSelectView } from 'src/auth/view/jwt/jwt-profile-select-view';

// ----------------------------------------------------------------------

const metadata = { title: `Selecciona perfil | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <JwtProfileSelectView />
    </>
  );
}
