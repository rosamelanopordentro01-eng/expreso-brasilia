// ============================================
// EXPRESO BRASILIA - PASSENGERS PAGE JS
// ============================================

(function() {
    'use strict';

    // Leer datos del viaje desde localStorage
    var tripDataRaw = localStorage.getItem('tripData');
    if (!tripDataRaw) {
        window.location.href = '/';
        return;
    }

    var tripData = JSON.parse(tripDataRaw);
    var seats = tripData.selectedSeats || [];
    var passengerCount = seats.length;

    if (passengerCount === 0) {
        window.location.href = '/';
        return;
    }

    // ============================================
    // HEADER & SUMMARY
    // ============================================

    // Ruta en mayúsculas, solo ciudades sin departamento
    document.getElementById('headerRoute').textContent =
        (tripData.origin || '').toUpperCase() + ' - ' + (tripData.destination || '').toUpperCase();

    // Formato fecha: "15 de febrero"
    var fullMonths = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var depDate = new Date(tripData.date + 'T00:00:00');
    var dateLabel = depDate.getDate() + ' de ' + fullMonths[depDate.getMonth()];

    document.getElementById('summaryTime').textContent =
        tripData.departureTime + ' - ' + tripData.arrivalTime + ' | ' + dateLabel;

    // Stepper count
    document.getElementById('stepperCount').textContent =
        passengerCount + (passengerCount === 1 ? ' pasajero' : ' pasajeros');

    // Subtítulo "X a bordo"
    document.getElementById('sectionSubtitle').textContent =
        passengerCount + ' a bordo';

    // ============================================
    // OPCIONES DE SELECT
    // ============================================

    var docTypes = [
        { value: '', label: 'Tipo de documento' },
        { value: 'DI', label: 'Documento de identidad' },
        { value: 'CC', label: 'Cédula de ciudadanía' },
        { value: 'CE', label: 'Cédula de extranjería' },
        { value: 'PA', label: 'Pasaporte' },
        { value: 'TI', label: 'Tarjeta de identidad' },
        { value: 'RC', label: 'Registro civil' },
        { value: 'CD', label: 'Carnet Diplomático' },
        { value: 'DE', label: 'Documento Extranjero' },
        { value: 'SC', label: 'Salvoconducto' },
        { value: 'TA', label: 'Tarjeta Andina' },
        { value: 'AN', label: 'Acta de Nacimiento' },
        { value: 'PEP', label: 'Permiso Especial de Permanencia' },
        { value: 'CI', label: 'Cédula de Identidad' }
    ];

    var countryCodes = [
        { value: '+57', label: '+57 CO' },
        { value: '+1', label: '+1 US' },
        { value: '+52', label: '+52 MX' },
        { value: '+54', label: '+54 AR' },
        { value: '+56', label: '+56 CL' },
        { value: '+51', label: '+51 PE' },
        { value: '+58', label: '+58 VE' },
        { value: '+593', label: '+593 EC' },
        { value: '+55', label: '+55 BR' }
    ];

    var genderOptions = [
        { value: '', label: 'Género' },
        { value: 'M', label: 'Masculino' },
        { value: 'F', label: 'Femenino' }
    ];

    function buildOptions(arr) {
        return arr.map(function(item) {
            return '<option value="' + item.value + '">' + item.label + '</option>';
        }).join('');
    }

    function buildDayOptions() {
        var opts = '<option value="">Día</option>';
        for (var i = 1; i <= 31; i++) {
            opts += '<option value="' + i + '">' + i + '</option>';
        }
        return opts;
    }

    function buildMonthOptions() {
        var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        var opts = '<option value="">Mes</option>';
        months.forEach(function(m, idx) {
            opts += '<option value="' + (idx + 1) + '">' + m + '</option>';
        });
        return opts;
    }

    function buildYearOptions() {
        var opts = '<option value="">Año</option>';
        var currentYear = new Date().getFullYear();
        for (var y = currentYear; y >= currentYear - 100; y--) {
            opts += '<option value="' + y + '">' + y + '</option>';
        }
        return opts;
    }

    // ============================================
    // GENERAR TARJETAS DE PASAJEROS
    // ============================================

    function inputField(placeholder, dataField, type) {
        type = type || 'text';
        return '<div class="psg-field">' +
            '<input type="' + type + '" class="psg-input psg-input--required" placeholder="' + placeholder + '" data-field="' + dataField + '" autocomplete="off">' +
            '<button class="psg-field__clear" type="button">&times;</button>' +
        '</div>';
    }

    function selectField(dataField, options, cssClass) {
        cssClass = cssClass || 'psg-select--required';
        return '<div class="psg-field">' +
            '<select class="psg-select ' + cssClass + '" data-field="' + dataField + '">' + options + '</select>' +
        '</div>';
    }

    function createPassengerCard(index, seatNumber) {
        var cardId = 'psg-card-' + index;
        var isFirst = index === 0;
        var toggleText = isFirst ? 'Ocultar' : 'Mostrar';

        var html = '<div class="psg-card" id="' + cardId + '">' +
            '<div class="psg-card__header" data-card="' + cardId + '">' +
                '<div class="psg-card__seat-badge">' + seatNumber + '</div>' +
                '<div class="psg-card__header-info">' +
                    '<div class="psg-card__header-name">Pasajero ' + (index + 1) + '</div>' +
                    '<div class="psg-card__header-type">Adulto</div>' +
                    '<div class="psg-card__header-seat">Asiento: ' + seatNumber + '</div>' +
                '</div>' +
                '<div class="psg-card__toggle' + (isFirst ? '' : ' psg-card__toggle--collapsed') + '">' +
                    '<span class="psg-card__toggle-text">' + toggleText + '</span>' +
                    '<svg viewBox="0 0 24 24" fill="none"><path d="M7 14l5-5 5 5" stroke="#686868" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '</div>' +
                '<div class="psg-card__indicator">P' + (index + 1) + '</div>' +
            '</div>' +
            '<div class="psg-card__body' + (isFirst ? '' : ' psg-card__body--hidden') + '" data-body="' + cardId + '">';

        // 1. Nombre(s)
        html += inputField('Nombre (s)', 'firstName');

        // 2. Apellido Paterno
        html += inputField('Apellido Paterno', 'lastName');

        // 3. Apellido Materno (opcional)
        html += '<div class="psg-field">' +
            '<input type="text" class="psg-input" placeholder="Apellido Materno (opcional)" data-field="lastNameMaternal" autocomplete="off">' +
            '<button class="psg-field__clear" type="button">&times;</button>' +
        '</div>';

        // 4. Correo electrónico
        html += inputField('Correo electrónico', 'email', 'email');

        // 5. Fecha de nacimiento (con label visible)
        html += '<div class="psg-field psg-field--has-label">' +
            '<label class="psg-field__label">Fecha de nacimiento</label>' +
            '<div class="psg-date-row">' +
                '<select class="psg-select psg-select--required" data-field="birthDay">' + buildDayOptions() + '</select>' +
                '<select class="psg-select psg-select--required" data-field="birthMonth">' + buildMonthOptions() + '</select>' +
                '<select class="psg-select psg-select--required" data-field="birthYear">' + buildYearOptions() + '</select>' +
            '</div>' +
        '</div>';

        // 6. Nacionalidad
        html += inputField('Nacionalidad', 'nationality');

        // 7. Tipo de documento
        html += selectField('docType', buildOptions(docTypes));

        // 8. Número de documento
        html += inputField('Número de documento', 'docNumber');

        // 9. Código de país + Teléfono
        html += '<div class="psg-field">' +
            '<div class="psg-phone-row">' +
                '<select class="psg-select" data-field="phoneCode">' + buildOptions(countryCodes) + '</select>' +
                '<div class="psg-field">' +
                    '<input type="tel" class="psg-input psg-input--required" placeholder="Teléfono celular" data-field="phone" autocomplete="off">' +
                    '<button class="psg-field__clear" type="button">&times;</button>' +
                '</div>' +
            '</div>' +
        '</div>';

        // 10. Género
        html += selectField('gender', buildOptions(genderOptions));

        html += '</div></div>';
        return html;
    }

    var cardsHTML = '';
    for (var i = 0; i < passengerCount; i++) {
        cardsHTML += createPassengerCard(i, seats[i]);
    }
    document.getElementById('passengerCards').innerHTML = cardsHTML;

    // ============================================
    // TOGGLE CARDS (show/hide)
    // ============================================

    document.querySelectorAll('.psg-card__header').forEach(function(header) {
        header.addEventListener('click', function() {
            var cardId = this.dataset.card;
            var body = document.querySelector('[data-body="' + cardId + '"]');
            var toggle = this.querySelector('.psg-card__toggle');
            var toggleText = this.querySelector('.psg-card__toggle-text');
            if (!body || !toggle) return;

            var isHidden = body.classList.toggle('psg-card__body--hidden');
            toggle.classList.toggle('psg-card__toggle--collapsed', isHidden);
            if (toggleText) {
                toggleText.textContent = isHidden ? 'Mostrar' : 'Ocultar';
            }
        });
    });

    // ============================================
    // CLEAR BUTTONS ON INPUTS
    // ============================================

    document.querySelectorAll('.psg-input').forEach(function(input) {
        var clearBtn = input.parentElement.querySelector('.psg-field__clear');
        if (!clearBtn) return;

        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                clearBtn.classList.add('psg-field__clear--visible');
            } else {
                clearBtn.classList.remove('psg-field__clear--visible');
            }
        });

        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            input.value = '';
            this.classList.remove('psg-field__clear--visible');
            input.focus();
            validateForm();
        });
    });

    // ============================================
    // TIMER (15 minutos)
    // ============================================

    var timeLeft = 15 * 60;
    var timerDisplay = document.getElementById('timerDisplay');
    var timerInterval;

    function updateTimer() {
        var minutes = Math.floor(timeLeft / 60);
        var seconds = timeLeft % 60;
        timerDisplay.textContent =
            String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

        if (timeLeft <= 180) {
            timerDisplay.classList.add('psg-timer__time--urgent');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showTimeoutModal();
        }

        timeLeft--;
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);

    // ============================================
    // TIMEOUT MODAL
    // ============================================

    function showTimeoutModal() {
        document.getElementById('timeoutModal').classList.add('psg-modal-overlay--visible');
    }

    document.getElementById('timeoutBtn').addEventListener('click', function() {
        localStorage.removeItem('tripData');
        window.location.href = '/';
    });

    // ============================================
    // FORM VALIDATION
    // ============================================

    function validateForm() {
        var allValid = true;
        var termsChecked = document.getElementById('termsCheckbox').checked;

        if (!termsChecked) {
            allValid = false;
        }

        document.querySelectorAll('.psg-input--required').forEach(function(input) {
            if (!input.value.trim()) {
                allValid = false;
            }
        });

        document.querySelectorAll('.psg-select--required').forEach(function(select) {
            if (!select.value) {
                allValid = false;
            }
        });

        document.getElementById('nextBtn').disabled = !allValid;
        return allValid;
    }

    document.querySelectorAll('.psg-input, .psg-select').forEach(function(el) {
        el.addEventListener('input', validateForm);
        el.addEventListener('change', validateForm);
    });

    document.getElementById('termsCheckbox').addEventListener('change', validateForm);

    // ============================================
    // BOTÓN SIGUIENTE
    // ============================================

    document.getElementById('nextBtn').addEventListener('click', function() {
        if (this.disabled) return;
        if (!validateForm()) return;

        var passengers = [];
        document.querySelectorAll('.psg-card').forEach(function(card, idx) {
            var body = card.querySelector('.psg-card__body');
            var getValue = function(field) {
                var el = body.querySelector('[data-field="' + field + '"]');
                return el ? el.value : '';
            };

            passengers.push({
                seat: seats[idx],
                firstName: getValue('firstName'),
                lastName: getValue('lastName'),
                lastNameMaternal: getValue('lastNameMaternal'),
                email: getValue('email'),
                birthDay: getValue('birthDay'),
                birthMonth: getValue('birthMonth'),
                birthYear: getValue('birthYear'),
                nationality: getValue('nationality'),
                docType: getValue('docType'),
                docNumber: getValue('docNumber'),
                phoneCode: getValue('phoneCode'),
                phone: getValue('phone'),
                gender: getValue('gender')
            });
        });

        var bookingData = Object.assign({}, tripData, {
            passengers: passengers,
            insurance: document.getElementById('insuranceToggle').checked
        });

        localStorage.setItem('bookingData', JSON.stringify(bookingData));
        window.location.href = '/payment.html';
    });

    // ============================================
    // BACK BUTTON
    // ============================================

    document.getElementById('backBtn').addEventListener('click', function() {
        window.history.back();
    });

})();
