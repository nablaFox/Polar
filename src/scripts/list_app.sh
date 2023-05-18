list_apps() {
  local apps=$(ls $APP_DIR)
  for app in $apps; do
    local status=$(check_status "$app")
    echo "$app | $status"
  done
}

get_app_pid() {
  local app_name=$1

  for pid in /proc/*; do
    if [ -d "$pid/cwd" ]; then
      local origin=$(basename "$(ls -l $pid/cwd)")
      if [ "$origin" = "$app_name" ]; then
        echo $(basename "$pid")
      fi
    fi
  done
}

check_status() {
  local app_name=$1
  local status="sleeping"

  if [ -d "$APP_DIR/$app_name" ]; then
    local pid=$(get_app_pid "$app_name")
    if [ -n "$pid" ]; then
      status="active"
    fi
  fi

  echo "$status"
}
