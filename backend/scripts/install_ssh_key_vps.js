const { Client } = require('ssh2');
const conn = new Client();

const publicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMWxBb+UpNXwmzVN+z1AJz8b+cKdPLlrp9Rad7IbHKNk felipe-versus-admin';

conn.on('ready', () => {
  console.log('Conectado à VPS. Gravando chave SSH pública...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    // Escreve a chave com quebra de linha limpa no final
    const writeStream = sftp.createWriteStream('/root/.ssh/authorized_keys', { flags: 'w', mode: 0o600 });
    writeStream.write(publicKey.trim() + '\n');
    writeStream.end(() => {
      const verifyCmd = `
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys

echo "=== PERMISSÕES E TAMANHO ==="
ls -lh /root/.ssh/authorized_keys

echo "=== CONTEÚDO GRAVADO ==="
cat /root/.ssh/authorized_keys

echo "=== QUANTIDADE DE LINHAS E CARACTERES ==="
wc -l -c /root/.ssh/authorized_keys

echo "=== VALIDAÇÃO DE SINTAXE SSH ==="
ssh-keygen -l -f /root/.ssh/authorized_keys
`;
      conn.exec(verifyCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
          console.log('Execução concluída com código:', code);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

