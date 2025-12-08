const { APP_AUTH_USERNAME, APP_AUTH_PASSWORD, SDK_API_KEY } = process.env;
let initialized = false;

export async function initSdk() {
  if (initialized) return;
  if (!APP_AUTH_USERNAME || !APP_AUTH_PASSWORD || !SDK_API_KEY) {
    throw new Error('SDK credentials missing (APP_AUTH_USERNAME/APP_AUTH_PASSWORD/SDK_API_KEY)');
  }
  RKZ.config.appAuthUsername = APP_AUTH_USERNAME;
  RKZ.config.appAuthPassword = APP_AUTH_PASSWORD;
  await RKZ.init(SDK_API_KEY);
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
