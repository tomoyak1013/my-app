// api/chat.js

export default async function handler(req, res) {
    // 1. CORSヘッダーの設定
    // すべてのドメインからのアクセスを許可する場合は '*' を指定します。
    // 特定のドメインのみ許可したい場合は直接 'https://direct-preview-...' を指定してください。
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 2. ブラウザからのPreflight（OPTIONS）リクエストを処理
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. POSTリクエスト以外の拒否
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' } });
    }

    // Vercelの環境変数からAPIキーを取得
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: { message: 'サーバーにAPIキーが設定されていません。' } });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'メッセージの形式が不正です。' } });
        }

        // OpenRouterへリクエストを転送
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": req.headers.referer || "https://vercel.app",
                "X-Title": "sample"
            },
            signal: AbortSignal.timeout(90000),
            body: JSON.stringify({
                model: "nvidia/nemotron-3.5-lightning:free",
                temperature: 1.0,
                messages: messages,
                reasoning: { enabled: true }
            })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return res.status(504).json({ error: { message: 'リクエストがタイムアウトしました（90秒）' } });
        }
        return res.status(500).json({ error: { message: `サーバー通信エラー: ${error.message}` } });
    }
}
