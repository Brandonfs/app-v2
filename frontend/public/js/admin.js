const currentUser = requireAuth(['admin', 'supervisor']);
if (!currentUser) {
  // requireAuth already redirects to login when needed.
} else {
  attachTopbar('/admin');

const attendanceRows = document.getElementById('attendance-rows');
const usersRows = document.getElementById('users-rows');
const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const statusFilter = document.getElementById('status-filter');

const buildQuery = () => {
  const params = new URLSearchParams();
  if (startDate.value) params.set('startDate', startDate.value);
  if (endDate.value) params.set('endDate', endDate.value);
  if (statusFilter.value) params.set('status', statusFilter.value);
  return params.toString();
};

const loadAttendance = async () => {
  try {
    const query = buildQuery();
    const rows = await request(`/attendance${query ? `?${query}` : ''}`);
    attendanceRows.innerHTML = rows.map((row) => `
      <tr class="${row.status === 'late' ? 'late-row' : ''}">
        <td>${row.id}</td>
        <td>${row.fullName}</td>
        <td>${row.username}</td>
        <td>${row.branchName || '-'}</td>
        <td>${formatDateTime(row.checkedInAt)}</td>
        <td><span class="badge ${row.status}">${row.status}</span></td>
      </tr>
    `).join('');

    if (!rows.length) {
      attendanceRows.innerHTML = '<tr><td colspan="6">Sin resultados para esos filtros.</td></tr>';
    }
  } catch (error) {
    attendanceRows.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
  }
};

const loadUsers = async () => {
  try {
    const users = await request('/admin/users');
    usersRows.innerHTML = users.map((user) => `
      <tr>
        <td>${user.id}</td>
        <td>${user.fullName}</td>
        <td>${user.username}</td>
        <td>
          ${currentUser.role === 'admin'
            ? `<select data-user-id="${user.id}" class="role-select">
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
                <option value="supervisor" ${user.role === 'supervisor' ? 'selected' : ''}>supervisor</option>
                <option value="empleado" ${user.role === 'empleado' ? 'selected' : ''}>empleado</option>
              </select>`
            : user.role}
        </td>
        <td>${user.branchName || '-'}</td>
        <td>${currentUser.role === 'admin' ? `<button data-update-id="${user.id}">Guardar</button>` : '-'}</td>
      </tr>
    `).join('');
  } catch (error) {
    usersRows.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
  }
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
  } catch (error) {
    alert(error.message);
  }
};

document.getElementById('export-excel').addEventListener('click', () => downloadReport('excel'));
document.getElementById('export-pdf').addEventListener('click', () => downloadReport('pdf'));

usersRows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-update-id]');
  if (!button) return;

  const userId = button.dataset.updateId;
  const select = document.querySelector(`select[data-user-id="${userId}"]`);
  if (!select) return;

  try {
    await request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: select.value })
    });
    await loadUsers();
  } catch (error) {
    alert(error.message);
  }
});

loadAttendance();
loadUsers();
}
