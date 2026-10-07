(() => {
  const list = document.getElementById('appointments-list');
  const template = document.getElementById('appointment-template');
  const message = document.getElementById('page-message');
  const customerSummary = document.getElementById('customer-summary');

  const dataUrl = '../../processos/meus_agendamentos_dados.php';
  const availabilityUrl = '../../processos/agendamento_dados.php';
  const updateUrl = '../../processos/agendamento_atualizar.php';
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  let services = [];

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

  function statusLabel(status) {
    const labels = {
      agendado: 'Agendado',
      confirmado: 'Confirmado',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
    };

    return labels[status] || status;
  }

  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.classList.remove('hidden', 'is-success');
    message.classList.toggle('is-success', type === 'success');
  }

  function clearMessage() {
    message.textContent = '';
    message.classList.add('hidden');
    message.classList.remove('is-success');
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
      throw new Error('Sessão expirada.');
    }

    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Não foi possível completar a solicitação.');
    }

    return data;
  }

  function fillServices(select, selectedId) {
    select.innerHTML = '';

    services.forEach((service) => {
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = `${service.nome} - ${formatMoney(service.valor)}`;
      option.selected = Number(selectedId) === Number(service.id);
      select.appendChild(option);
    });
  }

  function setSelectedTime(form, time) {
    const input = form.querySelector('[name="horario"]');
    input.value = time;

    form.querySelectorAll('.time-slot').forEach((button) => {
      const active = button.dataset.time === time;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  async function updateTimes(form, appointment) {
    const dateInput = form.querySelector('[name="data"]');
    const currentSelected = form.querySelector('[name="horario"]').value || appointment.hora_inicio;
    const params = new URLSearchParams({ data: dateInput.value });

    try {
      const data = await requestJson(`${availabilityUrl}?${params.toString()}`);
      const occupied = new Set(data.horarios_ocupados || []);

      form.querySelectorAll('.time-slot').forEach((button) => {
        const isOwnOriginalTime = dateInput.value === appointment.data && button.dataset.time === appointment.hora_inicio;
        const isOccupied = occupied.has(button.dataset.time) && !isOwnOriginalTime;
        button.disabled = isOccupied;
        button.title = isOccupied ? 'Horário já agendado' : '';
        button.setAttribute('aria-disabled', String(isOccupied));

        if (isOccupied && button.dataset.time === currentSelected) {
          setSelectedTime(form, '');
        }
      });
    } catch (error) {
      showMessage(error.message);
    }
  }

  function renderTimeButtons(form, appointment) {
    const grid = form.querySelector('.time-grid');
    grid.innerHTML = '';

    times.forEach((time) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-slot';
      button.dataset.time = time;
      button.textContent = time;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (!button.disabled) {
          setSelectedTime(form, time);
          clearMessage();
        }
      });
      grid.appendChild(button);
    });

    setSelectedTime(form, appointment.hora_inicio);
    updateTimes(form, appointment);
  }

  async function submitUpdate(form) {
    clearMessage();
    const formData = new FormData(form);

    if (!formData.get('horario')) {
      showMessage('Escolha um horário disponível.');
      return;
    }

    try {
      await requestJson(updateUrl, {
        method: 'POST',
        body: formData,
      });
      showMessage('Agendamento alterado com sucesso.', 'success');
      await loadPage();
    } catch (error) {
      showMessage(error.message);
    }
  }

  async function cancelAppointment(appointment) {
    clearMessage();
    const confirmed = window.confirm(`Cancelar o agendamento de ${appointment.servico_nome} em ${formatDate(appointment.data)}, às ${appointment.hora_inicio}?`);

    if (!confirmed) return;

    const formData = new FormData();
    formData.set('acao', 'cancelar');
    formData.set('id_agendamento', appointment.id);

    try {
      await requestJson(updateUrl, {
        method: 'POST',
        body: formData,
      });
      showMessage('Agendamento cancelado com sucesso.', 'success');
      await loadPage();
    } catch (error) {
      showMessage(error.message);
    }
  }

  function renderAppointment(appointment) {
    const node = template.content.firstElementChild.cloneNode(true);
    const form = node.querySelector('.appointment-form');
    const status = node.querySelector('.status-pill');
    const locked = ['cancelado', 'concluido'].includes(appointment.status);

    status.textContent = statusLabel(appointment.status);
    status.classList.toggle('is-canceled', appointment.status === 'cancelado');
    status.classList.toggle('is-done', appointment.status === 'concluido');

    node.querySelector('.appointment-title').textContent = appointment.servico_nome;
    node.querySelector('.appointment-meta').textContent = `${formatDate(appointment.data)} · ${appointment.hora_inicio} às ${appointment.hora_fim}`;
    node.querySelector('.appointment-price').textContent = formatMoney(appointment.valor);
    node.classList.toggle('is-locked', locked);

    form.querySelector('[name="id_agendamento"]').value = appointment.id;
    form.querySelector('[name="data"]').value = appointment.data;
    fillServices(form.querySelector('[name="id_servico"]'), appointment.id_servico);
    renderTimeButtons(form, appointment);

    form.querySelector('[name="data"]').addEventListener('change', () => updateTimes(form, appointment));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitUpdate(form);
    });
    form.querySelector('.cancel-button').addEventListener('click', () => cancelAppointment(appointment));

    return node;
  }

  function renderAppointments(appointments) {
    list.innerHTML = '';

    if (!appointments.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Você ainda não tem agendamentos. Quando marcar um horário, ele aparecerá aqui para acompanhamento, alteração ou cancelamento.';
      list.appendChild(empty);
      return;
    }

    appointments.forEach((appointment) => {
      list.appendChild(renderAppointment(appointment));
    });
  }

  async function loadPage() {
    const data = await requestJson(dataUrl);
    services = data.servicos || [];
    customerSummary.textContent = `${data.usuario.nome} · ${data.usuario.email}`;
    renderAppointments(data.agendamentos || []);
  }

  loadPage().catch((error) => showMessage(error.message));
})();
