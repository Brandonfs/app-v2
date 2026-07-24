const notFound = (req, res, next) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor.';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message,
    details: process.env.NODE_ENV === 'production' ? undefined : err.details || null
  });
};

module.exports = { notFound, errorHandler };
