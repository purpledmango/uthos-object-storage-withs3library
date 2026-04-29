const resolutionCodes = {
  DAEMON_DOWN: { code: "RES-001", title: "Daemon Not Running", escalate: false },
  STATUS_CHECK: { code: "RES-002", title: "Status Mismatch / No Config Match", escalate: false },
  PEER_UNREACHABLE: { code: "RES-003", title: "Peer IP Unreachable", escalate: true },
  FIREWALL_BLOCK: { code: "RES-004", title: "Firewall Blocking IKE/ESP", escalate: false },
  CONFIG_MISMATCH: { code: "RES-005", title: "Configuration Mismatch", escalate: false },
  AUTH_FAIL: { code: "RES-006", title: "Authentication Failure (PSK/Cert)", escalate: false },
  IKE_DEBUG: { code: "RES-007", title: "IKE Debug Required", escalate: false },
  IKE_PROPOSAL: { code: "RES-008", title: "IKE Proposal Mismatch", escalate: false },
  IKE_VERSION: { code: "RES-009", title: "IKE Version Mismatch", escalate: false },
  PSK_MISMATCH: { code: "RES-010", title: "Pre-Shared Key Mismatch", escalate: false },
  CLOCK_SKEW: { code: "RES-011", title: "Clock Skew / NTP Issue", escalate: false },
  NAT_T_ISSUE: { code: "RES-012", title: "NAT-Traversal Issue", escalate: false },
  SA_STATE: { code: "RES-013", title: "Child SA Not Installing", escalate: false },
  TS_MISMATCH: { code: "RES-014", title: "Traffic Selector Mismatch", escalate: false },
  ESP_PROPOSAL: { code: "RES-015", title: "ESP Proposal Mismatch", escalate: false },
  ROUTING: { code: "RES-016", title: "Missing/Incorrect Route", escalate: false },
  SA_LIFETIME: { code: "RES-017", title: "SA Lifetime Mismatch", escalate: false },
  PING_TEST: { code: "RES-018", title: "Packet Loss Through Tunnel", escalate: false },
  MTU_FIX: { code: "RES-019", title: "MTU/Fragmentation Issue", escalate: false },
  PACKET_CAPTURE: { code: "RES-020", title: "Asymmetric Traffic / ESP Drop", escalate: true },
  ASYMMETRIC_ROUTE: { code: "RES-021", title: "Asymmetric Routing", escalate: false },
  FORWARD_RULES: { code: "RES-022", title: "FORWARD Chain Blocking Traffic", escalate: false },
  IFACE_ERRORS: { code: "RES-023", title: "Interface Errors / Physical Issue", escalate: true },
  THROUGHPUT_TEST: { code: "RES-024", title: "Low Throughput Baseline", escalate: false },
  CPU_OFFLOAD: { code: "RES-025", title: "High CPU / No Hardware Crypto", escalate: false },
  MTU_PERF: { code: "RES-026", title: "MTU Causing Fragmentation/Performance", escalate: false },
  CIPHER_OPTIMIZE: { code: "RES-027", title: "Suboptimal Cipher Suite", escalate: false },
  LIVE_MONITOR: { code: "RES-028", title: "SA Counter Stuck", escalate: true },
  MANUAL_UP: { code: "RES-029", title: "Manual UP Required", escalate: false }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'escalation-list') {
    const escalate = Object.entries(resolutionCodes)
      .filter(([, v]) => v.escalate)
      .map(([tag, v]) => ({ tag, ...v }));
    return Response.json({ escalate });
  }

  return Response.json(resolutionCodes);
}