const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const pageRoutes = require('./routes/pageRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.use('/api', apiRoutes);
app.use('/', express.static(path.join(process.cwd(), 'frontend', 'public')));
app.use('/', pageRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
