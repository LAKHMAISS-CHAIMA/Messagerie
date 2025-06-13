# Script de sauvegarde pour l'application de messagerie
Write-Host "💾 Démarrage de la sauvegarde..." -ForegroundColor Green

# Configuration
$BACKUP_DIR = "C:\backups\messenger"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_PATH = Join-Path $BACKUP_DIR $DATE

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Dossier de backup créé: $BACKUP_DIR" -ForegroundColor Green
}

# Créer le dossier pour cette sauvegarde
New-Item -ItemType Directory -Force -Path $BACKUP_PATH | Out-Null
Write-Host "📁 Création du dossier de sauvegarde: $BACKUP_PATH" -ForegroundColor Yellow

# Sauvegarder MongoDB
Write-Host "🗄️ Sauvegarde de MongoDB..." -ForegroundColor Yellow
try {
    docker-compose exec -T mongodb mongodump --out /backup
    docker cp $(docker-compose ps -q mongodb):/backup "$BACKUP_PATH\mongodb"
    Write-Host "✅ Sauvegarde MongoDB terminée" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la sauvegarde MongoDB: $_" -ForegroundColor Red
}

# Sauvegarder Redis
Write-Host "🔴 Sauvegarde de Redis..." -ForegroundColor Yellow
try {
    docker-compose exec -T redis redis-cli SAVE
    docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_PATH\redis_dump.rdb"
    Write-Host "✅ Sauvegarde Redis terminée" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la sauvegarde Redis: $_" -ForegroundColor Red
}

# Sauvegarder les fichiers de configuration
Write-Host "📄 Sauvegarde des fichiers de configuration..." -ForegroundColor Yellow
try {
    Copy-Item -Path ".env" -Destination "$BACKUP_PATH\env_backup" -Force
    Copy-Item -Path "docker-compose.yml" -Destination "$BACKUP_PATH\docker-compose_backup.yml" -Force
    Copy-Item -Path "backend\nginx\nginx.conf" -Destination "$BACKUP_PATH\nginx_backup.conf" -Force
    Write-Host "✅ Sauvegarde des fichiers de configuration terminée" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la sauvegarde des fichiers de configuration: $_" -ForegroundColor Red
}

# Compresser la sauvegarde
Write-Host "🗜️ Compression de la sauvegarde..." -ForegroundColor Yellow
try {
    Compress-Archive -Path $BACKUP_PATH -DestinationPath "$BACKUP_PATH.zip" -Force
    Remove-Item -Path $BACKUP_PATH -Recurse -Force
    Write-Host "✅ Compression terminée: $BACKUP_PATH.zip" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la compression: $_" -ForegroundColor Red
}

# Nettoyer les anciennes sauvegardes (garder les 7 derniers jours)
Write-Host "🧹 Nettoyage des anciennes sauvegardes..." -ForegroundColor Yellow
$oldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
$oldBackups | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "🗑️ Suppression de l'ancienne sauvegarde: $($_.Name)" -ForegroundColor Yellow
}

Write-Host "✨ Sauvegarde terminée avec succès!" -ForegroundColor Green
Write-Host "📦 Fichier de sauvegarde: $BACKUP_PATH.zip" -ForegroundColor Cyan
Write-Host "📅 Prochaine sauvegarde recommandée: $((Get-Date).AddDays(1).ToString('yyyy-MM-dd'))" -ForegroundColor Cyan

# Créer une tâche planifiée pour les sauvegardes quotidiennes
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PWD\backup.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName "MessengerBackup" -Action $action -Trigger $trigger -Principal $principal -Settings $settings 

# Voir les logs en temps réel
docker-compose logs -f

# Voir l'état des conteneurs
docker-compose ps

# Voir les métriques
docker stats 