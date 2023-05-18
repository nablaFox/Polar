#!/usr/bin/env node

import { program } from 'commander'
import { readFileSync } from 'fs'
import { runCommand, runShell, uploadFile, uploadFolder } from '../src/ssh.js'
import { ec2Client, nginxConfig } from '../src/config.js'
import { 
  upload, 
  startApp, 
  stopApp, 
  listApps, 
  removeApp, 
  stopInstance,
  startInstance,
  rebootInstance,
  describeInstance,
  configureNginx,
  certbot
} from '../src/index.js'

const test = async (fn, ...params) => {
  const result = await fn(...params)

  if (Array.isArray(result) && result[0]) {
    console.log(result[0])
    console.log('\nDone')
  } else if (Array.isArray(result) ) {
    console.log(result[1].message)
  } else if (result) {
    console.log(result)
  } else {
    console.log('\nDone')
  }
}

const domain = 'icedcube.net'
const instanceId = 'i-0b1cd926939e84f0a'
const clientConfig = {
  host: 'ec2-18-157-191-202.eu-central-1.compute.amazonaws.com',
  username: 'ubuntu',
  privateKey: readFileSync('/home/sincro/Downloads/icecube-key.pem')
}

// ssh
// test(uploadFile, clientConfig, '/home/ubuntu/backbone', 'backbone')
// test(uploadFolder, clientConfig, '/home/ubuntu/app/test')
// test(runCommand, clientConfig, ['ls -la'])

// nginx
// test(certbot, clientConfig, 'test.com', {
//   onFirstCheck: data => console.log(data),
//   onSecondCheck: data => console.log(data),
// })

// test(configureNginx, clientConfig, 'test.com')
// test(configureAppRules, clientConfig, 'test', 'test.com', 4000, nginxConfig.app)

// ec2
// test(describeInstance, instanceId, ec2Client)
// test(startInstance, instanceId, ec2Client)
// test(stopInstance, instanceId, ec2Client)
// test(rebootInstance, instanceId, ec2Client)

// polar
// test(upload, clientConfig, 'test.com', nginxConfig.app)
// test(runCommand, clientConfig, [
//   'curl -L https://github.com/nablaFox/Polar/archive/main.zip -o Polar.zip',
//   'unzip Polar.zip',
//   'sudo mv Polar-main/src/scripts/polar.sh /usr/bin/polar',
//   'sudo mv Polar-main/src/scripts /usr/lib/polar',
//   'sudo chmod +x /usr/bin/polar',
//   'sudo rm -r Polar*',  
// ])
// test(listApps, clientConfig)
// test(startApp, clientConfig, 'my-first-test')
// test(stopApp, clientConfig, 'my-first-test')


// general test

// await test(configureNginx, clientConfig, domain, {
//   server: nginxConfig.server,
//   ssl: nginxConfig.sslConfig
// })

// await test(upload, clientConfig, domain, nginxConfig.app)
// await test(stopApp, clientConfig, 'my-second-test')
// await test(startApp, clientConfig, 'my-second-test')
// await test(removeApp, clientConfig, 'my-first-test')
// await test(listApps, clientConfig)