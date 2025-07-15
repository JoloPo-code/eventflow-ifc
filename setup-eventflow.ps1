# ===================================================================
# Script d'Installation pour l'Environnement de Développement EventFlow
# Auteur: Gemini
# Description: Ce script installe tous les outils nécessaires pour le projet
#              en utilisant le gestionnaire de paquets Chocolatey.
#
# IMPORTANT: Ce script doit être exécuté en tant qu'Administrateur.
# ===================================================================

# --- Étape 1: Vérification et Installation de Chocolatey ---
# Chocolatey est un gestionnaire de paquets qui simplifie l'installation de logiciels.
Write-Host "Vérification de l'installation de Chocolatey..." -ForegroundColor Yellow
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Chocolatey non trouvé. Installation en cours..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
} else {
    Write-Host "Chocolatey est déjà installé." -ForegroundColor Cyan
}

# --- Étape 2: Installation des outils de développement ---
Write-Host "Installation des outils de développement nécessaires..." -ForegroundColor Yellow

# Git (pour le contrôle de version)
Write-Host "Installation de Git..." -ForegroundColor Green
choco install git -y

# Node.js (pour faire tourner React et le backend)
Write-Host "Installation de Node.js LTS..." -ForegroundColor Green
choco install nodejs-lts -y

# Google Cloud SDK (pour les commandes gcloud)
Write-Host "Installation du Google Cloud SDK..." -ForegroundColor Green
choco install gcloudsdk -y

# PostgreSQL (pour le client psql nécessaire à la connexion)
Write-Host "Installation du client PostgreSQL..." -ForegroundColor Green
choco install postgresql16 --params '/install:client' -y

# Postman (pour tester l'API)
Write-Host "Installation de Postman..." -ForegroundColor Green
choco install postman -y

# --- Étape 3: Finalisation ---
Write-Host "-----------------------------------------------------" -ForegroundColor Yellow
Write-Host "Installation terminée !" -ForegroundColor Cyan
Write-Host "IMPORTANT: Veuillez fermer et rouvrir ce terminal pour que toutes les modifications prennent effet." -ForegroundColor Yellow
Write-Host "-----------------------------------------------------"
