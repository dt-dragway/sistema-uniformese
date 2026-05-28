import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Divider,
    Chip,
    Card,
    CardContent,
    Stack,
} from '@mui/material';
import {
    Info,
    Code,
    Business,
    Email,
    GitHub,
    Speed,
    Build,
    Copyright,
} from '@mui/icons-material';
import { APP_VERSION, APP_NAME, APP_BUILD_DATE } from '../config/appVersion';

const SystemInfoPage = () => {
    // System information
    const appInfo = {
        name: APP_NAME,
        version: APP_VERSION,
        description: 'Sistema de Punto de Venta con soporte para red',
        buildDate: APP_BUILD_DATE,
    };

    const developerInfo = {
        name: 'Jesus Aroldo Diaz',
        company: 'Comercializadora Gonzalez 2018',
        email: 'jadcsk15@gmail.com',
        website: 'https://github.com/dt-dragway/vertice_pos',
    };

    const techStack = {
        frontend: 'React 18.2.0 + TypeScript + Vite',
        backend: 'Node.js + Express 5.1.0',
        database: 'PostgreSQL',
        desktop: 'Electron 39.2.4',
        ui: 'Material-UI 5.18.0',
    };

    const license = {
        type: 'GPL-2.0',
        year: '2026',
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper sx={{ p: 4 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                    <Info fontSize="large" color="primary" />
                    <Typography variant="h4" fontWeight="bold">
                        Información del Sistema
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Main Info Card */}
                <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <CardContent>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            {appInfo.name}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                            {appInfo.description}
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <Chip
                                icon={<Speed sx={{ color: 'white !important' }} />}
                                label={`Versión ${appInfo.version}`}
                                sx={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                }}
                            />
                            <Chip
                                icon={<Build sx={{ color: 'white !important' }} />}
                                label={`Build: ${appInfo.buildDate}`}
                                sx={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Developer & License Info */}
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Business color="primary" />
                                    <Typography variant="h6" fontWeight="bold">
                                        Desarrollador
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Nombre
                                        </Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {developerInfo.name}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Desarrollado para el Negocio
                                        </Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {developerInfo.company}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Contacto
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Email fontSize="small" color="action" />
                                            <Typography variant="body1">{developerInfo.email}</Typography>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Repositorio de Desarrollo
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <GitHub fontSize="small" color="action" />
                                            <Typography variant="body1">{developerInfo.website}</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Copyright color="primary" />
                                    <Typography variant="h6" fontWeight="bold">
                                        Licencia
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Tipo de Licencia
                                        </Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {license.type}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Año
                                        </Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {license.year}
                                        </Typography>
                                    </Box>
                                    <Box mt={2}>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tech Stack */}
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Code color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                                Stack Tecnológico
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Frontend
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {techStack.frontend}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Backend
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {techStack.backend}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Base de Datos
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {techStack.database}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Framework Desktop
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {techStack.desktop}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        UI Framework
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {techStack.ui}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Footer */}
                <Box mt={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                        Desarrollado por Jesús Díaz, Soluciones Técnologica Integrales. Todos los Derechos Reservados
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default SystemInfoPage;
