import type { ChargePoint } from 'src/types/chargepoint';
import type { ConnectorResponse } from 'src/types/connector';

import { endpoints, fetcher, post } from 'src/lib/axios';

import { OCPPConfigurationResponse } from 'src/types/ocpp';



export const CHANGE_AVAILABILITY_TYPES = {
  Available: 'Available',
  Unavailable: 'Unavailable',
};

export const chargepointService = {
  getConfiguration: async (chargepoint: ChargePoint) => {
    const url = endpoints.chargepoints.single + chargepoint.id + endpoints.ocpp.configuration;

    const res: OCPPConfigurationResponse = await fetcher(url);
    return res;
  },
  changeAvailability: async (
    chargepoint: ChargePoint,
    connector: ConnectorResponse,
    status: typeof CHANGE_AVAILABILITY_TYPES
  ) => {
    const url =
      'http://' + chargepoint.endpoint_address + ':' + chargepoint.port + '/changeAvailability';
    const payload = {
      id: chargepoint.ocpp_id,
      status,
      connectorID: connector.ocpp_id,
    };
    const res = await post(url, payload);
    return res;
  },
};
