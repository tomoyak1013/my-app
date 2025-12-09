
# Vercel RKZ Proxy Template

ブラウザから安全に RKZ SDK を利用するための、**フロント → 自作API → SDK（サーバー側）**構成の最小テンプレートです。

## 構成
```
vercel-rkz-proxy-template/
  public/
    index.html
    app.js
  api/
    auth.js
    rkz.js
  package.json
  vercel.json
```

## セットアップ手順

1. **Vercel CLI をインストール**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **依存関係のインストール（ローカル開発用）**
   ```bash
   npm install
   ```

3. **環境変数の設定（Vercel Dashboard）**
   プロジェクト → Settings → Environment Variables に以下を追加：
   - `JWT_SECRET` : 強力なランダム文字列（例: `openssl rand -hex 64`）
   - `APP_AUTH_USERNAME` : RKZ アプリ認証ユーザー名
   - `APP_AUTH_PASSWORD` : RKZ アプリ認証パスワード
   - `SDK_API_KEY` : RKZ SDK 初期化キー
   - `ALLOWED_ORIGINS` : （別オリジンから呼ぶ場合のみ）例: `https://your-frontend.example.com`

4. **ローカルで動作確認**
   ```bash
   vercel dev
   ```
   ブラウザで `http://localhost:3000` を開き、ログインボタンを押して `/api/auth` の応答を確認。

5. **デプロイ**
   ```bash
   vercel
   ```

## トラブルシューティング

- `Cannot find module 'jsonwebtoken'`
  - ルートの `package.json` に依存があるかを確認し、`npm install` して再デプロイ。

- `unsupported "runtime" value` エラー
  - `api/auth.js` の `export const config = { runtime: 'nodejs' }` を使用。`nodejs18.x` のようなバージョン指定は不可。

- `500 Internal Server Error` が解消しない
  - `Functions → Logs` を確認。テンプレートは `ENV_ERROR / RKZ_ERROR / JWT_SIGN_ERROR / AUTH_HANDLER_ERROR` をログに出します。
  - `req.body` が undefined の場合に備え、手動 JSON パースを実装済みです。

## セキュリティの要点
- SDK の認証情報（ユーザー名/パスワード/キー）は **サーバー側のみ**に保持します。
- フロントには **HttpOnly + Secure + SameSite=Strict** の短命トークン（JWT）をクッキーで配布します。
- 本番運用では HTTPS（Vercelは自動）と許可オリジンの限定（CORS）を必ず有効化してください。

---

> 注: `rkz-sdk` の実パッケージ名・メソッドは環境に合わせて修正してください。
