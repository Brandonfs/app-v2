const currentUser = requireAuth(['qr_operator']);
if (!currentUser) {
  // requireAuth already redirects.
} else {
  attachTopbar('/generator');

  const generatorQrList = document.getElementById('generator-qr-list');

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
      </article>
    `).join('');
  };

  const loadQrs = async () => {
    try {
      const items = await request('/attendance/live-branches-qr');
      renderQrs(items);
    } catch (error) {
      generatorQrList.innerHTML = `<p>${error.message}</p>`;
    }
  };

  loadQrs();
  setInterval(loadQrs, 3000);
}
