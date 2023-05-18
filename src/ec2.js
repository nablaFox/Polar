import { 
  CreateKeyPairCommand, 
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  DescribeInstancesCommand
} from '@aws-sdk/client-ec2'

// function to create key pair
export const createKeyPair = async (keyName, client) => {
  const command = new CreateKeyPairCommand({
    KeyName: keyName
  })
  
  try {
    const data = await client.send(command)
    return [data, null]
  } catch (err) {
    return [null, err]
  }
}

// function to create an instance
export const createInstance = async (client, params) => {
  const command = new RunInstancesCommand(params)
  
  try {
    const data = await client.send(command)
    return [data.Instances[0], null]
  } catch (err) {
    return [null, err]
  }
}

export const manageInstance = async (instanceId, client, action) => {
  const command = new action.command({
    InstanceIds: [instanceId]
  })

  try {
    const data = await client.send(command)
    const _data = action.name ? data[action.name][0] : data
    return [_data, null]
  } catch (err) {
    return [null, err]
  }
}

// function to start the instance
export const startInstance = async (instanceId, client) => {
  return manageInstance(instanceId, client, {
    command: StartInstancesCommand,
    name: 'StartingInstances'
  })
}
 
// function to stop the instance
export const stopInstance = async (instanceId, client) => {
  return manageInstance(instanceId, client, {
    command: StopInstancesCommand,
    name: 'StoppingInstances'
  })
}

// function to reboot the instance
export const rebootInstance = async (instanceId, client) => {
  return manageInstance(instanceId, client, {
    command: RebootInstancesCommand
  })
}

// function to log the status of the instance
export const describeInstance = async (instanceId, client) => {
  const command = new DescribeInstancesCommand({
    InstanceIds: [instanceId]
  })

  try {
    const response = await client.send(command)
    if (!response.Reservations.length) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    return [response.Reservations[0].Instances[0], null]
  } catch(err) {
    return [null, err]
  }
}
