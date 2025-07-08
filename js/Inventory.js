class Inventory {
    constructor() {
        this.items = {};
        this.maxCapacity = 50;
        this.currentCapacity = 0;
        this.storageItems = {};
        this.storageCapacity = 200;
        this.currentStorageCapacity = 0;
        
        // 아이템 타입별 정보
        this.itemTypes = {
            // 과일류
            '사과': { emoji: '🍎', category: 'fruit', value: 5 },
            '오렌지': { emoji: '🍊', category: 'fruit', value: 4 },
            '바나나': { emoji: '🍌', category: 'fruit', value: 3 },
            '포도': { emoji: '🍇', category: 'fruit', value: 6 },
            '딸기': { emoji: '🍓', category: 'fruit', value: 7 },
            '배': { emoji: '🍐', category: 'fruit', value: 4 },
            
            // 야채류
            '당근': { emoji: '🥕', category: 'vegetable', value: 3 },
            '양배추': { emoji: '🥬', category: 'vegetable', value: 4 },
            '감자': { emoji: '🥔', category: 'vegetable', value: 2 },
            '토마토': { emoji: '🍅', category: 'vegetable', value: 5 },
            
            // 자연 재료
            '버섯': { emoji: '🍄', category: 'nature', value: 8 },
            '빨간버섯': { emoji: '🍄', category: 'nature', value: 12 },
            '갈색버섯': { emoji: '🍄', category: 'nature', value: 10 },
            '나무열매': { emoji: '🌰', category: 'nature', value: 3 },
            '꽃': { emoji: '🌸', category: 'nature', value: 2 },
            '약초': { emoji: '🌿', category: 'nature', value: 15 },
            
            // 귀중품
            '금화': { emoji: '🪙', category: 'treasure', value: 50 },
            '은화': { emoji: '🪙', category: 'treasure', value: 25 },
            '마법구슬': { emoji: '🔮', category: 'magic', value: 100 },
            '깃털': { emoji: '🪶', category: 'nature', value: 8 },
            '별가루': { emoji: '✨', category: 'magic', value: 80 }
        };
        
        this.init();
    }
    
    init() {
        this.updateInventoryUI();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Tab키로 창고 열기
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Tab') {
                event.preventDefault();
                this.toggleStorageModal();
            }
        });
        
        // ESC키로 모달 닫기
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    addItem(itemName, quantity = 1) {
        if (!this.itemTypes[itemName]) {
            console.warn(`알 수 없는 아이템: ${itemName}`);
            return false;
        }
        
        if (this.currentCapacity >= this.maxCapacity) {
            this.showMessage('가방이 가득 찼습니다!', 'error');
            return false;
        }
        
        if (this.items[itemName]) {
            this.items[itemName] += quantity;
        } else {
            this.items[itemName] = quantity;
        }
        
        this.currentCapacity += quantity;
        this.updateInventoryUI();
        this.showMessage(`${itemName} ${quantity}개를 얻었습니다!`, 'success');
        return true;
    }
    
    removeItem(itemName, quantity = 1) {
        if (!this.items[itemName] || this.items[itemName] < quantity) {
            return false;
        }
        
        this.items[itemName] -= quantity;
        this.currentCapacity -= quantity;
        
        if (this.items[itemName] <= 0) {
            delete this.items[itemName];
        }
        
        this.updateInventoryUI();
        return true;
    }
    
    hasItem(itemName, quantity = 1) {
        return this.items[itemName] && this.items[itemName] >= quantity;
    }
    
    getItemCount(itemName) {
        return this.items[itemName] || 0;
    }
    
    getItems() {
        return { ...this.items };
    }
    
    addToStorage(itemName, quantity = 1) {
        if (!this.itemTypes[itemName]) {
            return false;
        }
        
        if (this.currentStorageCapacity >= this.storageCapacity) {
            this.showMessage('창고가 가득 찼습니다!', 'error');
            return false;
        }
        
        if (this.storageItems[itemName]) {
            this.storageItems[itemName] += quantity;
        } else {
            this.storageItems[itemName] = quantity;
        }
        
        this.currentStorageCapacity += quantity;
        this.showMessage(`${itemName} ${quantity}개를 창고에 저장했습니다!`, 'success');
        return true;
    }
    
    removeFromStorage(itemName, quantity = 1) {
        if (!this.storageItems[itemName] || this.storageItems[itemName] < quantity) {
            return false;
        }
        
        this.storageItems[itemName] -= quantity;
        this.currentStorageCapacity -= quantity;
        
        if (this.storageItems[itemName] <= 0) {
            delete this.storageItems[itemName];
        }
        
        return true;
    }
    
    transferToStorage(itemName, quantity = 1) {
        if (!this.hasItem(itemName, quantity)) {
            this.showMessage('아이템이 부족합니다!', 'error');
            return false;
        }
        
        if (this.removeItem(itemName, quantity)) {
            if (this.addToStorage(itemName, quantity)) {
                return true;
            } else {
                // 창고에 추가 실패 시 인벤토리로 되돌리기
                this.addItem(itemName, quantity);
            }
        }
        
        return false;
    }
    
    transferFromStorage(itemName, quantity = 1) {
        if (!this.storageItems[itemName] || this.storageItems[itemName] < quantity) {
            this.showMessage('창고에 아이템이 부족합니다!', 'error');
            return false;
        }
        
        if (this.currentCapacity + quantity > this.maxCapacity) {
            this.showMessage('가방이 가득 찼습니다!', 'error');
            return false;
        }
        
        if (this.removeFromStorage(itemName, quantity)) {
            this.addItem(itemName, quantity);
            return true;
        }
        
        return false;
    }
    
    updateInventoryUI() {
        const inventoryItems = document.getElementById('inventoryItems');
        if (!inventoryItems) return;
        
        inventoryItems.innerHTML = '';
        
        // 용량 표시
        const capacityDiv = document.createElement('div');
        capacityDiv.className = 'inventory-capacity';
        capacityDiv.innerHTML = `용량: ${this.currentCapacity}/${this.maxCapacity}`;
        inventoryItems.appendChild(capacityDiv);
        
        // 아이템 표시
        Object.keys(this.items).forEach(itemName => {
            const quantity = this.items[itemName];
            const itemInfo = this.itemTypes[itemName];
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <span class="item-info">
                    <span class="item-emoji">${itemInfo.emoji}</span>
                    <span class="item-name">${itemName}</span>
                </span>
                <span class="item-quantity">${quantity}</span>
            `;
            inventoryItems.appendChild(itemDiv);
        });
        
        if (Object.keys(this.items).length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'inventory-empty';
            emptyDiv.textContent = '아이템이 없습니다.';
            inventoryItems.appendChild(emptyDiv);
        }
    }
    
    showMessage(message, type = 'info') {
        // 메시지 표시 시스템
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message ${type}`;
        messageDiv.textContent = message;
        
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.background = type === 'error' ? '#ff4444' : '#44ff44';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '10px 20px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.fontSize = '16px';
        messageDiv.style.fontWeight = 'bold';
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 2000);
    }
    
    toggleStorageModal() {
        let storageModal = document.getElementById('storageModal');
        
        if (!storageModal) {
            this.createStorageModal();
            storageModal = document.getElementById('storageModal');
        }
        
        if (storageModal.style.display === 'none' || !storageModal.style.display) {
            storageModal.style.display = 'block';
            this.updateStorageUI();
        } else {
            storageModal.style.display = 'none';
        }
    }
    
    createStorageModal() {
        const modal = document.createElement('div');
        modal.id = 'storageModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🏪 창고 관리</h2>
                <div class="storage-sections">
                    <div class="storage-section">
                        <h3>가방 (${this.currentCapacity}/${this.maxCapacity})</h3>
                        <div id="inventoryStorageItems" class="storage-items"></div>
                    </div>
                    <div class="storage-section">
                        <h3>창고 (${this.currentStorageCapacity}/${this.storageCapacity})</h3>
                        <div id="storageStorageItems" class="storage-items"></div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button onclick="window.inventory.closeStorageModal()">닫기</button>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            display: none;
            pointer-events: auto;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
        `;
        
        document.getElementById('ui').appendChild(modal);
        
        // CSS 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .storage-sections {
                display: flex;
                gap: 20px;
                margin: 20px 0;
            }
            
            .storage-section {
                flex: 1;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 8px;
            }
            
            .storage-items {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 10px;
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #eee;
                padding: 10px;
                border-radius: 5px;
            }
            
            .storage-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px;
                border: 2px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                background: #f9f9f9;
            }
            
            .storage-item:hover {
                border-color: #4CAF50;
                background: #e8f5e8;
            }
            
            .storage-item-emoji {
                font-size: 24px;
                margin-bottom: 5px;
            }
            
            .storage-item-name {
                font-size: 12px;
                text-align: center;
                margin-bottom: 5px;
            }
            
            .storage-item-count {
                font-size: 14px;
                color: #666;
                font-weight: bold;
            }
            
            .inventory-capacity {
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
                padding: 5px 10px;
                background: #f0f0f0;
                border-radius: 5px;
            }
            
            .inventory-empty {
                color: #999;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
            
            .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
            
            .modal-actions button {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;
                background: #ddd;
                color: #333;
            }
            
            .modal-actions button:hover {
                background: #ccc;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    updateStorageUI() {
        const inventoryStorageItems = document.getElementById('inventoryStorageItems');
        const storageStorageItems = document.getElementById('storageStorageItems');
        
        if (!inventoryStorageItems || !storageStorageItems) return;
        
        // 가방 아이템 표시
        inventoryStorageItems.innerHTML = '';
        Object.keys(this.items).forEach(itemName => {
            const quantity = this.items[itemName];
            const itemInfo = this.itemTypes[itemName];
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'storage-item';
            itemDiv.innerHTML = `
                <div class="storage-item-emoji">${itemInfo.emoji}</div>
                <div class="storage-item-name">${itemName}</div>
                <div class="storage-item-count">${quantity}</div>
            `;
            
            itemDiv.addEventListener('click', () => {
                const transferQuantity = Math.min(quantity, 10);
                if (this.transferToStorage(itemName, transferQuantity)) {
                    this.updateStorageUI();
                }
            });
            
            inventoryStorageItems.appendChild(itemDiv);
        });
        
        // 창고 아이템 표시
        storageStorageItems.innerHTML = '';
        Object.keys(this.storageItems).forEach(itemName => {
            const quantity = this.storageItems[itemName];
            const itemInfo = this.itemTypes[itemName];
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'storage-item';
            itemDiv.innerHTML = `
                <div class="storage-item-emoji">${itemInfo.emoji}</div>
                <div class="storage-item-name">${itemName}</div>
                <div class="storage-item-count">${quantity}</div>
            `;
            
            itemDiv.addEventListener('click', () => {
                const transferQuantity = Math.min(quantity, 10);
                if (this.transferFromStorage(itemName, transferQuantity)) {
                    this.updateStorageUI();
                }
            });
            
            storageStorageItems.appendChild(itemDiv);
        });
        
        // 용량 업데이트
        document.querySelector('.storage-section h3').textContent = `가방 (${this.currentCapacity}/${this.maxCapacity})`;
        document.querySelectorAll('.storage-section h3')[1].textContent = `창고 (${this.currentStorageCapacity}/${this.storageCapacity})`;
    }
    
    closeStorageModal() {
        const storageModal = document.getElementById('storageModal');
        if (storageModal) {
            storageModal.style.display = 'none';
        }
    }
    
    closeAllModals() {
        const modals = ['dialogBox', 'tradeModal', 'storageModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    getItemsByCategory(category) {
        const categoryItems = {};
        
        Object.keys(this.items).forEach(itemName => {
            const itemInfo = this.itemTypes[itemName];
            if (itemInfo && itemInfo.category === category) {
                categoryItems[itemName] = this.items[itemName];
            }
        });
        
        return categoryItems;
    }
    
    getItemValue(itemName) {
        const itemInfo = this.itemTypes[itemName];
        return itemInfo ? itemInfo.value : 0;
    }
    
    getTotalValue() {
        let total = 0;
        Object.keys(this.items).forEach(itemName => {
            const quantity = this.items[itemName];
            const value = this.getItemValue(itemName);
            total += quantity * value;
        });
        return total;
    }
    
    // 저장/로드 기능
    saveToLocalStorage() {
        const data = {
            items: this.items,
            storageItems: this.storageItems,
            currentCapacity: this.currentCapacity,
            currentStorageCapacity: this.currentStorageCapacity
        };
        
        localStorage.setItem('animalCrossingInventory', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const data = localStorage.getItem('animalCrossingInventory');
        if (data) {
            const parsed = JSON.parse(data);
            this.items = parsed.items || {};
            this.storageItems = parsed.storageItems || {};
            this.currentCapacity = parsed.currentCapacity || 0;
            this.currentStorageCapacity = parsed.currentStorageCapacity || 0;
            this.updateInventoryUI();
        }
    }
}