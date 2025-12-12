
// api/rkz.js
// 実際の RKZ SDK 名・メソッドに合わせて調整してください。
import RKZ from 'baasatrakuza';

const { App_AuthUsername, App_AuthPassword, SDK_API_KEY } = process.env;
let initialized = false;

export async function initSdk() {
  if (initialized) return;
  if (!App_AuthUsername || !App_AuthPassword || !SDK_API_KEY) {
    throw new Error('SDK credentials missing (App_AuthUsername/App_AuthPassword/SDK_API_KEY)');
  }
  RKZ.config.appAuthUsername = App_AuthUsername;
  RKZ.config.appAuthPassword = App_AuthPassword;
  try {
    await RKZ.init(SDK_API_KEY);
    console.log('SDKの初期化に成功しました！');
  } catch (error) {
    console.error('SDKの初期化に失敗しました。', error)
  }
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
