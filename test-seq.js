const app = require('./backend/src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  
  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      const req = http.request(`${baseUrl}${path}`, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json = {};
          try { json = JSON.parse(data); } catch(e) {}
          resolve({ status: res.statusCode, body: json });
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // 1) Health Check
    const health = await request('GET', '/api/health');
    if (health.status !== 200 || !health.body.ok) {
       throw new Error(`HEALTH_FAIL: ${JSON.stringify(health)}`);
    }
    console.log('HEALTH_OK');

    // 2) Login admin
    const adminLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'Admin123*' });
    if (adminLogin.status !== 200 || !adminLogin.body.token) {
       throw new Error(`ADMIN_LOGIN_FAIL: ${JSON.stringify(adminLogin)}`);
    }
    console.log('ADMIN_LOGIN_OK');
    const adminToken = adminLogin.body.token;

    // 3) Generate QR
    const qrGen = await request('POST', '/api/attendance/qr', {}, { 'Authorization': `Bearer ${adminToken}` });
    if (qrGen.status !== 200 || !qrGen.body.qrToken) {
       throw new Error(`QR_FAIL: ${JSON.stringify(qrGen)}`);
    }
    console.log('QR_OK');
    const qrToken = qrGen.body.qrToken;

    // 4) Login empleado
    const empLogin = await request('POST', '/api/auth/login', { username: 'empleado', password: 'Admin123*' });
    if (empLogin.status !== 200 || !empLogin.body.token) {
       throw new Error(`EMPLOYEE_LOGIN_FAIL: ${JSON.stringify(empLogin)}`);
    }
    const empToken = empLogin.body.token;

    // 5) Checkin empleado
    const checkinResponse = await request('POST', '/api/attendance/checkin', { qrToken }, { 'Authorization': `Bearer ${empToken}` });
    if (checkinResponse.status !== 201) {
       throw new Error(`CHECKIN_FAIL: ${JSON.stringify(checkinResponse)}`);
    }
    console.log('CHECKIN_OK');

    // 6) Get employee attendance count
    const myAttendance = await request('GET', '/api/attendance/my', null, { 'Authorization': `Bearer ${empToken}` });
    if (myAttendance.status !== 200) {
       throw new Error(`MY_FAIL: ${JSON.stringify(myAttendance)}`);
    }
    const myCount = Array.isArray(myAttendance.body) ? myAttendance.body.length : 0;
    console.log(`MY_COUNT=${myCount}`);

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
