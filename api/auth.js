
// api/auth.js
import jwt from 'jsonwebtoken';
import { loginWithRKZ, registerWithRKZ } from './rkz.js';

// Node.js ランタイムで実行（Edgeではありません）
export const config = { runtime: 'nodejs' };

export default async (req, res) => {
  try {
    // （必要なら）CORS。フロントと同一オリジンなら不要。
    const origin = process.env.ALLOWED_ORIGINS || '';
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('ENV_ERROR: JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server misconfiguration (JWT_SECRET)' });
    }

    // req.body が undefined の場合に備えて手動パース
    const body = req.body ?? await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(new Error('Invalid JSON body')); }
      });
      req.on('error', reject);
    });

    const { loginId, password, type } = body || {};
    if (!loginId || !password) {
      return res.status(400).json({ error: 'loginId and password are required' });
    }

    let user;
    try {
      user = (type === 'register')
        ? await registerWithRKZ(loginId, password)
        : await loginWithRKZ(loginId, password);
    } catch (rkzErr) {
      console.error('RKZ_ERROR:', rkzErr);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    if (!user || !user.user_no) {
      console.error('AUTH_LOGIC_ERROR: invalid user object:', user);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    let token;
    try {
      token = jwt.sign({ userNo: user.user_no, loginId: user.login_id }, JWT_SECRET, { expiresIn: '15m' });
    } catch (jwtErr) {
      console.error('JWT_SIGN_ERROR:', jwtErr);
      return res.status(500).json({ error: 'Token issue failed' });
    }

    // Cookie は配列で設定
    res.setHeader('Set-Cookie', [
      `APP_TOKEN=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`
    ]);

    return res.status(200).json({ ok: true, userNo: user.user_no, loginId: user.login_id });
  } catch (err) {
    console.error('AUTH_HANDLER_ERROR:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
