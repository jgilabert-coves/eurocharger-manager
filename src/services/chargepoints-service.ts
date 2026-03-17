import type { Chargepoint } from 'src/types/chargepoint';
import type {
  OCPPReserveNowRequest,
  OCPPConfigurationResponse,
  OCPPAuthorizationResponse,
  OCPPTriggerMessageRequest,
  OCPPStartTrasactionRequest,
  OCPPStopTransactionRequest,
  OCPPCancelReservationRequest,
  OCPPChangeAvailabilityRequest,
} from 'src/types/ocpp';

import { endpoints, fetcher, post } from 'src/lib/axios';

export const CHANGE_AVAILABILITY_TYPES = {
  Available: 'Available',
  Unavailable: 'Unavailable',
};

export const chargepointService = {
  getConfiguration: async (chargepoint: Chargepoint) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.configuration;

    const res: OCPPConfigurationResponse = await fetcher(url);
    return res;
  },

  changeAvailability: async (
    chargepoint: Chargepoint,
    changeData: OCPPChangeAvailabilityRequest
  ) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.changeAvailability;
    const payload = {
      id: chargepoint.ocpp_id,
      ...changeData,
    };
    const res: OCPPChangeAvailabilityRequest = await post(url, payload);
    return res;
  },

  startTransaction: async (
    chargepoint: Chargepoint,
    transactionData: OCPPStartTrasactionRequest
  ) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.startTransaction;
    const payload = {
      id: chargepoint.ocpp_id,
      ...transactionData,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },

  stopTransaction: async (
    chargepoint: Chargepoint,
    transactionData: OCPPStopTransactionRequest
  ) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.stopTransaction;
    const payload = {
      id: chargepoint.ocpp_id,
      ...transactionData,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },

  reserveNow: async (chargepoint: Chargepoint, reservationData: OCPPReserveNowRequest) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.reserveNow;
    const payload = {
      id: chargepoint.ocpp_id,
      ...reservationData,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },

  cancelReservation: async (
    chargepoint: Chargepoint,
    reservationData: OCPPCancelReservationRequest
  ) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.cancelReservation;
    const payload = {
      id: chargepoint.ocpp_id,
      ...reservationData,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },

  triggerMessage: async (chargepoint: Chargepoint, messageData: OCPPTriggerMessageRequest) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.triggerMessage;
    const payload = {
      id: chargepoint.ocpp_id,
      ...messageData,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },

  unlock: async (chargepoint: Chargepoint, connectorId: number) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.unlockConnector;
    const payload = {
      id: chargepoint.ocpp_id,
      connectorId,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },

  reset: async (chargepoint: Chargepoint, type: 'Soft' | 'Hard') => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.reset;
    const payload = {
      id: chargepoint.ocpp_id,
      type,
    };
    const res: OCPPAuthorizationResponse = await post(url, payload);
    return res;
  },
};
