const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const suiteGrid = document.querySelector('#suiteGrid');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const syncHeaderAuth = () => {
  if (!mainNav) return;

  mainNav.querySelectorAll('a').forEach((link) => {
    if (link.textContent.trim().toLowerCase().includes('sair da conta')) {
      link.remove();
    }
  });

  const accountNavLink =
    mainNav.querySelector('#navAccountLink') ||
    mainNav.querySelector('a[href="../account/account.html"]');

  if (!accountNavLink) return;

  if (window.NoxApi?.isLoggedIn()) {
    accountNavLink.textContent = 'Conta';
    accountNavLink.href = '../account/account.html';

    const logoutNavLink = document.createElement('a');
    logoutNavLink.id = 'navLogoutLink';
    logoutNavLink.href = '#';
    logoutNavLink.textContent = 'Sair da conta';
    logoutNavLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.NoxApi.logout();
      window.location.reload();
    });

    accountNavLink.insertAdjacentElement('afterend', logoutNavLink);
  } else {
    accountNavLink.textContent = 'Entrar';
    accountNavLink.href = '../account/account.html';
  }
};

syncHeaderAuth();

const renderSuites = (suites) => {
  if (!suiteGrid) return;

  if (!suites.length) {
    suiteGrid.innerHTML =
      '<p>Nenhuma suíte disponível no momento. Entre como Admin em "Conta" para cadastrar.</p>';
    return;
  }

  suiteGrid.innerHTML = suites
    .map(
      (suite) => `
        <article
          class="suite-card"
          data-suite="${suite.id}"
          tabindex="0"
          role="link"
          aria-label="Ver detalhes da ${suite.name}"
        >
          <div
            class="suite-image"
            style="background-image:url('${suite.image}')"
          >
            ${suite.tag ? `<span class="suite-tag">${suite.tag}</span>` : ''}
            <button class="heart" aria-label="Favoritar suíte">♡</button>
          </div>
          <div class="suite-info">
            <div>
              <h3>Suíte ${suite.number} · ${suite.name}</h3>
              <p>${suite.summary}</p>
            </div>
            <strong>
              A partir de<br />
              <b>${suite.price}</b>
            </strong>
          </div>
        </article>
      `
    )
    .join('');

  bindSuiteInteractions();
};

const bindSuiteInteractions = () => {
  document.querySelectorAll('.heart').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      button.classList.toggle('selected');
      button.textContent = button.classList.contains('selected') ? '♥' : '♡';
    });
  });

  document.querySelectorAll('.suite-card').forEach((card) => {
    const openSuite = () => {
      window.location.href = `../quarto/quarto.html?suite=${card.dataset.suite}`;
    };

    card.addEventListener('click', (event) => {
      if (!event.target.closest('.heart')) openSuite();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSuite();
      }
    });
  });
};

window.NoxApi.listSuites()
  .then(renderSuites)
  .catch((err) => {
    if (suiteGrid) {
      suiteGrid.innerHTML = `<p>Erro ao conectar com o servidor: ${err.message}</p>`;
    }
  });

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.booking-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document
      .querySelectorAll('.booking-tab')
      .forEach((item) => item.classList.remove('active'));

    tab.classList.add('active');

    document.querySelectorAll('.later-field').forEach((field) => {
      field.classList.toggle('hidden', tab.dataset.mode !== 'later');
      field.querySelector('input').required = tab.dataset.mode === 'later';
    });
  });
});

document.querySelector('.booking-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const feedback = document.querySelector('.booking-feedback');
  const form = new FormData(event.currentTarget);
  const criteria = {
    unit: form.get('unit'),
    date: form.get('date') || null,
    arrivalTime: form.get('arrivalTime') || null,
    duration: form.get('duration')
  };

  feedback.textContent = 'Consultando disponibilidade...';

  try {
    const result = await window.NoxApi.checkAvailability(criteria);

    if (!result.available) {
      feedback.textContent = 'Não há suítes disponíveis para o período informado.';
      return;
    }

    const query = new URLSearchParams(
      Object.entries(criteria).filter(([, value]) => value)
    );
    window.location.href = `../disponibilidade/disponibilidade.html?${query}`;
  } catch (error) {
    feedback.textContent = error.message;
  }
});

document.querySelector('.cookie-accept')?.addEventListener('click', () => {
  document.querySelector('.cookie-banner')?.remove();
});

const hojeISO = new Date().toLocaleDateString('en-CA');
document.querySelectorAll('input[type="date"]').forEach((input) => {
  input.min = hojeISO;
  if (!input.value || input.value < hojeISO) {
    input.value = hojeISO;
  }
});

const revealItems = document.querySelectorAll('.reveal');
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (!prefersReducedMotion) {
  window.addEventListener(
    'scroll',
    () => {
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.setProperty('--hero-offset', `${window.scrollY * 0.16}px`);
      }
    },
    { passive: true }
  );
}
