const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Instalando Nginx e iniciando frontend no PM2...');
  const script = `
    echo "=== 1. INICIANDO FRONTEND NO PM2 ==="
    pm2 delete versus-frontend 2>/dev/null || true
    pm2 start npm --name "versus-frontend" --prefix /root/verus/frontend -- start -- -p 3000
    pm2 save

    echo "=== 2. AGUARDANDO SUBIDA DO FRONTEND (porta 3000) ==="
    sleep 3
    curl -I http://127.0.0.1:3000/vallor || true

    echo "=== 3. INSTALANDO NGINX ==="
    apt-get update -qq && apt-get install -y nginx

    echo "=== 4. CONFIGURANDO NGINX REVERSE PROXY ==="
    cat << 'EOF' > /etc/nginx/sites-available/default
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 64M;

    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_vary on;

    location = / {
        return 301 /vallor;
    }

    location /vallor {
        proxy_pass http://127.0.0.1:3000/vallor;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /vallor/_next/static {
        proxy_pass http://127.0.0.1:3000/vallor/_next/static;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 365d;
        access_log off;
    }

    location /api-backend/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }
}
EOF

    echo "=== 5. VALIDANDO E REINICIANDO NGINX ==="
    nginx -t
    systemctl restart nginx
    systemctl enable nginx

    echo "=== 6. TESTE DE CONECTIVIDADE LOCAL NA PORTA 80 ==="
    curl -I http://127.0.0.1/vallor
    echo "=== 7. STATUS FINAL PM2 ==="
    pm2 status
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => {
      process.stdout.write(d.toString());
      out += d;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
      out += d;
    });
    stream.on('close', code => {
      console.log('\nFinalizado com código:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

