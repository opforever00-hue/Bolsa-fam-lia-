// functions/api/pagamento.js
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const dados = await request.json();
        const valorCentavos = dados.valor * 100;
        const cliente = dados.cliente || "Cliente";

        const pushinpayToken = env.PUSHINPAY_TOKEN;

        if (!pushinpayToken) {
            return new Response(JSON.stringify({ error: "Token da PushinPay não configurado na Cloudflare." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const responsePushin = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pushinpayToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                value: valorCentavos,
                description: `Taxa de Inscrição - ${cliente}`,
            })
        });

        const dataPushin = await responsePushin.json();

        if (!responsePushin.ok) {
            return new Response(JSON.stringify({ error: dataPushin.message || "Erro na PushinPay" }), {
                status: responsePushin.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            sucesso: true,
            id_transacao: dataPushin.id,
            qr_code: dataPushin.qr_code,
            qr_code_base64: dataPushin.qr_code_base64
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
