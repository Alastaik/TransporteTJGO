import { query } from '../db';

async function main() {
  try {
    const res = await query('SELECT matricula, nome, ativo FROM usuarios');
    console.log('Usuarios na base:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
