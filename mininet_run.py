from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.topo import TreeTopo
from mininet.log import setLogLevel
from functools import partial
from mininet.cli import CLI

def run():
    setLogLevel('info')

    topo = TreeTopo(depth=3, fanout=2)

    switch = partial(OVSSwitch, protocols='OpenFlow13')

    net = Mininet(
        topo=topo,
        controller=lambda name: RemoteController(
            name,
            ip='127.0.0.1',   # OS-Ken controller IP
            port=6653         # OpenFlow13 default port
        ),
        switch=switch,
        autoSetMacs=True
    )

    net.start()

    print("Mininet started with OS-Ken controller")

    h1 = net.get('h1')
    h2 = net.get('h2')
    h3 = net.get('h3')

    # Run processes
    h2.cmd('python3 server.py &')   # start server first
    h1.cmd('bash attack.sh &')      # then attack
    h3.cmd('ping 8.8.8.8 -c 5')     # final test

    CLI(net)

    net.stop()

if __name__ == '__main__':
    run()
