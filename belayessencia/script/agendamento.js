(() => {
  const form = document.getElementById('booking-form');
  const procedure = document.getElementById('procedure');
  const dateInput = document.getElementById('booking-date');
  const timeInput = document.getElementById('booking-time');
  const nameInput = document.getElementById('full-name');
  const whatsappInput = document.getElementById('whatsapp');
  const timeButtons = [...document.querySelectorAll('.time-slot')];
  const message = document.getElementById('form-message');
  const submitButton = document.getElementById('submit-button');
  const bookingView = document.getElementById('booking-view');
  const successView = document.getElementById('success-view');
  const newBookingButton = document.getElementById('new-booking');
  const summary = document.getElementById('confirmation-summary');

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

  function showMessage(text, type) {
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

  function formatDate(value) {
    const [year, month, day] = value.split('-');
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  function formatPhone(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) {
      input.value = digits;
      return;
    }

    if (digits.length <= 7) {
      input.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      return;
    }

    input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  timeButtons.forEach((button) => {
    button.addEventListener('click', () => {
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

  whatsappInput.addEventListener('input', () => formatPhone(whatsappInput));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    if (!procedure.value || !dateInput.value || !selectedTime || !nameInput.value.trim() || !whatsappInput.value.trim()) {
      showMessage('Preencha os seus dados e selecione procedimento, data e horário para continuar.', 'error');
      return;
    }

    timeInput.value = selectedTime;
    setLoading(true);

    const booking = {
      nome: nameInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      procedimento: procedure.value,
      data: dateInput.value,
      horario: selectedTime,
    };

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json',
        },
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        showMessage(result?.message || 'Não foi possível enviar sua solicitação agora.', 'error');
        return;
      }

      summary.textContent = `${booking.nome}, recebemos sua solicitação para ${booking.procedimento} no dia ${formatDate(booking.data)}, às ${booking.horario}.`;
      bookingView.classList.add('hidden-view');
      successView.classList.remove('hidden-view');
      refreshIcons();
    } catch (error) {
      showMessage('Não foi possível conectar ao sistema de agendamento. Tente novamente em instantes.', 'error');
    } finally {
      setLoading(false);
    }
  });

  newBookingButton.addEventListener('click', () => {
    form.reset();
    selectedTime = '';
    timeInput.value = '';

    timeButtons.forEach((button) => {
      button.classList.remove('is-selected');
      button.setAttribute('aria-pressed', 'false');
    });

    clearMessage();
    successView.classList.add('hidden-view');
    bookingView.classList.remove('hidden-view');
    procedure.focus();
  });

  refreshIcons();
})();
