const commandsRef = {
  status: {
    category: "Status & Overview",
    icon: "📊",
    commands: [
      { cmd: "ipsec status", desc: "Brief tunnel status overview" },
      { cmd: "ipsec statusall", desc: "Full status: IKE SAs, child SAs, proposals" },
      { cmd: "ipsec statusall 2>/dev/null | grep -E 'ESTABLISHED|CONNECTING|INSTALLED'", desc: "Quick health check — show active/connecting tunnels" },
      { cmd: "systemctl status strongswan", desc: "StrongSwan daemon status" },
      { cmd: "ipsec verify", desc: "Verify configuration and system requirements" }
    ]
  },
  control: {
    category: "Tunnel Control",
    icon: "🎛️",
    commands: [
      { cmd: "ipsec up <CONNECTION>", desc: "Bring up a tunnel" },
      { cmd: "ipsec down <CONNECTION>", desc: "Bring down a tunnel" },
      { cmd: "ipsec restart", desc: "Restart IKE daemon (affects all tunnels)" },
      { cmd: "ipsec reload", desc: "Reload config without dropping tunnels" },
      { cmd: "ipsec rereadsecrets", desc: "Reload /etc/ipsec.secrets (PSK changes)" },
      { cmd: "ipsec rereadcerts", desc: "Reload certificates" },
      { cmd: "ipsec stroke rekey <CONNECTION>", desc: "Force SA rekey on connection" }
    ]
  },
  xfrm: {
    category: "Kernel XFRM (IPSec Core)",
    icon: "🔧",
    commands: [
      { cmd: "ip xfrm state list", desc: "Show all active IPSec SA states (SPI, enc/auth, counters)" },
      { cmd: "ip xfrm policy list", desc: "Show all IPSec policies (traffic selectors)" },
      { cmd: "ip xfrm monitor", desc: "Live stream XFRM events (SA creation, deletion)" },
      { cmd: "ip -s xfrm state list", desc: "XFRM states with byte/packet counters" },
      { cmd: "ip xfrm state flush", desc: "⚠️ Flush all SA states (breaks active tunnels)" },
      { cmd: "ip xfrm policy flush", desc: "⚠️ Flush all IPSec policies" }
    ]
  },
  firewall: {
    category: "Firewall (iptables)",
    icon: "🛡️",
    commands: [
      { cmd: "iptables -L INPUT -n -v | grep -E '500|4500|esp'", desc: "Check IKE/ESP INPUT rules" },
      { cmd: "iptables -L FORWARD -n -v", desc: "Check FORWARD rules (tunnel traffic)" },
      { cmd: "iptables -I INPUT -p udp --dport 500 -j ACCEPT", desc: "Allow IKE (UDP 500)" },
      { cmd: "iptables -I INPUT -p udp --dport 4500 -j ACCEPT", desc: "Allow NAT-T (UDP 4500)" },
      { cmd: "iptables -I INPUT -p esp -j ACCEPT", desc: "Allow ESP (Protocol 50)" },
      { cmd: "iptables -I FORWARD -i ipsec+ -j ACCEPT && iptables -I FORWARD -o ipsec+ -j ACCEPT", desc: "Allow traffic through IPSec interfaces" },
      { cmd: "ufw allow 500/udp && ufw allow 4500/udp && ufw allow esp", desc: "UFW rules for IPSec" },
      { cmd: "firewall-cmd --permanent --add-port=500/udp --add-port=4500/udp --add-protocol=esp", desc: "Firewalld rules" }
    ]
  },
  network: {
    category: "Network Diagnostics",
    icon: "🌐",
    commands: [
      { cmd: "ping -c 4 <PEER_IP>", desc: "Test reachability to peer" },
      { cmd: "traceroute <PEER_IP>", desc: "Trace path to peer" },
      { cmd: "mtr <PEER_IP>", desc: "My traceroute — continuous ping + traceroute" },
      { cmd: "nmap -sU -p 500,4500 <PEER_IP>", desc: "Check if IKE ports are open" },
      { cmd: "tcpdump -i any -n udp port 500 or udp port 4500 or esp -c 20", desc: "Capture IPSec traffic" },
      { cmd: "ip route get <PEER_IP>", desc: "Check routing to peer" },
      { cmd: "arp -n | grep <PEER_IP>", desc: "Check ARP table" }
    ]
  },
  config: {
    category: "Configuration",
    icon: "⚙️",
    commands: [
      { cmd: "cat /etc/ipsec.conf", desc: "View main IPSec configuration" },
      { cmd: "cat /etc/ipsec.secrets", desc: "View PSK/cert secrets (be careful!)" },
      { cmd: "ls -la /etc/ipsec.d/", desc: "List certificate directory" },
      { cmd: "ipsec verify", desc: "Verify configuration syntax and requirements" },
      { cmd: "strongswan --version", desc: "Check StrongSwan version" },
      { cmd: "systemctl cat strongswan", desc: "View systemd service configuration" }
    ]
  },
  logs: {
    category: "Logs & Debugging",
    icon: "📝",
    commands: [
      { cmd: "journalctl -u strongswan -n 50", desc: "Recent StrongSwan logs" },
      { cmd: "journalctl -u strongswan -f", desc: "Follow StrongSwan logs live" },
      { cmd: "ipsec stroke loglevel ike 3", desc: "Enable IKE debug logging" },
      { cmd: "ipsec stroke loglevel net 3", desc: "Enable network debug logging" },
      { cmd: "ipsec stroke loglevel all 0", desc: "Disable all debug logging" },
      { cmd: "dmesg | grep -i ipsec", desc: "Kernel IPSec messages" },
      { cmd: "tail -f /var/log/syslog | grep -i ipsec", desc: "System logs for IPSec" }
    ]
  },
  certificates: {
    category: "Certificates",
    icon: "🔐",
    commands: [
      { cmd: "openssl x509 -in /etc/ipsec.d/certs/<CERT>.pem -text", desc: "View certificate details" },
      { cmd: "openssl x509 -in /etc/ipsec.d/certs/<CERT>.pem -dates", desc: "Check certificate validity dates" },
      { cmd: "ls -la /etc/ipsec.d/certs/", desc: "List installed certificates" },
      { cmd: "ls -la /etc/ipsec.d/private/", desc: "List private keys" },
      { cmd: "ls -la /etc/ipsec.d/cacerts/", desc: "List CA certificates" },
      { cmd: "ipsec rereadcerts", desc: "Reload certificates after changes" }
    ]
  },
  performance: {
    category: "Performance & Monitoring",
    icon: "📈",
    commands: [
      { cmd: "ip -s xfrm state list", desc: "XFRM counters (bytes/packets)" },
      { cmd: "ipsec statusall | grep -E 'bytes|packets'", desc: "Traffic counters" },
      { cmd: "iperf3 -c <PEER_IP> -t 30", desc: "Throughput test" },
      { cmd: "sar -n DEV 1 10", desc: "Network interface statistics" },
      { cmd: "top -p $(pgrep -f strongswan)", desc: "StrongSwan process CPU/memory" },
      { cmd: "vmstat 1 10", desc: "System virtual memory statistics" }
    ]
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (category) {
    const cat = commandsRef[category];
    if (!cat) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }
    return Response.json(cat);
  }

  return Response.json(commandsRef);
}