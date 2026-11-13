"""Reliably find and kill any processes occupying Sentinel ports (8000, 8001, 3000, 5173)."""

import os
import re
import subprocess
import sys

PORTS = [8000, 8001, 3000, 5173]


def kill_processes_on_ports():
    print(f"Scanning for processes listening on ports: {PORTS}")
    try:
        output = subprocess.check_output("netstat -ano", shell=True, text=True)
    except Exception as e:
        print(f"Failed to run netstat: {e}")
        return

    pids_to_kill = set()
    current_pid = os.getpid()

    for line in output.splitlines():
        line = line.strip()
        if "LISTENING" not in line:
            continue
        for port in PORTS:
            # Match :8000 exactly
            if re.search(rf":{port}\s+", line):
                parts = line.split()
                try:
                    pid = int(parts[-1])
                    if pid > 0 and pid != current_pid:
                        pids_to_kill.add((port, pid))
                except (ValueError, IndexError):
                    pass

    if not pids_to_kill:
        print("No conflicting processes found listening on Sentinel ports.")
        return

    for port, pid in pids_to_kill:
        print(f"Terminating PID {pid} listening on port {port}...")
        try:
            # /F = force, /T = tree kill (all child processes)
            subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print(f"  -> PID {pid} killed.")
        except Exception as e:
            print(f"  -> Could not kill PID {pid}: {e}")

    print("Port cleanup completed successfully.")


if __name__ == "__main__":
    kill_processes_on_ports()

