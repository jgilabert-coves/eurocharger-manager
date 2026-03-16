import 'mapbox-gl/dist/mapbox-gl.css';

import type { ReactNode } from 'react';
import type { Chargepoint, ChargingStationResponse } from 'src/types/chargepoint';
import type { OCPPConfigurationItem, OCPPConfigurationResponse } from 'src/types/ocpp';

import { useParams } from 'react-router';
import Map, { Marker } from 'react-map-gl';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid2';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Alert,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { themeConfig } from 'src/theme';
import { CONFIG } from 'src/global-config';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { chargepointService } from 'src/services/chargepoints-service';

import { TransactionsTable } from 'src/components/transactions-table';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}


export default function ChargingStationView() {
  const { id } = useParams();
  const [chargepoint, setChargepoint] = useState<Chargepoint>();
  const [tabValue, setTabValue] = useState(0);
  const [configuration, setConfiguration] = useState<OCPPConfigurationItem[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchChargetpointData = async () => {
    const response: ChargingStationResponse = await fetcher(endpoints.chargepoints.single + id);
    console.log('Pidiendo cargador con id: ' + id);
    return response;
  };

  useEffect(() => {
    console.log('Pidiendo cargador con id: ' + id);
    fetchChargetpointData().then((response) => {
      setChargepoint(response.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  function setChargepointStatusCell(status: string): ReactNode {
    const baseClasses = 'p-2 border-4 rounded-lg'; // Base classes for padding, border, and rounded corners
    let colorStyle = { backgroundColor: themeConfig.palette.grey[200] }; // Default background color

    switch (status.toLowerCase()) {
      case 'available':
        colorStyle = { backgroundColor: themeConfig.palette.primary.lighter };
        break;
      case 'charging':
      case 'preparing':
        colorStyle = { backgroundColor: themeConfig.palette.info.lighter };
        break;
      case 'unavailable':
      case 'faulted':
        colorStyle = { backgroundColor: themeConfig.palette.error.lighter };
        break;
      case 'reserved':
        colorStyle = { backgroundColor: themeConfig.palette.warning.lighter };
        break;
      default:
        colorStyle = { backgroundColor: themeConfig.palette.grey[200] };
        break;
    }

    return (
      <Typography variant="body1">
        <span className={baseClasses} style={colorStyle}>
          {status}
        </span>
      </Typography>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (tabValue === 1) {
      fetchConfiguration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  const fetchConfiguration = async () => {
    if (!chargepoint) {
      return;
    }
    setConfigLoading(true);
    setConfigError(null);
    try {
      const config: OCPPConfigurationResponse =
        await chargepointService.getConfiguration(chargepoint);
      if (config.data?.configuration_key) {
        setConfiguration(config.data.configuration_key);
      } else {
        setConfigError('No se pudo obtener la configuración del cargador');
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setConfigError('Ha ocurrido un error al obtener la configuración del cargador');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleConfigChange = (key: string, newValue: string) => {
    setConfiguration((prev) =>
      prev.map((item) => (item.key === key ? { ...item, value: newValue } : item))
    );
  };

  return (
    <>
      <Helmet>
        <title> {CONFIG.appName} </title>
      </Helmet>
      <DashboardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', mb: 5 }}>
          <Typography variant="h3" sx={{ mb: 5 }}>
            {chargepoint?.name} ({chargepoint?.client_cp_id})
          </Typography>
          {setChargepointStatusCell(chargepoint?.status ?? '')}
        </Box>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Información" {...a11yProps(0)} />
          <Tab label="Configuración" {...a11yProps(1)} />
          <Tab label="Recargas" {...a11yProps(2)} />
        </Tabs>

        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid size={4}>
              {chargepoint?.connectors.map((connector) => (
                <Card key={connector.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        {connector.name || connector.ocpp_id}
                      </Typography>
                      {setChargepointStatusCell(connector.status ?? '')}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {connector.power} kW
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        {connector.voltage} V
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        {connector.current} A
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>
            <Grid size={6}>
              {chargepoint && (
                <Box sx={{ height: 300, mb: 3, display: 'flex', flexDirection: 'column' }}>
                  <Map
                    mapboxAccessToken={CONFIG.mapboxApiKey}
                    initialViewState={{
                      longitude: chargepoint.longitude,
                      latitude: chargepoint.latitude,
                      zoom: 15,
                    }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                  >
                    <Marker
                      longitude={chargepoint.longitude ?? 0}
                      latitude={chargepoint.latitude ?? 0}
                      color="#FF0000"
                    />
                  </Map>
                  <Typography variant="subtitle2" gutterBottom>
                    {chargepoint.address}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Configuración OCPP
          </Typography>
          {configLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          )}
          {configError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {configError}
            </Alert>
          )}
          {!configLoading && !configError && (
            <Grid container spacing={2}>
              {configuration.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {item.key}
                      </Typography>
                      <TextField
                        fullWidth
                        value={item.value}
                        onChange={(e) => handleConfigChange(item.key, e.target.value)}
                        disabled={item.readonly}
                        size="small"
                        variant="outlined"
                        helperText={item.readonly ? 'Solo lectura' : ''}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={2}>
          <TransactionsTable endpoint={`/chargingstations/${id}/transactions`} />
        </CustomTabPanel>
      </DashboardContent>
    </>
  );
}
