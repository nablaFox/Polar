import { uploadFolder, runCommand } from './ssh.js'
import { configureAppRules } from './nginx.js'
import yaml from 'js-yaml'
import fs from 'fs'

// function to upload the application
export const upload = async (domain, nginxConfig, sshConfig) => {
  const file = fs.readFileSync('polar.yml', 'utf8')
  if (!file) {
    throw 'polar.yml file not found'
  }
   
  // look for the polar.yml file and get the app name and port
  const { app, port } = yaml.load(file)
  if (!app) { throw 'App name missing in polar.yml' }
  if (!port) { throw 'Port missing in polar.yml' }

  try {
    // upload the app folder to the server
    await uploadFolder(sshConfig, `/home/ubuntu/app/${app}`)

    // configure nginx
    await configureAppRules(app, port, domain, nginxConfig, sshConfig)
  } catch(err) {
    return err
  }
}

// function to list the applications
export const listApps = async (sshConfig) => {
  const [output, err] = await runCommand(sshConfig, [`polar list`])
  if (err) return [null, err]

  const apps = output
    .slice(0, -1)
    .split('\n')
    .map(app => ({
      name: app.split(' | ')[0],
      running: app.split(' | ')[1] === 'active'
    }))

  return [apps, null]
} 

// function to start the app
export const startApp = async (app, sshConfig) => await runCommand(sshConfig, [`polar start ${app}`])

// function to stop the app
export const stopApp = async (app, sshConfig) => await runCommand(sshConfig, [`polar stop ${app}`])

// function to remove app
export const removeApp = async (app, sshConfig) => await runCommand(sshConfig, [`sudo polar delete ${app}`])

export { startInstance, stopInstance, rebootInstance, describeInstance } from './ec2.js'

export { configureNginx, certbot } from './nginx.js'