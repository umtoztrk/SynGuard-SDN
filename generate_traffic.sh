#!/bin/bash

# Remove old CLI scenario file
rm -f scenario.cli

# 1. Start H2 Server (This runs in Python)
echo "h2 xterm -title 'H2-Server' -hold -e 'python3 -m http.server 8080' &" > scenario.cli
echo "sh sleep 1" >> scenario.cli

# 2. Benign Traffic (4 Random Hosts)
hosts=(h1 h3 h4 h5 h6 h7 h8)
selected_benign=$(printf "%s\n" "${hosts[@]}" | shuf -n 4)

for h in $selected_benign; do
    # FIX: Using bash instead of python3 to run the shell script
    echo "$h xterm -title '$h-Benign' -hold -e 'bash ./benign_traffic.sh' &" >> scenario.cli
done

echo "sh sleep 2" >> scenario.cli

# 3. Attack Traffic (2 Random Hosts from the remaining ones)
remaining_hosts=($(comm -23 <(printf "%s\n" "${hosts[@]}" | sort) <(printf "%s\n" $selected_benign | sort)))
selected_attack=$(printf "%s\n" "${remaining_hosts[@]}" | shuf -n 2)

for h in $selected_attack; do
    # FIX: Using bash instead of python3 to run the shell script
    echo "$h xterm -title '$h-Attack' -hold -e 'bash ./attack_traffic.sh' &" >> scenario.cli
done

echo "[+] Mininet scenario successfully written to 'scenario.cli'!"
