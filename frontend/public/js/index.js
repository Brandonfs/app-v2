const tabs = document.querySelectorAll('.tab-btn');
const panes = document.querySelectorAll('.tab-pane');
const authMessage = document.getElementById('auth-message');

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
