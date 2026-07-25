const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const env = require('../config/env');
const { getReportRows } = require('./attendanceController');
const { formatDateTimeInTimezone } = require('../utils/time');

const saveReportLog = async (userId, filters, fileType) => {
  await db('reports').insert({
    generated_by: userId,
    start_date: filters.startDate || null,
    end_date: filters.endDate || null,
    status_filter: filters.status || null,
    file_type: fileType
  });
};

const exportExcel = async (req, res, next) => {
  try {
    const records = await getReportRows(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencia');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nombre', key: 'fullName', width: 24 },
      { header: 'Cedula', key: 'cedula', width: 20 },
      { header: 'Rol', key: 'role', width: 14 },
      { header: 'Sucursal', key: 'branchName', width: 20 },
      { header: 'QR Generado', key: 'qrGeneratedAt', width: 26 },
      { header: 'Fecha/Hora', key: 'checkedInAt', width: 26 },
      { header: 'Estado', key: 'status', width: 14 }
    ];

    records.forEach((record) => {
      sheet.addRow({
        ...record,
        qrGeneratedAt: formatDateTimeInTimezone(record.qrGeneratedAt, env.appTimezone),
        checkedInAt: formatDateTimeInTimezone(record.checkedInAt, env.appTimezone)
      });
    });

    await saveReportLog(req.user.id, req.query, 'excel');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-asistencia.xlsx');

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    const records = await getReportRows(req.query);

    await saveReportLog(req.user.id, req.query, 'pdf');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-asistencia.pdf');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(16).text('Reporte de Asistencia', { align: 'center' });
    doc.moveDown();

    records.forEach((record) => {
      const line = `${record.id} | ${record.fullName} | ${record.cedula} | ${record.branchName || '-'} | QR: ${formatDateTimeInTimezone(record.qrGeneratedAt, env.appTimezone)} | Registro: ${formatDateTimeInTimezone(record.checkedInAt, env.appTimezone)} | ${record.status}`;
      doc.fillColor(record.status === 'late' ? 'red' : 'black').fontSize(9).text(line);
    });

    doc.end();
  } catch (error) {
    return next(error);
  }
};

const getReportsLog = async (req, res, next) => {
  try {
    const logs = await db('reports as r')
      .leftJoin('users as u', 'u.id', 'r.generated_by')
      .select(
        'r.id',
        'r.start_date as startDate',
        'r.end_date as endDate',
        'r.status_filter as statusFilter',
        'r.file_type as fileType',
        'r.created_at as createdAt',
        'u.username as generatedByCedula'
      )
      .orderBy('r.created_at', 'desc');

    return res.json(logs);
  } catch (error) {
    return next(error);
  }
};

module.exports = { exportExcel, exportPdf, getReportsLog };
