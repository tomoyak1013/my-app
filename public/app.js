
// フロント側の最低限の実装
// ボタンにイベントを付与
const btn = document.getElementById('loginBtn');
if (btn) btn.addEventListener('click', login);

async function login() {
  const loginId = document.getElementById('loginId').value.trim();
  const password = document.getElementById('password').value;

  if (!loginId || !password) {
    alert('Login ID と Password を入力してください');
    return;
  }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // HttpOnlyクッキー送受信用
      body: JSON.stringify({ loginId, password, type: 'login' }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      console.error('API error:', res.status, data);
      alert('エラー: ' + (data.error || res.status));
      return;
    }

    console.log('API応答:', data);
    alert('Login success! UserNo: ' + data.userNo);
  } catch (e) {
    console.error(e);
    alert('通信または認証に失敗しました: ' + e.message);
  }
}
