const currentUser = requireAuth(['empleado']);
if (!currentUser) {
  // requireAuth already redirects to login when needed.
} else {
  attachTopbar('/scan');

const scanMessage = document.getElementById('scan-message');
const startButton = document.getElementById('start-scan');
const stopButton = document.getElementById('stop-scan');
const generateCard = document.getElementById('generate-card');
const scanCard = document.getElementById('scan-card');

const setMessage = (msg, kind = 'success') => {
  scanMessage.textContent = msg;
  scanMessage.className = `message ${kind}`;
};

if (generateCard) {
  generateCard.style.display = 'none';
}
if (scanCard?.parentElement) {
  scanCard.parentElement.classList.remove('grid-2');
}

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
          showToast(`Asistencia registrada en ${response.branchName}.`, 'success');
          await scanner.stop();
        } catch (error) {
          setMessage(error.message, 'error');
          showToast(error.message, 'error');
        }
      }
    );
    setMessage('Escaner iniciado. Apunta al QR.', 'success');
  } catch (error) {
    setMessage(`No se pudo iniciar la camara: ${error.message}`, 'error');
    showToast(`No se pudo iniciar la camara: ${error.message}`, 'error');
  }
});

stopButton.addEventListener('click', async () => {
  try {
    if (scanner) {
      await scanner.stop();
      await scanner.clear();
      scanner = null;
      setMessage('Escaneo detenido.', 'success');
      showToast('Escaneo detenido.', 'success');
    }
  } catch (error) {
    setMessage('No se pudo detener el escaner.', 'error');
    showToast('No se pudo detener el escaner.', 'error');
  }
});
}
