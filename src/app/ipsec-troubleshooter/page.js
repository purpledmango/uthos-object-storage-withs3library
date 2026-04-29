'use client';

import { useState, useEffect, useRef } from 'react';

export default function IPsecTroubleshooter() {
  const [checklists, setChecklists] = useState({});
  const [commands, setCommands] = useState({});
  const [diagnostics, setDiagnostics] = useState({});
  const [selectedIssue, setSelectedIssue] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [commandOutputs, setCommandOutputs] = useState({});
  const [manualMode, setManualMode] = useState(true);
  const [sshConfig, setSshConfig] = useState({
    host: '',
    username: '',
    keyPath: ''
  });
  const [notes, setNotes] = useState('');
  const [findings, setFindings] = useState([]);
  const [tunnelDetails, setTunnelDetails] = useState({
    ticketNumber: '',
    peerIP: '',
    connectionName: '',
    localIP: '',
    remoteSubnet: '',
    localSubnet: ''
  });

  useEffect(() => {
    // Load data from APIs
    fetch('/api/checklist')
      .then(res => res.json())
      .then(setChecklists);

    fetch('/api/commands')
      .then(res => res.json())
      .then(setCommands);

    fetch('/api/diagnostics')
      .then(res => res.json())
      .then(setDiagnostics);
  }, []);

  const runCommand = async (command) => {
    const processedCommand = command
      .replace('<REMOTE_PEER_IP>', tunnelDetails.peerIP || '<REMOTE_PEER_IP>')
      .replace('<REMOTE_PUBLIC_IP>', tunnelDetails.remotePublicIP || '<REMOTE_PUBLIC_IP>')
      .replace('<LOCAL_PUBLIC_IP>', tunnelDetails.localPublicIP || '<LOCAL_PUBLIC_IP>')
      .replace('<CONNECTION>', tunnelDetails.connectionName || '<CONNECTION>')
      .replace('<PEER_IP>', tunnelDetails.peerIP || '<PEER_IP>')
      .replace('<LOCAL_IP>', tunnelDetails.localIP || '<LOCAL_IP>')
      .replace('<REMOTE_SUBNET_IP>', tunnelDetails.remoteSubnet?.split('/')[0] || '<REMOTE_SUBNET_IP>')
      .replace('<PEER_ID>', tunnelDetails.peerId || '<PEER_ID>')
      .replace('<LOCAL_ID>', tunnelDetails.localId || '<LOCAL_ID>');

    if (manualMode) {
      // In manual mode, just prepare the command for display
      setCommandOutputs(prev => ({
        ...prev,
        [command]: prev[command] || `Run this command on your StrongSwan host:\n\n${processedCommand}\n\nThen paste the output above.`
      }));
      return;
    }

    try {
      const response = await fetch('/api/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: processedCommand })
      });
      const result = await response.json();
      setCommandOutputs(prev => ({
        ...prev,
        [command]: Array.isArray(result.output) ? result.output.join('\n') : result.output
      }));
    } catch (error) {
      setCommandOutputs(prev => ({
        ...prev,
        [command]: `Error executing command: ${error.message}`
      }));
    }
  };

  const addFinding = (step, action, result) => {
    setFindings(prev => [...prev, {
      timestamp: new Date().toISOString(),
      step: step.title,
      action,
      result
    }]);
  };

  const exportReport = () => {
    const report = {
      ticketNumber: tunnelDetails.ticketNumber,
      timestamp: new Date().toISOString(),
      tunnelDetails,
      issue: selectedIssue,
      findings,
      notes,
      completedSteps: currentStep
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipsec-troubleshoot-${tunnelDetails.ticketNumber || 'report'}.json`;
    a.click();
  };

  const currentChecklist = checklists[selectedIssue];
  const steps = currentChecklist?.steps || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">
              🔐
            </div>
            <div>
              <h1 className="text-2xl font-bold">IPSec Troubleshooter</h1>
              <p className="text-gray-400">L1 Engineer Console</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setManualMode(!manualMode)}
              className={`px-4 py-2 rounded-lg ${manualMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {manualMode ? '🔧 Manual Mode' : '🤖 Auto Mode'}
            </button>
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              📄 Export Report
            </button>
          </div>
        </div>

        {/* SSH Configuration */}
        {!manualMode && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">🔑 SSH Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Host/IP (e.g., 192.168.1.100)"
                value={sshConfig.host}
                onChange={(e) => setSshConfig(prev => ({ ...prev, host: e.target.value }))}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Username"
                value={sshConfig.username}
                onChange={(e) => setSshConfig(prev => ({ ...prev, username: e.target.value }))}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="SSH Key Path (optional)"
                value={sshConfig.keyPath}
                onChange={(e) => setSshConfig(prev => ({ ...prev, keyPath: e.target.value }))}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>⚠️ Security Notice:</strong> SSH execution requires server-side implementation.
                Currently, this feature is not implemented. Use Manual Mode for real troubleshooting.
              </p>
            </div>
          </div>
        )}

        {/* Manual Mode Instructions */}
        {manualMode && (
          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-400">📋 Manual Troubleshooting Mode</h2>
            <div className="space-y-4 text-sm">
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-semibold text-blue-300 mb-2">How to Use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li>Run the suggested commands on your StrongSwan Linux host</li>
                  <li>Copy the actual output and paste it in the "Command Output" field</li>
                  <li>Mark steps as resolved, skipped, or escalate as needed</li>
                  <li>Use the findings log to track your progress</li>
                </ol>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-semibold text-green-300 mb-2">Prerequisites:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>Access to the Linux system running StrongSwan</li>
                  <li>sudo privileges for IPsec commands</li>
                  <li>Terminal access (SSH or local console)</li>
                  <li>Basic Linux command knowledge</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tunnel Details */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tunnel Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Ticket Number"
              value={tunnelDetails.ticketNumber}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, ticketNumber: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Connection Name"
              value={tunnelDetails.connectionName}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, connectionName: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Peer IP (Private)"
              value={tunnelDetails.peerIP}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, peerIP: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Remote Public IP"
              value={tunnelDetails.remotePublicIP}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, remotePublicIP: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Local IP (Private)"
              value={tunnelDetails.localIP}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, localIP: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Local Public IP"
              value={tunnelDetails.localPublicIP}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, localPublicIP: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Remote Subnet"
              value={tunnelDetails.remoteSubnet}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, remoteSubnet: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Local Subnet"
              value={tunnelDetails.localSubnet}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, localSubnet: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Peer ID"
              value={tunnelDetails.peerId}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, peerId: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Local ID"
              value={tunnelDetails.localId}
              onChange={(e) => setTunnelDetails(prev => ({ ...prev, localId: e.target.value }))}
              className="px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Command Reference */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📚 Command Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(commands).map(([category, data]) => (
              <div key={category} className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <span>{data.icon}</span>
                  {data.category}
                </h3>
                <div className="space-y-1">
                  {data.commands?.slice(0, 3).map((cmd, i) => (
                    <div key={i} className="text-xs text-gray-300">
                      <code className="bg-gray-600 px-1 py-0.5 rounded text-xs">{cmd.cmd.split(' ')[0]}</code>
                      <span className="ml-1">{cmd.desc}</span>
                    </div>
                  ))}
                  {data.commands?.length > 3 && (
                    <div className="text-xs text-gray-400">... and {data.commands.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ping Test Tool */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🏓 Ping Test Tool</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="IP to ping (e.g., remote subnet IP)"
                value={pingTest.targetIP}
                onChange={(e) => setPingTest(prev => ({ ...prev, targetIP: e.target.value }))}
                className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={async () => {
                  if (!pingTest.targetIP) return;
                  setPingTest(prev => ({ ...prev, isRunning: true, results: null }));
                  try {
                    const response = await fetch('/api/run-command', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ command: `ping -c 4 ${pingTest.targetIP}` })
                    });
                    const result = await response.json();
                    setPingTest(prev => ({
                      ...prev,
                      results: Array.isArray(result.output) ? result.output.join('\n') : result.output,
                      isRunning: false
                    }));
                  } catch (error) {
                    setPingTest(prev => ({
                      ...prev,
                      results: `Error: ${error.message}`,
                      isRunning: false
                    }));
                  }
                }}
                disabled={pingTest.isRunning || !pingTest.targetIP}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
              >
                {pingTest.isRunning ? 'Pinging...' : 'Ping'}
              </button>
            </div>
            {pingTest.results && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-green-300 mb-2">Ping Results:</h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {pingTest.results}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Additional Diagnostic Tools */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🔧 Additional Diagnostic Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
                <span>🗺️</span>
                Traceroute
              </h3>
              <input
                type="text"
                placeholder="Target IP"
                className="w-full px-3 py-2 bg-gray-600 rounded border border-gray-500 focus:border-orange-500 focus:outline-none mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    runCommand(`traceroute ${e.target.value}`);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Target IP"]');
                  if (input?.value) {
                    runCommand(`traceroute ${input.value}`);
                    input.value = '';
                  }
                }}
                className="w-full px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
              >
                Run Traceroute
              </button>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                <span>🔍</span>
                Port Scan
              </h3>
              <input
                type="text"
                placeholder="Target IP"
                className="w-full px-3 py-2 bg-gray-600 rounded border border-gray-500 focus:border-red-500 focus:outline-none mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    runCommand(`nmap -sU -p 500,4500 ${e.target.value}`);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Target IP"]');
                  if (input?.value) {
                    runCommand(`nmap -sU -p 500,4500 ${input.value}`);
                    input.value = '';
                  }
                }}
                className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Scan IKE Ports
              </button>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                <span>📊</span>
                System Resources
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => runCommand('top -b -n 1 | head -20')}
                  className="w-full px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  CPU/Memory Usage
                </button>
                <button
                  onClick={() => runCommand('df -h')}
                  className="w-full px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  Disk Usage
                </button>
                <button
                  onClick={() => runCommand('free -h')}
                  className="w-full px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  Memory Info
                </button>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                <span>🌐</span>
                Network Interfaces
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => runCommand('ip addr show')}
                  className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  IP Addresses
                </button>
                <button
                  onClick={() => runCommand('ip route show')}
                  className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Routing Table
                </button>
                <button
                  onClick={() => runCommand('netstat -tuln')}
                  className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Listening Ports
                </button>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                <span>🔥</span>
                Firewall Check
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => runCommand('iptables -L -n -v')}
                  className="w-full px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                >
                  IPTables Rules
                </button>
                <button
                  onClick={() => runCommand('ufw status verbose')}
                  className="w-full px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                >
                  UFW Status
                </button>
                <button
                  onClick={() => runCommand('firewall-cmd --list-all')}
                  className="w-full px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                >
                  Firewalld Rules
                </button>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <span>📝</span>
                Logs & Debug
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => runCommand('journalctl -u strongswan -n 20')}
                  className="w-full px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  StrongSwan Logs
                </button>
                <button
                  onClick={() => runCommand('dmesg | grep -i ipsec | tail -10')}
                  className="w-full px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  Kernel IPSec Logs
                </button>
                <button
                  onClick={() => runCommand('ipsec verify')}
                  className="w-full px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  Config Verification
                </button>
              </div>
            </div>
          </div>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(checklists).map(([key, checklist]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedIssue(key);
                  setCurrentStep(0);
                }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedIssue === key
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">{checklist.icon}</div>
                <div className="font-semibold">{checklist.title}</div>
                <div className="text-sm text-gray-400">{checklist.steps?.length || 0} steps</div>
              </button>
            ))}
          </div>
        </div>

        {/* Troubleshooting Steps */}
        {selectedIssue && steps.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {currentChecklist.icon} {currentChecklist.title}
              </h2>
              <div className="text-sm text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`border-l-4 pl-4 ${
                    index < currentStep ? 'border-green-500' :
                    index === currentStep ? 'border-blue-500' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      step.priority === 'critical' ? 'bg-red-600' :
                      step.priority === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                    }`}>
                      {step.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">{step.phase}</span>
                  </div>

                  <h3 className="font-semibold mb-2">{step.title}</h3>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Commands to Run:</h4>
                    <div className="space-y-2">
                      {step.commands.map((cmd, cmdIndex) => (
                        <div key={cmdIndex} className="flex items-center gap-2">
                          <code className="flex-1 bg-gray-700 p-2 rounded font-mono text-sm">
                            {cmd.replace('<REMOTE_PEER_IP>', tunnelDetails.peerIP || '<REMOTE_PEER_IP>')
                                .replace('<CONNECTION>', tunnelDetails.connectionName || '<CONNECTION>')
                                .replace('<PEER_IP>', tunnelDetails.peerIP || '<PEER_IP>')
                                .replace('<REMOTE_SUBNET_IP>', tunnelDetails.remoteSubnet?.split('/')[0] || '<REMOTE_SUBNET_IP>')}
                          </code>
                          <button
                            onClick={() => runCommand(cmd)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          >
                            Run
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {step.expected && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Expected Output:</h4>
                      <div className="bg-gray-700 p-3 rounded font-mono text-sm text-green-300">
                        {step.expected}
                      </div>
                    </div>
                  )}

                  {step.fix && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">Fix / Resolution:</h4>
                      <div className="bg-gray-700 p-3 rounded font-mono text-sm text-blue-300">
                        {step.fix}
                      </div>
                    </div>
                  )}

                  {/* Manual Command Output Input */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                      Command Output {manualMode ? '(Paste actual output here)' : '(Simulated)'}:
                    </h4>
                    <textarea
                      value={commandOutputs[step.commands[0]] || ''}
                      onChange={(e) => setCommandOutputs(prev => ({
                        ...prev,
                        [step.commands[0]]: e.target.value
                      }))}
                      placeholder={manualMode ? "Paste the actual command output from your terminal here..." : "Simulated output will appear here..."}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-3 font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
                      rows={6}
                    />
                    {!manualMode && commandOutputs[step.commands[0]] && (
                      <div className="mt-2 text-xs text-gray-400">
                        Simulated output loaded. In real troubleshooting, run this command on your StrongSwan host.
                      </div>
                    )}
                  </div>

                  {index === currentStep && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          addFinding(step, 'Resolved', 'Issue fixed');
                          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                      >
                        ✅ Resolved
                      </button>
                      <button
                        onClick={() => {
                          addFinding(step, 'Skipped', 'Step skipped');
                          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                      >
                        ⏭️ Skip
                      </button>
                      <button
                        onClick={() => {
                          addFinding(step, 'Escalated', 'Requires escalation');
                          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                      >
                        🚨 Escalate
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Findings Log */}
        {findings.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">📋 Findings Log</h2>
            <div className="space-y-2">
              {findings.map((finding, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded text-sm">
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>{finding.step}</span>
                    <span>{new Date(finding.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div>{finding.action}: {finding.result}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engineer Notes */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📝 Engineer Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your troubleshooting notes here..."
            className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-3 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}