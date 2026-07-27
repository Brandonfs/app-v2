const currentUser = requireAuth(['qr_operator']);
if (!currentUser) {
  // requireAuth already redirects.
} else {
  attachTopbar('/generator');

  const generatorQrList = document.getElementById('generator-qr-list');
  const fullscreenViewer = document.getElementById('qr-fullscreen-viewer');
  const fullscreenCard = fullscreenViewer?.querySelector('.qr-fullscreen-card');
  const closeFullscreenButton = document.getElementById('close-fullscreen-viewer');
  const fullscreenBranchName = document.getElementById('fullscreen-branch-name');
  const fullscreenQrImage = document.getElementById('fullscreen-qr-image');
  const fullscreenGeneratedAt = document.getElementById('fullscreen-generated-at');

  let activeBranchName = null;

  const renderQrs = (items) => {
    if (!items.length) {
      generatorQrList.innerHTML = '<p>No hay sedes registradas.</p>';
      return;
    }

    generatorQrList.innerHTML = items.map((item) => `
      <article class="qr-wall-item">
        <h3>${item.branchName}</h3>
        <img src="${item.qrDataUrl}" alt="QR ${item.branchName}" />
        <small>Generado: ${formatDateTime(item.generatedAt)}</small>
        <button
          type="button"
          class="open-fullscreen-btn"
          data-branch-name="${item.branchName}"
          data-generated-at="${item.generatedAt}"
          data-qr-src="${item.qrDataUrl}">
          Ver en pantalla completa
        </button>
      </article>
    `).join('');

    if (activeBranchName) {
      const updated = items.find((item) => item.branchName === activeBranchName);
      if (updated && fullscreenQrImage && fullscreenGeneratedAt) {
        fullscreenQrImage.src = updated.qrDataUrl;
        fullscreenGeneratedAt.textContent = `Generado: ${formatDateTime(updated.generatedAt)}`;
      }
    }
  };

  const openFullscreenViewer = (branchName, qrSrc, generatedAt) => {
    if (!fullscreenViewer || !fullscreenCard || !fullscreenBranchName || !fullscreenQrImage || !fullscreenGeneratedAt) {
      return;
    }

    activeBranchName = branchName;
    fullscreenBranchName.textContent = branchName;
    fullscreenQrImage.src = qrSrc;
    fullscreenGeneratedAt.textContent = `Generado: ${formatDateTime(generatedAt)}`;
    fullscreenViewer.classList.add('open');
    fullscreenViewer.setAttribute('aria-hidden', 'false');

    if (fullscreenCard.requestFullscreen) {
      fullscreenCard.requestFullscreen().catch(() => {
        // If fullscreen API is blocked, keep the modal open as fallback.
      });
    }
  };

  const closeFullscreenViewer = () => {
    if (!fullscreenViewer) return;

    activeBranchName = null;
    fullscreenViewer.classList.remove('open');
    fullscreenViewer.setAttribute('aria-hidden', 'true');

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore exit errors from browser restrictions.
      });
    }
  };

  const closeFullscreenWithPassword = async () => {
    const password = window.prompt('Ingresa tu contraseña para cerrar la vista en pantalla completa:');
    if (password === null) return;

    try {
      await request('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      closeFullscreenViewer();
      showToast('Vista de pantalla completa cerrada.', 'success');
    } catch (error) {
      showToast(error.message || 'Contraseña incorrecta.', 'error');
    }
  };

  const loadQrs = async () => {
    try {
      const items = await request('/attendance/live-branches-qr');
      renderQrs(items);
    } catch (error) {
      generatorQrList.innerHTML = `<p>${error.message}</p>`;
      showToast(error.message, 'error');
    }
  };

  generatorQrList.addEventListener('click', (event) => {
    const button = event.target.closest('.open-fullscreen-btn');
    if (!button) return;

    openFullscreenViewer(
      button.dataset.branchName,
      button.dataset.qrSrc,
      button.dataset.generatedAt
    );
  });

  closeFullscreenButton?.addEventListener('click', closeFullscreenWithPassword);

  loadQrs();
  setInterval(loadQrs, 3000);
}
