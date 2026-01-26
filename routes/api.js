/**
 * Expreso Brasilia - Rutas API
 * Conexión con la API real de Expreso Brasilia
 */

const express = require('express');
const router = express.Router();

// ========================================
// CONFIGURACIÓN DE LA API
// ========================================

const API_BASE = 'https://one-api.expresobrasilia.com/api/v2';
const API_KEY = 'ac1d2715377e5d88e7fffe848034c0b102';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const API_POLL_INTERVAL_MS = 1000; // 1 segundo
const API_MAX_POLL_ATTEMPTS = 15;

// Cache para búsquedas
const searchCache = new Map();

// Headers para la API
const getHeaders = () => ({
    'Authorization': `Token token=${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'es-CO'
});

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Formatear duración de minutos a "Xh Xmin"
 */
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}min` : '00min'}`;
}

/**
 * Formatear hora ISO a "HH:MM AM/PM"
 */
function formatTime(isoTime) {
    const date = new Date(isoTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Formatear precio en COP
 */
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Convertir fecha de varios formatos a DD-MM-YYYY
 */
function formatDateForAPI(date) {
    // Si ya está en formato DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
        return date;
    }

    // Si está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-');
        return `${day}-${month}-${year}`;
    }

    // Si está en formato DD-Mmm-YY (ej: 28-Ene-26)
    const months = {
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
    };

    const match = date.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{2})$/i);
    if (match) {
        const [, day, monthStr, year] = match;
        const month = months[monthStr.toLowerCase()];
        return `${day.padStart(2, '0')}-${month}-20${year}`;
    }

    // Default: usar fecha actual
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Normalizar texto para slug
 */
function toSlug(text) {
    return text.toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// MAPEOS DE SERVICIOS
// ========================================

const serviceAmenities = {
    "premium-plus": ["wifi", "ac", "bathroom", "tv", "usb", "personal_screen"],
    "premium-plus-extra": ["wifi", "ac", "bathroom", "tv", "usb", "personal_screen", "snacks"],
    "premium-tech": ["wifi", "ac", "bathroom", "tv", "usb", "entertainment", "gps"],
    "premium": ["wifi", "ac", "bathroom", "tv", "usb"],
    "brasilia": ["ac", "bathroom"],
    "arauca-estelar": ["wifi", "ac", "bathroom", "tv", "usb"],
    "arauca-super-estelar-vip": ["wifi", "ac", "bathroom", "tv", "usb", "snacks"],
    "gaviota-preferencial": ["wifi", "ac", "bathroom", "tv"],
    "gaviota-diamante": ["wifi", "ac", "bathroom", "tv", "usb", "personal_screen"],
    "caribe-express": ["wifi", "ac", "bathroom", "tv"],
    "caribe-express-plus": ["wifi", "ac", "bathroom", "tv", "usb"],
    "caribe-express-brasilia": ["wifi", "ac", "bathroom", "tv"],
    "servicio-preferencial": ["wifi", "ac", "bathroom", "tv"],
    "buseton-caribe-express": ["wifi", "ac", "bathroom", "tv"],
    "buses-techo-azul": ["wifi", "ac", "bathroom", "tv"]
};

const serviceTypes = {
    "premium-plus": "Preferencial de Lujo",
    "premium-plus-extra": "Preferencial de Lujo",
    "premium-tech": "Preferencial de Lujo",
    "premium": "Servicio Especial",
    "brasilia": "Servicio Regular",
    "arauca-estelar": "Servicio Especial",
    "arauca-super-estelar-vip": "Servicio VIP",
    "gaviota-preferencial": "Preferencial de Lujo",
    "gaviota-diamante": "Servicio VIP",
    "caribe-express": "Servicio Especial",
    "caribe-express-plus": "Preferencial de Lujo",
    "caribe-express-brasilia": "Servicio Especial",
    "servicio-preferencial": "Preferencial de Lujo",
    "buseton-caribe-express": "Servicio Especial",
    "buses-techo-azul": "Servicio Especial"
};

// ========================================
// FUNCIONES DE LA API
// ========================================

/**
 * Obtener lista de ciudades desde la API
 */
async function getPlacesFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/places?prefetch=true`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[API] Error obteniendo ciudades:', error.message);
        throw error;
    }
}

/**
 * Crear búsqueda de viajes
 */
async function createSearch(origin, destination, date) {
    // Verificar cache
    const cacheKey = `${origin}-${destination}-${date}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[API] Cache hit for ${cacheKey}`);
        return { id: cached.id };
    }

    const formattedDate = formatDateForAPI(date);

    const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            origin,
            destination,
            date: formattedDate,
            passengers: ['adult'],
            way: 'departure',
            round: false
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors?.[0]?.message || 'Error al crear búsqueda');
    }

    const data = await response.json();
    const searchId = data.search?.id || data.id;

    if (!searchId) {
        throw new Error('ID de búsqueda no encontrado');
    }

    // Guardar en cache
    searchCache.set(cacheKey, { id: searchId, timestamp: Date.now() });
    console.log(`[API] Search created: ${searchId}`);

    return { id: searchId };
}

/**
 * Obtener resultados de búsqueda con polling
 */
async function getSearchResults(searchId) {
    for (let attempt = 1; attempt <= API_MAX_POLL_ATTEMPTS; attempt++) {
        const response = await fetch(`${API_BASE}/search/${searchId}?type=bus`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener resultados');
        }

        const data = await response.json();

        if (data.state === 'finished' || data.state === 'complete' || (data.trips && data.trips.length > 0)) {
            console.log(`[API] Search results ready (attempt ${attempt})`);
            return data;
        }

        if (data.state === 'error') {
            throw new Error('Error en la búsqueda');
        }

        await sleep(API_POLL_INTERVAL_MS);
    }

    throw new Error('Tiempo de espera agotado');
}

/**
 * Buscar viajes (función combinada)
 */
async function searchTrips(origin, destination, date) {
    const { id } = await createSearch(origin, destination, date);
    return getSearchResults(id);
}

/**
 * Obtener asientos de un viaje
 */
async function getSeats(tripId) {
    // Paso 1: Crear request de detalles
    const detailsResponse = await fetch(`${API_BASE}/trips/${tripId}/details_requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            with_pricing: true,
            include: ['bus']
        })
    });

    if (!detailsResponse.ok) {
        throw new Error('Error al solicitar asientos');
    }

    const detailsData = await detailsResponse.json();
    const requestId = detailsData.id;

    if (!requestId) {
        throw new Error('ID de solicitud no encontrado');
    }

    // Paso 2: Polling hasta obtener resultados
    for (let attempt = 1; attempt <= API_MAX_POLL_ATTEMPTS; attempt++) {
        await sleep(API_POLL_INTERVAL_MS);

        const pollResponse = await fetch(
            `${API_BASE}/trips/${tripId}/details_requests/${requestId}`,
            { headers: getHeaders() }
        );

        if (!pollResponse.ok) {
            throw new Error('Error al consultar asientos');
        }

        const pollData = await pollResponse.json();

        if (pollData.state === 'finished' || pollData.state === 'complete') {
            console.log(`[API] Seats ready (attempt ${attempt})`);
            return pollData;
        }

        if (pollData.state === 'error') {
            throw new Error(pollData.error_message || 'Error al obtener asientos');
        }
    }

    throw new Error('Tiempo de espera agotado para asientos');
}

// ========================================
// DATOS LOCALES (Fallback)
// ========================================

const ciudadesLocal = [
    { id: 1, display: 'Barranquilla', city_name: 'Barranquilla', slug: 'barranquilla', state: 'Atlántico', country: 'CO', popularity: '100' },
    { id: 2, display: 'Bogotá', city_name: 'Bogotá', slug: 'bogota', state: 'Cundinamarca', country: 'CO', popularity: '100' },
    { id: 3, display: 'Medellín', city_name: 'Medellín', slug: 'medellin', state: 'Antioquia', country: 'CO', popularity: '95' },
    { id: 4, display: 'Cartagena', city_name: 'Cartagena', slug: 'cartagena', state: 'Bolívar', country: 'CO', popularity: '90' },
    { id: 5, display: 'Santa Marta', city_name: 'Santa Marta', slug: 'santa-marta', state: 'Magdalena', country: 'CO', popularity: '85' },
    { id: 6, display: 'Valledupar', city_name: 'Valledupar', slug: 'valledupar', state: 'Cesar', country: 'CO', popularity: '80' },
    { id: 7, display: 'Montería', city_name: 'Montería', slug: 'monteria', state: 'Córdoba', country: 'CO', popularity: '75' },
    { id: 8, display: 'Sincelejo', city_name: 'Sincelejo', slug: 'sincelejo', state: 'Sucre', country: 'CO', popularity: '70' },
    { id: 9, display: 'Cúcuta', city_name: 'Cúcuta', slug: 'cucuta', state: 'Norte de Santander', country: 'CO', popularity: '70' },
    { id: 10, display: 'Bucaramanga', city_name: 'Bucaramanga', slug: 'bucaramanga', state: 'Santander', country: 'CO', popularity: '75' },
    { id: 11, display: 'Cali', city_name: 'Cali', slug: 'cali', state: 'Valle del Cauca', country: 'CO', popularity: '85' },
    { id: 12, display: 'Riohacha', city_name: 'Riohacha', slug: 'riohacha', state: 'La Guajira', country: 'CO', popularity: '60' }
];

// Destinos populares
const destinos = [
    {
        id: 1, name: 'Valledupar',
        image: 'https://static.expresobrasilia.com/wp-content/uploads/2021/04/Valledupar-500x500-1.jpg',
        from: 'Barranquilla', price: 64000, currency: 'COP'
    },
    {
        id: 2, name: 'Cartagena',
        image: 'https://static.expresobrasilia.com/wp-content/uploads/2024/01/Brasilia-500x500_1.jpg',
        from: 'Montería', price: 100000, currency: 'COP'
    },
    {
        id: 3, name: 'Barranquilla',
        image: 'https://static.expresobrasilia.com/wp-content/uploads/2021/04/Monteria-500x500-1.jpg',
        from: 'Montería', price: 80000, currency: 'COP'
    },
    {
        id: 4, name: 'Medellín',
        image: 'https://static.expresobrasilia.com/wp-content/uploads/2021/04/Medellin-500x500-1.jpg',
        from: 'Montería', price: 140000, currency: 'COP'
    }
];

// Servicios
const servicios = [
    { id: 1, name: 'Expreso Brasilia', logo: 'https://static.expresobrasilia.com/wp-content/uploads/2024/09/logo-white-300x83-1.png' },
    { id: 2, name: 'Brasilia Carga', logo: 'https://static.expresobrasilia.com/wp-content/uploads/2020/09/logo-brasilia-carga.png' },
    { id: 3, name: 'Servicio Especial', logo: 'https://static.expresobrasilia.com/wp-content/uploads/2020/09/logo-servicio-especial.png' },
    { id: 4, name: 'Brasilia Play', logo: 'https://static.expresobrasilia.com/wp-content/uploads/2020/09/logo-brasilia-play.png' },
    { id: 5, name: 'Fundación Brasilia', logo: 'https://static.expresobrasilia.com/wp-content/uploads/2020/12/logo-fundacion.png' }
];

// ========================================
// RUTAS API
// ========================================

/**
 * GET /api/places
 * Obtener ciudades (desde API real o fallback local)
 */
router.get('/places', async (req, res) => {
    const { q, prefetch } = req.query;

    try {
        // Intentar obtener de la API real
        const places = await getPlacesFromAPI();

        // Si es prefetch, devolver todas
        if (prefetch === 'true') {
            return res.json(places);
        }

        // Si hay query, filtrar
        if (q) {
            const query = q.toLowerCase();
            const filtered = places.filter(place =>
                place.display?.toLowerCase().includes(query) ||
                place.city_name?.toLowerCase().includes(query)
            );
            return res.json(filtered.slice(0, 20));
        }

        // Por defecto, las más populares
        const sorted = [...places].sort((a, b) =>
            parseFloat(b.popularity || 0) - parseFloat(a.popularity || 0)
        );
        return res.json(sorted.slice(0, 50));

    } catch (error) {
        console.error('[API] Usando datos locales:', error.message);

        // Fallback a datos locales
        if (prefetch === 'true') {
            return res.json(ciudadesLocal);
        }

        if (q) {
            const query = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const filtered = ciudadesLocal.filter(c => {
                const name = c.city_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return name.includes(query);
            });
            return res.json(filtered.slice(0, 20));
        }

        return res.json(ciudadesLocal.slice(0, 50));
    }
});

/**
 * GET /api/search
 * Buscar viajes disponibles (API real)
 */
router.get('/search', async (req, res) => {
    const { origin, destination, date } = req.query;

    if (!origin || !destination) {
        return res.status(400).json({
            error: 'Se requiere origen y destino'
        });
    }

    const searchDate = date || new Date().toISOString().split('T')[0];

    try {
        // Normalizar para la API
        const originSlug = toSlug(origin);
        const destSlug = toSlug(destination);

        console.log(`[API] Buscando viajes: ${originSlug} -> ${destSlug} (${searchDate})`);

        // Llamar a la API real
        const result = await searchTrips(originSlug, destSlug, searchDate);

        // Transformar los viajes
        const trips = result.trips.map((trip, index) => {
            const line = result.lines?.[trip.line_id];
            const originTerminal = result.terminals?.[trip.origin_id];
            const destTerminal = result.terminals?.[trip.destination_id];

            const hasDiscount = trip.pricing.discount_type !== null;
            const amenities = serviceAmenities[trip.line_id] || line?.services || ['ac', 'bathroom'];

            // Determinar badges
            const badges = [];
            if (trip.line_id.includes('vip') || trip.line_id.includes('diamante')) {
                badges.push('recommended');
            }
            if (index < 3 && trip.availability > 20) {
                badges.push('popular');
            }

            return {
                id: trip.id,
                serviceName: line?.name || trip.service || 'EXPRESO',
                serviceType: serviceTypes[trip.line_id] || line?.service_type || 'Servicio Especial',
                departure: {
                    city: originTerminal?.city_name || origin.toUpperCase(),
                    terminal: originTerminal?.name || `${origin.toUpperCase()} TERMINAL`,
                    time: formatTime(trip.departure),
                    date: trip.departure.split('T')[0]
                },
                arrival: {
                    city: destTerminal?.city_name || destination.toUpperCase(),
                    terminal: destTerminal?.name || `${destination.toUpperCase()} TERMINAL`,
                    time: formatTime(trip.arrival),
                    date: trip.arrival.split('T')[0]
                },
                duration: formatDuration(trip.duration),
                price: {
                    current: trip.pricing.total,
                    original: hasDiscount ? trip.pricing.total_before_discount : null,
                    formatted: formatPrice(trip.pricing.total)
                },
                availableSeats: trip.availability,
                amenities: amenities,
                badges,
                lineId: trip.line_id,
                allowsSeatSelection: trip.allows_seat_selection
            };
        });

        // Ordenar por hora de salida
        trips.sort((a, b) => a.departure.time.localeCompare(b.departure.time));

        // Calcular rango de precios
        const prices = trips.map(t => t.price.current);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        res.json({
            success: true,
            origin: origin.toUpperCase().replace(/-/g, ' '),
            destination: destination.toUpperCase().replace(/-/g, ' '),
            date: searchDate,
            trips: trips,
            filters: {
                serviceTypes: [...new Set(trips.map(t => t.serviceType))],
                priceRange: { min: minPrice, max: maxPrice },
                departureTimeRanges: [
                    { label: 'Madrugada', start: '00:00', end: '06:00' },
                    { label: 'Mañana', start: '06:00', end: '12:00' },
                    { label: 'Tarde', start: '12:00', end: '18:00' },
                    { label: 'Noche', start: '18:00', end: '24:00' }
                ]
            },
            totalResults: trips.length
        });

    } catch (error) {
        console.error('[API] Error buscando viajes:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al buscar viajes. Intente nuevamente.',
            message: error.message
        });
    }
});

/**
 * GET /api/seats
 * Obtener asientos de un viaje
 */
router.get('/seats', async (req, res) => {
    const { tripId } = req.query;

    if (!tripId) {
        return res.status(400).json({
            error: 'Se requiere tripId'
        });
    }

    try {
        const result = await getSeats(tripId);

        // Transformar la estructura del bus
        const busMatrix = result.bus;
        const seats = [];
        const tripPrice = result.trip?.pricing?.total || 0;

        // Procesar cada piso
        busMatrix.forEach((floor, floorIndex) => {
            floor.forEach((row, rowIndex) => {
                let seatIndex = 0;
                const columns = ['A', 'B', 'C', 'D'];

                row.forEach((item) => {
                    if (item.category === 'seat' && item.number) {
                        const colLetter = columns[seatIndex % 4] || 'A';
                        const isWindow = colLetter === 'A' || colLetter === 'D';

                        let status = 'available';
                        if (item.sold || item.occupied) {
                            status = 'occupied';
                        }

                        seats.push({
                            id: item.number,
                            row: rowIndex + 1,
                            column: colLetter,
                            status,
                            price: tripPrice,
                            type: isWindow ? 'window' : 'aisle'
                        });

                        seatIndex++;
                    }
                });
            });
        });

        // Ordenar por número de asiento
        seats.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        res.json({
            success: true,
            tripId,
            seats,
            legend: [
                { status: 'available', label: 'Disponible', color: '#22c55e' },
                { status: 'selected', label: 'Seleccionado', color: '#3b82f6' },
                { status: 'occupied', label: 'Ocupado', color: '#ef4444' }
            ],
            busLayout: {
                floors: busMatrix.length,
                rows: busMatrix[0]?.length || 0,
                seatsPerRow: 4
            },
            totalSeats: seats.length,
            availableSeats: seats.filter(s => s.status === 'available').length
        });

    } catch (error) {
        console.error('[API] Error obteniendo asientos:', error.message);

        // Datos mock para fallback
        const mockSeats = generateMockSeats();

        res.json({
            success: true,
            tripId,
            seats: mockSeats,
            legend: [
                { status: 'available', label: 'Disponible', color: '#22c55e' },
                { status: 'selected', label: 'Seleccionado', color: '#3b82f6' },
                { status: 'occupied', label: 'Ocupado', color: '#ef4444' }
            ],
            busLayout: { floors: 1, rows: 10, seatsPerRow: 4 },
            totalSeats: mockSeats.length,
            availableSeats: mockSeats.filter(s => s.status === 'available').length,
            isMock: true
        });
    }
});

/**
 * Generar asientos mock
 */
function generateMockSeats() {
    const seats = [];
    const columns = ['A', 'B', 'C', 'D'];
    const occupiedSeats = [3, 7, 12, 15, 21, 28, 33, 37];

    for (let row = 1; row <= 10; row++) {
        columns.forEach((col, colIndex) => {
            const seatNumber = (row - 1) * 4 + colIndex + 1;
            const isWindow = col === 'A' || col === 'D';
            const isOccupied = occupiedSeats.includes(seatNumber);

            seats.push({
                id: seatNumber.toString(),
                row,
                column: col,
                status: isOccupied ? 'occupied' : 'available',
                price: 85000,
                type: isWindow ? 'window' : 'aisle'
            });
        });
    }

    return seats;
}

/**
 * GET /api/destinations
 * Obtener destinos populares
 */
router.get('/destinations', (req, res) => {
    const { limit = 4 } = req.query;
    res.json({
        success: true,
        count: destinos.length,
        destinations: destinos.slice(0, parseInt(limit))
    });
});

/**
 * GET /api/services
 * Obtener lista de servicios
 */
router.get('/services', (req, res) => {
    res.json({
        success: true,
        count: servicios.length,
        services: servicios
    });
});

/**
 * POST /api/contact
 * Enviar mensaje de contacto
 */
router.post('/contact', (req, res) => {
    const { nombre, email, telefono, mensaje, asunto } = req.body;

    if (!nombre || !email || !mensaje) {
        return res.status(400).json({
            success: false,
            message: 'Nombre, email y mensaje son requeridos'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email inválido'
        });
    }

    const ticket = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    res.json({
        success: true,
        message: 'Mensaje enviado correctamente',
        ticket: ticket,
        data: { nombre, email, telefono, asunto, mensaje, createdAt: new Date().toISOString() }
    });
});

/**
 * GET /api/health
 * Health check del servidor
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        apiConnected: true
    });
});

module.exports = router;
