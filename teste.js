const SftpClient = require('ssh2-sftp-client');

const sftp = new SftpClient();

async function teste() {

    try {

        await sftp.connect({
            host: '188.255.171.181',
            port: 2382,
            username: 'SEU_USUARIO',
            password: 'SUA_SENHA'
        });

        console.log(await sftp.list('/'));

    } catch (err) {

        console.log(err);

    }
}

teste();