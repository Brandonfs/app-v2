const tabs = document.querySelectorAll('.tab-btn');
const panes = document.querySelectorAll('.tab-pane');
const authMessage = document.getElementById('auth-message');
const publicQrList = document.getElementById('public-qr-list');

const setMessage = (msg, kind = 'error') => {
  authMessage.textContent = msg;
  authMessage.className = `message ${kind}`;
};

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((el) => el.classList.remove('active'));
    panes.forEach((pane) => pane.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-form`).classList.add('active');
  });
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    storage.saveSession(data);
    setMessage('Bienvenido. Redirigiendo...', 'success');
    window.location.href = routeByRole(data.user.role);
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setMessage('Registro completado. Ahora inicia sesion.', 'success');
    event.target.reset();
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

const renderPublicQrs = (items) => {
  if (!items.length) {
    publicQrList.innerHTML = '<p>No hay sedes registradas aun.</p>';
    return;
  }

  publicQrList.innerHTML = items.map((item) => `
    <article class="qr-wall-item">
      <h3>${item.branchName}</h3>
      <img src="${item.qrDataUrl}" alt="QR ${item.branchName}" />
      <small>Actualizado: ${formatDateTime(item.generatedAt)}</small>
    </article>
  `).join('');
};

const loadPublicQrs = async () => {
  try {
    const items = await request('/attendance/public/branches-qr');
    renderPublicQrs(items);
  } catch (error) {
    publicQrList.innerHTML = `<p>${error.message}</p>`;
  }
};

loadPublicQrs();
setInterval(loadPublicQrs, 3000);
