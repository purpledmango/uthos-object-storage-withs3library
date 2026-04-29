# IPSec Troubleshooter - Enhanced Real Troubleshooting Guide

## New Features Added

### 🔧 Enhanced Tunnel Configuration
- **Peer IP (Private)**: Internal IP address of the remote peer
- **Remote Public IP**: Public IP address for external connectivity tests
- **Local Public IP**: Your public IP address
- **Peer ID**: IKE identity of the remote peer
- **Local ID**: IKE identity of the local system

### 🏓 Ping Test Tool
- Test connectivity to any IP address
- Useful for verifying remote subnet reachability
- Quick validation of tunnel functionality

### 📡 TCP Dump Tool
- **Interface Selection**: Choose network interface to monitor
- **Custom Filters**: Filter packets by port, protocol, or IP
- **Duration Control**: Set capture time (1-60 seconds)
- **Real-time Packet Analysis**: Monitor IKE, ESP, and other IPSec traffic

### 🔧 Additional Diagnostic Tools

#### Network Diagnostics
- **Traceroute**: Trace packet paths to identify routing issues
- **Port Scanning**: Check if IKE ports (500/4500) are open
- **System Resources**: Monitor CPU, memory, and disk usage
- **Network Interfaces**: View IP addresses and routing tables

#### Security & Firewall
- **IPTables Rules**: Check Linux firewall configuration
- **UFW Status**: Ubuntu firewall verification
- **Firewalld Rules**: Red Hat/CentOS firewall checks

#### Logs & Monitoring
- **StrongSwan Logs**: Recent daemon logs
- **Kernel IPSec Logs**: System-level IPSec messages
- **Configuration Verification**: Validate IPSec setup

This web application provides a structured approach to troubleshooting IPSec VPN issues on StrongSwan/Linux systems. For **real troubleshooting** (not simulation), follow these steps:

### Prerequisites

1. **Access to StrongSwan Host**: You need terminal access to the Linux system running StrongSwan
2. **sudo privileges**: Required for most IPsec commands
3. **Basic Linux knowledge**: Understanding of terminal commands and system administration

### Real Troubleshooting Workflow

#### 1. Access Your StrongSwan System
```bash
# SSH into your StrongSwan host
ssh user@strongswan-host

# Or use local terminal if you're on the host
```

#### 2. Use the Web Interface
1. Open the IPSec Troubleshooter in your browser
2. Fill in tunnel details (peer IP, connection name, etc.)
3. Select the appropriate issue type
4. For each troubleshooting step:
   - **Copy the command** from the interface
   - **Run it on your StrongSwan host** in a terminal
   - **Paste the actual output** back into the web interface
   - **Analyze** if it matches the expected output
   - **Apply fixes** as suggested

#### 3. Common Commands You'll Run

**Status Check:**
```bash
sudo systemctl status strongswan
sudo ipsec statusall
```

**Network Testing:**
```bash
ping -c 4 <PEER_IP>
traceroute <PEER_IP>
```

**Configuration Check:**
```bash
sudo cat /etc/ipsec.conf
sudo cat /etc/ipsec.secrets
```

**Debugging:**
```bash
sudo ipsec stroke loglevel ike 3
sudo journalctl -u strongswan -f
```

### Security Considerations

- **Never expose this tool publicly** - it contains sensitive troubleshooting information
- **Use HTTPS** in production environments
- **Limit access** to authorized network engineers only
- **Be careful with secrets** - the interface shows PSK locations but doesn't display actual secrets

### Advanced Setup (Optional)

For automated command execution, you would need to:

1. **Backend API**: Create a secure API endpoint that can SSH into target systems
2. **SSH Key Management**: Proper key-based authentication
3. **Access Controls**: Role-based permissions for different command types
4. **Audit Logging**: Log all command executions for compliance

### Troubleshooting Tips

1. **Start with basics**: Always check daemon status first
2. **Network before crypto**: Verify connectivity before diving into IKE/IPSec issues
3. **Check logs**: `journalctl -u strongswan -n 50` often reveals the root cause
4. **Configuration syntax**: Use `ipsec verify` to check for config errors
5. **Firewall rules**: Common issue - ensure UDP 500/4500 and ESP are allowed

### Export and Documentation

- Use the **Export Report** feature to save troubleshooting sessions
- Include findings, notes, and resolution steps
- Attach to tickets for documentation

### Getting Help

If you're stuck:
1. Check the command reference section
2. Review StrongSwan documentation
3. Consult with senior network engineers
4. Use the escalation features in the interface

---

**Note**: This tool is designed for L1 troubleshooting. Complex issues may require L2/L3 escalation with packet captures and deeper analysis.