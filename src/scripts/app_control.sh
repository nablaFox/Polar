start_app() {
  local app_name=$1
  local is_running=$(check_status "$app_name")

  if [ "$is_running" = "active" ]; then
    >&2 echo "App '$app_name' is already running"
    exit 1
  fi

  if [ ! -d "$APP_DIR/$app_name" ]; then
    >&2 echo "App '$app_name' does not exist"
    exit 1
  fi

  local config="$APP_DIR/$app_name/polar.yml"
  local command=$(grep "command" "$config" | grep -oP "(?<=command: ).*")
  nohup $(cd $APP_DIR/$app_name && $command) >/dev/null 2>&1 &
  echo "App '$app_name' started"
}

stop_app() {
  local app_name=$1
  local pids=$(get_app_pid "$app_name")
  if [ -n "$pids" ]; then
    for pid in $pids; do
      kill "$pid"
    done
    echo "$app_name stopped"
  else
    >&2 echo "App '$app_name' is already closed"
    exit 1
  fi
}