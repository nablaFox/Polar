import { EC2Client } from '@aws-sdk/client-ec2'

export const clientConfig = {
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

export const ec2Client = new EC2Client(clientConfig)

export const scripts = [
  '#!/bin/bash',
  'sudo apt update',
  // install nginx
  'sudo apt install certbot python3-certbot-nginx nginx -y',
  'sudo mkdir /etc/nginx/snippets/certs',
  // download and install nodejs
  'curl -fsSL https://deb.nodesource.com/setup_19.x | sudo -E bash - && sudo apt-get install -y nodejs',
  // download and install polar scripts
  'curl -L https://github.com/nablaFox/Polar/archive/main.zip -o Polar.zip',
  'unzip Polar.zip',
  'sudo mv Polar-main/src/scripts/polar.sh /usr/bin/polar',
  'sudo mv Polar-main/src/scripts /usr/lib/polar',
  'sudo chmod +x /usr/bin/polar',
  'sudo rm -r Polar*',
  // polar setup
  'mkdir /home/ubuntu/app'
]

export const instanceParams = {
  ImageId: 'ami-0ec7f9846da6b0f61',
  InstanceType: 't2.micro',
  KeyName: 'polar-key',
  MaxCount: 1,
  MinCount: 1,
  BlockDeviceMappings: [
    {
      DeviceName: '/dev/sda1',
      Ebs: {
        DeleteOnTermination: true,
        VolumeSize: 20,
        VolumeType: 'gp2'
      }
    }
  ],
  UserData: Buffer.from(scripts.join('\n')).toString('base64')
}

export const groupParams = {
  Description: 'Polar security group',
  GroupName: 'polar-group'
}

export const inboundRules = [
  {
    IpProtocol: 'tcp',
    FromPort: 80,
    ToPort: 80,
    IpRanges: [{ CidrIp: '0.0.0.0/0' }]
  },
  {
    IpProtocol: 'tcp',
    FromPort: 443,
    ToPort: 443,
    IpRanges: [{ CidrIp: '0.0.0.0/0' }]
  },
  {
    IpProtocol: 'tcp',
    FromPort: 22,
    ToPort: 22,
    IpRanges: [{ CidrIp: '0.0.0.0/0' }]
  }
]

export const nginxConfig = {
  server: {
    listen: 80,
    rewrite: ['^ https://$server_name$request_uri? permanent'],
  },

  app: {
    listen: '443 ssl',
    include: ['snippets/ssl.conf'],
    'location /': {
      proxy_set_header: ['Host $host', 'X-Real-IP $remote_addr']
    }
  },

  sslConfig: {
    ssl_session_timeout: '1d',
    ssl_session_cache: 'shared:SSL:50m',
    ssl_session_tickets: 'on',
    ssl_protocols: 'TLSv1.2',
    ssl_ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES256-SHA384',
    ssl_ecdh_curve: 'secp384r1',
    ssl_prefer_server_ciphers: 'on',
    ssl_stapling: 'on',
    ssl_stapling_verify: 'on',
    add_header: [
      'Strict-Transport-Security "max-age=15768000; includeSubdomains; preload"',
      'X-Frame-Options DENY',
      'X-Content-Type-Options nosniff'
    ]
  }
}
