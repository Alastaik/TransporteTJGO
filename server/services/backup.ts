import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';

export function initBackupRoutine() {
  // Configuração
  const backupsDir = path.join(__dirname, '..', '..', 'storage', 'backups');
  const dbUser = process.env.DB_USER || 'tjgo_app';
  const dbPassword = process.env.DB_PASSWORD || 'tjgo_senha_segura';
  const dbName = process.env.DB_NAME || 'transportetjgo_db';
  const dbHost = process.env.DB_HOST || 'postgres';

  // Garante que o diretório existe
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Agendamento: Roda todos os dias às 03:00 da manhã
  // 0 3 * * * = min: 0, hour: 3, day: *, month: *, day of week: *
  cron.schedule('0 3 * * *', () => {
    console.log('[Backup] Iniciando rotina de backup do banco de dados...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `backup-${dbName}-${timestamp}.sql`;
    const filePath = path.join(backupsDir, fileName);

    // O Docker envia a senha pro pg_dump via variável de ambiente PGPASSWORD
    const env = { ...process.env, PGPASSWORD: dbPassword };
    const dumpCmd = `pg_dump -h ${dbHost} -U ${dbUser} -d ${dbName} -F c -f "${filePath}"`;

    exec(dumpCmd, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Backup] Erro ao executar pg_dump: ${error.message}`);
        return;
      }
      
      console.log(`[Backup] Backup concluído com sucesso: ${fileName}`);

      // Lógica opcional para rotacionar/apagar backups muito antigos (ex: manter apenas últimos 15 dias)
      limparBackupsAntigos(backupsDir, 15);
    });
  });

  console.log('[Backup] Serviço de backup automático inicializado (Todos os dias às 03:00).');
}

function limparBackupsAntigos(dir: string, daysToKeep: number) {
  try {
    const files = fs.readdirSync(dir);
    const now = Date.now();
    const msToKeep = daysToKeep * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > msToKeep) {
        fs.unlinkSync(filePath);
        console.log(`[Backup] Arquivo antigo removido: ${file}`);
      }
    });
  } catch (e: any) {
    console.error(`[Backup] Erro ao limpar arquivos antigos: ${e.message}`);
  }
}
