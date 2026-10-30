const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const tls = require('tls');

async function verifyEmailConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
  const mailFrom = process.env.MAIL_FROM || `"${process.env.MAIL_FROM_NAME || 'National Scholarship Portal'}" <${user}>`;

  const maskedPass = pass ? `${pass.substring(0, 2)}****${pass.substring(pass.length - 2)}` : '(not set)';

  console.log('====================================================');
  console.log(' National Scholarship Portal — SMTP Verification');
  console.log('====================================================');
  console.log(`SMTP Host:      ${host}`);
  console.log(`SMTP Port:      ${port}`);
  console.log(`SMTP Secure:    ${process.env.SMTP_SECURE || 'true'}`);
  console.log(`SMTP User:      ${user}`);
  console.log(`SMTP Password:  ${maskedPass} (${pass.length} chars)`);
  console.log(`Mail From:      ${mailFrom}`);
  console.log('----------------------------------------------------');

  if (!user || !pass) {
    console.error('ERROR: Missing SMTP_USER or SMTP_PASSWORD in .env');
    process.exit(1);
  }

  const userB64 = Buffer.from(user).toString('base64');
  const passB64 = Buffer.from(pass).toString('base64');

  let step = 0;

  const socket = tls.connect(port, host, { servername: host }, () => {
    console.log(`[1/4] Connected to ${host}:${port} over TLS successfully.`);
  });

  socket.on('data', (data) => {
    const msg = data.toString();

    if (step === 0 && msg.startsWith('220')) {
      step = 1;
      socket.write('EHLO localhost\r\n');
    } else if (step === 1 && msg.includes('250 ')) {
      step = 2;
      console.log('[2/4] Handshake (EHLO) completed.');
      socket.write('AUTH LOGIN\r\n');
    } else if (step === 2 && msg.startsWith('334')) {
      step = 3;
      console.log('[3/4] Sending SMTP User authentication...');
      socket.write(userB64 + '\r\n');
    } else if (step === 3 && msg.startsWith('334')) {
      step = 4;
      console.log('[4/4] Sending SMTP Password authentication...');
      socket.write(passB64 + '\r\n');
    } else if (step === 4) {
      if (msg.startsWith('235')) {
        step = 5;
        console.log('----------------------------------------------------');
        console.log('>>> VERIFICATION RESULT: SUCCESS (235 Accepted) <<<');
        console.log('Google SMTP accepted credentials successfully!');
        console.log('Mailing process is ready and verified.');
        console.log('====================================================');
        socket.write('QUIT\r\n');
        setTimeout(() => {
          socket.destroy();
          process.exit(0);
        }, 300);
      } else {
        console.error('----------------------------------------------------');
        console.error('>>> VERIFICATION FAILED: Authentication Rejected <<<');
        console.error('Response:', msg.trim());
        console.error('====================================================');
        socket.write('QUIT\r\n');
        setTimeout(() => {
          socket.destroy();
          process.exit(1);
        }, 500);
      }
    }
  });

  socket.on('error', (err) => {
    console.error('----------------------------------------------------');
    console.error('>>> CONNECTION ERROR:', err.message);
    console.error('====================================================');
    process.exit(1);
  });
}

verifyEmailConfig();
