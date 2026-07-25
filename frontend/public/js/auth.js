const routeByRole = (role) => {
  if (role === 'qr_operator') {
    return '/generator';
  }
  if (role === 'admin' || role === 'supervisor') {
    return '/admin';
  }
  return '/user';
};

const requireAuth = (allowedRoles = []) => {
  const token = storage.getToken();
  const user = storage.getUser();

  if (!token || !user) {
    window.location.href = '/';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    window.location.href = routeByRole(user.role);
    return null;
  }

  return user;
};

const attachTopbar = (activePath) => {
  const user = storage.getUser();
  const topbar = document.getElementById('topbar');
  if (!topbar || !user) return;

  topbar.innerHTML = `
    <div>
      <strong>${user.fullName}</strong>
      <p>${user.role} | Cedula: ${user.cedula || user.username}</p>
    </div>
    <div class="nav-links">
      ${user.role === 'qr_operator' ? '<a href="/generator">QR por sede</a>' : '<a href="/user">Usuario</a><a href="/scan">Escaneo QR</a>'}
      ${(user.role === 'admin' || user.role === 'supervisor') ? '<a href="/admin">Administracion</a>' : ''}
      <button id="logout" class="btn-link">Salir</button>
    </div>
  `;

  const links = topbar.querySelectorAll('a');
  links.forEach((link) => {
    if (link.getAttribute('href') === activePath) {
      link.style.background = '#dce8f2';
    }
  });

  const logout = document.getElementById('logout');
  logout.addEventListener('click', () => {
    storage.clear();
    window.location.href = '/';
  });
};
