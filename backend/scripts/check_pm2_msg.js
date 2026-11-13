const { exec } = require('child_process');

exec('grep -i -C 10 "AC3866C7D111EE47C4A63B6F323B19C9" ~/.pm2/logs/*.log', (err, stdout, stderr) => {
  if (stdout) {
    console.log('--- MATCH IN PM2 LOGS ---');
    console.log(stdout);
  } else {
    console.log('No direct match in ~/.pm2/logs/*.log, searching recent logs around 11:28:29...');
    exec('grep -i -C 5 "Semeadora Verona" ~/.pm2/logs/*.log', (e2, o2) => {
      console.log('Semeadora Verona match:');
      console.log(o2 || 'None');
    });
  }
});

