import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { CreateRateWizard } from './create-rate-wizard';

// ----------------------------------------------------------------------

export type CreateRateDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (rateId?: number) => void;
  connectorId?: number;
  chargepointId?: number;
};

export function CreateRateDialog({
  open,
  onClose,
  onSuccess,
  connectorId,
  chargepointId,
}: CreateRateDialogProps) {
  const handleSuccess = (rateId?: number) => {
    onSuccess?.(rateId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Nueva tarifa</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1, pb: 3 }}>
          <CreateRateWizard
            onSuccess={handleSuccess}
            onCancel={onClose}
            connectorId={connectorId}
            chargepointId={chargepointId}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
