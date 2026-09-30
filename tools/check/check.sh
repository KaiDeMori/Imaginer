#!/usr/bin/env bash
# Gate for workflow steps: fails when the module graph, a name, or the cache manifest is broken, and ignores type noise.
# Gated codes: 1xxx syntax, 2300 duplicate identifier, 2304 and 2552 cannot find name, 2305, 2614 and 2724 missing export, 2307 cannot find module, 2451 redeclared variable, 5xxx, 6xxx and 18003 unusable configuration.

set -u

script_folder="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
config_path="$script_folder/check_config.json"
check_failed=0

for required_command in tsc node; do
   if ! command -v "$required_command" > /dev/null 2>&1; then
      echo "check failed: $required_command not found" >&2
      exit 1
   fi
done

tsc_output="$(tsc -p "$config_path" --pretty false 2>&1)"
tsc_exit_code=$?

# tsc exits with 0 or 2 when it has checked the project; any other exit code means it could not check it, which must never pass as clean.
if [ "$tsc_exit_code" -ne 0 ] && [ "$tsc_exit_code" -ne 2 ]; then
   echo "check failed: tsc exited with code $tsc_exit_code" >&2
   printf '%s\n' "$tsc_output" >&2
   exit 1
fi

gated_errors="$(printf '%s\n' "$tsc_output" | grep -E 'error TS(1[0-9]{3}|2300|2304|2305|2307|2451|2552|2614|2724|5[0-9]{3}|6[0-9]{3}|18003):')"

if [ -n "$gated_errors" ]; then
   echo "check failed: tsc"
   printf '%s\n' "$gated_errors"
   check_failed=1
fi

if ! node "$script_folder/check_manifest.mjs"; then
   check_failed=1
fi

if [ "$check_failed" -ne 0 ]; then
   exit 1
fi

echo "check passed"
