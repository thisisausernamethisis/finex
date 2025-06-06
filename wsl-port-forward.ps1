# WSL Port Forwarding Script
# Run this as Administrator

param(
    [int]$Port = 3000,
    [string]$Action = "add"
)

# Get WSL IP address
$wslIp = (wsl hostname -I).Trim()

if ($Action -eq "add") {
    Write-Host "Setting up port forwarding from Windows:$Port to WSL:$Port ($wslIp)"
    netsh interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$wslIp
    
    # Add firewall rule
    New-NetFirewallRule -DisplayName "WSL Port $Port" -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    
    Write-Host "✅ Port forwarding enabled for port $Port"
    Write-Host "🌐 Access your app at: http://localhost:$Port"
} 
elseif ($Action -eq "remove") {
    Write-Host "Removing port forwarding for port $Port"
    netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0
    Remove-NetFirewallRule -DisplayName "WSL Port $Port" -ErrorAction SilentlyContinue
    Write-Host "✅ Port forwarding removed for port $Port"
}
elseif ($Action -eq "list") {
    Write-Host "Current port forwards:"
    netsh interface portproxy show all
}

# Show current WSL IP
Write-Host "`n🔍 Current WSL IP: $wslIp"
Write-Host "💡 Alternative access: http://$wslIp`:$Port" 