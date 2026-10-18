const fs = require('fs');
const crypto = require('crypto');

if (fs.existsSync('.env')) {
  process.exit(0);
}

const secret = crypto.randomBytes(32).toString('hex');
fs.writeFileSync('.env', `JWT_SECRET=${secret}\n`);
console.log('Created .env with a new random JWT_SECRET');