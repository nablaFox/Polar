import { Client } from 'ssh2'
import readline from 'readline'
import path from 'path'
import tar from 'tar'

const ssh = async (config, fn, hasResult) => {
  const client = new Client()
  client.connect(config)

  try {
    const result = await new Promise((resolve, reject) => {
      client.on('ready', async () => {
        fn(client, resolve, reject)
      })
    })

    return result ? [result, null] : void 0
  } catch(err) {
    return hasResult ? [null, err] : err
  }
}

// function to run commands on the instance
export const runCommand = async (config, cmd) => {
  const cmdString = cmd.join(' && ')
  let cmdOutput = ''
  let cmdError = ''

  return ssh(config, (client, resolve, reject) => {
    client.exec(cmdString, (err, stream) => {
      if (err) return reject(err)

      stream.on('data', data => {
        cmdOutput += data.toString()
      }).on('exit', () => {
        if (cmdError) {
          reject(new Error(`Failed: ${cmdError}`))
        } else { 
          resolve(cmdOutput)
        }
        client.end()
      }).stderr.on('data', data => {
        if (data) {
          cmdError += data.toString()
        }
      })
    })
  }, true)
}

// function to run interactive shell on the instance
export const runShell = async (config, fn) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return ssh(config, (client, resolve, reject) => {
    client.shell(async (err, stream) => {
      if (err) return reject(err)

      const close = err => {
        if (err) { reject(err) }
        stream.close()
      }

      fn && fn(rl, stream, close)
      stream.on('close', () => {
        rl.close()
        resolve()
        client.end()
      })
    })
  })
}

// function to upload files to the instance
export const uploadFile = async (config, remotePath, payload) => {
  return ssh(config, (client, resolve, reject) => {
    client.sftp((err, sftp) => {
      if (err) return reject(err)

      if (typeof payload === 'string') {
        return sftp.fastPut(payload, remotePath, err => {
          if (err) { reject(err) }
          else { resolve() }
          client.end()
        })
      }
      
      else if (typeof payload === 'function') {
        const writeStream = sftp.createWriteStream(remotePath)
        writeStream.on('close', () => {
          client.end()
          resolve()
        })
        writeStream.on('error', err => {
          client.end()
          reject(err)
        })
        payload(writeStream)
      }
    })
  })
}

// function to upload folder to the instance
export const uploadFolder = async (config, remotePath, localPath) => {
  remotePath += '.tar'

  // compress the folder
  const compressed = tar.c([path.basename(localPath)])

  const uploadFailed = await uploadFile(config, remotePath, stream => {
    compressed.pipe(stream)
    compressed.on('end', () => stream.close())
  })

  if (uploadFailed) { return uploadFailed }

  await runCommand(config, [
    `tar -xf ${remotePath} -C ${path.dirname(remotePath)}`,
    `rm ${remotePath}`
  ])
}