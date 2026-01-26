/**
 * Expreso Brasilia - JavaScript Principal
 * Funcionalidades: Menú, Carousel, Búsqueda, Formularios
 */

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // CONFIGURACIÓN API
    // ========================================
    const API_BASE_URL = '/api';

    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================
    const header = document.getElementById('header');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const carousel = document.getElementById('carousel');
    const searchForm = document.getElementById('searchForm');
    const contactBar = document.getElementById('contactBar');
    const contactModal = document.getElementById('contactModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // ========================================
    // MENÚ HAMBURGUESA
    // ========================================
    function openMenu() {
        hamburgerBtn.classList.add('active');
        sidebarMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        sidebarMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMenu);
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Submenús
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;

            // En mobile, toggle el submenu
            if (window.innerWidth < 1024) {
                parent.classList.toggle('open');
            }
        });
    });

    // ========================================
    // STICKY HEADER
    // ========================================
    let lastScrollTop = 0;

    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ========================================
    // CAROUSEL / SLIDER
    // ========================================
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.dot');
        let currentSlide = 0;
        let autoplayInterval;
        const autoplayDelay = 5000; // 5 segundos

        function showSlide(index) {
            // Manejar índices fuera de rango
            if (index >= slides.length) {
                currentSlide = 0;
            } else if (index < 0) {
                currentSlide = slides.length - 1;
            } else {
                currentSlide = index;
            }

            // Actualizar slides
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === currentSlide) {
                    slide.classList.add('active');
                }
            });

            // Actualizar dots
            dots.forEach((dot, i) => {
                dot.classList.remove('active');
                if (i === currentSlide) {
                    dot.classList.add('active');
                }
            });
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        function startAutoplay() {
            stopAutoplay();
            autoplayInterval = setInterval(nextSlide, autoplayDelay);
        }

        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
            }
        }

        // Click en dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                startAutoplay();
            });
        });

        // Pausar en hover
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

        // Touch/Swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoplay();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (diff > swipeThreshold) {
                nextSlide();
            } else if (diff < -swipeThreshold) {
                prevSlide();
            }
        }

        // Flechas de navegación
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                startAutoplay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startAutoplay();
            });
        }

        // Iniciar autoplay
        startAutoplay();
    }

    // ========================================
    // FORMULARIO DE BÚSQUEDA
    // ========================================
    const origenInput = document.getElementById('origen');
    const destinoInput = document.getElementById('destino');
    const swapBtn = document.getElementById('swapBtn');
    const fechaIdaInput = document.getElementById('fechaIda');

    // Modal de ciudades
    const cityModalOverlay = document.getElementById('cityModalOverlay');
    const cityModal = document.getElementById('cityModal');
    const cityModalTitle = document.getElementById('cityModalTitle');
    const citySearchLabel = document.getElementById('citySearchLabel');
    const citySearchInput = document.getElementById('citySearchInput');
    const cityList = document.getElementById('cityList');
    const closeCityModal = document.getElementById('closeCityModal');

    // Recuadro de sugerencias
    const recommendedRoutes = document.getElementById('recommendedRoutes');
    const recommendedRoutesList = document.getElementById('recommendedRoutesList');

    // Calendario de fecha
    const datePicker = document.getElementById('datePicker');
    const pickerMonth = document.getElementById('pickerMonth');
    const pickerYear = document.getElementById('pickerYear');
    const pickerDays = document.getElementById('pickerDays');
    const pickerPrev = document.getElementById('pickerPrev');
    const pickerNext = document.getElementById('pickerNext');
    const pickerToday = document.getElementById('pickerToday');
    const pickerClose = document.getElementById('pickerClose');

    let currentInputTarget = null; // 'origen' o 'destino'
    let allCities = []; // Cache de ciudades
    let selectedOriginCity = null; // Ciudad de origen seleccionada
    let selectedDestinationCity = null; // Ciudad de destino seleccionada

    // Variables del calendario
    let pickerCurrentDate = new Date();
    let pickerSelectedDate = null;

    // Nombres de meses en español
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Destinos sugeridos por origen (rutas populares)
    const suggestedDestinations = {
        'BOGOTA': ['MEDELLIN', 'BARRANQUILLA', 'CARTAGENA', 'CALI'],
        'MEDELLIN': ['BOGOTA', 'CARTAGENA', 'BARRANQUILLA', 'MONTERIA'],
        'BARRANQUILLA': ['BOGOTA', 'MEDELLIN', 'CARTAGENA', 'SANTA MARTA'],
        'CARTAGENA': ['BOGOTA', 'MEDELLIN', 'BARRANQUILLA', 'MONTERIA'],
        'CALI': ['BOGOTA', 'MEDELLIN', 'ARMENIA', 'PEREIRA'],
        'BUCARAMANGA': ['BOGOTA', 'MEDELLIN', 'CUCUTA', 'BARRANQUILLA'],
        'CUCUTA': ['BOGOTA', 'BUCARAMANGA', 'MEDELLIN', 'BARRANQUILLA'],
        'SANTA MARTA': ['BOGOTA', 'BARRANQUILLA', 'MEDELLIN', 'CARTAGENA'],
        'MONTERIA': ['MEDELLIN', 'BOGOTA', 'CARTAGENA', 'BARRANQUILLA'],
        'PEREIRA': ['BOGOTA', 'MEDELLIN', 'CALI', 'ARMENIA']
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Cargar ciudades desde la API
    async function loadCities() {
        if (allCities.length > 0) return allCities;

        try {
            const response = await fetch(`${API_BASE_URL}/places?prefetch=true`);
            if (response.ok) {
                const data = await response.json();
                // La API puede devolver array directo o {places: [...]}
                allCities = Array.isArray(data) ? data : (data.places || []);
                return allCities;
            }
        } catch (error) {
            console.error('Error cargando ciudades:', error);
        }
        return [];
    }

    // Agrupar ciudades por departamento/estado
    function groupCitiesByDept(cities) {
        const groups = {};
        cities.forEach(city => {
            const dept = city.state || city.department || 'Otros';
            if (!groups[dept]) {
                groups[dept] = [];
            }
            groups[dept].push(city);
        });
        return groups;
    }

    // Formatear nombre de ciudad como "Medellin, Medellin"
    function formatCityName(name) {
        if (!name) return '';
        const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return formatted + ', ' + formatted;
    }

    // Renderizar lista de ciudades
    function renderCityList(cities) {
        cityList.innerHTML = '';

        if (!cities || cities.length === 0) {
            cityList.innerHTML = '<li class="city-loading">No se encontraron ciudades</li>';
            return;
        }

        const grouped = groupCitiesByDept(cities);
        const sortedDepts = Object.keys(grouped).sort();

        sortedDepts.forEach(dept => {
            // Header del departamento
            const deptLi = document.createElement('li');
            deptLi.className = 'department-header';
            deptLi.textContent = dept.toUpperCase();
            cityList.appendChild(deptLi);

            // Ciudades del departamento
            grouped[dept].forEach(city => {
                const cityLi = document.createElement('li');
                cityLi.className = 'city-item';

                const rawName = city.city_name || city.display || city.name || city;
                const formattedName = formatCityName(rawName);

                cityLi.innerHTML = `
                    <span class="city-icon">
                        <svg width="15" height="16" viewBox="0 0 15 16">
                            <path d="M7.5 0C3.36 0 0 3.36 0 7.5c0 5.25 7.5 8.5 7.5 8.5s7.5-3.25 7.5-8.5C15 3.36 11.64 0 7.5 0zm0 10.5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                        </svg>
                    </span>
                    <span class="city-name">${formattedName}</span>
                `;

                cityLi.addEventListener('click', () => {
                    selectCity(city);
                });

                cityList.appendChild(cityLi);
            });
        });
    }

    // Seleccionar ciudad
    function selectCity(city) {
        const rawName = city.city_name || city.display || city.name || city;
        // Capitalizar el nombre
        const cityName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
        const cityUpperName = rawName.toUpperCase();

        if (currentInputTarget === 'origen' && origenInput) {
            origenInput.value = cityName;
            selectedOriginCity = cityUpperName; // Guardar origen para sugerencias
            closeCityModalFn();

            // Abrir automáticamente modal de destino después de seleccionar origen
            setTimeout(() => {
                openCityModal('destino');
            }, 300);
        } else if (currentInputTarget === 'destino' && destinoInput) {
            destinoInput.value = cityName;
            selectedDestinationCity = cityUpperName;
            closeCityModalFn();

            // Abrir automáticamente calendario después de seleccionar destino
            setTimeout(() => {
                openDatePicker();
            }, 300);
        }
    }

    // Renderizar sugerencias de destino
    function renderSuggestedDestinations() {
        if (!recommendedRoutes || !recommendedRoutesList) return;

        // Obtener destinos sugeridos para el origen seleccionado
        const suggestions = suggestedDestinations[selectedOriginCity] || [];

        if (suggestions.length === 0) {
            recommendedRoutes.style.display = 'none';
            return;
        }

        recommendedRoutes.style.display = 'block';
        recommendedRoutesList.innerHTML = '';

        suggestions.forEach(destName => {
            const formattedName = destName.charAt(0).toUpperCase() + destName.slice(1).toLowerCase();

            const routeItem = document.createElement('div');
            routeItem.className = 'route-option-wrapper';
            routeItem.innerHTML = `
                <span class="route-option-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path d="M10 0L12.5 7.5H20L14 12L16 20L10 15L4 20L6 12L0 7.5H7.5L10 0Z"/>
                    </svg>
                </span>
                <div class="route-option-route">
                    <span class="route-city-name">${formattedName}</span>
                    <span class="route-city-department">${formattedName}</span>
                </div>
            `;

            routeItem.addEventListener('click', () => {
                // Buscar la ciudad en allCities para obtener datos completos
                const cityData = allCities.find(c =>
                    (c.city_name || c.display || c.name || '').toUpperCase() === destName
                ) || { city_name: destName };

                selectCity(cityData);
            });

            recommendedRoutesList.appendChild(routeItem);
        });
    }

    // Abrir modal de ciudades
    async function openCityModal(type) {
        currentInputTarget = type;

        if (type === 'origen') {
            cityModalTitle.textContent = 'Elige tu origen';
            citySearchLabel.textContent = 'Origen';
            citySearchInput.placeholder = 'Buscar Origen';
            // Ocultar sugerencias en modal de origen
            if (recommendedRoutes) recommendedRoutes.style.display = 'none';
        } else {
            cityModalTitle.textContent = 'Elige tu destino';
            citySearchLabel.textContent = 'Destino';
            citySearchInput.placeholder = 'Buscar Destino';
            // Mostrar sugerencias si hay un origen seleccionado
            if (selectedOriginCity) {
                renderSuggestedDestinations();
            } else if (recommendedRoutes) {
                recommendedRoutes.style.display = 'none';
            }
        }

        citySearchInput.value = '';
        cityList.innerHTML = '<li class="city-loading">Cargando ciudades...</li>';

        // Mostrar overlay y modal
        cityModalOverlay.classList.add('active');
        cityModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Cargar ciudades
        const cities = await loadCities();
        renderCityList(cities);

        // Focus en el input de búsqueda
        setTimeout(() => citySearchInput.focus(), 100);
    }

    // Cerrar modal de ciudades
    function closeCityModalFn() {
        cityModalOverlay.classList.remove('active');
        cityModal.classList.remove('active');
        document.body.style.overflow = '';
        currentInputTarget = null;
    }

    // ========================================
    // CALENDARIO DE SELECCIÓN DE FECHA
    // ========================================

    // Abrir calendario
    function openDatePicker() {
        if (!datePicker) return;

        // Inicializar con fecha actual o la seleccionada previamente
        pickerCurrentDate = pickerSelectedDate ? new Date(pickerSelectedDate) : new Date();

        // Renderizar el calendario
        renderCalendar();

        // Mostrar el calendario
        datePicker.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Cerrar calendario
    function closeDatePicker() {
        if (!datePicker) return;
        datePicker.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Renderizar calendario
    function renderCalendar() {
        if (!pickerMonth || !pickerYear || !pickerDays) return;

        const year = pickerCurrentDate.getFullYear();
        const month = pickerCurrentDate.getMonth();

        // Actualizar mes y año en el header
        pickerMonth.textContent = monthNames[month];
        pickerYear.textContent = year;

        // Obtener primer día del mes y total de días
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();

        // Día de la semana del primer día (0=Domingo, ajustar para Lunes=0)
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6; // Domingo se convierte en 6

        // Fecha de hoy para comparaciones
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generar HTML de los días
        let html = '';
        let dayCount = 1;
        let nextMonthDay = 1;

        // Días del mes anterior
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        for (let week = 0; week < 6; week++) {
            html += '<tr>';
            for (let day = 0; day < 7; day++) {
                const cellIndex = week * 7 + day;

                if (cellIndex < startDay) {
                    // Días del mes anterior
                    const prevDay = prevMonthLastDay - startDay + cellIndex + 1;
                    html += `<td class="picker__day picker__day--outside picker__day--disabled">${prevDay}</td>`;
                } else if (dayCount <= totalDays) {
                    // Días del mes actual
                    const currentDate = new Date(year, month, dayCount);
                    currentDate.setHours(0, 0, 0, 0);

                    let classes = 'picker__day';

                    // Verificar si es hoy
                    if (currentDate.getTime() === today.getTime()) {
                        classes += ' picker__day--today';
                    }

                    // Verificar si está seleccionado
                    if (pickerSelectedDate) {
                        const selected = new Date(pickerSelectedDate);
                        selected.setHours(0, 0, 0, 0);
                        if (currentDate.getTime() === selected.getTime()) {
                            classes += ' picker__day--selected';
                        }
                    }

                    // Verificar si es fecha pasada
                    if (currentDate < today) {
                        classes += ' picker__day--disabled';
                        html += `<td class="${classes}">${dayCount}</td>`;
                    } else {
                        html += `<td class="${classes}" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}">${dayCount}</td>`;
                    }

                    dayCount++;
                } else {
                    // Días del mes siguiente
                    html += `<td class="picker__day picker__day--outside picker__day--disabled">${nextMonthDay}</td>`;
                    nextMonthDay++;
                }
            }
            html += '</tr>';

            // Si ya completamos todos los días, salir
            if (dayCount > totalDays && week >= 3) break;
        }

        pickerDays.innerHTML = html;

        // Actualizar estado de botones de navegación
        updateNavButtons();

        // Agregar event listeners a los días
        addDayClickListeners();
    }

    // Actualizar estado de botones de navegación
    function updateNavButtons() {
        const today = new Date();
        const currentMonth = new Date(pickerCurrentDate.getFullYear(), pickerCurrentDate.getMonth(), 1);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Deshabilitar botón anterior si estamos en el mes actual
        if (pickerPrev) {
            pickerPrev.disabled = currentMonth <= thisMonth;
        }
    }

    // Agregar event listeners a los días
    function addDayClickListeners() {
        const days = pickerDays.querySelectorAll('.picker__day:not(.picker__day--disabled)');
        days.forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.getAttribute('data-date');
                if (dateStr) {
                    selectDate(dateStr);
                }
            });
        });
    }

    // Seleccionar fecha
    function selectDate(dateStr) {
        pickerSelectedDate = new Date(dateStr + 'T00:00:00');

        // Actualizar input de fecha
        if (fechaIdaInput) {
            fechaIdaInput.value = dateStr;
        }

        // Re-renderizar para mostrar selección
        renderCalendar();

        // Cerrar calendario después de un breve delay
        setTimeout(() => {
            closeDatePicker();
        }, 200);
    }

    // Ir al mes anterior
    function goToPrevMonth() {
        pickerCurrentDate.setMonth(pickerCurrentDate.getMonth() - 1);
        renderCalendar();
    }

    // Ir al mes siguiente
    function goToNextMonth() {
        pickerCurrentDate.setMonth(pickerCurrentDate.getMonth() + 1);
        renderCalendar();
    }

    // Ir a hoy
    function goToToday() {
        const today = new Date();
        pickerCurrentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        selectDate(formatDateISO(today));
    }

    // Formatear fecha a ISO (YYYY-MM-DD)
    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Event listeners del calendario
    if (pickerPrev) {
        pickerPrev.addEventListener('click', goToPrevMonth);
    }

    if (pickerNext) {
        pickerNext.addEventListener('click', goToNextMonth);
    }

    if (pickerToday) {
        pickerToday.addEventListener('click', goToToday);
    }

    if (pickerClose) {
        pickerClose.addEventListener('click', closeDatePicker);
    }

    // Cerrar calendario al hacer click en el holder (fondo oscuro)
    if (datePicker) {
        const pickerHolder = datePicker.querySelector('.picker__holder');
        if (pickerHolder) {
            pickerHolder.addEventListener('click', (e) => {
                if (e.target === pickerHolder) {
                    closeDatePicker();
                }
            });
        }
    }

    // Filtrar ciudades
    function filterCities(query) {
        if (!query || query.length < 1) {
            renderCityList(allCities);
            return;
        }

        const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const filtered = allCities.filter(city => {
            const name = (city.display || city.city_name || city.name || '').toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const state = (city.state || city.department || '').toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return name.includes(q) || state.includes(q);
        });

        renderCityList(filtered);
    }

    // Event listeners para modal de ciudades
    if (origenInput) {
        origenInput.addEventListener('click', (e) => {
            e.preventDefault();
            openCityModal('origen');
        });
        origenInput.addEventListener('focus', (e) => {
            e.preventDefault();
            openCityModal('origen');
        });
    }

    if (destinoInput) {
        destinoInput.addEventListener('click', (e) => {
            e.preventDefault();
            openCityModal('destino');
        });
        destinoInput.addEventListener('focus', (e) => {
            e.preventDefault();
            openCityModal('destino');
        });
    }

    if (closeCityModal) {
        closeCityModal.addEventListener('click', closeCityModalFn);
    }

    // Cerrar modal al hacer click en el overlay
    if (cityModalOverlay) {
        cityModalOverlay.addEventListener('click', closeCityModalFn);
    }

    if (citySearchInput) {
        const debouncedFilter = debounce((query) => filterCities(query), 200);
        citySearchInput.addEventListener('input', (e) => {
            debouncedFilter(e.target.value);
        });
    }

    // Intercambiar origen y destino
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = origenInput.value;
            origenInput.value = destinoInput.value;
            destinoInput.value = temp;

            // También intercambiar las ciudades seleccionadas
            const tempCity = selectedOriginCity;
            selectedOriginCity = selectedDestinationCity;
            selectedDestinationCity = tempCity;

            // Animación visual
            swapBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                swapBtn.style.transform = 'rotate(0deg)';
            }, 300);
        });
    }

    // ========================================
    // MANEJO DE DOS ESTADOS DEL CARD DE FECHAS
    // Usa clase .has-date para alternar estados
    // ========================================

    const dateCard = document.getElementById('dateCard');
    const clearDepartureBtn = document.getElementById('clearDepartureDate');
    const fechaRegresoInput = document.getElementById('fechaRegreso');
    let isSelectingReturn = false;

    // Función para cambiar a Estado 2 (con fecha seleccionada)
    function switchToDateState2(dateStr) {
        if (dateCard && fechaIdaInput) {
            // Agregar clase has-date para mostrar Estado 2
            dateCard.classList.add('has-date');
            // Establecer la fecha
            fechaIdaInput.value = dateStr;
            pickerSelectedDate = new Date(dateStr + 'T00:00:00');
        }
    }

    // Función para volver a Estado 1 (sin fecha)
    function switchToDateState1() {
        if (dateCard && fechaIdaInput) {
            // Remover clase has-date para volver a Estado 1
            dateCard.classList.remove('has-date');
            // Limpiar fecha
            fechaIdaInput.value = '';
            pickerSelectedDate = null;
            // Limpiar fecha de regreso también
            if (fechaRegresoInput) {
                fechaRegresoInput.value = '';
            }
            // Restablecer botón activo a "Hoy"
            const btns = dateCard.querySelectorAll('.date-buttons .date-btn');
            btns.forEach((btn, index) => {
                btn.classList.toggle('active', index === 0);
            });
        }
    }

    // Click en campo de fecha de ida (Estado 2) - abre calendario
    if (fechaIdaInput) {
        fechaIdaInput.addEventListener('click', () => {
            isSelectingReturn = false;
            openDatePicker();
        });
    }

    // Botón limpiar fecha (X) - vuelve a Estado 1
    if (clearDepartureBtn) {
        clearDepartureBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchToDateState1();
        });
    }

    // Click en campo de fecha de regreso - abre calendario para regreso
    if (fechaRegresoInput) {
        fechaRegresoInput.addEventListener('click', () => {
            openDatePickerForReturn();
        });
    }

    // Función para abrir calendario de regreso
    function openDatePickerForReturn() {
        if (!datePicker) return;

        isSelectingReturn = true;

        // Cambiar título
        const pickerTitle = datePicker.querySelector('.picker__title');
        if (pickerTitle) {
            pickerTitle.textContent = 'Elige tu fecha de regreso';
        }

        // Si hay fecha de ida, empezar desde ahí (mínimo día siguiente)
        if (pickerSelectedDate) {
            pickerCurrentDate = new Date(pickerSelectedDate);
        } else {
            pickerCurrentDate = new Date();
        }

        renderCalendar();
        datePicker.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Modificar selectDate para manejar los dos estados
    selectDate = function(dateStr) {
        if (isSelectingReturn) {
            // Seleccionar fecha de regreso
            if (fechaRegresoInput) {
                fechaRegresoInput.value = dateStr;
            }
            isSelectingReturn = false;

            // Restaurar título
            const pickerTitle = datePicker.querySelector('.picker__title');
            if (pickerTitle) {
                pickerTitle.textContent = 'Elige tu fecha de ida';
            }

            setTimeout(() => {
                closeDatePicker();
            }, 200);
        } else {
            // Seleccionar fecha de ida - cambiar a Estado 2
            switchToDateState2(dateStr);
            renderCalendar();

            setTimeout(() => {
                closeDatePicker();
            }, 200);
        }
    };

    // Botones de fecha en Estado Inicial (Hoy, Mañana, Elegir)
    const dateButtons = dateCard ? dateCard.querySelectorAll('.date-buttons .date-btn') : [];
    dateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            dateButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const dateType = btn.dataset.date;
            const today = new Date();

            if (dateType === 'today') {
                // Seleccionar hoy y cambiar a Estado con fecha
                const todayStr = formatDate(today);
                switchToDateState2(todayStr);
            } else if (dateType === 'tomorrow') {
                // Seleccionar mañana y cambiar a Estado con fecha
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = formatDate(tomorrow);
                switchToDateState2(tomorrowStr);
            } else if (dateType === 'calendar') {
                // Abrir calendario para elegir fecha
                isSelectingReturn = false;
                openDatePicker();
            }
        });
    });

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Establecer fecha mínima en inputs de fecha
    const fechaInputs = document.querySelectorAll('input[type="date"]');
    const today = formatDate(new Date());
    fechaInputs.forEach(input => {
        input.min = today;
    });

    // Submit del formulario - Usar API de Node.js con endpoint GET
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const origen = origenInput.value.trim();
            const destino = destinoInput.value.trim();
            const fecha = fechaIdaInput.value || formatDate(new Date());

            if (!origen) {
                openCityModal('origen');
                return;
            }

            if (!destino) {
                openCityModal('destino');
                return;
            }

            // Mostrar loading
            const btnSearch = searchForm.querySelector('.search-btn');
            const originalHTML = btnSearch.innerHTML;
            btnSearch.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            btnSearch.disabled = true;

            try {
                const params = new URLSearchParams({
                    origin: origen,
                    destination: destino,
                    date: fecha
                });

                const response = await fetch(`${API_BASE_URL}/search?${params}`);
                const data = await response.json();

                if (data.success && data.trips) {
                    // Mostrar resultados
                    showSearchResults(data);
                } else {
                    alert(data.error || data.message || 'No se encontraron viajes para esta ruta');
                }
            } catch (error) {
                console.error('Error en búsqueda:', error);
                alert('Error de conexión. Por favor intente nuevamente.');
            } finally {
                btnSearch.innerHTML = originalHTML;
                btnSearch.disabled = false;
            }
        });
    }

    // Mostrar resultados de búsqueda
    function showSearchResults(data) {
        const { origin, destination, date, trips, filters, totalResults } = data;

        // Crear modal de resultados
        const existingModal = document.getElementById('resultsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const minPrice = filters?.priceRange?.min || 0;

        const modal = document.createElement('div');
        modal.id = 'resultsModal';
        modal.className = 'results-modal';
        modal.innerHTML = `
            <div class="results-modal-content">
                <div class="results-modal-header">
                    <h3>${origin} → ${destination}</h3>
                    <span class="results-date">${formatDisplayDate(date)}</span>
                    <button class="close-results" aria-label="Cerrar">&times;</button>
                </div>
                <div class="results-modal-body">
                    <p class="results-count">${totalResults} viajes encontrados desde <strong>$${minPrice.toLocaleString()} COP</strong></p>
                    <div class="trips-list">
                        ${trips.map(trip => `
                            <div class="trip-card" data-trip-id="${trip.id}">
                                <div class="trip-time">
                                    <span class="departure">${trip.departure.time}</span>
                                    <span class="arrow">→</span>
                                    <span class="arrival">${trip.arrival.time}</span>
                                </div>
                                <div class="trip-duration">${trip.duration}</div>
                                <div class="trip-info">
                                    <span class="trip-type">${trip.serviceType}</span>
                                    <span class="trip-service">${trip.serviceName}</span>
                                    <span class="trip-available">${trip.availableSeats} asientos</span>
                                </div>
                                <div class="trip-amenities">
                                    ${trip.amenities.map(a => `<span class="amenity" title="${a}">${getAmenityIcon(a)}</span>`).join('')}
                                </div>
                                <div class="trip-price">
                                    ${trip.price.original ? `<span class="price-original">$${trip.price.original.toLocaleString()}</span>` : ''}
                                    <span class="price">$${trip.price.current.toLocaleString()}</span>
                                    <span class="currency">COP</span>
                                </div>
                                <button class="btn-select-trip" data-trip='${JSON.stringify(trip)}'>Seleccionar</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Función para obtener icono de amenidad
        function getAmenityIcon(amenity) {
            const icons = {
                'wifi': '<i class="fas fa-wifi"></i>',
                'ac': '<i class="fas fa-snowflake"></i>',
                'bathroom': '<i class="fas fa-restroom"></i>',
                'tv': '<i class="fas fa-tv"></i>',
                'usb': '<i class="fas fa-usb"></i>',
                'personal_screen': '<i class="fas fa-tablet-alt"></i>',
                'snacks': '<i class="fas fa-cookie"></i>',
                'entertainment': '<i class="fas fa-headphones"></i>',
                'gps': '<i class="fas fa-map-marker-alt"></i>'
            };
            return icons[amenity] || '';
        }

        // Agregar estilos del modal si no existen
        if (!document.getElementById('resultsModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'resultsModalStyles';
            styles.textContent = `
                .results-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    z-index: 2000;
                    padding: 10px;
                    overflow-y: auto;
                }
                .results-modal-content {
                    background: white;
                    border-radius: 15px;
                    width: 100%;
                    max-width: 600px;
                    margin: 20px 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .results-modal-header {
                    background: var(--primary-blue, #00529c);
                    color: white;
                    padding: 20px;
                    position: relative;
                }
                .results-modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-family: 'Oswald', sans-serif;
                }
                .results-date {
                    font-size: 13px;
                    opacity: 0.9;
                    display: block;
                    margin-top: 5px;
                }
                .close-results {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    line-height: 1;
                }
                .results-modal-body {
                    padding: 15px;
                    overflow-y: auto;
                    max-height: 70vh;
                }
                .results-count {
                    margin-bottom: 15px;
                    color: #666;
                    font-size: 14px;
                }
                .trips-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .trip-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: box-shadow 0.2s;
                }
                .trip-card:hover {
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .trip-time {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                }
                .trip-time .departure {
                    color: var(--primary-blue, #00529c);
                    font-size: 18px;
                }
                .trip-time .arrow {
                    color: #999;
                    font-size: 14px;
                }
                .trip-time .arrival {
                    color: #666;
                    font-size: 16px;
                }
                .trip-duration {
                    font-size: 12px;
                    color: #999;
                }
                .trip-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    align-items: center;
                }
                .trip-type {
                    background: #e8f4fc;
                    color: var(--primary-blue, #00529c);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .trip-service {
                    font-size: 12px;
                    color: #333;
                    font-weight: 500;
                }
                .trip-available {
                    font-size: 11px;
                    color: #22c55e;
                    margin-left: auto;
                }
                .trip-amenities {
                    display: flex;
                    gap: 8px;
                    color: #888;
                    font-size: 14px;
                }
                .trip-amenities .amenity {
                    opacity: 0.7;
                }
                .trip-price {
                    display: flex;
                    align-items: baseline;
                    gap: 5px;
                }
                .trip-price .price-original {
                    color: #999;
                    font-size: 14px;
                    text-decoration: line-through;
                }
                .trip-price .price {
                    color: var(--accent-red, #bf0811);
                    font-size: 22px;
                    font-weight: 700;
                }
                .trip-price .currency {
                    font-size: 12px;
                    color: #666;
                }
                .btn-select-trip {
                    background: var(--primary-blue, #00529c);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s;
                    width: 100%;
                    margin-top: 5px;
                }
                .btn-select-trip:hover {
                    background: #003d73;
                }
            `;
            document.head.appendChild(styles);
        }

        // Cerrar modal
        modal.querySelector('.close-results').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Seleccionar viaje
        modal.querySelectorAll('.btn-select-trip').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Funcionalidad de reserva en desarrollo. Gracias por tu interés.');
            });
        });
    }

    function formatDisplayDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-CO', options);
    }

    // ========================================
    // MODAL DE CONTACTO
    // ========================================
    if (contactBar && contactModal) {
        contactBar.addEventListener('click', () => {
            contactModal.classList.toggle('active');
        });
    }

    if (closeModalBtn && contactModal) {
        closeModalBtn.addEventListener('click', () => {
            contactModal.classList.remove('active');
        });
    }

    // Cerrar modal al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (contactModal &&
            !e.target.closest('.contact-modal') &&
            !e.target.closest('.contact-bar')) {
            contactModal.classList.remove('active');
        }
    });

    // ========================================
    // FOOTER SUBMENÚ
    // ========================================
    const footerSubmenuToggles = document.querySelectorAll('.footer-submenu-toggle');

    footerSubmenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth < 768) {
                e.preventDefault();
                const parent = this.parentElement;
                const submenu = parent.querySelector('.footer-submenu');

                if (submenu) {
                    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
                    submenu.style.position = 'relative';
                    submenu.style.bottom = 'auto';
                    submenu.style.left = 'auto';
                    submenu.style.transform = 'none';
                }
            }
        });
    });

    // ========================================
    // CARGAR DESTINOS DESDE API
    // ========================================
    async function loadDestinations() {
        try {
            const response = await fetch(`${API_BASE_URL}/destinations?limit=4`);
            const data = await response.json();

            if (data.success && data.destinations) {
                // Los destinos ya están en el HTML, pero podrían actualizarse dinámicamente
                console.log('Destinos cargados:', data.destinations.length);
            }
        } catch (error) {
            console.error('Error cargando destinos:', error);
        }
    }

    // ========================================
    // CARGAR NOTICIAS DESDE API
    // ========================================
    async function loadNews() {
        try {
            const response = await fetch(`${API_BASE_URL}/news?limit=3`);
            const data = await response.json();

            if (data.success && data.news) {
                console.log('Noticias cargadas:', data.news.length);
            }
        } catch (error) {
            console.error('Error cargando noticias:', error);
        }
    }

    // ========================================
    // LAZY LOADING IMAGES (Progressive Enhancement)
    // ========================================
    if ('loading' in HTMLImageElement.prototype) {
        // El navegador soporta lazy loading nativo
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    } else {
        // Fallback para navegadores antiguos
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // ========================================
    // SMOOTH SCROLL PARA ENLACES INTERNOS
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;

                window.scrollTo({
                    top: targetPosition - headerHeight - 20,
                    behavior: 'smooth'
                });

                // Cerrar menú si está abierto
                closeMenu();
            }
        });
    });

    // ========================================
    // RESIZE HANDLER
    // ========================================
    let resizeTimer;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Cerrar menú en desktop
            if (window.innerWidth >= 1024) {
                closeMenu();

                // Resetear submenús del footer
                document.querySelectorAll('.footer-submenu').forEach(submenu => {
                    submenu.style.display = '';
                    submenu.style.position = '';
                    submenu.style.bottom = '';
                    submenu.style.left = '';
                    submenu.style.transform = '';
                });
            }
        }, 250);
    });

    // ========================================
    // ACCESIBILIDAD - KEYBOARD NAVIGATION
    // ========================================
    document.addEventListener('keydown', (e) => {
        // Cerrar menú con Escape
        if (e.key === 'Escape') {
            closeMenu();
            contactModal?.classList.remove('active');

            // Cerrar calendario
            if (datePicker && datePicker.style.display !== 'none') {
                closeDatePicker();
            }

            // Cerrar modal de ciudades
            if (cityModal?.classList.contains('active')) {
                closeCityModalFn();
            }

            // Cerrar modal de resultados
            const resultsModal = document.getElementById('resultsModal');
            if (resultsModal) {
                resultsModal.remove();
            }
        }
    });

    // Focus trap en menú móvil
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    if (sidebarMenu) {
        const focusableContent = sidebarMenu.querySelectorAll(focusableElements);
        const firstFocusable = focusableContent[0];
        const lastFocusable = focusableContent[focusableContent.length - 1];

        sidebarMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    // Cargar datos iniciales desde la API
    loadDestinations();
    loadNews();

    // Verificar estado del servidor
    fetch(`${API_BASE_URL}/health`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('Servidor Node.js conectado correctamente');
            }
        })
        .catch(err => {
            console.warn('Servidor Node.js no disponible, usando modo estático');
        });

    console.log('Expreso Brasilia - Sitio web cargado correctamente');
});
