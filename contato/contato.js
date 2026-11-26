(function () {
  const app = document.querySelector('#app');

  const contaLink = window.NoxApi?.isLoggedIn()
    ? '<a class="back-link" href="../account/account.html">Conta</a>'
    : '';

  app.innerHTML = `
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
    <main class="flow-shell">
      <div class="flow-intro">
        <p class="eyebrow">Fale com a gente</p>
        <h1>Estamos<br /><em>por aqui.</em></h1>
        <p>Tem uma dúvida, sugestão ou quer preparar algo especial? Envie uma mensagem.</p>
      </div>
      <div class="flow-columns">
        <form class="panel-form contact-form">
          <label class="field">
            <span>Seu nome</span>
            <input required />
          </label>
          <label class="field">
            <span>Seu e-mail</span>
            <input type="email" required />
          </label>
          <label class="field">
            <span>Mensagem</span>
            <textarea rows="5" required></textarea>
          </label>
          <button class="button button-dark" type="submit">
            Enviar mensagem <span>↗</span>
          </button>
          <p class="form-feedback" aria-live="polite"></p>
        </form>
        <aside class="contact-details">
          <p class="eyebrow">BUSCAMOR Motel</p>
          <h2>Av. dos Imarés, 320</h2>
          <p>São Paulo — SP<br />Todos os dias, 24 horas</p>
          <a href="tel:+5511999999999">(11) 99999-9999</a>
          <a href="mailto:oi@buscamor.com.br">oi@buscamor.com.br</a>
        </aside>
      </div>
    </main>
  `;

  document.querySelector('.contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.querySelector('.form-feedback').textContent =
      'Mensagem enviada. Retornaremos em breve.';
  });
})();
