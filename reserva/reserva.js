(async function () {
  const flow = window.NoxFlow;
  const app = document.querySelector('#app');

  const header = (step = '02 / 04') => {
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

  const shell = (content, step = '02 / 04') => `
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

  const reservationSummary = (suite) => `
    <aside class="reservation-card">
      <p class="eyebrow">Sua escolha</p>
      <div
        class="mini-image"
        style="background-image:url('${suite.image}')"
      ></div>
      <h2>${suite.name}</h2>
      <p>${flow.formatDate(flow.criteria.date)} · ${flow.criteria.arrivalTime} (${formatDuration(flow.criteria.duration)})</p>
      <strong>${suite.price}</strong>
    </aside>
  `;

  const suite = await loadSelectedSuite();
  if (!suite) {
    app.innerHTML = shell(
      intro('Aviso', 'Nenhuma suíte<br /><em>cadastrada.</em>', 'Peça ao administrador para cadastrar as suítes no painel.')
    );
    return;
  }

  const session = window.NoxApi.getSession();

  if (!session?.token) {
    app.innerHTML = shell(
      `
        ${intro(
          '02 · Identificação',
          'Entre na sua<br /><em>conta para reservar.</em>',
          'Para sua segurança, é necessário estar logado antes de confirmar a suíte.'
        )}
        <div class="flow-columns">
          <div class="panel-form">
            <p>Já possui cadastro ou deseja criar sua conta agora?</p>
            <a class="button button-dark" href="../account/account.html">Ir para Login / Cadastro <span>↗</span></a>
          </div>
          ${reservationSummary(suite)}
        </div>
      `,
      '02 / 04'
    );
    return;
  }

  const user = session.user;

  app.innerHTML = shell(
    `
      ${intro(
        '02 · Seus dados',
        'Confira seus<br /><em>dados de reserva.</em>',
        'Seus dados da conta já foram preenchidos automaticamente.'
      )}
      <div class="flow-columns">
        <form class="panel-form" id="guestForm">
          <label class="field">
            <span>Nome completo</span>
            <input name="name" value="${user.nome || ''}" readonly />
          </label>
          <label class="field">
            <span>CPF (apresentar no check-in)</span>
            <input name="document" value="${window.NoxApi.formatarCPF(user.cpf)}" readonly />
          </label>
          <label class="field">
            <span>E-mail</span>
            <input name="email" type="email" value="${user.email || ''}" readonly />
          </label>
          <label class="field">
            <span>Telefone</span>
            <input name="phone" type="tel" value="${window.NoxApi.formatarTelefone(user.telefone)}" readonly />
          </label>
          <label class="check-line">
            <input type="checkbox" required />
            Confirmo os dados e aceito os termos da reserva.
          </label>
          ${button('Continuar para pagamento')}
        </form>
        ${reservationSummary(suite)}
      </div>
    `,
    '02 / 04'
  );

  document.querySelector('#guestForm').addEventListener('submit', (event) => {
    event.preventDefault();
    flow.go('../checkout/checkout.html', { suite: suite.id });
  });
})();
