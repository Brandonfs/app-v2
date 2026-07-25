const currentUser = requireAuth(['admin', 'supervisor', 'empleado']);
if (!currentUser) {
  // requireAuth already redirects to login when needed.
} else {
  attachTopbar('/user');

const loadProfile = async () => {
  try {
    const me = await request('/auth/me');
    document.getElementById('user-info').textContent =
      `${me.fullName} | Cedula: ${me.cedula || me.username} | ${me.role} | ${me.branchName || 'Sin sucursal'}`;
  } catch (error) {
    document.getElementById('user-info').textContent = error.message;
  }
};

const loadAttendance = async () => {
  try {
    const rows = await request('/attendance/my');
    const body = document.getElementById('my-attendance');
    body.innerHTML = rows
      .map((row) => `
        <tr class="${row.status === 'late' ? 'late-row' : ''}">
          <td>${row.id}</td>
          <td>${row.qrGeneratedAt ? formatDateTime(row.qrGeneratedAt) : '-'}</td>
          <td>${formatDateTime(row.checkedInAt)}</td>
          <td>${row.branchName || '-'}</td>
          <td><span class="badge ${row.status}">${row.status}</span></td>
        </tr>
      `)
      .join('');

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5">No hay asistencias registradas.</td></tr>';
    }
  } catch (error) {
    document.getElementById('my-attendance').innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
};

  loadProfile();
  loadAttendance();
}
