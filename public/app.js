
document.getElementById('loginBtn').addEventListener('click', login);
async function login() {
  const loginId = document.getElementById('loginId').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // クッキー送受信
    body: JSON.stringify({ loginId, password, type: 'login' }),
  });

  const data = await res.json();
  if (data.ok) {
    alert('Login success! UserNo: ' + data.userNo);
  } else {
    alert('Login failed: ' + data.error);
  }
}
