import { runCommand, runShell } from './ssh.js'

// function to merge n nginx configs
export const mergeNginxConf = (...config) => {
  const result = {}
  config.forEach(conf => {
    Object.entries(conf).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        result[key] = result[key] ? [...result[key], ...value] : value
      } else if (typeof value === 'object') {
        result[key] = result[key] ? mergeNginxConf(result[key], value) : value
      } else {
        result[key] = result[key] ? result[key] : value
      }
    })
  })

  return result
}

// function to normalize the nginx config
export const nginxNormalize = (option, ...config) => {
  const mergedConfig = mergeNginxConf(...config)

  const result = Object.entries(mergedConfig).map(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(item => `${key} ${item};\n`).join('')
    } else if (typeof value === 'object') {
      return nginxNormalize(key, value)
    } else {
      return `${key} ${value};\n`
    }
  }).join('')

  if (option) { return `${option} {\n${result}}\n` }
  return result
}

// function to configure nginx with letsencrypt
export const configureNginx = async (domain, sshConfig, config) => {
  const serverConfig = nginxNormalize('server', {
    server_name: `*.${domain}`,
    ...config.server,
  })

  const sslConfig = nginxNormalize(null, config.ssl)

  const sslCertificate = nginxNormalize(null, {
    ssl_certificate: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
    ssl_certificate_key: `/etc/letsencrypt/live/${domain}/privkey.pem`,
    ssl_trusted_certificate: `/etc/letsencrypt/live/${domain}/chain.pem`
  })

  return (await runCommand(sshConfig, [
    `echo '${serverConfig}' | sudo tee /etc/nginx/conf.d/${domain.split('.')[0]}.conf`,
    `echo '${sslConfig}' | sudo tee /etc/nginx/snippets/ssl.conf`,
    `echo '${sslCertificate}' | sudo tee /etc/nginx/snippets/certs/${domain}`
  ]))[1]
}

// function to configure the app
export const configureAppRules = async (app, port, domain, sshConfig, ...config) => {
  const appConfig = nginxNormalize('server', {
    server_name: `${app}.${domain}`,
    include: [`snippets/certs/${domain}`],
    'location /': { 
      proxy_pass: [`http://localhost:${port}`]
    }
  }, ...config)

  return (await runCommand(sshConfig, [
    `echo '${appConfig}' | sudo tee /etc/nginx/conf.d/${app}.${domain.split('.')[0]}.conf`,
    `sudo systemctl restart nginx || sudo rm /etc/nginx/conf.d/${app}*`
  ]))[1]
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