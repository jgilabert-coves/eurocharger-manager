export type OCPPConfiguration = {
    configuration_key: OCPPConfigurationItem[];
}

export type OCPPConfigurationItem = {
    key: string;
    value: string;
    readonly: boolean;
};

export type OCPPConfigurationResponse = {
    status_code: number;
    data: OCPPConfiguration | null;
    error: string | null;
}

export type OCPPStartTrasactionRequest = {
  connectorId: number;
  idTag: string;
};

export type OCPPAuthorizationResponse = {
  status: "Accepted" | "Rejected";
};

export type OCPPStopTransactionRequest = {
  transactionId: number;
};

export type OCPPReserveNowRequest = {
  connectorId: number;
  appUserId: string;
  reservationId: string;
  expiryDate: string; // ISO 8601 format
};

export type OCPPCancelReservationRequest = {
  reservationId: string;
};

export type OCPPChangeAvailabilityRequest = {
  connectorId: number;
  availability: "Inoperative" | "Operative";
};

export type OCPPTriggerMessageRequest = {
    requestedMessage: "BootNotification" | "StatusNotification" | "Heartbeat";
    connectorId?: number;
};