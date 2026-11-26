(async function () {
  const flow = window.NoxFlow;
  const app = document.querySelector('#app');

  const header = (step = '03 / 04') => {
    const contaLink = window.NoxApi?.isLoggedIn()
      ? '<a class="back-link" href="../account/account.html">Conta</a>'
      : '';

    return `
      <header class="app-header">
        <a class="brand" href="../home/index.html">
          <span>BUSCAMOR</span>
          <small>MOTEL</small>
        </a>
        <div style="display: flex; align-items: center; gap: 20px;">
          ${contaLink}
          <span class="step-label">${step}</span>
        </div>
      </header>
    `;
  };

  const shell = (content, step = '03 / 04') => `
    ${header(step)}
    <main class="flow-shell">${content}</main>
  `;

  const formatDuration = (value) =>
    ({
      '3-hours': '3 horas',
      '6-hours': '6 horas',
      overnight: 'Pernoite'
    })[value] || value;

  const button = (label) => `
    <button class="button button-dark" type="submit">
      ${label} <span>↗</span>
    </button>
  `;

  const intro = (eyebrow, title, description) => `
    <div class="flow-intro">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
  `;

  const loadSelectedSuite = async () => {
    if (flow.suiteId) {
      try {
        return await window.NoxApi.getSuite(flow.suiteId);
      } catch {
        // fallback para primeira suíte disponível
      }
    }
    const suites = await window.NoxApi.listSuites();
    if (suites.length > 0) {
      flow.suiteId = suites[0].id;
      return suites[0];
    }
    return null;
  };

  try {
    const suite = await loadSelectedSuite();
    if (!suite) {
      app.innerHTML = shell(
        intro('Aviso', 'Suíte não<br /><em>encontrada.</em>', 'Volte e selecione uma suíte novamente.')
      );
      return;
    }

    if (!window.NoxApi.isLoggedIn()) {
      window.location.href = '../account/account.html';
      return;
    }

    app.innerHTML = shell(
      `
        ${intro(
          '03 · Pagamento',
          'Quase lá.<br /><em>Pague com Mercado Pago.</em>',
          'Você será redirecionado para o ambiente seguro do Mercado Pago (Pix ou Cartão).'
        )}
        <div class="flow-columns">
          <form class="panel-form" id="paymentForm">
            <div class="payment-note">
              Ao clicar abaixo, sua reserva será registrada e uma nova aba abrirá com o Checkout Pro do Mercado Pago.
            </div>
            ${button('Ir para Mercado Pago')}
          </form>
          <aside class="reservation-card">
            <p class="eyebrow">Resumo</p>
            <h2>Suíte ${suite.number} · ${suite.name}</h2>
            <p>${flow.formatDate(flow.criteria.date)} · ${flow.criteria.arrivalTime} (${formatDuration(flow.criteria.duration)})</p>
            <hr />
            <div class="price-row total">
              <span>Total</span>
              <strong>${suite.price}</strong>
            </div>
          </aside>
        </div>
      `,
      '03 / 04'
    );

    document.querySelector('#paymentForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector('button[type="submit"]');
      const note = form.querySelector('.payment-note');

      submitButton.disabled = true;
      submitButton.textContent = 'Gerando pagamento...';

      try {
        const { reserva, checkout } = await window.NoxApi.createReservationAndCheckout(
          suite.id,
          flow.criteria
        );

        sessionStorage.setItem('noxLastReservation', JSON.stringify(reserva));
        window.open(checkout.checkoutUrl, '_blank', 'noopener,noreferrer');

        submitButton.textContent = 'Aguardando pagamento...';
        note.innerHTML = `
          A janela do Mercado Pago foi aberta em uma nova aba. Assim que o pagamento for aprovado, esta página irá automaticamente para <strong>Minhas Reservas</strong>.
          <br /><br />
          Caso não tenha aberto, <a href="${checkout.checkoutUrl}" target="_blank" rel="noopener noreferrer"><strong>clique aqui para pagar</strong></a>.
        `;

        const intervaloVerificacao = setInterval(async () => {
          try {
            const minhasReservas = await window.NoxApi.getMinhasReservas();
            const reservaAtualizada = minhasReservas.find((r) => r.id === reserva.id);

            if (reservaAtualizada && reservaAtualizada.status === 'CONFIRMADA') {
              clearInterval(intervaloVerificacao);
              window.location.href = '../minhas-reservas/minhas-reservas.html';
            }
          } catch {
            // Ignora falhas temporárias enquanto aguarda o pagamento
          }
        }, 3000);
      } catch (error) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Ir para Mercado Pago <span>↗</span>';
        note.textContent = error.message;
      }
    });
  } catch (error) {
    app.innerHTML = shell(
      intro('Erro', 'Falha ao carregar<br /><em>o checkout.</em>', error.message)
    );
  }
})();
