client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'coins') {

        await interaction.deferReply();

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

            await interaction.editReply({

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

            await interaction.editReply({
                content:
'Erro ao gerar pagamento.'
            });

        }
    }
});