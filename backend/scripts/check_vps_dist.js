const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Ready');
  conn.exec('cd /root/verus/backend && node -e "const { DashboardService } = require(\'./dist/src/modules/dashboard/dashboard.service\'); console.log(\'Has ecosystem in code:\', DashboardService.prototype.getGeoMapData.toString().includes(\'ecosystem\'));"', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', data => console.log('VPS dist check:', data.toString()));
    stream.stderr.on('data', data => console.error('VPS stderr:', data.toString()));
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

