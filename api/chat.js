// api/chat.js (Vanilla JS / Node.js標準機能のみ)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' } });
    }

    // Vercelの環境変数から取得
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: { message: 'サーバーにAPIキーが設定されていません。' } });
    }

    try {
        const { messages } = req.body;

        // OpenRouterへ転送
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
        return res.status(500).json({ error: { message: `サーバー通信エラー: ${error.message}` } });
    }
}
