# --- REQUIRED LIBRARIES ---
from os_ken.base import app_manager  # Imports OS-Ken's base application class.
from os_ken.controller import ofp_event  # Required to catch events coming from the switch.
from os_ken.controller.handler import MAIN_DISPATCHER, DEAD_DISPATCHER, CONFIG_DISPATCHER, set_ev_cls  # Determines at which stages events are listened to.
from os_ken.ofproto import ofproto_v1_3  # Indicates we will use OpenFlow 1.3 protocol.
from os_ken.lib.packet import packet, ethernet, ipv4  # Used to open and read network packets (Ethernet, IP).
from os_ken.lib import hub  # Used to run infinite loops (threads) in the background.
import time  # Stopwatch for time and speed calculations (Delta operations).
import requests  # Used to send data to the AI API (FastAPI).

# --- MAIN CONTROLLER CLASS ---
class DDoSDetectionController(app_manager.OSKenApp):
    # Specify that this controller will communicate using OpenFlow 1.3 version.
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(DDoSDetectionController, self).__init__(*args, **kwargs)
        self.datapaths = {}  # Stores active switches (datapaths) connected to the network.
        self.flow_stats = {}  # Stores previous counter values (packets/bytes) of network flows.
        self.mac_to_port = {}  # Maps MAC addresses to their respective switch ports.
        
        # Starts the background monitoring thread to collect intelligence upon controller startup.
        self.monitor_thread = hub.spawn(self._monitor)

    # ==========================================
    # 1. INITIAL SWITCH CONNECTION (TABLE-MISS)
    # ==========================================
    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath  # Get the ID of the connected switch.
        ofproto = datapath.ofproto  # Get OpenFlow protocol constants.
        parser = datapath.ofproto_parser  # Get parser to write commands to the switch.
        
        match = parser.OFPMatch()  # No rules specified (Meaning "ALL TRAFFIC").
        # Action: "Send the packet to the controller (me)."
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        
        # Install Priority 0 (lowest) flow rule on the switch: "Ask me about everything you don't know."
        mod = parser.OFPFlowMod(datapath=datapath, priority=0, match=match, instructions=inst)
        datapath.send_msg(mod)

    # ==========================================
    # 2. TRACK SWITCH STATES (ALIVE/DEAD)
    # ==========================================
    @set_ev_cls(ofp_event.EventOFPStateChange, [MAIN_DISPATCHER, DEAD_DISPATCHER])
    def _state_change_handler(self, ev):
        datapath = ev.datapath
        # If the switch is alive and ready for data communication, add it to the dictionary.
        if ev.state == MAIN_DISPATCHER:
            self.datapaths[datapath.id] = datapath
        # If the switch is disconnected (dead) from the network, remove it from the dictionary.
        elif ev.state == DEAD_DISPATCHER:
            if datapath.id in self.datapaths:
                del self.datapaths[datapath.id]

    # ==========================================
    # 3. INCOMING PACKET HANDLER (LEARNING AND RULE WRITING)
    # ==========================================
    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def _packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']  # Find which port the packet entered the switch from.

        pkt = packet.Packet(msg.data)  # Open the packet.
        eth = pkt.get_protocols(ethernet.ethernet)[0]  # Read the Ethernet header.
        
        # Ignore IPv6 packets (EtherType 34525) to reduce system load.
        if eth.ethertype == 34525: 
            return

        dst = eth.dst  # Destination MAC address
        src = eth.src  # Source MAC address
        dpid = datapath.id  # Switch ID
        
        # Learning Phase: Record the port for this MAC address in the dictionary.
        self.mac_to_port.setdefault(dpid, {})
        self.mac_to_port[dpid][src] = in_port

        # If destination MAC port is known, use it; otherwise, send everywhere (FLOOD).
        out_port = self.mac_to_port[dpid].get(dst, ofproto.OFPP_FLOOD)
        actions = [parser.OFPActionOutput(out_port)]

        # If destination is found (not FLOOD), install an IP-based RULE on the switch!
        if out_port != ofproto.OFPP_FLOOD:
            ipv4_pkt = pkt.get_protocol(ipv4.ipv4)
            # If it's an IPv4 (Internet) packet:
            if ipv4_pkt:
                # Match rule: Only packets from this Source IP to this Destination IP!
                match = parser.OFPMatch(eth_type=0x0800, ipv4_src=ipv4_pkt.src, ipv4_dst=ipv4_pkt.dst)
                inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
                
                # Install Priority 1 rule. The switch will handle future packets itself 
                # and start COUNTING THEM IN THE BACKGROUND!
                mod = parser.OFPFlowMod(datapath=datapath, priority=1, match=match, instructions=inst)
                datapath.send_msg(mod)

        # Physically forward this first packet to its target port.
        data = None
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data
        out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id, in_port=in_port, actions=actions, data=data)
        datapath.send_msg(out)

    # ==========================================
    # 4. STATISTICS REQUEST (RADAR) LOOP
    # ==========================================
    def _monitor(self):
        # Start infinite loop
        while True:
            # For each active switch in the network...
            for dp in self.datapaths.values():
                self._request_stats(dp)  # Request counter data.
            hub.sleep(1)  # Sleep for 1 second and ask again (Provides 1-second interval data flow).

    # Function requesting Flow statistics from the switch.
    def _request_stats(self, datapath):
        parser = datapath.ofproto_parser
        req = parser.OFPFlowStatsRequest(datapath)
        datapath.send_msg(req)

    # ==========================================
    # 5. EXECUTIONER (BLOCKING DDoS ATTACKER IP)
    # ==========================================
    def _block_ip(self, datapath, ip_to_block):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        
        # Rule: Catch packets coming from this Source IP (Attacker).
        match = parser.OFPMatch(eth_type=0x0800, ipv4_src=ip_to_block)
        # Action: EMPTY LIST ([]). In networking, no action means DROP the packet.
        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, [])]
        
        # Install the Priority 100 (HIGHEST PRIORITY) execution rule on the switch!
        mod = parser.OFPFlowMod(datapath=datapath, priority=100, match=match, instructions=inst)
        datapath.send_msg(mod)
        print(f"[🛡️ DEFENSE] Attack from IP {ip_to_block} BLOCKED!")

    # ==========================================
    # 6. AI COMMUNICATION AND FEATURE EXTRACTION
    # ==========================================
    @set_ev_cls(ofp_event.EventOFPFlowStatsReply, MAIN_DISPATCHER)
    def _flow_stats_reply_handler(self, ev):
        current_time = time.time()  # Get current time.
        datapath = ev.msg.datapath
        
        # For each flow counter coming from the switch:
        for stat in ev.msg.body:
            # Only consider IPv4 rule counters.
            if stat.match.get('eth_type') == 0x0800:
                src_ip = stat.match.get('ipv4_src')
                dst_ip = stat.match.get('ipv4_dst')
                
                # Skip if IP is missing.
                if not src_ip or not dst_ip:
                    continue

                flow_id = f"{src_ip}-{dst_ip}"  # Create flow ID (From A to B)
                curr_bytes = stat.byte_count    # CURRENT Total Bytes
                curr_pkts = stat.packet_count   # CURRENT Total Packets
                
                # Retrieve the data of this flow from ONE SECOND AGO. (Default to 0 if not found)
                prev_bytes, prev_pkts, prev_time = self.flow_stats.get(flow_id, (0, 0, current_time - 1))
                
                # DELTA CALCULATION: How much traffic occurred in the last 1 second?
                delta_bytes = curr_bytes - prev_bytes
                delta_pkts = curr_pkts - prev_pkts
                delta_time = current_time - prev_time

                # If no new packets or time is too short, skip calculation to save system resources.
                if delta_pkts <= 0 or delta_time <= 0.01:
                    continue 
                
                # THE 4 MATHEMATICAL FEATURES REQUIRED BY AI
                flow_pkts_s = delta_pkts / delta_time    # Packets per second
                flow_byts_s = delta_bytes / delta_time   # Bytes per second
                pkt_size_avg = delta_bytes / delta_pkts  # Average Packet Size
                flow_iat_mean = delta_time / delta_pkts  # Inter-arrival time (Time between packets)

                # Save current values to memory so they become "old values" in the next second.
                self.flow_stats[flow_id] = (curr_bytes, curr_pkts, current_time)

                # Prepare the JSON payload to send to the AI.
                payload = {
                    "flow_id": flow_id,
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "features": {
                        "Flow_Pkts_per_s": float(flow_pkts_s),
                        "Flow_Byts_per_s": float(flow_byts_s),
                        "Pkt_Size_Avg": float(pkt_size_avg),
                        "Flow_IAT_Mean": float(flow_iat_mean)
                    }
                }
                
                # SEND TO API!
                try:
                    # Query the Python FastAPI AI running on port 8000.
                    response = requests.post("http://127.0.0.1:8000/predict", json=payload, timeout=2)
                    if response.status_code == 200:
                        data = response.json()
                        # If AI says "DROP" (detected DDoS)...
                        if data.get("action") == "drop":
                            # Call the Executioner for that IP immediately!
                            self._block_ip(datapath, src_ip)
                except Exception as e:
                    print(f"[!] API Connection Error: {e}")
