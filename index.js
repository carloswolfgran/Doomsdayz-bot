require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());

const fs = require('fs');

const SftpClient = require('ssh2-sftp-client');

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

const commands = [
    new SlashCommandBuilder()
        .setName('coins')
        .setDescription('Comprar coins')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade')
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

async function adicionarCoinsFTP(steamID, coins) {

    const sftp = new SftpClient();

    try {

        await sftp.connect({
            host: process.env.FTP_HOST,
            port: Number(process.env.FTP_PORT),
            username: process.env.FTP_USER,
            password: process.env.FTP_PASS
        });

        const caminhoArquivo =
'/home/container/profiles/FlameHost/Addons/Shop/Players/PlayerDatabase/' +
`${steamID}.json`;

        const arquivoLocal =
`${steamID}.json`;

        await sftp.fastGet(
            caminhoArquivo,
            arquivoLocal
        );

        const dados =
JSON.parse(
    fs.readFileSync(arquivoLocal)
);

        dados.Balance += coins;

        fs.writeFileSync(
            arquivoLocal,
            JSON.stringify(dados, null, 4)
        );

        await sftp.fastPut(
            arquivoLocal,
            caminhoArquivo
        );

        console.log(
`${coins} coins adicionadas para ${steamID}`
        );

        await sftp.end();

    } catch (err) {

        console.log(err);

    }
}

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'coins') {

        const quantidade =
        interaction.options.getInteger('quantidade');

        const payment_data = {
            transaction_amount: quantidade,
            description: `Coins DoomsDayZ`,
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

            await interaction.reply({

                content:
`💰 PAGAMENTO PIX GERADO

Valor: R$ ${quantidade}

PIX COPIA E COLA:

${pix}

Após pagar o sistema confirmará automaticamente.`,

                files: [attachment]

            });

            console.log(
`Pagamento criado: ${payment.id}`
            );

        } catch (error) {

            console.log(error);

            await interaction.reply({
                content:
'Erro ao gerar pagamento.',
                ephemeral: true
            });

        }
    }
});

app.get('/', (req, res) => {
    res.send('Bot online');
});

app.post('/webhook', async (req, res) => {

    console.log('Webhook recebido');

    console.log(req.body);

    res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor web iniciado');
});

client.login(process.env.DISCORD_TOKEN);