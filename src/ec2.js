import { 
  CreateKeyPairCommand,
  DeleteKeyPairCommand, 
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  DescribeInstancesCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupIngressCommand,
  waitUntilInstanceStatusOk
} from '@aws-sdk/client-ec2'

// function to run the ec2 command
export const ec2Command = async (client, { command, params, get }) => {
  const _command = new command(params)

  try {
    const data = await client.send(_command)
    const _data = get ? get(data) : data
    return [_data, null]
  } catch (err) {
    return [null, err]
  }
}

export const createKeyPair = async (client, KeyName) => {
  return ec2Command(client, {
    command: CreateKeyPairCommand,
    params: { KeyName },
    get: data => data.KeyMaterial
  })
}

export const deleteKeyPair = async (client, KeyName) => {
  return ec2Command(client, {
    command: DeleteKeyPairCommand,
    params: { KeyName }
  })
}

export const createSecurityGroup = async (client, params) => {
  return ec2Command(client, {
    command: CreateSecurityGroupCommand,
    params
  })
}

export const deleteSecurityGroup = async (client, GroupId) => {
  return ec2Command(client, {
    command: DeleteSecurityGroupCommand,
    params: { GroupId }
  })
}

export const findSecurityGroup = async (client, groupName) => {
  return ec2Command(client, {
    command: DescribeSecurityGroupsCommand,
    params: { Filters: [{ Name: 'group-name', Values: [groupName] }] },
    get: data => data.SecurityGroups[0]
  })
}

export const setInboundRules = async (client, GroupId, params) => {
  return ec2Command(client, {
    command: AuthorizeSecurityGroupIngressCommand,
    params: { GroupId, IpPermissions: params }
  })
}

export const createGroupWithInboundRules = async (client, groupParams, inboundRules) => {
  const [group, groupFailed] = await createSecurityGroup(client, groupParams)
  if (groupFailed) { return [null, groupFailed] }

  const { GroupId } = group

  const [_, inboundRulesFailed] = await setInboundRules(client, GroupId, inboundRules)
  if (inboundRulesFailed) { return [null, inboundRulesFailed] }

  return [GroupId, null]
}

export const createInstance = async (client, params) => {
  return ec2Command(client, {
    command: RunInstancesCommand,
    params,
    get: data => data.Instances[0]
  })
}

export const startInstance = async (client, instanceId) => {
  return ec2Command(client, {
    command: StartInstancesCommand,
    params: { InstanceIds: [instanceId] },
    get: data => data.StartingInstances[0]
  })
}

export const stopInstance = async (client, instanceId) => {
  return ec2Command(client, {
    command: StopInstancesCommand,
    params: { InstanceIds: [instanceId] },
    get: data => data.StoppingInstances[0]
  })
}

export const rebootInstance = async (client, instanceId) => {
  return ec2Command(client, {
    command: RebootInstancesCommand,
    params: { InstanceIds: [instanceId] }
  })
}

export const describeInstance = async (client, instanceId) => {
  return ec2Command(client, {
    command: DescribeInstancesCommand,
    params: { InstanceIds: [instanceId] },
    get: data => {
      if (!data.Reservations.length) {
        throw new Error(`Instance ${instanceId} not found`)
      }

      return data.Reservations[0].Instances[0]
    }
  })
}

export const createInstanceWithInboundRules = async (client, instanceParams, groupParams, inboundRules) => {
  // check first if the group already exists
  const [groupExist, _] = await findSecurityGroup(client, groupParams.GroupName)
  
  const [groupId, groupFailed] = groupExist
    ? [groupExist.GroupId, null]
    : await createGroupWithInboundRules(client, groupParams, inboundRules)
      
  if (groupFailed) { 
    await deleteKeyPair(client, instanceParams.KeyName)
    return [null, groupFailed]
  }

  const [instance, instanceFailed] = await createInstance(client, {
    ...instanceParams,
    KeyName: instanceParams.KeyName,
    SecurityGroupIds: [groupId]
  })

  if (instanceFailed) { 
    await deleteKeyPair(client, instanceParams.KeyName)
    await deleteSecurityGroup(client, groupId)
    return [null, instanceFailed]
  }

  return [instance, null]
}

export const waitForInstance = async (client, instanceId, params) => {
  try {
    await waitUntilInstanceStatusOk({
      client,
      ...params
    }, { InstanceIds: [instanceId] })
  
    return describeInstance(client, instanceId)
  } catch(err) {
    return [null, err]
  }
}