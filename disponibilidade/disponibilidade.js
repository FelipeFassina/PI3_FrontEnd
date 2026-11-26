(async function () {
  const flow = window.NoxFlow;
  const app = document.querySelector('#app');

  const header = () => {
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
          <a class="back-link" href="../home/index.html">← Início</a>
        </div>
      </header>
    `;
  };

  const shell = (content) => `
    ${header()}
    <main class="flow-shell">${content}</main>
  `;

  const formatDuration = (value) =>
    ({
      '3-hours': '3 horas',
      '6-hours': '6 horas',
      overnight: 'Pernoite'
    })[value] || value;

  const intro = (eyebrow, title, description) => `
    <div class="flow-intro">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
  `;

  app.innerHTML = shell(`
    ${intro('01 · Disponibilidade', 'Buscando<br /><em>suítes...</em>', 'Consultando disponibilidade em tempo real.')}
  `);

  try {
    const result = await window.NoxApi.checkAvailability(flow.criteria);
    const suites = result.suites;

    if (!suites.length) {
      app.innerHTML = shell(`
        ${intro(
          '01 · Disponibilidade',
          'Nenhuma suíte<br /><em>livre neste horário.</em>',
          'Tente escolher outro horário ou verifique as suítes cadastradas.'
        )}
        <a class="button button-dark" href="../home/index.html">Nova busca <span>↗</span></a>
      `);
      return;
    }

    const suiteCards = suites
      .map(
        (item, index) => `
          <article class="availability-card">
            <div
              class="availability-image"
              style="background-image:url('${item.image}')"
            >
              <span>${index === 0 ? 'Recomendado' : 'Disponível'}</span>
            </div>
            <div class="availability-info">
              <div>
                <p class="eyebrow">Suíte ${item.number}</p>
                <h2>${item.name}</h2>
                <p>${item.summary}</p>
              </div>
              <strong>
                ${item.price}
                <small>por período</small>
              </strong>
            </div>
            <button class="button button-dark" data-suite="${item.id}">
              Escolher suíte <span>↗</span>
            </button>
          </article>
        `
      )
      .join('');

    app.innerHTML = shell(`
      ${intro(
        '01 · Disponibilidade',
        'Escolha seu<br /><em>cenário.</em>',
        'Suítes livres para o período escolhido. Selecione uma para continuar.'
      )}
      <div class="search-summary">
        <span>${flow.formatDate(flow.criteria.date)}</span>
        <span>${flow.criteria.arrivalTime}</span>
        <span>${formatDuration(flow.criteria.duration)}</span>
      </div>
      <section class="availability-grid">${suiteCards}</section>
    `);

    document.querySelectorAll('[data-suite]').forEach((item) => {
      item.addEventListener('click', () => {
        flow.go('../reserva/reserva.html', { suite: item.dataset.suite });
      });
    });
  } catch (error) {
    app.innerHTML = shell(`
      ${intro('Erro', 'Não foi possível<br /><em>consultar.</em>', error.message)}
    `);
  }
})();
