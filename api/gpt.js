// api/gpt.js

export default async function handler(req, res) {
    // 1. CORSヘッダーの設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 2. Preflight (OPTIONS) リクエストのハンドリング
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' } });
    }

    // Vercelの環境変数からOpenAIのAPIキーを取得
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: { message: 'サーバーにOPENAI_API_KEYが設定されていません。' } });
    }

    try {
        const { input } = req.body;

        if (!input || !Array.isArray(input)) {
            return res.status(400).json({ error: { message: '入力データ(input)の形式が不正です。' } });
        }

        // OpenAI Responses API へのリクエスト
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(90000),
            body: JSON.stringify({
                model: "gpt-5-nano",
                input: input,
                reasoning: { effort: "low" },
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        // ストリーミングレスポンス用のヘッダーを設定
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');

        // OpenAIからのストリームデータを直接クライアント（ブラウザ）へ中継
        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }

        return res.end();

    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return res.status(504).json({ error: { message: 'リクエストがタイムアウトしました（90秒）' } });
        }
        return res.status(500).json({ error: { message: `サーバー通信エラー: ${error.message}` } });
    }
}
