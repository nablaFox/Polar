import { EC2Client } from '@aws-sdk/client-ec2'

export const clientConfig = {
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

export const ec2Client = new EC2Client(clientConfig)

export const instanceParams = {
  ImageId: 1,
  UserData: [
    'sudo apt update',
    'sudo apt upgrade -y',
    'sudo apt install certbot python3-certbot-nginx nginx -y',
    'sudo mkdir /etc/nginx/snippets/certs',
    // download and install the scripts
  ].join(' && '),
}

export const nginxConfig = {
  server: {
    listen: 80,
    rewrite: [
      '^ https://$server_name$request_uri? permanent'
    ]
  },

  app: {
    listen: '443 ssl',
    return: '200 "Ok"'
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
