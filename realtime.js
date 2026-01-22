// realtime.js - Простая система обновления комнат

class RealtimeManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.updateInterval = null;
        this.updateRate = 3000; // 3 секунды
        console.log('RealtimeManager инициализирован');
    }
    
    // Начать обновление комнаты
    startRoomUpdates(roomCode) {
        this.stopUpdates();
        
        console.log(`Начато обновление комнаты: ${roomCode}`);
        
        this.updateInterval = setInterval(() => {
            this.updateRoom(roomCode);
        }, this.updateRate);
        
        // Сразу обновляем
        this.updateRoom(roomCode);
    }
    
    // Обновить данные комнаты
    updateRoom(roomCode) {
        if (!Database) return;
        
        const room = Database.findRoomByCode(roomCode);
        if (!room) {
            console.log('Комната не найдена, останавливаем обновления');
            this.stopUpdates();
            return;
        }
        
        // Обновляем UI если мы на экране комнаты
        if (this.gameManager.currentState.gameScreen === 'code') {
            this.updateRoomUI(room);
        }
        
        // Если игра началась, обновляем игровой экран
        if (room.gameState === 'playing' && this.gameManager.currentState.gameScreen === 'game') {
            this.updateGameUI(room);
        }
    }
    
    // Обновить UI комнаты
    updateRoomUI(room) {
        // Обновляем счетчик игроков
        const playerCount = document.getElementById('playerCount');
        if (playerCount) {
            playerCount.textContent = `Игроков: ${room.players.length}/${room.maxPlayers}`;
        }
        
        // Обновляем список игроков
        this.updatePlayersList(room);
        
        // Обновляем кнопку начала игры
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            const canStart = this.gameManager.currentState.isHost && 
                           room.players.length >= 2 && 
                           room.gameState === 'waiting';
            startGameBtn.style.display = canStart ? 'block' : 'none';
        }
    }
    
    // Обновить список игроков
    updatePlayersList(room) {
        const playersList = document.getElementById('playersList');
        if (!playersList) return;
        
        const currentUser = this.gameManager.currentState.user;
        
        let playersHTML = '';
        room.players.forEach(player => {
            const isCurrentUser = currentUser && player.id === currentUser.id;
            playersHTML += `
                <div class="player-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="player-avatar">${player.avatar || player.name.charAt(0).toUpperCase()}</div>
                    <div class="player-name">
                        ${player.name} ${player.isHost ? '👑' : ''}
                        ${isCurrentUser ? '<span style="color: #00f3ff; font-size: 0.8em;">(Вы)</span>' : ''}
                    </div>
                </div>
            `;
        });
        
        playersList.innerHTML = playersHTML;
    }
    
    // Обновить игровой UI
    updateGameUI(room) {
        // Обновляем таймер если есть
        if (room.questionStartTime && room.timeLimit > 0) {
            const now = Date.now();
            const elapsed = Math.floor((now - room.questionStartTime) / 1000);
            const timeLeft = Math.max(0, room.timeLimit - elapsed);
            
            const gameTimer = document.getElementById('gameTimer');
            if (gameTimer) {
                gameTimer.textContent = timeLeft;
                
                // Меняем цвет при малом времени
                if (timeLeft <= 5) {
                    gameTimer.style.color = '#ff5555';
                } else if (timeLeft <= 10) {
                    gameTimer.style.color = '#ffaa00';
                }
            }
        }
        
        // Обновляем статус игроков
        this.updateGamePlayers(room);
    }
    
    // Обновить игроков в игре
    updateGamePlayers(room) {
        const gamePlayers = document.getElementById('gamePlayers');
        if (!gamePlayers) return;
        
        let playersHTML = '';
        room.players.forEach(player => {
            playersHTML += `
                <div class="game-player">
                    <div class="game-player-avatar">${player.avatar || player.name.charAt(0).toUpperCase()}</div>
                    <div class="game-player-info">
                        <div class="game-player-name">${player.name}</div>
                        <div class="game-player-score">${player.score} очков</div>
                        <div class="game-player-status ${player.answered ? 'answered' : 'waiting'}">
                            ${player.answered ? '✓ Ответил' : '⌛ Ожидание'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        gamePlayers.innerHTML = playersHTML;
    }
    
    // Остановить обновления
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Обновления остановлены');
        }
    }
    
    // Эмуляция уведомлений от других игроков
    simulatePlayerJoin(playerName) {
        if (this.gameManager.currentState.gameScreen === 'code') {
            showNotification('Новый игрок', `${playerName} присоединился к комнате`, '#00ff9d');
        }
    }
    
    // Эмуляция начала игры
    simulateGameStart() {
        if (this.gameManager.currentState.gameScreen === 'code') {
            showNotification('Игра начинается!', 'Приготовьтесь к первому вопросу', '#00ff9d');
        }
    }
}

// Глобальный экземпляр
let realtimeManager = null;

// Инициализация по требованию
function initRealtimeManager() {
    if (!realtimeManager && window.game) {
        realtimeManager = new RealtimeManager(window.game);
        window.realtimeManager = realtimeManager;
        console.log('RealtimeManager инициализирован');
        
        // Автоматически запускаем обновление при входе в комнату
        if (window.game.currentState.roomCode) {
            setTimeout(() => {
                realtimeManager.startRoomUpdates(window.game.currentState.roomCode);
            }, 1000);
        }
    }
    return realtimeManager;
}

// Автоматическая инициализация при создании/входе в комнату
const originalCreateRoom = window.game?.createRoom;
if (originalCreateRoom) {
    window.game.createRoom = function(...args) {
        const result = originalCreateRoom.apply(this, args);
        setTimeout(() => {
            initRealtimeManager();
            if (realtimeManager) {
                realtimeManager.startRoomUpdates(this.currentState.roomCode);
            }
        }, 500);
        return result;
    };
}

const originalJoinRoom = window.game?.joinRoom;
if (originalJoinRoom) {
    window.game.joinRoom = function(...args) {
        const result = originalJoinRoom.apply(this, args);
        setTimeout(() => {
            initRealtimeManager();
            if (realtimeManager) {
                realtimeManager.startRoomUpdates(this.currentState.roomCode);
            }
        }, 500);
        return result;
    };
}

// Инициализация при загрузке если уже есть комната
document.addEventListener('DOMContentLoaded', () => {
    if (window.game && window.game.currentState.roomCode) {
        setTimeout(() => {
            initRealtimeManager();
        }, 2000);
    }
});
