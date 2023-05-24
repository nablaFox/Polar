#!/usr/bin/env node

import { program } from 'commander'
import { setup } from './commands/config.js'
import { deploy, start, stop, list, init, remove } from './commands/app.js'
import { startInstance, stopInstance, rebootInstance, getInstanceStatus } from './commands/instance.js'

program
  .name('polar-cli')
  .description('CLI for managing web applications on AWS EC2 instances')
  .version('0.0.1')

program.command('setup')
  .description('CLI configuration')
  .action(setup)

program.command('init')
  .description('Create a polar.yml file')
  .action(init)

program.command('deploy')
  .description('Deploy the application')
  .action(deploy)

program.command('start')
  .description('Start an application')
  .argument('<app>', 'Application name')
  .action(start)

program.command('stop')
  .description('Stop an application')
  .argument('<app>', 'Application name')
  .action(stop)

program.command('remove')
  .description('Remove an application')
  .argument('<app>', 'Application name')
  .action(remove)

program.command('list')
  .description('List the applications')
  .action(list)

program.command('instance')
  .description('Manage the instance')
  .argument('<action>', 'Action to perform')
  .action(action => {
    action === 'start' && startInstance()
    action === 'stop' && stopInstance()
    action === 'reboot' && rebootInstance()
    action === 'info' && getInstanceStatus()
  })

program.parse()