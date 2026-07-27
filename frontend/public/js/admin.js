const currentUser = requireAuth(['admin', 'supervisor']);
if (!currentUser) {
  // requireAuth already redirects to login when needed.
} else {
  attachTopbar('/admin');

  const attendanceRows = document.getElementById('attendance-rows');
  const usersRows = document.getElementById('users-rows');
  const branchesRows = document.getElementById('branches-rows');
  const disabledUsersRows = document.getElementById('disabled-users-rows');
  const disabledBranchesRows = document.getElementById('disabled-branches-rows');

  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');
  const statusFilter = document.getElementById('status-filter');
  const lateAfterFilter = document.getElementById('late-after-filter');

  const branchNameInput = document.getElementById('branch-name');
  const branchLocationInput = document.getElementById('branch-location');
  const branchMessage = document.getElementById('branch-message');

  const searchCedulaInput = document.getElementById('search-cedula');
  const searchUserButton = document.getElementById('search-user-btn');
  const foundUserInfo = document.getElementById('found-user-info');
  const newPasswordInput = document.getElementById('new-password');
  const resetPasswordButton = document.getElementById('reset-password-btn');

  let foundCedula = null;
  let branchesCache = [];

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (startDate.value) params.set('startDate', startDate.value);
    if (endDate.value) params.set('endDate', endDate.value);
    if (statusFilter.value) params.set('status', statusFilter.value);
    if (lateAfterFilter.value) params.set('lateAfter', lateAfterFilter.value);
    return params.toString();
  };

  const setFoundUserMessage = (msg, kind = 'error') => {
    foundUserInfo.textContent = msg;
    foundUserInfo.className = `message ${kind}`;
  };

  const setBranchMessage = (msg, kind = 'error') => {
    branchMessage.textContent = msg;
    branchMessage.className = `message ${kind}`;
  };

  const loadAttendance = async () => {
    try {
      const query = buildQuery();
      const rows = await request(`/attendance${query ? `?${query}` : ''}`);
      attendanceRows.innerHTML = rows.map((row) => `
        <tr class="${row.status === 'late' ? 'late-row' : ''}">
          <td>${row.id}</td>
          <td>${row.fullName}</td>
          <td>${row.cedula || row.username}</td>
          <td>${row.branchName || '-'}</td>
          <td>${row.qrGeneratedAt ? formatDateTime(row.qrGeneratedAt) : '-'}</td>
          <td>${formatDateTime(row.checkedInAt)}</td>
          <td><span class="badge ${row.status}">${row.status}</span></td>
        </tr>
      `).join('');

      if (!rows.length) {
        attendanceRows.innerHTML = '<tr><td colspan="7">Sin resultados para esos filtros.</td></tr>';
      }
    } catch (error) {
      attendanceRows.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
      showToast(error.message, 'error');
    }
  };

  const branchOptions = (selectedBranchId) => {
    const options = ['<option value="">Sin sede</option>'];
    branchesCache
      .filter((branch) => branch.is_active || branch.isActive)
      .forEach((branch) => {
        const selected = Number(selectedBranchId) === Number(branch.id) ? 'selected' : '';
        options.push(`<option value="${branch.id}" ${selected}>${branch.name}</option>`);
      });
    return options.join('');
  };

  const loadUsers = async () => {
    try {
      const users = await request('/admin/users?includeInactive=1');
      usersRows.innerHTML = users.map((user) => `
        <tr>
          <td>${user.id}</td>
          <td><input type="text" value="${user.fullName}" data-user-field="fullName" data-user-id="${user.id}" /></td>
          <td><input type="text" value="${user.cedula || user.username}" data-user-field="cedula" data-user-id="${user.id}" /></td>
          <td>
            <select data-user-field="branchId" data-user-id="${user.id}">
              ${branchOptions(user.branchId)}
            </select>
          </td>
          <td>
            <select data-user-field="role" data-user-id="${user.id}">
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
              <option value="supervisor" ${user.role === 'supervisor' ? 'selected' : ''}>Analista de Control y Asistencia</option>
              <option value="empleado" ${user.role === 'empleado' ? 'selected' : ''}>Usuario</option>
            </select>
          </td>
          <td>
            <select data-user-field="isActive" data-user-id="${user.id}">
              <option value="1" ${user.isActive ? 'selected' : ''}>Habilitado</option>
              <option value="0" ${!user.isActive ? 'selected' : ''}>Deshabilitado</option>
            </select>
          </td>
          <td><button type="button" data-save-user-id="${user.id}">Guardar</button></td>
        </tr>
      `).join('');

      if (!users.length) {
        usersRows.innerHTML = '<tr><td colspan="7">No hay usuarios para mostrar.</td></tr>';
      }
    } catch (error) {
      usersRows.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
      showToast(error.message, 'error');
    }
  };

  const loadBranches = async () => {
    try {
      branchesCache = await request('/admin/branches?includeInactive=1');
      branchesRows.innerHTML = branchesCache.map((branch) => `
        <tr>
          <td>${branch.id}</td>
          <td><input type="text" value="${branch.name}" data-branch-field="name" data-branch-id="${branch.id}" /></td>
          <td><input type="text" value="${branch.location || ''}" data-branch-field="location" data-branch-id="${branch.id}" /></td>
          <td>
            <select data-branch-field="isActive" data-branch-id="${branch.id}">
              <option value="1" ${(branch.is_active || branch.isActive) ? 'selected' : ''}>Habilitada</option>
              <option value="0" ${!(branch.is_active || branch.isActive) ? 'selected' : ''}>Deshabilitada</option>
            </select>
          </td>
          <td><button type="button" data-save-branch-id="${branch.id}">Guardar</button></td>
        </tr>
      `).join('');

      if (!branchesCache.length) {
        branchesRows.innerHTML = '<tr><td colspan="5">No hay sedes registradas.</td></tr>';
      }
    } catch (error) {
      branchesRows.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
      showToast(error.message, 'error');
    }
  };

  const loadDisabledSummary = async () => {
    try {
      const summary = await request('/admin/disabled');

      disabledUsersRows.innerHTML = summary.users.map((user) => `
        <tr>
          <td>${user.id}</td>
          <td>${user.fullName}</td>
          <td>${user.cedula}</td>
          <td>${roleLabel(user.role)}</td>
          <td><button type="button" data-reactivate-user-id="${user.id}">Habilitar</button></td>
        </tr>
      `).join('');

      if (!summary.users.length) {
        disabledUsersRows.innerHTML = '<tr><td colspan="5">No hay usuarios deshabilitados.</td></tr>';
      }

      disabledBranchesRows.innerHTML = summary.branches.map((branch) => `
        <tr>
          <td>${branch.id}</td>
          <td>${branch.name}</td>
          <td>${branch.location || '-'}</td>
          <td><button type="button" data-reactivate-branch-id="${branch.id}">Habilitar</button></td>
        </tr>
      `).join('');

      if (!summary.branches.length) {
        disabledBranchesRows.innerHTML = '<tr><td colspan="4">No hay sedes deshabilitadas.</td></tr>';
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const setupSidebarSectionHighlight = () => {
    const navLinks = Array.from(document.querySelectorAll('.admin-sidebar-nav a[href^="#"]'));
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length) return;

    const setActiveLink = (sectionId) => {
      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('active', isActive);
      });
    };

    setActiveLink(sections[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveLink(visible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.2, 0.4, 0.6]
      }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const hideRestrictedAdminSectionsForSupervisor = () => {
    if (currentUser.role !== 'supervisor') return;

    const restrictedSectionIds = ['sec-usuarios', 'sec-credenciales', 'sec-sedes', 'sec-deshabilitados'];
    restrictedSectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = 'none';
      }
    });

    document.querySelectorAll('.admin-sidebar-nav a').forEach((link) => {
      const target = (link.getAttribute('href') || '').replace('#', '');
      if (restrictedSectionIds.includes(target)) {
        link.remove();
      }
    });
  };

  document.getElementById('filter-btn').addEventListener('click', loadAttendance);

  const downloadReport = async (format) => {
    try {
      const token = storage.getToken();
      const query = buildQuery();
      const response = await fetch(`/api/reports/${format}${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'No se pudo exportar el archivo.' }));
        throw new Error(payload.message || 'No se pudo exportar el archivo.');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = format === 'excel' ? 'reporte-asistencia.xlsx' : 'reporte-asistencia.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Reporte exportado correctamente.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  document.getElementById('export-excel').addEventListener('click', () => downloadReport('excel'));
  document.getElementById('export-pdf').addEventListener('click', () => downloadReport('pdf'));

  if (currentUser.role === 'admin') {
    searchUserButton.addEventListener('click', async () => {
      const cedula = searchCedulaInput.value.trim();
      foundCedula = null;
      resetPasswordButton.disabled = true;

      if (!cedula) {
        setFoundUserMessage('Ingresa una cedula para buscar.', 'error');
        return;
      }

      try {
        const user = await request(`/admin/users/by-cedula/${encodeURIComponent(cedula)}`);
        foundCedula = user.cedula;
        setFoundUserMessage(`Encontrado: ${user.fullName} (${roleLabel(user.role)})`, 'success');
        resetPasswordButton.disabled = false;
      } catch (error) {
        setFoundUserMessage(error.message, 'error');
        showToast(error.message, 'error');
      }
    });

    resetPasswordButton.addEventListener('click', async () => {
      const newPassword = newPasswordInput.value;
      if (!foundCedula) {
        setFoundUserMessage('Primero busca un usuario por cedula.', 'error');
        return;
      }
      if (newPassword.length < 6) {
        setFoundUserMessage('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
        return;
      }

      try {
        await request('/admin/users/reset-password', {
          method: 'PATCH',
          body: JSON.stringify({ cedula: foundCedula, newPassword })
        });
        setFoundUserMessage('Contraseña reseteada correctamente.', 'success');
        newPasswordInput.value = '';
        showToast('Contraseña restablecida correctamente.', 'success');
      } catch (error) {
        setFoundUserMessage(error.message, 'error');
        showToast(error.message, 'error');
      }
    });

    document.getElementById('create-branch-btn').addEventListener('click', async () => {
      const name = branchNameInput.value.trim();
      const location = branchLocationInput.value.trim();

      if (!name) {
        setBranchMessage('El nombre de sede es obligatorio.', 'error');
        return;
      }

      try {
        await request('/admin/branches', {
          method: 'POST',
          body: JSON.stringify({ name, location })
        });
        setBranchMessage('Sede creada correctamente.', 'success');
        showToast('Sede creada correctamente.', 'success');
        branchNameInput.value = '';
        branchLocationInput.value = '';
        await loadBranches();
        await loadDisabledSummary();
        await loadUsers();
      } catch (error) {
        setBranchMessage(error.message, 'error');
        showToast(error.message, 'error');
      }
    });
  } else {
    searchUserButton.disabled = true;
    resetPasswordButton.disabled = true;
    document.getElementById('create-branch-btn').disabled = true;
    searchCedulaInput.disabled = true;
    newPasswordInput.disabled = true;
    branchNameInput.disabled = true;
    branchLocationInput.disabled = true;
  }

  usersRows.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-save-user-id]');
    if (!button) return;

    const userId = button.dataset.saveUserId;
    const fullName = document.querySelector(`input[data-user-id="${userId}"][data-user-field="fullName"]`)?.value?.trim() || '';
    const cedula = document.querySelector(`input[data-user-id="${userId}"][data-user-field="cedula"]`)?.value?.trim() || '';
    const role = document.querySelector(`select[data-user-id="${userId}"][data-user-field="role"]`)?.value || '';
    const branchId = document.querySelector(`select[data-user-id="${userId}"][data-user-field="branchId"]`)?.value || '';
    const isActive = document.querySelector(`select[data-user-id="${userId}"][data-user-field="isActive"]`)?.value === '1';

    try {
      await request(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          cedula,
          role,
          branchId: branchId ? Number(branchId) : null,
          isActive
        })
      });

      showToast('Usuario guardado correctamente.', 'success');
      await loadUsers();
      await loadDisabledSummary();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  branchesRows.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-save-branch-id]');
    if (!button) return;

    const branchId = button.dataset.saveBranchId;
    const name = document.querySelector(`input[data-branch-id="${branchId}"][data-branch-field="name"]`)?.value?.trim() || '';
    const location = document.querySelector(`input[data-branch-id="${branchId}"][data-branch-field="location"]`)?.value?.trim() || '';
    const isActive = document.querySelector(`select[data-branch-id="${branchId}"][data-branch-field="isActive"]`)?.value === '1';

    try {
      await request(`/admin/branches/${branchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, location, isActive })
      });
      showToast('Sede guardada correctamente.', 'success');
      await loadBranches();
      await loadDisabledSummary();
      await loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  disabledUsersRows.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-reactivate-user-id]');
    if (!button) return;

    try {
      await request(`/admin/users/${button.dataset.reactivateUserId}/reactivate`, {
        method: 'PATCH'
      });
      showToast('Usuario habilitado nuevamente.', 'success');
      await loadDisabledSummary();
      await loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  disabledBranchesRows.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-reactivate-branch-id]');
    if (!button) return;

    try {
      await request(`/admin/branches/${button.dataset.reactivateBranchId}/reactivate`, {
        method: 'PATCH'
      });
      showToast('Sede habilitada nuevamente.', 'success');
      await loadDisabledSummary();
      await loadBranches();
      await loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  hideRestrictedAdminSectionsForSupervisor();
  loadAttendance();

  if (currentUser.role === 'admin') {
    loadBranches()
      .then(loadUsers)
      .then(loadDisabledSummary)
      .catch((error) => showToast(error.message, 'error'));
  }

  setupSidebarSectionHighlight();
}
