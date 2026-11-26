(function () {
  const app = document.querySelector('#accountApp');

  const roleLabels = {
    USER: 'Usuário',
    FUNC: 'Funcionário',
    ADMIN: 'Administrador'
  };

  // --- Formatação e Máscaras de CPF e Telefone ---
  const formatarCPF = (valor) =>
    String(valor || '')
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  const formatarTelefone = (valor) => {
    const numeros = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/, '($1)$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numeros
      .replace(/^(\d{2})(\d)/, '($1)$2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatarDataHora = (iso) => {
    if (!iso) return '-';
    if (String(iso).includes('/')) return iso;
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const aplicarMascarasFormulario = (form) => {
    if (!form) return;

    const inputCpf = form.querySelector('input[name="cpf"]');
    const inputTelefone = form.querySelector('input[name="telefone"]');

    if (inputCpf) {
      inputCpf.setAttribute('maxlength', '14');
      inputCpf.addEventListener('input', (e) => {
        e.target.value = formatarCPF(e.target.value);
      });
    }

    if (inputTelefone) {
      inputTelefone.setAttribute('maxlength', '14');
      inputTelefone.addEventListener('input', (e) => {
        e.target.value = formatarTelefone(e.target.value);
      });
    }
  };

  const layout = (eyebrow, title, description, content) => `
    <div class="flow-intro">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
    ${content}
  `;

  const syncHeaderLogout = () => {
    let btnSairTopo = document.querySelector('#headerLogoutBtn');
    const appHeader = document.querySelector('.app-header');

    if (!btnSairTopo && appHeader) {
      btnSairTopo = document.createElement('a');
      btnSairTopo.id = 'headerLogoutBtn';
      btnSairTopo.className = 'back-link';
      btnSairTopo.href = '#';
      btnSairTopo.textContent = 'Sair da conta';
      appHeader.appendChild(btnSairTopo);
    }

    if (btnSairTopo) {
      btnSairTopo.style.display = window.NoxApi.isLoggedIn() ? 'inline-block' : 'none';
      btnSairTopo.onclick = (e) => {
        e.preventDefault();
        window.NoxApi.logout();
        btnSairTopo.style.display = 'none';
        renderLogin();
      };
    }
  };

  const renderLogin = (message = '') => {
    syncHeaderLogout();

    app.innerHTML = layout(
      'Área segura',
      'Entre na sua<br /><em>conta.</em>',
      'Acesse sua reserva ou as ferramentas da equipe BUSCAMOR.',
      `
        <div class="account-grid">
          <form class="panel-form" id="loginForm">
            <p class="eyebrow">Já tenho conta</p>
            <label class="field"><span>E-mail</span><input name="email" type="email" required /></label>
            <label class="field"><span>Senha</span><input name="senha" type="password" required /></label>
            <button class="button button-dark" type="submit">Entrar <span>↗</span></button>
            <p class="form-feedback">${message}</p>
          </form>

          <form class="panel-form" id="signupForm">
            <p class="eyebrow">Primeiro acesso</p>
            <label class="field"><span>Nome completo</span><input name="nome" required /></label>
            <label class="field"><span>E-mail</span><input name="email" type="email" required /></label>
            <label class="field"><span>CPF</span><input name="cpf" placeholder="000.000.000-00" required /></label>
            <label class="field"><span>Telefone</span><input name="telefone" placeholder="(11) 99999-9999" required /></label>
            <label class="field"><span>Senha (mínimo 8 caracteres)</span><input name="senha" type="password" minlength="8" required /></label>
            <button class="button button-dark" type="submit">Criar conta <span>↗</span></button>
            <p class="form-feedback" aria-live="polite"></p>
          </form>
        </div>
      `
    );

    const signupForm = document.querySelector('#signupForm');
    aplicarMascarasFormulario(signupForm);

    document.querySelector('#loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const feedback = form.querySelector('.form-feedback');
      const data = Object.fromEntries(new FormData(form));

      feedback.textContent = 'Autenticando...';
      try {
        await window.NoxApi.login(data.email, data.senha);
        renderDashboard();
      } catch (error) {
        feedback.textContent = error.message;
      }
    });

    document.querySelector('#signupForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const feedback = form.querySelector('.form-feedback');
      const data = Object.fromEntries(new FormData(form));

      data.cpf = data.cpf.replace(/\D/g, '');
      data.telefone = data.telefone.replace(/\D/g, '');

      feedback.textContent = 'Criando conta...';
      try {
        await window.NoxApi.register(data);
        await window.NoxApi.login(data.email, data.senha);
        renderDashboard();
      } catch (error) {
        feedback.textContent = error.message;
      }
    });
  };

  const renderDashboard = async () => {
    const session = window.NoxApi.getSession();
    if (!session?.token || !session?.user) {
      renderLogin();
      return;
    }

    const user = session.user;
    const role = user.role;

    if (role === 'USER') {
      app.innerHTML = layout(
        `${roleLabels[role]} · Conta ativa`,
        `Olá, ${user.nome}.`,
        'Consulte suas reservas e acompanhe o status do seu pagamento.',
        `
          <section class="account-panel">
            <p class="eyebrow">Área do hóspede</p>
            <h2>Suas reservas</h2>
            <p>CPF cadastrado: <strong>${formatarCPF(user.cpf || '')}</strong></p>
            <a class="button button-dark" href="../minhas-reservas/minhas-reservas.html">Ver minhas reservas <span>↗</span></a>
          </section>
        `
      );
    }

    if (role === 'FUNC') {
      app.innerHTML = layout(
        `${roleLabels[role]} · Operação`,
        `Olá, ${user.nome}.`,
        'Gerencie o check-in e check-out dos hóspedes.',
        `
          <section class="account-panel">
            <p class="eyebrow">Recepção</p>
            <h2>Reservas do motel</h2>
            <div class="admin-list" id="funcReservasList">Carregando reservas...</div>
            <p class="form-feedback" id="checkinFeedback" aria-live="polite"></p>
          </section>
        `
      );

      const carregarReservasRecepcao = async () => {
        const container = document.querySelector('#funcReservasList');
        const feedback = document.querySelector('#checkinFeedback');
        try {
          const reservas = await window.NoxApi.getTodasReservas();
          if (!reservas.length) {
            container.innerHTML = '<p>Nenhuma reserva registrada no momento.</p>';
            return;
          }

          container.innerHTML = reservas
            .map(
              (r) => `
                <div class="admin-suite" style="flex-wrap: wrap; gap: 10px;">
                  <span>
                    <strong>#${r.id}</strong> · Suíte ${r.numeroQuarto} (${r.nomeQuarto}) — Cliente: <strong>${r.nomeCliente}</strong>
                    <br />
                    <small>
                      Check-in: ${formatarDataHora(r.dataCheckIn)} · Check-out: ${formatarDataHora(r.dataCheckOut)}
                      <br />
                      Status: <strong>${r.status}</strong> · Valor: <strong>${window.NoxApi.formatPrice(r.valorTotal)}</strong>
                    </small>
                  </span>
                  <div style="display: flex; gap: 8px;">
                    ${
                      r.status === 'CONFIRMADA'
                        ? `<button type="button" data-checkin="${r.id}">Fazer Check-in</button>`
                        : ''
                    }
                    ${
                      r.status === 'EM_ANDAMENTO'
                        ? `<button type="button" data-checkout="${r.id}">Fazer Check-out</button>`
                        : ''
                    }
                  </div>
                </div>
              `
            )
            .join('');

          container.querySelectorAll('[data-checkin]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              try {
                await window.NoxApi.realizarCheckIn(btn.dataset.checkin);
                feedback.textContent = `Check-in da reserva #${btn.dataset.checkin} realizado!`;
                carregarReservasRecepcao();
              } catch (err) {
                feedback.textContent = err.message;
              }
            });
          });

          container.querySelectorAll('[data-checkout]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              try {
                await window.NoxApi.realizarCheckOut(btn.dataset.checkout);
                feedback.textContent = `Check-out da reserva #${btn.dataset.checkout} concluído!`;
                carregarReservasRecepcao();
              } catch (err) {
                feedback.textContent = err.message;
              }
            });
          });
        } catch (err) {
          container.innerHTML = `<p>${err.message}</p>`;
        }
      };

      carregarReservasRecepcao();
    }

    if (role === 'ADMIN') {
      app.innerHTML = layout(
        `${roleLabels[role]} · Gestão`,
        `Olá, ${user.nome}.`,
        'Cadastre ou edite suítes, gerencie status, gerencie funcionários e acompanhe todas as reservas.',
        `
          <div class="account-grid">
            <section class="account-panel" id="suiteFormPanel">
              <p class="eyebrow" id="suiteFormEyebrow">Nova Suíte</p>
              <h2 id="suiteFormTitle">Cadastrar quarto</h2>
              <form class="panel-form" id="suiteForm">
                <input type="hidden" name="id" />
                <label class="field"><span>Número da suíte</span><input name="numero" inputmode="numeric" pattern="[0-9]+" placeholder="Ex: 05" required /></label>
                <label class="field"><span>Nome da suíte</span><input name="nome" placeholder="Ex: Suíte Aura" required /></label>
                <label class="field"><span>Características / O que tem (separe por vírgula)</span><input name="caracteristicas" placeholder="Banheira de imersão, Cama king size, Som ambiente, Smart TV" required /></label>
                <label class="field"><span>01 · Título da descrição</span><input name="tituloDescricao" placeholder="Ex: Um refúgio para desacelerar." required /></label>
                <label class="field"><span>01 · Descrição completa</span><textarea name="descricaoDetalhada" rows="3" placeholder="Texto detalhado sobre a experiência da suíte..." required></textarea></label>
                <label class="field"><span>Preço por período (R$)</span><input name="precoDiaria" type="number" step="0.01" placeholder="189.90" required /></label>
                <label class="field"><span id="suiteFotoLabel">Foto do quarto</span><input name="foto" type="file" accept="image/*" required /></label>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <button class="button button-dark" type="submit" id="suiteSubmitBtn">Cadastrar suíte <span>↗</span></button>
                  <button class="button" type="button" id="suiteCancelEditBtn" style="display: none;">Cancelar edição</button>
                </div>
              </form>
              <p class="form-feedback" id="suiteFeedback" aria-live="polite"></p>
            </section>

            <section class="account-panel">
              <p class="eyebrow">Equipe</p>
              <h2>Cadastrar funcionário</h2>
              <form class="panel-form" id="funcForm">
                <label class="field"><span>Nome</span><input name="nome" required /></label>
                <label class="field"><span>E-mail</span><input name="email" type="email" required /></label>
                <label class="field"><span>CPF</span><input name="cpf" placeholder="000.000.000-00" required /></label>
                <label class="field"><span>Telefone</span><input name="telefone" placeholder="(11) 99999-9999" required /></label>
                <label class="field"><span>Senha (mín. 8 caracteres)</span><input name="senha" type="password" minlength="8" required /></label>
                <button class="button button-dark" type="submit">Cadastrar funcionário</button>
              </form>
              <p class="form-feedback" id="funcFeedback" aria-live="polite"></p>
            </section>
          </div>

          <section class="account-panel" style="margin-top: 24px;">
            <p class="eyebrow">Suítes cadastradas no banco</p>
            <h2>Gerenciar quartos</h2>
            <div class="admin-list" id="suiteAdminList">Carregando...</div>
          </section>

          <section class="account-panel" style="margin-top: 24px;">
            <p class="eyebrow">Equipe cadastrada</p>
            <h2>Gerenciar funcionários</h2>
            <div class="admin-list" id="funcAdminList">Carregando funcionários...</div>
          </section>

          <section class="account-panel" style="margin-top: 24px;">
            <p class="eyebrow">Histórico e operação</p>
            <h2>Todas as reservas</h2>
            <div class="admin-list" id="adminReservasList">Carregando reservas...</div>
            <p class="form-feedback" id="adminReservasFeedback" aria-live="polite"></p>
          </section>
        `
      );

      const funcForm = document.querySelector('#funcForm');
      aplicarMascarasFormulario(funcForm);

      const inputNumeroSuite = document.querySelector('#suiteForm input[name="numero"]');
      if (inputNumeroSuite) {
        inputNumeroSuite.addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/\D/g, '');
        });
      }

      const resetarFormularioSuite = () => {
        const form = document.querySelector('#suiteForm');
        form.reset();
        form.querySelector('input[name="id"]').value = '';
        form.querySelector('input[name="foto"]').required = true;
        document.querySelector('#suiteFormEyebrow').textContent = 'Nova Suíte';
        document.querySelector('#suiteFormTitle').textContent = 'Cadastrar quarto';
        document.querySelector('#suiteFotoLabel').textContent = 'Foto do quarto';
        document.querySelector('#suiteSubmitBtn').innerHTML = 'Cadastrar suíte <span>↗</span>';
        document.querySelector('#suiteCancelEditBtn').style.display = 'none';
      };

      document.querySelector('#suiteCancelEditBtn').addEventListener('click', () => {
        resetarFormularioSuite();
        document.querySelector('#suiteFeedback').textContent = '';
      });

      const renderSuitesAdmin = async () => {
        const list = document.querySelector('#suiteAdminList');
        try {
          const suites = await window.NoxApi.listarTodosQuartosAdmin();
          if (!suites.length) {
            list.innerHTML = '<p>Nenhuma suíte cadastrada ainda.</p>';
            return;
          }
          list.innerHTML = suites
            .map(
              (item) => `
                <div class="admin-suite" style="flex-wrap: wrap; gap: 10px;">
                  <span>
                    <strong>Suíte ${item.number}</strong> · ${item.name} (${item.price})
                  </span>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <select data-suite-status="${item.id}">
                      <option value="ATIVO" ${item.status === 'ATIVO' ? 'selected' : ''}>ATIVO</option>
                      <option value="MANUTENCAO" ${item.status === 'MANUTENCAO' ? 'selected' : ''}>MANUTENCAO</option>
                      <option value="INATIVO" ${item.status === 'INATIVO' ? 'selected' : ''}>INATIVO</option>
                    </select>
                    <button type="button" data-save-status="${item.id}">Atualizar status</button>
                    <button type="button" data-edit-suite="${item.id}">Editar</button>
                  </div>
                </div>
              `
            )
            .join('');

          list.querySelectorAll('[data-save-status]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.saveStatus;
              const novoStatus = list.querySelector(`[data-suite-status="${id}"]`).value;
              try {
                await window.NoxApi.alterarStatusQuarto(id, novoStatus);
                document.querySelector('#suiteFeedback').textContent = 'Status da suíte atualizado!';
                renderSuitesAdmin();
              } catch (err) {
                document.querySelector('#suiteFeedback').textContent = err.message;
              }
            });
          });

          list.querySelectorAll('[data-edit-suite]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const suite = suites.find((s) => String(s.id) === String(btn.dataset.editSuite));
              if (!suite) return;

              const form = document.querySelector('#suiteForm');
              form.querySelector('input[name="id"]').value = suite.id;
              form.querySelector('input[name="numero"]').value = suite.number;
              form.querySelector('input[name="nome"]').value = suite.name;
              form.querySelector('input[name="caracteristicas"]').value = suite.amenities.join(', ');
              form.querySelector('input[name="tituloDescricao"]').value = suite.headline;
              form.querySelector('textarea[name="descricaoDetalhada"]').value = suite.longDescription;
              form.querySelector('input[name="precoDiaria"]').value = suite.priceValue;
              form.querySelector('input[name="foto"]').required = false;

              document.querySelector('#suiteFormEyebrow').textContent = `Editando Suíte ${suite.number}`;
              document.querySelector('#suiteFormTitle').textContent = `Editar ${suite.name}`;
              document.querySelector('#suiteFotoLabel').textContent = 'Nova foto (deixe vazio para manter a atual)';
              document.querySelector('#suiteSubmitBtn').innerHTML = 'Salvar alterações <span>↗</span>';
              document.querySelector('#suiteCancelEditBtn').style.display = 'inline-block';
              document.querySelector('#suiteFeedback').textContent = '';

              document.querySelector('#suiteFormPanel').scrollIntoView({ behavior: 'smooth' });
            });
          });
        } catch (err) {
          list.innerHTML = `<p>${err.message}</p>`;
        }
      };

      const renderFuncionariosAdmin = async () => {
        const list = document.querySelector('#funcAdminList');
        const feedback = document.querySelector('#funcFeedback');
        try {
          const funcionarios = await window.NoxApi.listarFuncionarios();
          if (!funcionarios.length) {
            list.innerHTML = '<p>Nenhum funcionário cadastrado ainda.</p>';
            return;
          }

          list.innerHTML = funcionarios
            .map(
              (f) => `
                <div class="admin-suite" style="flex-wrap: wrap; gap: 10px;">
                  <span>
                    <strong>${f.nome}</strong> · ${f.email}
                    <br /><small>CPF: ${formatarCPF(f.cpf)} · Tel: ${formatarTelefone(f.telefone)}</small>
                  </span>
                  <button type="button" data-remove-func="${f.id}">Remover</button>
                </div>
              `
            )
            .join('');

          list.querySelectorAll('[data-remove-func]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              if (!confirm('Deseja realmente remover este funcionário?')) return;
              try {
                await window.NoxApi.removerFuncionario(btn.dataset.removeFunc);
                feedback.textContent = 'Funcionário removido com sucesso!';
                renderFuncionariosAdmin();
              } catch (err) {
                feedback.textContent = err.message;
              }
            });
          });
        } catch (err) {
          list.innerHTML = `<p>${err.message}</p>`;
        }
      };

      const renderReservasAdmin = async () => {
        const container = document.querySelector('#adminReservasList');
        const feedback = document.querySelector('#adminReservasFeedback');
        try {
          const reservas = await window.NoxApi.getTodasReservas();
          if (!reservas.length) {
            container.innerHTML = '<p>Nenhuma reserva realizada pelos usuários ainda.</p>';
            return;
          }

          container.innerHTML = reservas
            .map(
              (r) => `
                <div class="admin-suite" style="flex-wrap: wrap; gap: 10px;">
                  <span>
                    <strong>#${r.id}</strong> · Suíte ${r.numeroQuarto} (${r.nomeQuarto}) — Cliente: <strong>${r.nomeCliente}</strong>
                    <br />
                    <small>
                      Check-in: ${formatarDataHora(r.dataCheckIn)} · Check-out: ${formatarDataHora(r.dataCheckOut)}
                      <br />
                      Status: <strong>${r.status}</strong> · Valor: <strong>${window.NoxApi.formatPrice(r.valorTotal)}</strong>
                    </small>
                  </span>
                  <div style="display: flex; gap: 8px;">
                    ${
                      r.status === 'CONFIRMADA'
                        ? `<button type="button" data-admin-checkin="${r.id}">Fazer Check-in</button>`
                        : ''
                    }
                    ${
                      r.status === 'EM_ANDAMENTO'
                        ? `<button type="button" data-admin-checkout="${r.id}">Fazer Check-out</button>`
                        : ''
                    }
                  </div>
                </div>
              `
            )
            .join('');

          container.querySelectorAll('[data-admin-checkin]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              try {
                await window.NoxApi.realizarCheckIn(btn.dataset.adminCheckin);
                feedback.textContent = `Check-in da reserva #${btn.dataset.adminCheckin} realizado!`;
                renderReservasAdmin();
              } catch (err) {
                feedback.textContent = err.message;
              }
            });
          });

          container.querySelectorAll('[data-admin-checkout]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              try {
                await window.NoxApi.realizarCheckOut(btn.dataset.adminCheckout);
                feedback.textContent = `Check-out da reserva #${btn.dataset.adminCheckout} concluído!`;
                renderReservasAdmin();
              } catch (err) {
                feedback.textContent = err.message;
              }
            });
          });
        } catch (err) {
          container.innerHTML = `<p>${err.message}</p>`;
        }
      };

      renderSuitesAdmin();
      renderFuncionariosAdmin();
      renderReservasAdmin();

      document.querySelector('#suiteForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const feedback = document.querySelector('#suiteFeedback');
        const formData = new FormData(form);
        const editandoId = formData.get('id');
        const numeroDigitado = String(formData.get('numero') || '').replace(/\D/g, '');

        if (!numeroDigitado) {
          feedback.textContent = 'Informe um número válido para a suíte (apenas números).';
          return;
        }

        feedback.textContent = 'Verificando disponibilidade do número...';
        try {
          const suitesExistentes = await window.NoxApi.listarTodosQuartosAdmin();
          const numeroInt = parseInt(numeroDigitado, 10);
          const duplicado = suitesExistentes.find(
            (s) =>
              String(s.id) !== String(editandoId) &&
              parseInt(String(s.number).replace(/\D/g, ''), 10) === numeroInt
          );

          if (duplicado) {
            feedback.textContent = `Já existe uma suíte cadastrada com o número ${duplicado.number} (${duplicado.name}).`;
            return;
          }

          const arquivoFoto = formData.get('foto');
          let imagemUrl = null;

          if (arquivoFoto && arquivoFoto.size > 0) {
            feedback.textContent = 'Enviando foto...';
            const uploadRes = await window.NoxApi.uploadFotoQuarto(arquivoFoto);
            imagemUrl = uploadRes.imagemUrl;
          }

          const caracteristicasFormatadas = String(formData.get('caracteristicas') || '')
            .split(/[,;./·_\n]+|\s+-\s+/)
            .map((item) => item.trim())
            .filter(Boolean)
            .join(', ');

          const payload = {
            numero: numeroDigitado,
            nome: formData.get('nome'),
            caracteristicas: caracteristicasFormatadas,
            tituloDescricao: formData.get('tituloDescricao'),
            descricaoDetalhada: formData.get('descricaoDetalhada'),
            precoDiaria: Number(formData.get('precoDiaria')),
            imagemUrl
          };

          if (editandoId) {
            feedback.textContent = 'Salvando alterações...';
            await window.NoxApi.atualizarQuarto(editandoId, payload);
            feedback.textContent = 'Suíte atualizada com sucesso!';
          } else {
            feedback.textContent = 'Cadastrando suíte...';
            await window.NoxApi.cadastrarQuarto(payload);
            feedback.textContent = 'Suíte cadastrada com sucesso!';
          }

          resetarFormularioSuite();
          renderSuitesAdmin();
        } catch (err) {
          feedback.textContent = err.message;
        }
      });

      document.querySelector('#funcForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const feedback = document.querySelector('#funcFeedback');
        const data = Object.fromEntries(new FormData(form));

        data.cpf = data.cpf.replace(/\D/g, '');
        data.telefone = data.telefone.replace(/\D/g, '');

        feedback.textContent = 'Cadastrando funcionário...';
        try {
          await window.NoxApi.cadastrarFuncionario(data);
          form.reset();
          feedback.textContent = `Funcionário ${data.nome} cadastrado com sucesso!`;
          renderFuncionariosAdmin();
        } catch (err) {
          feedback.textContent = err.message;
        }
      });
    }

    syncHeaderLogout();
  };

  renderDashboard();
})();
