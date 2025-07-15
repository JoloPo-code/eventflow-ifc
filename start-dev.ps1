# ===================================================================
# Script de Démarrage pour l'Environnement de Développement EventFlow
# Auteur: Gemini
# Description: Ce script arrête tous les processus existants et
#              relance le proxy, le backend et le frontend dans
#              des fenêtres de terminal séparées.
# Utilisation: Lancez-le depuis la racine de votre projet avec : .\start-dev.ps1
# ===================================================================

# --- Étape 1: Arrêter les anciens processus pour un redémarrage propre ---
Write-Host "Arrêt des processus node.exe et cloud-sql-proxy.exe existants..." -ForegroundColor Yellow
Get-Process -Name "node", "cloud-sql-proxy" -ErrorAction SilentlyContinue | Stop-Process -Force

# --- Étape 2: Lancer le Cloud SQL Auth Proxy ---
Write-Host "Lancement du Cloud SQL Auth Proxy..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; ./cloud-sql-proxy.exe eventflow-ifc:asia-southeast1:eventflow-ifc-db --port=5433"

# Attendre un court instant pour que le proxy s'initialise
Start-Sleep -Seconds 5

# --- Étape 3: Lancer le serveur Backend ---
Write-Host "Lancement du serveur Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; node server.js"

# Attendre un court instant pour que le backend démarre
Start-Sleep -Seconds 3

# --- Étape 4: Lancer le serveur Frontend React ---
Write-Host "Lancement de l'application React (Frontend)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
Write-Host "Environnement de développement démarré !"
Write-Host "Trois nouvelles fenêtres de terminal ont été ouvertes."
Write-Host "-----------------------------------------------------"
