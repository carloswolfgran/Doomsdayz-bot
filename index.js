require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    AttachmentBuilder
} = require('discord.js');

const { MercadoPagoConfig, Payment } = require('mercadopago');

const clientMP = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const paymentClient = new Payment(clientMP);

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const vipList = {

    1: {
        nome: 'APOIADOR SOLDADO',
        valor: 10,
        beneficios:
`• Seguro do carro
 • Manutenção mensal: R$5,00`
    },

    2: {
        nome: 'APOIADOR CABO',
        valor: 30,
        beneficios:
`• 1 carro civil de até 100.000 reais OU 100.000 em dinheiro
 • Seguro do carro
 • Manutenção mensal: R$10,00`
    },

    3: {
        nome: 'APOIADOR SARGENTO',
        valor: 45,
        beneficios:
`• 1 carro civil de até 100.000 reais OU 100.000 em dinheiro
 • Seguro do carro restaurável
 • Manutenção mensal: R$15,00`
    },

    4: {
        nome: 'APOIADOR OFICIAL',
        valor: 60,
        beneficios:
`• Qualquer carro do jogo (exceto loja de carros)
 • Seguro do carro
 • Seguro da base
 • Manutenção mensal: R$20,00`
    },

    5: {
        nome: 'APOIADOR TENENTE',
        valor: 75,
        beneficios:
`• Qualquer carro do jogo (exceto loja de carros)
 • Seguro do carro
 • Conjunto DoomsDayZ Winter
 • Manutenção mensal: R$25,00`
    },

    6: {
        nome: 'APOIADOR 1° TENENTE',
        valor: 110,
        beneficios:
`• Qualquer carro do jogo
 • Seguro do carro
 • Conjunto DoomsDayZ Winter Completo
 • Manutenção mensal: R$35,00`
    }

};

const commands = [

    new SlashCommandBuilder()
        .setName('vip')
        .setDescription('Comprar VIP')
        .addIntegerOption(option =>
            option.setName('plano')
                .setDescription('1 até 6')
                .setRequired(true)
        )

].map(command => command.toJSON());

const rest = new REST({ version: '10' })
.setToken(process.env.DISCORD_TOKEN);

(async () => {

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('Comandos registrados.');

    } catch (error) {

        console.error(error);

    }

})();

client.once('ready', async () => {

    console.log(`Bot online como ${client.user.tag}`);

    try {

        const canal =
        await client.channels.fetch(
            '1507532077221023764'
        );

       await canal.send(

`💎 SISTEMA VIP DOOMSDAYZ 💎

🔥 COMO COMPRAR SEU VIP

💬 /vip 1
➡️ APOIADOR SOLDADO — R$10

• Seguro do carro
• Manutenção mensal: R$5,00

━━━━━━━━━━━━━━━

💬 /vip 2
➡️ APOIADOR CABO — R$30

• 1 carro civil de até 100.000 reais OU 100.000 em dinheiro
• Seguro do carro
• Manutenção mensal: R$10,00

━━━━━━━━━━━━━━━

💬 /vip 3
➡️ APOIADOR SARGENTO — R$45

• 1 carro civil de até 100.000 reais OU 100.000 em dinheiro
• Seguro do carro restaurável
• Manutenção mensal: R$15,00

━━━━━━━━━━━━━━━

💬 /vip 4
➡️ APOIADOR OFICIAL — R$60

• Qualquer carro do jogo (exceto loja de carros)
• Seguro do carro
• Seguro da base
• Manutenção mensal: R$20,00

━━━━━━━━━━━━━━━

💬 /vip 5
➡️ APOIADOR TENENTE — R$75

• Qualquer carro do jogo (exceto loja de carros)
• Seguro do carro
• Conjunto DoomsDayZ Winter
• Manutenção mensal: R$25,00

━━━━━━━━━━━━━━━

💬 /vip 6
➡️ APOIADOR 1° TENENTE — R$110

• Qualquer carro do jogo
• Seguro do carro
• Conjunto DoomsDayZ Winter Completo
• Manutenção mensal: R$35,00

━━━━━━━━━━━━━━━

💳 Após digitar o comando:

✅ O bot irá gerar um PIX automático
✅ Faça o pagamento
✅ O sistema confirma automaticamente

⚠️ Em caso de problemas abra ticket

🔥 Obrigado por apoiar o DoomsDayZ!`

);
    } catch (err) {

        console.log(err);

    }

});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vip') {

        await interaction.deferReply({ ephemeral: true });

        const plano =
        interaction.options.getInteger('plano');

        const vip =
        vipList[plano];

        if (!vip) {

            return await interaction.editReply({
                content: 'VIP inválido.'
            });

        }

        const payment_data = {

            transaction_amount: vip.valor,

            description:
`VIP ${vip.nome} - DoomsDayZ`,

            payment_method_id: 'pix',

            payer: {
                email: 'comprador@email.com'
            }

        };

        try {

            const payment =
            await paymentClient.create({
                body: payment_data
            });

            const pix =
payment.point_of_interaction.transaction_data.qr_code;

            const qrCodeBase64 =
payment.point_of_interaction.transaction_data.qr_code_base64;

            const buffer =
Buffer.from(qrCodeBase64, 'base64');

            const attachment =
new AttachmentBuilder(buffer, {
    name: 'pix.png'
});

            global.lastVip = {
                id: payment.id,
                vip: vip.nome,
                valor: vip.valor,
                usuario: interaction.user.username
            };

            return await interaction.editReply({

                content:

`💎 VIP ${vip.nome}

 💰 Valor: R$${vip.valor}

━━━━━━━━━━━━━━━

 ${vip.beneficios}

━━━━━━━━━━━━━━━

 PIX COPIA E COLA:

 ${pix}

 ⚠️ Após pagar o sistema confirmará automaticamente.`,

                files: [attachment]

            });

        } catch (error) {

            console.log(error);

            return await interaction.editReply({
                content:
'Erro ao gerar pagamento.'
            });

        }
    }
});

app.get('/', (req, res) => {
    res.send('Bot online');
});

app.post('/webhook', async (req, res) => {

    try {

        console.log('Webhook recebido');

        const paymentId = req.body.data.id;

        const pagamento =
        await paymentClient.get({
            id: paymentId
        });

        if (pagamento.status === 'approved') {

            console.log('Pagamento aprovado');

            const canal =
            await client.channels.fetch(
                '1507532077221023764'
            );

            await canal.send(

`✅ NOVA COMPRA VIP

👤 Usuário:
${global.lastVip.usuario}

💎 VIP:
${global.lastVip.vip}

💰 Valor:
R$${global.lastVip.valor}

🧾 Pagamento ID:
${paymentId}

🔥 Obrigado por apoiar o DoomsDayZ!`

            );

        }

        res.sendStatus(200);

    } catch (err) {

        console.log(err);

        res.sendStatus(500);

    }

});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor web iniciado');
});

client.login(process.env.DISCORD_TOKEN);