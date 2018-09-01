#! /usr/bin/env sh

command="${1}"
shift

printUsage() {
  printf "./run <command>\\n\\n"
  echo   "where <command> is one of:"
  echo   "  lint"
  printf "  test\\n\\n"
}

case "${command}" in
  test)
    ./node_modules/.bin/mocha \
      --ui tdd \
      --exclude "tests/commands/tmp/**/*" \
      "$@" \
      -- "tests/**/*.js"
    ;;

  lint)
    ./node_modules/.bin/eslint commands tests helpers.js index.js usage.js ;;

  '')
    printf "'run' requires a command\\n\\n"
    printUsage ;;

  *)
    printf "command '%s' not valid\\n\\n" "${command}"
    printUsage ;;
esac
