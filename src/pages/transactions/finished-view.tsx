import { Navigate } from 'react-router';

import { paths } from 'src/routes/paths';

export default function TransactionsFinishedView() {
  return <Navigate to={paths.transactions.actives} replace />;
}
