// functions/api/verificar-pagamento.js
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const dados = await request.json();
        const idTransacao = dados.id_transacao;

        if (!idTransacao) {
            return new Response(JSON.stringify({ error: "ID da transação não fornecido." }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const pushinpayToken = env.PUSHINPAY_TOKEN;

        if (!pushinpayToken) {
            return new Response(JSON.stringify({ error: "Token da PushinPay não configurado." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Consulta o status da transação na PushinPay
        // A documentação da PushinPay indica o endpoint /api/pix/status/{id} 
        const responsePushin = await fetch(`https://api.pushinpay.com.br/api/pix/status/${idTransacao}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${pushinpayToken}`,
                'Accept': 'application/json'
            }
        });

        const dataPushin = await responsePushin.json();

        if (!responsePushin.ok) {
            return new Response(JSON.stringify({ error: dataPushin.message || "Erro ao verificar status" }), {
                status: responsePushin.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verifica se o status é "paid" ou "completed" (ajuste conforme a documentação da PushinPay)
        const pago = dataPushin.status === 'paid' || dataPushin.status === 'completed';

        return new Response(JSON.stringify({
            pago: pago,
            status: dataPushin.status
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
