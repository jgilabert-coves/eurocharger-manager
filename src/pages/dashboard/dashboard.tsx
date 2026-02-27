import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState } from 'react';

import { Card } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

import { CONFIG } from 'src/global-config';
import axios, { endpoints, fetcher } from 'src/lib/axios';

import { DashboardContent } from '../../layouts/dashboard';

// ----------------------------------------------------------------------

export type DashboardIntResponse = {
  value: number;
};

const metadata = { title: `${CONFIG.appName}` };

export const getActiveAppUsers = async (): Promise<DashboardIntResponse> => {
  try {
    return await fetcher(endpoints.dashboard.activeUsers);
  } catch (error) {
    console.error('Error during activeUsers:', error);
    throw error;
  }
};
export const getActiveTransactions = async (): Promise<DashboardIntResponse> => {
  try {
    return await fetcher(endpoints.dashboard.activeTransactions);
  } catch (error) {
    console.error('Error during activeTransactions:', error);
    throw error;
  }
};
export const getAlarms = async (): Promise<DashboardIntResponse> => {
  try {
    return await fetcher(endpoints.dashboard.alarms);
  } catch (error) {
    console.error('Error during alarms:', error);
    throw error;
  }
};
export const getChargepoints = async (): Promise<DashboardIntResponse> => {
  try {
    return await fetcher(endpoints.dashboard.chargepoints);
  } catch (error) {
    console.error('Error during chargepoints:', error);
    throw error;
  }
};

export default function Page() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [transactions, setTransactions] = useState(0);
  const [chargepoints, setChargepoints] = useState(0);
  const [alarms, setAlarms] = useState(0);

  const fetchUsers = async () => {
    const data = await getActiveAppUsers();
    setActiveUsers(data.value);
  };

  const fetchTransactions = async () => {
    const data = await getActiveTransactions();
    setTransactions(data.value);
  };

  const fetchAlarms = async () => {
    const data = await getAlarms();
    setAlarms(data.value);
  };

  const fetchChargepoints = async () => {
    const data = await getChargepoints();
    setChargepoints(data.value);
  };

  useEffect(() => {
    fetchUsers();
    fetchTransactions();
    fetchAlarms();
    fetchChargepoints();
  }, []);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>
      <DashboardContent>
        <Typography variant="h2" sx={{ mb: 5 }}>
          Dashboard
        </Typography>
        <Grid container spacing={2}>
          <Grid size={3}>
            <Card className="p-5">
              <Typography variant="body1"> Cargadores </Typography>
              <Typography variant="h3"> {chargepoints} </Typography>
            </Card>
          </Grid>
          <Grid size={3}>
            <Card className="p-5">
              <Typography variant="body1"> Usuarios </Typography>
              <Typography variant="h3"> {activeUsers} </Typography>
            </Card>
          </Grid>
          <Grid size={3}>
            <Card className="p-5">
              <Typography variant="body1"> Recargas </Typography>
              <Typography variant="h3"> {transactions} </Typography>
            </Card>
          </Grid>
          <Grid size={3}>
            <Card className="p-5">
              <Typography variant="body1"> Alarmas </Typography>
              <Typography variant="h3"> {alarms} </Typography>
            </Card>
          </Grid>
          <Grid size={4}>
            <Card className="p-5">
              Tabla
            </Card>
          </Grid>
          <Grid size={4}>
            <Card>
              <PieChart
                height={300}
                series={[
                  {
                    data: [
                      { id: 0, value: 10 },
                      { id: 1, value: 15 },
                      { id: 2, value: 20 },
                    ],
                    paddingAngle: 0,
                    cornerRadius: 5,
                    startAngle: 0,
                    endAngle: 360,
                  },
                ]}
              />
            </Card>
          </Grid>
          <Grid size={4}>
            <Card className="p-5">Chart</Card>
          </Grid>
        </Grid>
      </DashboardContent>
    </>
  );
}

export type DashboardTransactionChart = {
  date: string;
  kwh: number;
  num: number;
};
/*
export const ChartBar = () => {
  const API_URL = CONFIG.serverUrl;

  const [chartData, setChartData] = useState<DashboardTransactionChart[]>([]);

  const getData = async (): Promise<DashboardTransactionChart[]> => {
    const response = await fetch(API_URL.concat('dashboard/transactions'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${localStorage.getItem('token')}`,
      },
    });
    console.log(response);
    return await response.json();
  };

  useEffect(() => {
    getData().then((data) => {
      console.log(data);
      setChartData(data);
      console.log(chartData);
    });
  }, []);

  return (
    <BarChart
      series={[{ data: chartData.map((item) => item.num) }]}
      height={300}
      xAxis={[{ data: chartData.map((item) => item.date), scaleType: 'band' }]}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
      borderRadius={5}
    />
  );
};
*/