import { runCommand, runShell } from './ssh.js'

// function to normalize the nginx config
export const nginxNormalize = (config, option) => {
  const result = Object.entries(config).map(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(item => `${key} ${item};\n`).join('')
    } else if (typeof value === 'object') {
      return `${key} {\n${nginxNormalize(value)}}\n`
    } else {
      return `${key} ${value};\n`
    }
  }).join('')

  if (option) { return `${option} {\n${result}}` }
  return result
}

// function to configure nginx with letsencrypt
export const configureNginx = async (sshConfig, domain, config) => {
  const serverConfig = nginxNormalize({
    server_name: `*.${domain}`,
    ...config.server,
  }, 'server')

  const sslConfig = nginxNormalize(config.ssl)

  const sslCertificate = nginxNormalize({
    ssl_certificate: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
    ssl_certificate_key: `/etc/letsencrypt/live/${domain}/privkey.pem`,
    ssl_trusted_certificate: `/etc/letsencrypt/live/${domain}/chain.pem`
  })

  return runCommand(sshConfig, [
    `echo '${serverConfig}' | sudo tee /etc/nginx/conf.d/${domain.split('.')[0]}.conf `,
    `echo '${sslConfig}' | sudo tee /etc/nginx/snippets/ssl.conf`,
    `echo '${sslCertificate}' | sudo tee /etc/nginx/snippets/certs/${domain}`
  ])
}

// function to run certbot
export const certbot = async (sshConfig, domain, fn) => {
  const command =  `sudo certbot certonly --manual -d *.${domain} -d ${domain} --agree-tos --manual-public-ip-logging-ok --preferred-challenges dns-01 --server https://acme-v02.api.letsencrypt.org/directory --register-unsafely-without-email --rsa-key-size 4096`

  let check1 = false
  let check2 = false
  const isSuccess = data => /Congratulations/.exec(data)
  const isError = data => /failed to authenticate/.exec(data)
  const isCheck = data => /[\w\d-]{40,}/.exec(data)

  return runShell(sshConfig, (rl, stream, close) => {
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

// function to configure the app
export const configureAppRules = async (sshConfig, app, domain, port, config) => {
  const appConfig = nginxNormalize({
    server_name: `${app}.${domain}`,
    ...config,
    include: [
      ...config.include,
      `snippets/certs/${domain}`
    ],
    'location /': {
      proxy_pass: `http://localhost:${port}`,
      ...config['location /']
    }
  }, 'server')

  return runCommand(sshConfig, [
    `echo '${appConfig}' | sudo tee /etc/nginx/conf.d/${app}.${domain.split('.')[0]}.conf`
  ])
}
