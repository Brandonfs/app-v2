const currentUser = requireAuth(['admin', 'supervisor', 'empleado']);
if (!currentUser) {
  // requireAuth already redirects to login when needed.
} else {
  attachTopbar('/scan');

const scanMessage = document.getElementById('scan-message');
const qrContainer = document.getElementById('qr-container');
const generateButton = document.getElementById('generate-qr');
const branchSelect = document.getElementById('branch-select');
const startButton = document.getElementById('start-scan');
const stopButton = document.getElementById('stop-scan');

const setMessage = (msg, kind = 'success') => {
  scanMessage.textContent = msg;
  scanMessage.className = `message ${kind}`;
};

if (!['admin', 'supervisor'].includes(currentUser.role)) {
  generateButton.disabled = true;
  generateButton.textContent = 'Solo admin/supervisor';
  branchSelect.disabled = true;
}

const loadBranches = async () => {
  try {
    const branches = await request('/admin/branches');
    branchSelect.innerHTML = branches.map((branch) =>
      `<option value="${branch.id}">${branch.name}</option>`
    ).join('');

    if (!branches.length) {
      branchSelect.innerHTML = '<option value="">Sin sedes</option>';
      generateButton.disabled = true;
    }
  } catch (error) {
    branchSelect.innerHTML = '<option value="">Error cargando sedes</option>';
  }
};

generateButton.addEventListener('click', async () => {
  try {
    const data = await request('/attendance/qr', {
      method: 'POST',
      body: JSON.stringify({ branchId: Number(branchSelect.value) || null })
    });
    qrContainer.innerHTML = `<img alt="QR Asistencia" src="${data.qrDataUrl}" style="max-width: 100%;" />`;
    qrContainer.dataset.qrToken = data.qrToken;
    setMessage('QR generado correctamente.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

let scanner = null;

startButton.addEventListener('click', async () => {
  try {
    if (!window.Html5Qrcode) {
      setMessage('No se pudo cargar la libreria de camara.', 'error');
      return;
    }

    scanner = new Html5Qrcode('reader');
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        try {
          const response = await request('/attendance/checkin', {
            method: 'POST',
            body: JSON.stringify({ qrToken: decodedText })
          });
          setMessage(`Asistencia registrada en sede: ${response.branchName}.`, 'success');
          await scanner.stop();
        } catch (error) {
          setMessage(error.message, 'error');
        }
      }
    );
    setMessage('Escaner iniciado. Apunta al QR.', 'success');
  } catch (error) {
    setMessage(`No se pudo iniciar la camara: ${error.message}`, 'error');
  }
});

stopButton.addEventListener('click', async () => {
  try {
    if (scanner) {
      await scanner.stop();
      await scanner.clear();
      scanner = null;
      setMessage('Escaneo detenido.', 'success');
    }
  } catch (error) {
    setMessage('No se pudo detener el escaner.', 'error');
  }
});

loadBranches();
}
