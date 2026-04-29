const commandOutputs = {
  "systemctl status strongswan": [
    "● strongswan.service - strongSwan IPsec IKEv1/IKEv2 daemon",
    "     Loaded: loaded (/lib/systemd/system/strongswan.service; enabled; vendor preset: enabled)",
    "     Active: active (running) since Mon 2024-01-15 10:30:45 UTC; 2 days ago",
    "       Docs: man:strongswan(8)",
    "             man:ipsec(8)",
    "             man:ipsec.conf(5)",
    "    Process: 1234 ExecStart=/usr/sbin/ipsec start (code=exited, status=0/SUCCESS)",
    "   Main PID: 1256 (starter)",
    "      Tasks: 12 (limit: 4915)",
    "     Memory: 8.2M",
    "        CPU: 1.234s",
    "     CGroup: /system.slice/strongswan.service",
    "             ├─1256 /usr/lib/ipsec/starter --daemon charon",
    "             └─1278 /usr/lib/ipsec/charon"
  ],
  "ipsec statusall": [
    "Status of IKE charon daemon (strongSwan 5.9.5, Linux 5.15.0-76-generic, x86_64):",
    "  uptime: 2 days, since Jan 15 10:30:45 2024",
    "  malloc: sbrk 270336, mmap 0, used 186368, free 83968",
    "  worker threads: 11 of 16 idle, 5/0/0/0 working, job queue: 0/0/0/0, scheduled: 0",
    "  loaded plugins: charon aesni aes gcm rc2 sha2 sha1 md5 random nonce x509 revocation constraints pubkey pkcs1 pkcs7 pkcs8 pkcs12 pgp dnskey sshkey pem openssl fips-prf gmp agent xcbc hmac ctr ccm curl attr kernel-netlink resolve socket-default connmark farp dhcp forecast radix vici unity counters",
    "Listening IP addresses:",
    "  10.0.0.1",
    "  192.168.1.100",
    "Connections:",
    "    office-vpn:  192.168.1.100...203.0.113.1  IKEv2, dpddelay=30s",
    "    office-vpn:   local:  [192.168.1.100] uses pre-shared key authentication",
    "    office-vpn:   remote: [203.0.113.1] uses pre-shared key authentication",
    "    office-vpn:   child:  10.0.0.0/24 === 192.168.2.0/24 TUNNEL, dpdaction=restart",
    "Security Associations (1 up, 0 connecting):",
    "    office-vpn[1]: ESTABLISHED 2 hours ago, 192.168.1.100[192.168.1.100]...203.0.113.1[203.0.113.1]",
    "    office-vpn[1]: IKEv2 SPIs: 4b5c3d2e1f0a9b8c_i* 8c7b6a5d4e3f2c1b_r, pre-shared key reauthentication in 21 hours",
    "    office-vpn[1]: IKE proposal: AES_CBC_256/HMAC_SHA2_256_128/PRF_HMAC_SHA2_256/MODP_2048",
    "    office-vpn{1}:  INSTALLED, TUNNEL, reqid 1, ESP SPIs: c1b2a3d4e5f6_i 6f5e4d3c2b1a_o",
    "    office-vpn{1}:  AES_CBC_256/HMAC_SHA2_256_128, 123456 bytes_i (1024 pkts, 0s ago), 789012 bytes_o (2048 pkts, 0s ago), rekeying in 45 minutes",
    "    office-vpn{1}:   10.0.0.0/24 === 192.168.2.0/24"
  ],
  "ping -c 4 203.0.113.1": [
    "PING 203.0.113.1 (203.0.113.1) 56(84) bytes of data.",
    "64 bytes from 203.0.113.1: icmp_seq=1 ttl=54 time=12.3 ms",
    "64 bytes from 203.0.113.1: icmp_seq=2 ttl=54 time=11.8 ms",
    "64 bytes from 203.0.113.1: icmp_seq=3 ttl=54 time=12.1 ms",
    "64 bytes from 203.0.113.1: icmp_seq=4 ttl=54 time=11.9 ms",
    "",
    "--- 203.0.113.1 ping statistics ---",
    "4 packets transmitted, 4 received, 0% packet loss, time 3004ms",
    "rtt min/avg/max/mdev = 11.8/12.0/12.3/0.2 ms"
  ],
  "ip xfrm state list": [
    "src 192.168.1.100 dst 203.0.113.1",
    "	proto esp spi 0xc1b2a3d4 reqid 1 mode tunnel",
    "	replay-window 32 flag af-unspecified",
    "	auth-trunc hmac(sha256) 0x1234567890abcdef1234567890abcdef12345678 128",
    "	enc cbc(aes) 0xfedcba0987654321fedcba0987654321fedcba09",
    "	encap type espinudp sport 4500 dport 4500 addr 0.0.0.0",
    "	anti-replay context: seq 0x0, oseq 0x0, bitmap 0x00000000",
    "src 203.0.113.1 dst 192.168.1.100",
    "	proto esp spi 0x6f5e4d3c reqid 1 mode tunnel",
    "	replay-window 32 flag af-unspecified",
    "	auth-trunc hmac(sha256) 0xabcdef1234567890abcdef1234567890abcdef12 128",
    "	enc cbc(aes) 0x87654321fedcba0987654321fedcba098765432",
    "	encap type espinudp sport 4500 dport 4500 addr 0.0.0.0",
    "	anti-replay context: seq 0x0, oseq 0x0, bitmap 0x00000000"
  ],
  "ip xfrm policy list": [
    "src 10.0.0.0/24 dst 192.168.2.0/24",
    "	dir out priority 0 ptype main",
    "	tmpl src 192.168.1.100 dst 203.0.113.1",
    "		proto esp reqid 1 mode tunnel",
    "src 192.168.2.0/24 dst 10.0.0.0/24",
    "	dir in priority 0 ptype main",
    "	tmpl src 203.0.113.1 dst 192.168.1.100",
    "		proto esp reqid 1 mode tunnel"
  ]
};

export async function POST(request) {
  const { command } = await request.json();

  // Simulate command execution with delay
  const output = commandOutputs[command] || [
    `# ${command}`,
    "(Simulated output — run this on your actual StrongSwan host)",
    "",
    "For real troubleshooting, execute this command on the Linux system running StrongSwan."
  ];

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  return Response.json({
    command,
    output,
    timestamp: new Date().toISOString()
  });
}