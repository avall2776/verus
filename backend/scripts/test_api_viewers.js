const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const axios = require('axios');
    async function test() {
      // Need a JWT or let's test via radarStoriesService directly in Nest context or via public token
      // Let's call the NestJS service directly
      const { NestFactory } = require('@nestjs/core');
      const { AppModule } = require('./dist/src/app.module');
      const { RadarStoriesService } = require('./dist/src/modules/crm/services/radar-stories.service');
      
      const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
      const service = app.get(RadarStoriesService);
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      
      const viewers = await service.getViewers(tenantId);
      console.log('Total Deduplicated Viewers returned by API:', viewers.length);
      viewers.forEach((v, idx) => {
        console.log(\`\${idx+1}. \${v.name} | \${v.phoneFormatted} | \${v.crmStatusLabel} | \${v.storyMedia.exactTime}\`);
      });
      await app.close();
    }
    test().catch(console.error);
  `;
  const stream = conn.exec('cd /root/verus/backend && node', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Result:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
    stream.write(script);
    stream.end();
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
