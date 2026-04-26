import 'dotenv/config';
import { execSync } from 'child_process';

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error('DIRECT_URL is not defined in .env');
}

const command = `DATABASE_URL=${directUrl} npx prisma migrate dev --name submission-unique-constraint`;

try {
  console.log(`Running: ${command}`);
  const output = execSync(command, { stdio: 'inherit' });
  console.log('Migration successful');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}