#!/bin/bash

APP_DIR="/home/ubuntu/app"

source /usr/lib/polar/list_app.sh
source /usr/lib/polar/delete_app.sh
source /usr/lib/polar/app_control.sh

case $1 in
  "list")
    list_apps
    ;;
  "start")
    if [[ -z $2 ]]; then
      >&2 echo "Fatal: application not specified"
      exit 1
    else
      start_app $2
    fi
    ;;
  "stop")
    if [[ -z $2 ]]; then
      >&2 echo "Fatal: application not specified"
      exit 1
    else
      stop_app $2
    fi
    ;;
  "delete")
    if [[ -z $2 ]]; then
      >&2 echo "Fatal: application not specified"
      exit 1
    else
      delete_app $2
    fi
    ;;
  *)
    >&2 echo "Usage: $0 [list | run <server_name> | stop <server_name> | delete <server_name>]"
    exit 1
    ;;
esac
