import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography, Box, Paper } from '@mui/material';

interface InternalDispatchChartProps {
    data: {
        date: string;
        cost: number;
        saleValue: number;
    }[];
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
                {payload.map((entry: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
                        <Typography variant="body2" sx={{ color: '#dcdcdc' }}>
                            {entry.name}: <span style={{ fontWeight: 'bold', color: '#fff' }}>${entry.value.toFixed(2)}</span>
                        </Typography>
                    </Box>
                ))}
            </Paper>
        );
    }
    return null;
};

const InternalDispatchChart = ({ data }: InternalDispatchChartProps) => {
    if (!data || data.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                    No hay datos para mostrar en el período seleccionado
                </Typography>
            </Box>
        );
    }

    // Format data for chart
    const chartData = data.map((item) => ({
        fecha: new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        'Costo': parseFloat(item.cost.toFixed(2)),
        'Valor de Venta': parseFloat(item.saleValue.toFixed(2)),
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef5777" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#b33939" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="colorSaleValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4bcffa" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#0fb9b1" stopOpacity={0.7} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="fecha"
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
                    dataKey="Costo"
                    fill="url(#colorCost)"
                    name="Costo (Despacho)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                />
                <Bar
                    dataKey="Valor de Venta"
                    fill="url(#colorSaleValue)"
                    name="Valor si se Vendiera"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default InternalDispatchChart;
