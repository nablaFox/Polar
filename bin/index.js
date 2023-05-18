#!/usr/bin/env node
import { program } from 'commander'
import { Client } from 'ssh2'
import { readFileSync } from 'fs'
import { certbot, configureNginx } from '../src/nginx.js'
import { describeInstance, startInstance, stopInstance, rebootInstance } from '../src/ec2.js'
import { runCommand, runShell, uploadFile, uploadFolder } from '../src/ssh.js'
import { ec2Client } from '../src/config.js'

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

const instanceId = 'i-0b1cd926939e84f0a'
const clientConfig = {
  host: 'ec2-18-157-191-202.eu-central-1.compute.amazonaws.com',
  username: 'ubuntu',
  privateKey: readFileSync('/home/sincro/Downloads/icecube-key.pem')
}

// ssh
// test(uploadFile, clientConfig, '/home/ubuntu/backbone', 'backbone')
// test(uploadFolder, clientConfig, '/home/ubuntu/bin', 'bin')
// await test(runCommand, clientConfig, ['ls -la'])

// nginx
// await test(certbot, clientConfig, 'test.com', {
//   onFirstCheck: data => console.log(data),
//   onSecondCheck: data => console.log(data),
// })

// await test(configureNginx, clientConfig, 'test.com')

// ec2
// test(describeInstance, instanceId, ec2Client)
// test(startInstance, instanceId, ec2Client)
// test(stopInstance, instanceId, ec2Client)
// test(rebootInstance, instanceId, ec2Client)