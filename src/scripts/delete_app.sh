delete_app() {
  local app_name=$1
  local is_running=$(check_status "$app_name")

  if [ ! -d "$APP_DIR/$app_name" ]; then
    >&2 echo "App '$app_name' does not exist"
    exit 1
  fi

  if [ "$is_running" = "active" ]; then
    stop_app "$app_name"
  fi

  rm -rf "$APP_DIR/$app_name"
  remove_nginx_rule "$app_name"
  systemctl restart nginx
  echo "App '$app_name' deleted"
}

remove_nginx_rule() {
  local app_name=$1
  local nginx_conf="/etc/nginx/conf.d/$app_name*.conf"
  
  if compgen -G "$nginx_conf" > /dev/null; then
    rm $nginx_conf
    echo "Nginx rule for '$app_name' deleted"
  fi
}