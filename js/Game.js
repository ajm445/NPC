class Game {
    constructor() {
        this.engine = null;
        this.player = null;
        this.environment = null;
        this.npcManager = null;
        this.inventory = null;
        this.smartCamera = null;
        this.isInitialized = false;
        this.gameState = 'loading';
        this.currentNPC = null;
        this.gameTime = 0;
        
        // 교환 시스템 관련
        this.tradeSystem = null;
        this.selectedPlayerItems = [];
        this.selectedNPCItems = [];
        
        // 게임 설정
        this.settings = {
            autoSave: true,
            autoSaveInterval: 30000, // 30초마다 자동 저장
            soundEnabled: true,
            musicEnabled: true
        };
        
        // 전역 참조
        window.game = this;
        window.inventory = null;
    }
    
    init() {
        try {
            console.log('게임 초기화 시작...');
            
            // 게임 엔진 초기화
            this.engine = new GameEngine();
            
            // 인벤토리 시스템 초기화
            this.inventory = new Inventory();
            window.inventory = this.inventory;
            
            // 플레이어 초기화
            this.player = new Player(this.engine);
            
            // 플레이어 모델 생성 확인
            setTimeout(() => {
                if (!this.player.model) {
                    console.warn('플레이어 모델이 생성되지 않았습니다. 강제 생성을 시도합니다.');
                    this.player.createFallbackModel();
                }
                console.log('플레이어 모델 상태:', this.player.model ? '생성됨' : '생성되지 않음');
            }, 500);
            
            // 환경 초기화
            this.environment = new Environment(this.engine);
            
            // NPC 매니저 초기화 (스마트 NPC 사용)
            this.npcManager = new SmartNPCManager(this.engine);
            this.npcManager.init();
            
            // 스마트 카메라 초기화
            this.smartCamera = new SmartCamera(this.engine.camera, this.player);
            
            // NPC들에게 플레이어 참조 전달
            this.npcManager.setPlayer(this.player);
            
            // 교환 시스템 초기화
            this.tradeSystem = new TradeSystem(this.inventory);
            
            // 게임 루프 시작
            this.startGameLoop();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 데이터 로드
            this.loadGameData();
            
            this.gameState = 'playing';
            this.isInitialized = true;
            
            console.log('게임 초기화 완료!');
            
        } catch (error) {
            console.error('게임 초기화 실패:', error);
            this.gameState = 'error';
        }
    }
    
    setupEventListeners() {
        // 윈도우 언로드 시 자동 저장
        window.addEventListener('beforeunload', () => {
            this.saveGameData();
        });
        
        // 대화 시스템
        window.closeDialog = () => {
            this.closeDialog();
        };
        
        window.handleDialogAction = () => {
            this.handleDialogAction();
        };
        
        // 교환 시스템
        window.closeTradeModal = () => {
            this.closeTradeModal();
        };
        
        window.executeTrade = () => {
            this.executeTrade();
        };
        
        // 키보드 이벤트
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (!this.isInitialized) return;
            
            try {
                const deltaTime = this.engine.clock.getDelta();
                this.gameTime += deltaTime;
                
                // 게임 업데이트
                this.update(deltaTime);
                
                // 렌더링
                this.engine.update();
                
                // 자동 저장
                if (this.settings.autoSave && this.gameTime % this.settings.autoSaveInterval < deltaTime) {
                    this.saveGameData();
                }
                
            } catch (error) {
                console.error('게임 루프 오류:', error);
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // 플레이어 업데이트
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // 환경 업데이트
        if (this.environment) {
            this.environment.update(deltaTime);
        }
        
        // NPC 업데이트
        if (this.npcManager) {
            this.npcManager.update(deltaTime);
        }
        
        // 스마트 카메라 업데이트
        if (this.smartCamera) {
            this.smartCamera.update(deltaTime, this.npcManager.getNPCs());
        }
        
        // 수집 가능한 아이템 확인
        this.checkCollectibles();
    }
    
    checkCollectibles() {
        if (!this.player || !this.environment) return;
        
        const playerPos = this.player.getPosition();
        const collectible = this.environment.getCollectibleAt(playerPos, 2);
        
        if (collectible) {
            const item = collectible.item;
            if (item.userData && item.userData.collectible) {
                let itemName = '';
                
                if (item.userData.type === 'fruit') {
                    itemName = item.userData.fruitType;
                } else if (item.userData.type === 'mushroom') {
                    itemName = item.userData.mushroomType;
                } else {
                    itemName = item.userData.type;
                }
                
                if (this.inventory.addItem(itemName, 1)) {
                    this.environment.removeCollectible(collectible.index);
                }
            }
        }
    }
    
    handlePlayerInteraction(playerPosition, interactionDistance) {
        // NPC 상호작용
        const npc = this.npcManager.handlePlayerInteraction(playerPosition, interactionDistance);
        if (npc) {
            this.currentNPC = npc;
            return;
        }
        
        // 건물 상호작용
        const building = this.environment.getBuildingAt(playerPosition, interactionDistance);
        if (building) {
            this.handleBuildingInteraction(building);
            return;
        }
        
        // 수집 가능한 아이템 상호작용
        const collectible = this.environment.getCollectibleAt(playerPosition, interactionDistance);
        if (collectible) {
            this.handleCollectibleInteraction(collectible);
        }
    }
    
    handleBuildingInteraction(building) {
        if (!building.userData) return;
        
        switch (building.userData.type) {
            case 'house':
                this.showDialog('집', '편안한 집이네요. 휴식하고 싶으시면 언제든지 들어오세요!');
                break;
            case 'shop':
                this.showDialog('상점', '상점에 오신 것을 환영합니다! 다양한 물건을 사고 팔 수 있어요.');
                break;
            case 'storage':
                this.inventory.toggleStorageModal();
                break;
        }
    }
    
    handleCollectibleInteraction(collectible) {
        const item = collectible.item;
        if (item.userData && item.userData.collectible) {
            let itemName = '';
            
            if (item.userData.type === 'fruit') {
                itemName = item.userData.fruitType;
            } else if (item.userData.type === 'mushroom') {
                itemName = item.userData.mushroomType;
            } else {
                itemName = item.userData.type;
            }
            
            if (this.inventory.addItem(itemName, 1)) {
                this.environment.removeCollectible(collectible.index);
            }
        }
    }
    
    showDialog(speaker, content, actions = null) {
        const dialogBox = document.getElementById('dialogBox');
        const speakerElement = document.querySelector('#dialogBox .speaker');
        const contentElement = document.querySelector('#dialogBox .content');
        
        speakerElement.textContent = speaker;
        contentElement.textContent = content;
        dialogBox.style.display = 'block';
        
        if (actions) {
            const actionsElement = document.querySelector('#dialogBox .actions');
            actionsElement.innerHTML = '';
            actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.text;
                button.className = action.class || 'secondary';
                button.onclick = action.callback;
                actionsElement.appendChild(button);
            });
        }
    }
    
    closeDialog() {
        const dialogBox = document.getElementById('dialogBox');
        dialogBox.style.display = 'none';
        
        if (this.currentNPC) {
            this.currentNPC.endInteraction();
            this.currentNPC = null;
        }
    }
    
    handleDialogAction() {
        if (this.currentNPC && this.currentNPC.canTrade()) {
            this.openTradeModal();
        } else {
            this.closeDialog();
        }
    }
    
    openTradeModal() {
        const tradeModal = document.getElementById('tradeModal');
        tradeModal.style.display = 'block';
        
        this.updateTradeModal();
    }
    
    updateTradeModal() {
        const playerTradeItems = document.getElementById('playerTradeItems');
        const npcTradeItems = document.getElementById('npcTradeItems');
        
        if (!playerTradeItems || !npcTradeItems || !this.currentNPC) return;
        
        // 플레이어 아이템 표시
        playerTradeItems.innerHTML = '';
        const playerItems = this.inventory.getItems();
        
        Object.keys(playerItems).forEach(itemName => {
            const quantity = playerItems[itemName];
            const itemInfo = this.inventory.itemTypes[itemName];
            
            if (itemInfo) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'trade-item';
                itemDiv.innerHTML = `
                    <div class="trade-item-icon">${itemInfo.emoji}</div>
                    <div class="trade-item-name">${itemName}</div>
                    <div class="trade-item-count">${quantity}</div>
                `;
                
                itemDiv.addEventListener('click', () => {
                    this.togglePlayerTradeItem(itemName, itemDiv);
                });
                
                playerTradeItems.appendChild(itemDiv);
            }
        });
        
        // NPC 아이템 표시
        npcTradeItems.innerHTML = '';
        const npcItems = this.currentNPC.getTradeItems();
        
        npcItems.forEach(itemName => {
            const itemInfo = this.inventory.itemTypes[itemName];
            
            if (itemInfo) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'trade-item';
                itemDiv.innerHTML = `
                    <div class="trade-item-icon">${itemInfo.emoji}</div>
                    <div class="trade-item-name">${itemName}</div>
                    <div class="trade-item-count">1</div>
                `;
                
                itemDiv.addEventListener('click', () => {
                    this.toggleNPCTradeItem(itemName, itemDiv);
                });
                
                npcTradeItems.appendChild(itemDiv);
            }
        });
    }
    
    togglePlayerTradeItem(itemName, element) {
        const index = this.selectedPlayerItems.indexOf(itemName);
        
        if (index > -1) {
            this.selectedPlayerItems.splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.selectedPlayerItems.push(itemName);
            element.classList.add('selected');
        }
    }
    
    toggleNPCTradeItem(itemName, element) {
        const index = this.selectedNPCItems.indexOf(itemName);
        
        if (index > -1) {
            this.selectedNPCItems.splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.selectedNPCItems.push(itemName);
            element.classList.add('selected');
        }
    }
    
    executeTrade() {
        if (this.selectedPlayerItems.length === 0 || this.selectedNPCItems.length === 0) {
            this.inventory.showMessage('교환할 아이템을 선택해주세요!', 'error');
            return;
        }
        
        // 플레이어가 아이템을 가지고 있는지 확인
        for (const itemName of this.selectedPlayerItems) {
            if (!this.inventory.hasItem(itemName)) {
                this.inventory.showMessage(`${itemName}이(가) 부족합니다!`, 'error');
                return;
            }
        }
        
        // 교환 실행
        try {
            // 플레이어 아이템 제거
            this.selectedPlayerItems.forEach(itemName => {
                this.inventory.removeItem(itemName, 1);
            });
            
            // NPC 아이템 추가
            this.selectedNPCItems.forEach(itemName => {
                this.inventory.addItem(itemName, 1);
            });
            
            this.inventory.showMessage('교환이 완료되었습니다!', 'success');
            
            // NPC 반응
            if (this.currentNPC) {
                this.currentNPC.showSpeechBubble('고마워요! 좋은 거래였어요!');
                this.currentNPC.animationCallbacks.happy();
            }
            
            // 교환 완료 후 정리
            this.selectedPlayerItems = [];
            this.selectedNPCItems = [];
            this.closeTradeModal();
            
        } catch (error) {
            console.error('교환 실행 오류:', error);
            this.inventory.showMessage('교환 중 오류가 발생했습니다!', 'error');
        }
    }
    
    closeTradeModal() {
        const tradeModal = document.getElementById('tradeModal');
        tradeModal.style.display = 'none';
        
        this.selectedPlayerItems = [];
        this.selectedNPCItems = [];
        
        this.closeDialog();
    }
    
    closeAllModals() {
        const modals = ['dialogBox', 'tradeModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
        
        if (this.inventory) {
            this.inventory.closeAllModals();
        }
        
        if (this.currentNPC) {
            this.currentNPC.endInteraction();
            this.currentNPC = null;
        }
    }
    
    saveGameData() {
        try {
            const gameData = {
                playerPosition: this.player ? this.player.getPosition() : { x: 0, y: 0, z: 0 },
                playerRotation: this.player ? this.player.getRotation() : { x: 0, y: 0, z: 0 },
                gameTime: this.gameTime,
                settings: this.settings,
                timestamp: Date.now()
            };
            
            localStorage.setItem('animalCrossingGame', JSON.stringify(gameData));
            
            if (this.inventory) {
                this.inventory.saveToLocalStorage();
            }
            
            console.log('게임 데이터 저장 완료');
            
        } catch (error) {
            console.error('게임 데이터 저장 실패:', error);
        }
    }
    
    loadGameData() {
        try {
            const gameData = localStorage.getItem('animalCrossingGame');
            if (gameData) {
                const parsed = JSON.parse(gameData);
                
                // 플레이어 위치는 항상 높은 곳으로 시작 (디버깅용)
                if (this.player) {
                    this.player.setPosition(0, 10, 0);
                    console.log('플레이어 위치를 높은 곳으로 강제 설정 (Y=10)');
                }
                
                // 플레이어 회전 복원
                if (this.player && parsed.playerRotation) {
                    this.player.setRotation(
                        parsed.playerRotation.x,
                        parsed.playerRotation.y,
                        parsed.playerRotation.z
                    );
                }
                
                // 게임 시간 복원
                this.gameTime = parsed.gameTime || 0;
                
                // 설정 복원
                this.settings = { ...this.settings, ...parsed.settings };
                
                console.log('게임 데이터 로드 완료');
            }
            
            // 인벤토리 데이터 로드
            if (this.inventory) {
                this.inventory.loadFromLocalStorage();
            }
            
        } catch (error) {
            console.error('게임 데이터 로드 실패:', error);
        }
    }
    
    resetGame() {
        if (confirm('게임을 초기화하시겠습니까? 모든 진행 상황이 삭제됩니다.')) {
            localStorage.removeItem('animalCrossingGame');
            localStorage.removeItem('animalCrossingInventory');
            location.reload();
        }
    }
    
    getGameState() {
        return this.gameState;
    }
    
    getPlayer() {
        return this.player;
    }
    
    getEnvironment() {
        return this.environment;
    }
    
    getNPCManager() {
        return this.npcManager;
    }
    
    getInventory() {
        return this.inventory;
    }
}

// 교환 시스템 클래스
class TradeSystem {
    constructor(inventory) {
        this.inventory = inventory;
        this.tradeHistory = [];
        this.maxTradeHistory = 50;
    }
    
    canTrade(playerItems, npcItems) {
        // 플레이어가 모든 아이템을 가지고 있는지 확인
        for (const itemName of playerItems) {
            if (!this.inventory.hasItem(itemName)) {
                return false;
            }
        }
        
        return true;
    }
    
    executeTrade(playerItems, npcItems, npcName) {
        if (!this.canTrade(playerItems, npcItems)) {
            return false;
        }
        
        try {
            // 플레이어 아이템 제거
            playerItems.forEach(itemName => {
                this.inventory.removeItem(itemName, 1);
            });
            
            // NPC 아이템 추가
            npcItems.forEach(itemName => {
                this.inventory.addItem(itemName, 1);
            });
            
            // 교환 기록 추가
            this.addTradeRecord(playerItems, npcItems, npcName);
            
            return true;
            
        } catch (error) {
            console.error('교환 실행 오류:', error);
            return false;
        }
    }
    
    addTradeRecord(playerItems, npcItems, npcName) {
        const record = {
            timestamp: Date.now(),
            playerItems: [...playerItems],
            npcItems: [...npcItems],
            npcName: npcName
        };
        
        this.tradeHistory.unshift(record);
        
        // 기록 제한
        if (this.tradeHistory.length > this.maxTradeHistory) {
            this.tradeHistory = this.tradeHistory.slice(0, this.maxTradeHistory);
        }
    }
    
    getTradeHistory() {
        return this.tradeHistory;
    }
    
    getTradeValue(items) {
        return items.reduce((total, itemName) => {
            return total + this.inventory.getItemValue(itemName);
        }, 0);
    }
}