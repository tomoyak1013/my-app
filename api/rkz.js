
// api/rkz.js
// 実際の RKZ SDK 名・メソッドに合わせて調整してください。
import RKZ from 'baasatrakuza-admin';

const { APP_tenantBaseUrl, APP_tenantId, APP_token } = process.env;
let initialized = false;

export async function initSdk() {
  if (initialized) return;
  if (!APP_tenantBaseUrl || !APP_tenantId || !APP_token) {
    throw new Error('SDK credentials missing (APP_tenantBaseUrl/APP_tenantId/APP_token)');
  }
  await RKZ.init({
    tenantBaseUrl: APP_tenantBaseUrl,
    tenantId: APP_tenantId,
    token: APP_token
  });
  initialized = true;
}

export async function loginWithRKZ(loginId, password) {
  await initSdk();
  const user = await RKZ.User.auth(loginId, password);
  return user;
}

export async function registerWithRKZ(loginId, password) {
  await initSdk();
  const user = await RKZ.User.register({
    login_id: loginId,
    attributes: { user_password: password },
  });
  return user;
}
