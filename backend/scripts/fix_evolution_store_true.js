const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const composeYaml = `services:
  evolution:
    image: atendai/evolution-api:v1.8.2
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://187.127.10.166:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=verto123
      - DATABASE_ENABLED=false
      - NODE_OPTIONS=--max-old-space-size=4096
      - LOG_LEVEL=ERROR,WARN,INFO
      - STORE_MESSAGES=true
      - STORE_MESSAGE_UP=true
      - STORE_CONTACTS=true
      - STORE_CHATS=true
      - CLEAN_STORE_CLEANING_INTERVAL=86400
      - CLEAN_STORE_MESSAGES=true
      - CLEAN_STORE_MESSAGE_UP=true
      - CLEAN_STORE_CONTACTS=false
      - CLEAN_STORE_CHATS=false
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

volumes:
  evolution_instances:
  evolution_store:
`;

  const cmd = `
cat << 'EOF' > /opt/evolution-api/docker-compose.yml
${composeYaml}
EOF

cd /opt/evolution-api
docker compose up -d

sleep 6
docker ps | grep evolution
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

