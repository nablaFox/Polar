import { nginxConfig } from './config.js'
import { runCommand, runShell } from './ssh.js'

// function to normalize the nginx config
export const nginxNormalize = (config, option) => {
  const result = Object.entries(config).map(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(item => `${key} ${item};\n`).join('')
    }
    else {
      return `${key} ${value};\n`
    }
  }).join('')

  if (option) { return `${option} {\n${result}}` }
  return result
}

// function to configure nginx with letsencrypt
export const configureNginx = async (config, domain) => {
  const serverConfig = nginxNormalize({
    server_name: `*.${domain}`,
    ...nginxConfig.server,
  }, 'server')

  const sslConfig = nginxNormalize(nginxConfig.sslConfig)

  const sslCertificate = nginxNormalize({
    ssl_certificate: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
    ssl_certificate_key: `/etc/letsencrypt/live/${domain}/privkey.pem`,
    ssl_trusted_certificate: `/etc/letsencrypt/live/${domain}/chain.pem`
  })

  return runCommand(config, [
    `echo '${serverConfig}' | sudo tee /home/ubuntu/conf.d/${domain.split('.')[0]}.conf `,
    `echo '${sslConfig}' | sudo tee /etc/nginx/snippets/ssl.conf`,
    `echo '${sslCertificate}' | sudo tee /etc/nginx/snippets/certs/${domain}`
  ])
}

// function to run certbot
export const certbot = async (config, domain, fn) => {
  const command =  `sudo certbot certonly --manual -d *.${domain} -d ${domain} --agree-tos --manual-public-ip-logging-ok --preferred-challenges dns-01 --server https://acme-v02.api.letsencrypt.org/directory --register-unsafely-without-email --rsa-key-size 4096`

  let check1 = false
  let check2 = false
  const isSuccess = data => /Congratulations/.exec(data)
  const isError = data => /failed to authenticate/.exec(data)
  const isCheck = data => /[\w\d-]{40,}/.exec(data)

  return runShell(config, (rl, stream, close) => {
    stream.write(`${command}\n`)

    rl.on('line', input => {
      input === '' 
      && (check1 || check2) 
      && stream.write(`${input}\n`)
    })
    
    stream.on('data', data => {
      const output = data.toString()

      if (isCheck(output) && !check1) {
        fn?.onFirstCheck(output)
        check1 = true
      } else if (isCheck(output)){
        fn?.onSecondCheck(output)
        check2 = true
      } else if (isError(output)) {
        close(new Error('Challenge failed'))
      } else if (isSuccess(output)) {
        close()
      }
    })
  })
}
