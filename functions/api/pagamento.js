// functions/api/pagamento.js
// Esta é uma Cloudflare Pages Function. Ela roda no servidor e usa a variável de ambiente.

export async function onRequestPost(context) {
    // context.env contém as variáveis de ambiente configuradas na Cloudflare
    const { request, env } = context;

    try {
        const dados = await request.json();
        const valorCentavos = dados.valor * 100; // Converte R$ 20,00 para 2000 centavos
        const cliente = dados.cliente || "Cliente";

        // Pega o Token da PushinPay da Variável de Ambiente da Cloudflare
        const pushinpayToken = env.PUSHINPAY_TOKEN;

        if (!pushinpayToken) {
            return new Response(JSON.stringify({ error: "Token da PushinPay não configurado na Cloudflare." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Chamada Real para a API da PushinPay
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

        // Retorna o QR Code para o front-end
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
