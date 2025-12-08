import jwt from 'jsonwebtoken';
import { loginWithRKZ, registerWithRKZ } from './rkz.js';

// （必要なら）Nodeランタイムを明示。Edgeを使っていたらコメントアウトしてNodeに戻す。
export const config = { runtime: 'nodejs' };

export default async (req, res) => {
  try {
    // （同一オリジンなら不要）別ドメインから呼ぶならCORSヘッダー
    const allowedOrigin = process.env.ALLOWED_ORIGINS;
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ✅ JWT_SECRET チェック（未設定なら即座に明示的エラー）
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('ENV_ERROR: JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server misconfiguration (JWT_SECRET)' });
    }

    // ✅ まずreq.bodyを使ってみて、無ければ手動でパース
    const body = req.body ?? await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'));
        } catch (e) {
          reject(new Error('Invalid JSON body'));
        }
      });
      req.on('error', reject);
    });

    const { loginId, password, type } = body || {};
    if (!loginId || !password) {
      return res.status(400).json({ error: 'loginId and password are required' });
    }

    // ✅ RKZ呼び出し（詳細ログを出す）
    let user;
    try {
      if (type === 'register') {
        user = await registerWithRKZ(loginId, password);
      } else {
        user = await loginWithRKZ(loginId, password);
      }
    } catch (rkzErr) {
      console.error('RKZ_ERROR:', rkzErr);
      // SDKエラーの詳細を露出しない（内部ログのみ保持）
      return res.status(500).json({ error: 'Authentication failed' });
    }

    if (!user || !user.user_no) {
      console.error('AUTH_LOGIC_ERROR: user object is invalid:', user);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    // ✅ JWT発行（短命）
    let token;
    try {
      token = jwt.sign(
        { userNo: user.user_no, loginId: user.login_id },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
    } catch (jwtErr) {
      console.error('JWT_SIGN_ERROR:', jwtErr);
      return res.status(500).json({ error: 'Token issue failed' });
    }

    // ✅ Cookieは配列で設定（将来追加時も安全）
    res.setHeader('Set-Cookie', [
      `APP_TOKEN=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`
    ]);

    return res.status(200).json({ ok: true, userNo: user.user_no, loginId: user.login_id });
  } catch (err) {
    // ハンドラ外例外
    console.error('AUTH_HANDLER_ERROR:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
