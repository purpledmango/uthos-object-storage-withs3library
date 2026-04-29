const checklists = {
  tunnel_down: {
    title: "Tunnel Down / Not Establishing",
    icon: "🔴",
    description: "Use when tunnel shows DOWN or never comes up",
    steps: [
      {
        id: "td_1",
        phase: "Initial Check",
        title: "Verify IKE Daemon is Running",
        priority: "critical",
        commands: ["systemctl status strongswan", "systemctl status ipsec", "ipsec statusall"],
        expected: "Active (running) state. ipsec statusall shows loaded connections.",
        fix: "If stopped: `systemctl start strongswan` or `systemctl start ipsec`. Check `journalctl -u strongswan -n 50`",
        resolution_tag: "DAEMON_DOWN"
      },
      {
        id: "td_2",
        phase: "Initial Check",
        title: "Check Tunnel Status",
        priority: "critical",
        commands: ["ipsec status", "ipsec statusall | grep -E 'ESTABLISHED|CONNECTING|no match'"],
        expected: "Tunnel in ESTABLISHED state",
        fix: "If CONNECTING: Peer unreachable or firewall blocking. If 'no match': Check /etc/ipsec.conf peer IP and leftid/rightid.",
        resolution_tag: "STATUS_CHECK"
      },
      {
        id: "td_3",
        phase: "Network Reachability",
        title: "Ping Remote Peer (UDP/500 path)",
        priority: "critical",
        commands: [
          "ping -c 4 <REMOTE_PEER_IP>",
          "traceroute <REMOTE_PEER_IP>",
          "curl -s --max-time 3 telnet://<REMOTE_PEER_IP>:500 || echo 'UDP/500 test (use nmap)'"
        ],
        expected: "Ping responds. Traceroute reaches peer. No intermediate drops.",
        fix: "If no ping: Check routing `ip route get <PEER_IP>`. Check default gateway. If intermediate drop: ISP/transit issue — escalate.",
        resolution_tag: "PEER_UNREACHABLE"
      },
      {
        id: "td_4",
        phase: "Firewall",
        title: "Verify Firewall Rules for IKE/ESP",
        priority: "critical",
        commands: [
          "iptables -L INPUT -n -v | grep -E '500|4500|esp'",
          "iptables -L FORWARD -n -v",
          "ufw status | grep -E '500|4500'",
          "firewalld --list-all"
        ],
        expected: "UDP 500, UDP 4500, ESP protocol 50 allowed in INPUT. FORWARD allows tunnel traffic.",
        fix: "Add rules: `iptables -I INPUT -p udp --dport 500 -j ACCEPT` etc. Or configure firewalld/ufw.",
        resolution_tag: "FIREWALL_BLOCK"
      },
      {
        id: "td_5",
        phase: "Configuration",
        title: "Check IPSec Configuration",
        priority: "high",
        commands: [
          "cat /etc/ipsec.conf | grep -A 10 -B 2 '<CONNECTION>'",
          "grep -E 'left=|right=|leftid=|rightid=' /etc/ipsec.conf",
          "ipsec verify"
        ],
        expected: "Peer IPs match. IDs match certificates/PSK. No config errors from ipsec verify.",
        fix: "Correct IPs/IDs in /etc/ipsec.conf. Restart: `ipsec restart`",
        resolution_tag: "CONFIG_ERROR"
      },
      {
        id: "td_6",
        phase: "Authentication",
        title: "Verify PSK / Certificate Match",
        priority: "high",
        commands: [
          "grep '<PEER_IP>' /etc/ipsec.secrets",
          "ls -la /etc/ipsec.d/certs/ | grep '<CERT_NAME>'",
          "openssl x509 -in /etc/ipsec.d/certs/<CERT>.pem -text | grep 'Subject:'"
        ],
        expected: "PSK exists for peer. Certificate valid and matches config.",
        fix: "Update PSK in /etc/ipsec.secrets. Install correct certificate. Restart daemon.",
        resolution_tag: "AUTH_MISMATCH"
      },
      {
        id: "td_7",
        phase: "Manual Test",
        title: "Manual Tunnel Initiation",
        priority: "medium",
        commands: [
          "ipsec up <CONNECTION>",
          "ipsec statusall | grep '<CONNECTION>'",
          "journalctl -u strongswan -n 20 | grep '<CONNECTION>'"
        ],
        expected: "Tunnel establishes. Status shows ESTABLISHED. Logs show success.",
        fix: "If fails: Check logs for specific error. May need to adjust proposals or NAT-T settings.",
        resolution_tag: "MANUAL_INIT"
      }
    ]
  },
  phase1_fail: {
    title: "Phase 1 (IKE) Failures",
    icon: "🟠",
    description: "IKE SA establishment issues",
    steps: [
      {
        id: "p1_1",
        phase: "Debug",
        title: "Enable IKE Debug Logging",
        priority: "high",
        commands: [
          "ipsec stroke loglevel ike 3",
          "ipsec stroke loglevel cfg 2",
          "journalctl -u strongswan -f"
        ],
        expected: "Debug logs enabled. Journal shows IKE negotiation details.",
        fix: "Check logs for 'NO_PROPOSAL_CHOSEN', 'INVALID_ID_INFORMATION', etc.",
        resolution_tag: "IKE_DEBUG"
      },
      {
        id: "p1_2",
        phase: "Proposals",
        title: "Verify IKE Proposal Match",
        priority: "critical",
        commands: [
          "grep -E 'ike=|esp=' /etc/ipsec.conf",
          "ipsec statusall | grep 'IKE proposal:'"
        ],
        expected: "Local and remote proposals match (enc/auth/DH group).",
        fix: "Adjust ike= line in /etc/ipsec.conf to match peer. Common: aes256-sha256-modp2048",
        resolution_tag: "PROPOSAL_MISMATCH"
      },
      {
        id: "p1_3",
        phase: "Version",
        title: "IKEv1 vs IKEv2 Compatibility",
        priority: "high",
        commands: [
          "grep 'keyexchange=' /etc/ipsec.conf",
          "ipsec statusall | grep 'IKE version:'"
        ],
        expected: "Both sides using same IKE version.",
        fix: "Set keyexchange=ikev2 or ikev1 in config. Restart daemon.",
        resolution_tag: "IKE_VERSION"
      },
      {
        id: "p1_4",
        phase: "Authentication",
        title: "PSK Authentication Test",
        priority: "critical",
        commands: [
          "ipsec rereadsecrets",
          "grep '<PEER_IP>' /etc/ipsec.secrets",
          "ipsec up <CONNECTION> 2>&1 | grep -i 'auth'"
        ],
        expected: "PSK loaded. No auth errors in logs.",
        fix: "Ensure PSK matches exactly. Check for extra spaces/newlines.",
        resolution_tag: "PSK_ERROR"
      },
      {
        id: "p1_5",
        phase: "Timing",
        title: "IKE SA Lifetime & Clock Sync",
        priority: "medium",
        commands: [
          "grep 'ikelifetime=' /etc/ipsec.conf",
          "date",
          "chronyc tracking || ntpq -p"
        ],
        expected: "Lifetime reasonable (24h default). Clock synced.",
        fix: "If clock skew: Configure NTP. If lifetime issue: Adjust ikelifetime= in config.",
        resolution_tag: "TIMING_ISSUE"
      },
      {
        id: "p1_6",
        phase: "NAT",
        title: "NAT-Traversal Configuration",
        priority: "medium",
        commands: [
          "grep 'nat_traversal=' /etc/ipsec.conf",
          "iptables -t nat -L -n -v | grep '4500'",
          "ipsec statusall | grep 'NAT'"
        ],
        expected: "NAT-T enabled if behind NAT. UDP 4500 allowed.",
        fix: "Add nat_traversal=yes to config. Allow UDP 4500 in firewall.",
        resolution_tag: "NAT_TRAVERSAL"
      }
    ]
  },
  phase2_fail: {
    title: "Phase 2 (IPSec SA) Failures",
    icon: "🟡",
    description: "Child SA establishment issues",
    steps: [
      {
        id: "p2_1",
        phase: "XFRM",
        title: "Child SA / XFRM State Check",
        priority: "critical",
        commands: [
          "ip xfrm state list",
          "ip xfrm policy list",
          "ipsec statusall | grep 'INSTALLED'"
        ],
        expected: "XFRM states and policies present. Child SA installed.",
        fix: "If missing: Check Phase 1 established first. May need traffic to trigger.",
        resolution_tag: "XFRM_MISSING"
      },
      {
        id: "p2_2",
        phase: "Selectors",
        title: "Traffic Selector Verification",
        priority: "high",
        commands: [
          "grep -E 'leftsubnet=|rightsubnet=' /etc/ipsec.conf",
          "ip xfrm policy list | grep 'src\|dst'",
          "ip route show table 220"
        ],
        expected: "Subnets match between config and XFRM policies.",
        fix: "Correct leftsubnet=/rightsubnet= in config. Restart tunnel.",
        resolution_tag: "SELECTOR_MISMATCH"
      },
      {
        id: "p2_3",
        phase: "ESP",
        title: "ESP Proposal Match",
        priority: "high",
        commands: [
          "grep 'esp=' /etc/ipsec.conf",
          "ip xfrm state list | grep 'proto esp'"
        ],
        expected: "ESP proposals match (enc/auth).",
        fix: "Adjust esp= line. Common: aes256-sha256",
        resolution_tag: "ESP_PROPOSAL"
      },
      {
        id: "p2_4",
        phase: "Routing",
        title: "IPSec Route Installation",
        priority: "medium",
        commands: [
          "ip route show table 220",
          "ip rule show | grep 220",
          "ping -c 2 <REMOTE_SUBNET_IP>"
        ],
        expected: "Routes in table 220. Rule for table 220 exists. Ping works through tunnel.",
        fix: "If missing routes: Check auto=route in config. Manual: ip route add table 220...",
        resolution_tag: "ROUTE_MISSING"
      },
      {
        id: "p2_5",
        phase: "Rekey",
        title: "Child SA Rekey Issues",
        priority: "low",
        commands: [
          "grep 'lifetime=' /etc/ipsec.conf",
          "ip xfrm state list | grep 'lifetime'"
        ],
        expected: "Lifetime configured. Rekey happening automatically.",
        fix: "Adjust lifetime= in config. Force rekey: ipsec stroke rekey <conn>",
        resolution_tag: "REKEY_ISSUE"
      }
    ]
  },
  packet_loss: {
    title: "Packet Loss / Cannot Reach Remote Side",
    icon: "🔵",
    description: "Traffic not flowing through established tunnel",
    steps: [
      {
        id: "pl_1",
        phase: "Connectivity",
        title: "Basic Connectivity Test",
        priority: "critical",
        commands: [
          "ping -c 4 <REMOTE_SUBNET_IP>",
          "traceroute <REMOTE_SUBNET_IP>",
          "tcpdump -i any -n host <REMOTE_SUBNET_IP> -c 10"
        ],
        expected: "Ping responds. Traceroute shows tunnel path. TCPdump shows ESP packets.",
        fix: "If no ping: Check routes. If traceroute wrong: Routing issue. If no ESP: Tunnel not encrypting.",
        resolution_tag: "CONNECTIVITY_FAIL"
      },
      {
        id: "pl_2",
        phase: "MTU",
        title: "MTU / Fragmentation Issues",
        priority: "high",
        commands: [
          "ping -M do -s 1472 <REMOTE_SUBNET_IP>",
          "ip link show | grep mtu",
          "grep 'mtu=' /etc/ipsec.conf"
        ],
        expected: "Large ping works. MTU reasonable. DF bit handling configured.",
        fix: "If fragmentation: Reduce MTU or enable DF clearing. Add mtu=1400 to config.",
        resolution_tag: "MTU_ISSUE"
      },
      {
        id: "pl_3",
        phase: "Policies",
        title: "XFRM Policy Matching",
        priority: "high",
        commands: [
          "ip xfrm policy list",
          "ip xfrm state list | grep 'reqid'",
          "ipsec statusall | grep 'policy:'"
        ],
        expected: "Policies match traffic. Reqid matches between state/policy.",
        fix: "Check subnet configs. May need to restart tunnel after config changes.",
        resolution_tag: "POLICY_MISMATCH"
      },
      {
        id: "pl_4",
        phase: "Firewall",
        title: "Tunnel Traffic Firewall Rules",
        priority: "high",
        commands: [
          "iptables -L FORWARD -n -v | grep ipsec",
          "iptables -t nat -L -n -v",
          "ufw status verbose"
        ],
        expected: "FORWARD allows ipsec+ interface traffic. No NAT interfering.",
        fix: "Add: iptables -I FORWARD -i ipsec+ -j ACCEPT -o ipsec+ -j ACCEPT",
        resolution_tag: "FIREWALL_TUNNEL"
      },
      {
        id: "pl_5",
        phase: "DPD",
        title: "Dead Peer Detection",
        priority: "medium",
        commands: [
          "grep 'dpddelay=' /etc/ipsec.conf",
          "ipsec statusall | grep 'DPD'"
        ],
        expected: "DPD configured and active.",
        fix: "Add dpddelay=30 to config. Helps detect dead tunnels.",
        resolution_tag: "DPD_CONFIG"
      },
      {
        id: "pl_6",
        phase: "Logging",
        title: "Traffic Logging & Debug",
        priority: "low",
        commands: [
          "ipsec stroke loglevel net 3",
          "journalctl -u strongswan -f | grep -i 'drop\|reject'",
          "tcpdump -i ipsec0 -n -c 20"
        ],
        expected: "Logs show traffic flowing. No drops in kernel logs.",
        fix: "Check kernel logs for drops. May need routing or policy adjustments.",
        resolution_tag: "TRAFFIC_DEBUG"
      }
    ]
  },
  performance: {
    title: "Performance / Throughput Issues",
    icon: "⚡",
    description: "Slow or suboptimal tunnel performance",
    steps: [
      {
        id: "perf_1",
        phase: "Baseline",
        title: "Establish Performance Baseline",
        priority: "high",
        commands: [
          "iperf3 -c <REMOTE_IP> -t 10",
          "ip -s xfrm state list | grep 'bytes\|packets'",
          "ethtool <INTERFACE> | grep Speed"
        ],
        expected: "Throughput numbers. Counters increasing. Interface speed known.",
        fix: "Compare with expected speeds. Check for bottlenecks.",
        resolution_tag: "BASELINE_TEST"
      },
      {
        id: "perf_2",
        phase: "Encryption",
        title: "Encryption Overhead Check",
        priority: "medium",
        commands: [
          "grep -E 'ike=|esp=' /etc/ipsec.conf",
          "cryptsetup benchmark",
          "openssl speed -evp aes-256-gcm"
        ],
        expected: "Hardware acceleration available. AES-NI supported.",
        fix: "Use aes256gcm16 for better performance if supported.",
        resolution_tag: "ENCRYPTION_OVERHEAD"
      },
      {
        id: "perf_3",
        phase: "CPU",
        title: "CPU Utilization During Traffic",
        priority: "medium",
        commands: [
          "top -p $(pgrep -f strongswan)",
          "perf stat -p $(pgrep -f strongswan) sleep 10",
          "vmstat 1 10"
        ],
        expected: "CPU usage reasonable (<50%). No high system load.",
        fix: "If high CPU: Consider faster encryption or hardware acceleration.",
        resolution_tag: "CPU_USAGE"
      },
      {
        id: "perf_4",
        phase: "Offload",
        title: "IPSec Offload Capabilities",
        priority: "low",
        commands: [
          "ethtool -k <INTERFACE> | grep -i offload",
          "ip xfrm state list | grep 'offload'",
          "lsmod | grep -i offload"
        ],
        expected: "Offload supported and enabled if available.",
        fix: "Enable offload: ethtool -K <iface> esp-hw-offload on",
        resolution_tag: "OFFLOAD_CONFIG"
      },
      {
        id: "perf_5",
        phase: "QoS",
        title: "QoS / Traffic Shaping",
        priority: "low",
        commands: [
          "tc qdisc show",
          "iptables -t mangle -L -n -v",
          "ipsec statusall | grep 'qos'"
        ],
        expected: "No QoS interfering with IPSec traffic.",
        fix: "Check for traffic shaping rules that may throttle IPSec.",
        resolution_tag: "QOS_ISSUE"
      }
    ]
  }
};

module.exports = checklists;