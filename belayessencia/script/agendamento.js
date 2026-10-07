(() => {
  const form = document.getElementById('booking-form');
  const procedure = document.getElementById('procedure');
  const dateInput = document.getElementById('booking-date');
  const timeInput = document.getElementById('booking-time');
  const timeButtons = [...document.querySelectorAll('.time-slot')];
  const message = document.getElementById('form-message');
  const submitButton = document.getElementById('submit-button');
  const bookingView = document.getElementById('booking-view');
  const successView = document.getElementById('success-view');
  const newBookingButton = document.getElementById('new-booking');
  const summary = document.getElementById('confirmation-summary');
  const customerCard = document.getElementById('customer-card');
  const customerName = document.getElementById('customer-name');
  const customerContact = document.getElementById('customer-contact');
  const serviceDetails = document.getElementById('service-details');

  const dataUrl = '../../processos/agendamento_dados.php';
  const services = new Map();
  let currentUser = null;
  let selectedTime = '';

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  dateInput.min = localToday;

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    const [year, month, day] = value.split('-');
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.classList.remove('hidden', 'text-[#a15e52]', 'text-[#55745b]');
    message.classList.add(type === 'error' ? 'text-[#a15e52]' : 'text-[#55745b]');
  }

  function clearMessage() {
    message.textContent = '';
    message.classList.add('hidden');
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
  }

  function redirectToLogin(data) {
    const loginUrl = data?.redirect || 'login.html?erro=sessao';
    window.location.href = loginUrl.replace('../belayessencia/html/', '');
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      redirectToLogin(data);
      throw new Error('Sessao expirada');
    }

    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Não foi possível completar a solicitação.');
    }

    return data;
  }

  function renderUser(user) {
    currentUser = user;
    customerName.textContent = user.nome;
    customerContact.textContent = user.telefone ? `${user.email} · ${user.telefone}` : user.email;
    customerCard.classList.remove('hidden-view');
  }

  function renderServices(items) {
    services.clear();
    procedure.innerHTML = '<option value="" selected disabled>Selecione um procedimento</option>';

    items.forEach((service) => {
      services.set(String(service.id), service);
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = `${service.nome} - ${formatMoney(service.valor)}`;
      procedure.appendChild(option);
    });

    updateServiceDetails();
  }

  function updateServiceDetails() {
    const service = services.get(procedure.value);

    if (!service) {
      serviceDetails.textContent = '';
      serviceDetails.classList.add('hidden-view');
      return;
    }

    serviceDetails.textContent = `${formatMoney(service.valor)} · duração aproximada de ${service.duracao_minutos} minutos`;
    serviceDetails.classList.remove('hidden-view');
  }

  function clearSelectedTime() {
    selectedTime = '';
    timeInput.value = '';
    timeButtons.forEach((button) => {
      button.classList.remove('is-selected');
      button.setAttribute('aria-pressed', 'false');
    });
  }

  function applyOccupiedTimes(occupiedTimes) {
    const occupied = new Set(occupiedTimes);

    timeButtons.forEach((button) => {
      const isOccupied = occupied.has(button.dataset.time);
      button.disabled = isOccupied;
      button.setAttribute('aria-disabled', String(isOccupied));
      button.title = isOccupied ? 'Horário já agendado' : '';

      if (isOccupied && selectedTime === button.dataset.time) {
        clearSelectedTime();
      }
    });
  }

  async function loadAvailability() {
    if (!dateInput.value) {
      applyOccupiedTimes([]);
      return;
    }

    try {
      const params = new URLSearchParams({ data: dateInput.value });
      const data = await requestJson(`${dataUrl}?${params.toString()}`);
      applyOccupiedTimes(data.horarios_ocupados || []);
    } catch (error) {
      showMessage(error.message);
    }
  }

  async function initialiseBooking() {
    setLoading(true);

    try {
      const params = dateInput.value ? `?${new URLSearchParams({ data: dateInput.value }).toString()}` : '';
      const data = await requestJson(`${dataUrl}${params}`);
      renderUser(data.usuario);
      renderServices(data.servicos || []);
      applyOccupiedTimes(data.horarios_ocupados || []);
      clearMessage();
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  timeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;

      selectedTime = button.dataset.time;
      timeInput.value = selectedTime;

      timeButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-selected', active);
        item.setAttribute('aria-pressed', String(active));
      });

      clearMessage();
    });
  });

  procedure.addEventListener('change', () => {
    updateServiceDetails();
    clearMessage();
  });

  dateInput.addEventListener('change', () => {
    clearSelectedTime();
    clearMessage();
    loadAvailability();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    const service = services.get(procedure.value);

    if (!service || !dateInput.value || !selectedTime) {
      showMessage('Selecione procedimento, data e horário para continuar.');
      return;
    }

    timeInput.value = selectedTime;
    setLoading(true);

    try {
      const result = await requestJson(form.action, {
        method: 'POST',
        body: new FormData(form),
      });
      const confirmedService = result.servico || service;

      summary.textContent = `${currentUser.nome}, seu agendamento de ${confirmedService.nome} (${formatMoney(confirmedService.valor)}) foi marcado para ${formatDate(dateInput.value)}, às ${selectedTime}.`;
      bookingView.classList.add('hidden-view');
      successView.classList.remove('hidden-view');
      refreshIcons();
    } catch (error) {
      showMessage(error.message);
      loadAvailability();
    } finally {
      setLoading(false);
    }
  });

  newBookingButton.addEventListener('click', () => {
    form.reset();
    clearSelectedTime();
    clearMessage();
    updateServiceDetails();
    successView.classList.add('hidden-view');
    bookingView.classList.remove('hidden-view');
    loadAvailability();
    procedure.focus();
  });

  refreshIcons();
  initialiseBooking();
})();
