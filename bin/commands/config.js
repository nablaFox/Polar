import { 
  createInstanceWithInboundRules, 
  createKeyPair,
  waitForInstance
} from '../../src/index.js'
import {
  ec2Client,
  instanceParams,
  groupParams,
  inboundRules,
  nginxConfig
} from '../../src/config.js'
import { configureNginx, certbot } from '../../src/index.js'
import { logError } from './format.js'
import { createSpinner } from 'nanospinner'
import prompts from 'prompts'
import chalk from 'chalk'
import fs from 'fs'

export const setup = async () => {
  console.log(chalk.green('\nThe Polar CLI\n'))

  // check if previous configuration exists

  // check for credentials
  if (!checkCredentials()) { 
    return logError('AWS credentials not found')
  }

  // keypair
  const [keyPair, keyPairFailed] = await getKeyPair()
  if (keyPairFailed) { 
    return logError(keyPairFailed.message)
  }

  // instance
  const [instance, instanceError] = await createPolarInstance()
  if (instanceError) {
    return logError(instanceError.message)
  }

  const { PublicIpAddress } = instance

  // configure
  const sshConfig = {
    host: PublicIpAddress,
    username: 'ubuntu',
    privateKey: Buffer.from(keyPair)
  }

  const configureFailed = await configurePolarInstance(sshConfig)
  if (configureFailed) { 
    return logError(configureFailed.message)
  }

  console.log('\nDone! Insert', chalk.green(PublicIpAddress), 'in your DNS records')
}

const checkCredentials = () => {
  const credentials = process.env.AWS_DEFAULT_REGION 
    && process.env.AWS_ACCESS_KEY_ID 
    && process.env.AWS_SECRET_ACCESS_KEY

  if (!credentials) { 
    console.log('Please set the following environment variables:', '\n')
    console.log('AWS_DEFAULT_REGION=<your-region-here>')
    console.log('AWS_ACCESS_KEY_ID=<your-key-here>')
    console.log('AWS_SECRET_ACCESS_KEY=<your-secret-key-here>', '\n')
    return
  }

  return true
}

const getKeyPair = async () => {
  const basePath = `/home/${process.env.USER}`

  const path = await askPath(
    'Where do you want to save the keypair?', 
    `${basePath}/.polar-key.pem`
  )

  if (!path) { return [null, new Error('invalid path')] }
  const [keyPair, keypairFailed] = await createKeyPair(ec2Client, instanceParams.KeyName)
  if (keypairFailed) { return [null, keypairFailed] }

  fs.writeFileSync(path, keyPair)
  fs.appendFileSync(`${basePath}/.bashrc`, `export POLAR_KEYPAIR=${path}\n`)

  return [keyPair, null]
}

const createPolarInstance = async () => {
  const spinner = createSpinner('Creating instance...').start()
  const [creatingInstance, creationFailed] = await createInstanceWithInboundRules(ec2Client, instanceParams, groupParams, inboundRules)

  if (creationFailed) {
    spinner.error('Instance creation failed')
    return [null, creationFailed]
  }

  const [instance, instanceFailed] = await waitForInstance(
    ec2Client, 
    creatingInstance.InstanceId,
    { maxWaitTime: 300, minDelay: 1, maxDelay: 5 }
  )

  if (instanceFailed) { 
    spinner.error('Instance creation failed')
    return [null, instanceFailed] 
  }

  spinner.success()
  return [instance, null]
}

const configurePolarInstance = async (ssh) => {
  const { domain } = await prompts({
    type: 'text',
    name: 'domain',
    message: 'Enter your domain name',
    validate: domain => {
      if (!domain) { return 'Please enter a valid domain' }
      return true
    }
  })

  const certbotFailed = await certbot(ssh, domain, {
    onFirstCheck: async (data) => await askCertbot(data, domain, 1),
    onSecondCheck: async (data) => await askCertbot(data, domain, 2)
  })

  if (certbotFailed) { return certbotFailed }
  
  const nginxFailed = await configureNginx(domain, ssh, {
    server: nginxConfig.server,
    ssl: nginxConfig.sslConfig
  })

  if (nginxFailed) { return nginxFailed }
}

const askCertbot = async (data, domain, check) => {
  console.log(
    check === 1 ? '\nPlease deploy a' : '\nPlease deploy another',
    chalk.bold('DNS TXT record'),
    'record under the name:',
    chalk.bold.blue(`\n_acme-challenge.${domain}`),
    '\n\nwith the following',
    chalk.bold('value:'),
    chalk.bold.blue(`\n${data}\n`),
    check === 2 ? chalk.dim('\n(Note note note note)') : ''
  )

  await prompts({
    type: 'invisible',
    name: 'done',
    message: 'Press ENTER to continue'
  })
}

const askPath = async (message, initial) => {
  return (await prompts({
    type: 'text',
    name: 'path',
    message,
    initial,
    validate: path => {
      if (!path.startsWith('/')) { return 'Please enter a valid path' }
      const dirPath = path.split('/').slice(0, -1).join('/')
      if (!fs.existsSync(dirPath)) { return 'This path does not exist' }
      return true
    }
  })).path
}