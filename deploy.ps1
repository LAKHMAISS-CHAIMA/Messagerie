# Script de déploiement pour l'application de messagerie
Write-Host "🚀 Démarrage du déploiement..." -ForegroundColor Green

# Vérifier si Docker est installé
try {
    docker --version | Out-Null
    Write-Host "✅ Docker est installé" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé. Veuillez installer Docker Desktop pour Windows" -ForegroundColor Red
    exit 1
}

# Vérifier si le fichier .env existe
if (-not (Test-Path .env)) {
    Write-Host "⚠️ Le fichier .env n'existe pas. Création..." -ForegroundColor Yellow
    @"
# Configuration de l'application
NODE_ENV=production
PORT=5000

# Base de données MongoDB
MONGODB_URI=mongodb://mongodb:27017/messenger

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=$(New-Guid)

# Configuration SSL
SSL_CERT_PATH=/etc/nginx/ssl/server.crt
SSL_KEY_PATH=/etc/nginx/ssl/server.key
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ Fichier .env créé" -ForegroundColor Green
}

# Vérifier si les certificats SSL existent
if (-not (Test-Path "backend\nginx\ssl\server.key") -or -not (Test-Path "backend\nginx\ssl\server.crt")) {
    Write-Host "⚠️ Certificats SSL manquants. Création..." -ForegroundColor Yellow
    
    # Créer le dossier ssl s'il n'existe pas
    if (-not (Test-Path "backend\nginx\ssl")) {
        New-Item -ItemType Directory -Force -Path "backend\nginx\ssl" | Out-Null
    }

    # Vérifier si OpenSSL est installé
    try {
        openssl version | Out-Null
    } catch {
        Write-Host "❌ OpenSSL n'est pas installé. Installation..." -ForegroundColor Red
        # Essayer d'installer OpenSSL via winget
        try {
            winget install OpenSSL
        } catch {
            Write-Host "❌ Impossible d'installer OpenSSL. Veuillez l'installer manuellement" -ForegroundColor Red
            exit 1
        }
    }

    # Générer les certificats
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "backend\nginx\ssl\server.key" -out "backend\nginx\ssl\server.crt" -subj "/CN=localhost"
    Write-Host "✅ Certificats SSL créés" -ForegroundColor Green
}

# Arrêter les conteneurs existants
Write-Host "🛑 Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker-compose down

# Nettoyer les images non utilisées
Write-Host "🧹 Nettoyage des images non utilisées..." -ForegroundColor Yellow
docker system prune -f

# Reconstruire et démarrer les conteneurs
Write-Host "🏗️ Construction et démarrage des conteneurs..." -ForegroundColor Yellow
docker-compose up -d --build

# Vérifier que les conteneurs sont en cours d'exécution
Write-Host "🔍 Vérification des conteneurs..." -ForegroundColor Yellow
$containers = docker-compose ps -q
$running = docker ps -q

if ($containers.Count -eq $running.Count) {
    Write-Host "✅ Tous les conteneurs sont en cours d'exécution" -ForegroundColor Green
} else {
    Write-Host "❌ Certains conteneurs ne sont pas démarrés" -ForegroundColor Red
    docker-compose ps
    exit 1
}

# Vérifier les logs pour les erreurs
Write-Host "📋 Vérification des logs..." -ForegroundColor Yellow
$logs = docker-compose logs --tail=50
if ($logs -match "error|Error|ERROR") {
    Write-Host "⚠️ Des erreurs ont été détectées dans les logs" -ForegroundColor Yellow
    Write-Host $logs
} else {
    Write-Host "✅ Aucune erreur détectée dans les logs" -ForegroundColor Green
}

Write-Host "✨ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "🌐 L'application est accessible sur https://localhost" -ForegroundColor Cyan
Write-Host "📝 Pour voir les logs en temps réel: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "🛑 Pour arrêter l'application: docker-compose down" -ForegroundColor Cyan 