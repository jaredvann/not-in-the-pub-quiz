# Not In The Pub Quiz


**To port forward 3000 to 80:**

sudo iptables -t nat -A PREROUTING -i ens2 -p tcp --dport 80 -j REDIRECT --to-port 3000