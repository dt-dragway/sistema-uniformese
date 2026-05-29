import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Sale } from '../../models/Sale';
import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface SalesChartProps {
  sales: Sale[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        sx={{
          p: 2,
          backgroundColor: 'rgba(30, 39, 46, 0.95)',
          border: '1px solid rgba(255, 159, 67, 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: '#dcdcdc', mb: 1 }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 'bold' }}>
          ${payload[0].value.toFixed(2)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#808e9b' }}>
          Total Ventas
        </Typography>
      </Paper>
    );
  }
  return null;
};

const SalesChart = ({ sales }: SalesChartProps) => {
  const data = useMemo(() => {
    const salesByDay: { [key: string]: number } = {};
    sales.forEach((sale) => {
      // Filter out cancelled sales if not already filtered
      if (!sale.isCancelled) {
        const date = new Date(sale.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        salesByDay[date] = (salesByDay[date] || 0) + sale.totalUsd;
      }
    });

    return Object.keys(salesByDay).map((date) => ({
      date,
      total: salesByDay[date],
    }));
  }, [sales]);

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography color="text.secondary">No hay datos de ventas para mostrar</Typography>
      </Box>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff9f43" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#ee5a24" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#808e9b"
          tick={{ fill: '#808e9b' }}
          tickLine={false}
        />
        <YAxis
          stroke="#808e9b"
          tick={{ fill: '#808e9b' }}
          tickLine={false}
          tickFormatter={(value) => `REF ${value}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Bar
          dataKey="total"
          fill="url(#colorSales)"
          name="Total de Ventas (REF)"
          radius={[6, 6, 0, 0]}
          barSize={60}
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;
