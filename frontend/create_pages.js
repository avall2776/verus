const fs = require('fs');
const path = require('path');

const dirs = ['dashboard', 'inbox', 'crm', 'agent', 'contacts', 'integrations', 'settings'];
const base = path.join(__dirname, 'src', 'app', '(dashboard)');

dirs.forEach(d => {
  const dirPath = path.join(base, d);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  
  const content = `export default function ${d.charAt(0).toUpperCase() + d.slice(1)}Page() {
  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-black text-white capitalize mb-4">${d.replace('-', ' ')}</h1>
      <p className="text-text-secondary">Esta tela está em construção.</p>
    </div>
  );
}`;
  
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), content);
  console.log(`Created ${d}/page.tsx`);
});
