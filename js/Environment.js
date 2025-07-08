class Environment {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.trees = [];
        this.fruits = [];
        this.buildings = [];
        this.decorations = [];
        this.collectibles = [];
        this.mapSize = 50;
        
        this.fruitTypes = [
            { name: '사과', color: 0xff0000, emoji: '🍎' },
            { name: '오렌지', color: 0xffa500, emoji: '🍊' },
            { name: '바나나', color: 0xffff00, emoji: '🍌' },
            { name: '포도', color: 0x800080, emoji: '🍇' },
            { name: '딸기', color: 0xff69b4, emoji: '🍓' },
            { name: '배', color: 0x90EE90, emoji: '🍐' }
        ];
        
        this.init();
    }
    
    init() {
        this.createTerrain();
        this.createTrees();
        this.createBuildings();
        this.createFruits();
        this.createDecorations();
        // 스카이박스를 일시적으로 비활성화 (디버깅용)
        // this.createSkybox();
        console.log('Environment 초기화 완료 (스카이박스 비활성화)');
    }
    
    createTerrain() {
        // 지형 생성
        const groundGeometry = new THREE.PlaneGeometry(this.mapSize * 2, this.mapSize * 2, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x90EE90,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // 지형에 높이 변화 추가
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 0.5; // z 좌표 (높이)
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.engine.scene.add(ground);
        
        // 길 생성
        this.createPaths();
    }
    
    createPaths() {
        const pathGeometry = new THREE.PlaneGeometry(2, 40);
        const pathMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // 메인 길
        const mainPath = new THREE.Mesh(pathGeometry, pathMaterial);
        mainPath.rotation.x = -Math.PI / 2;
        mainPath.position.y = 0.01;
        mainPath.receiveShadow = true;
        this.engine.scene.add(mainPath);
        
        // 교차로
        const crossPath = new THREE.Mesh(pathGeometry, pathMaterial);
        crossPath.rotation.x = -Math.PI / 2;
        crossPath.rotation.y = Math.PI / 2;
        crossPath.position.y = 0.01;
        crossPath.receiveShadow = true;
        this.engine.scene.add(crossPath);
    }
    
    createTrees() {
        const treeCount = 30;
        
        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree();
            
            // 랜덤 위치 배치 (길에서 벗어나게)
            let x, z;
            do {
                x = (Math.random() - 0.5) * this.mapSize * 1.5;
                z = (Math.random() - 0.5) * this.mapSize * 1.5;
            } while (Math.abs(x) < 3 && Math.abs(z) < 3); // 길 피하기
            
            tree.position.set(x, 0, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4
            );
            
            this.engine.scene.add(tree);
            this.trees.push(tree);
        }
    }
    
    createTree() {
        const tree = new THREE.Group();
        
        // 나무 줄기
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);
        
        // 나무 잎
        const leafGeometry = new THREE.SphereGeometry(2, 8, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.1
        });
        const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
        leaves.position.y = 4;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
        
        // 나무마다 랜덤하게 과일 추가
        if (Math.random() < 0.7) {
            const fruitCount = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < fruitCount; i++) {
                const fruit = this.createFruit();
                fruit.position.set(
                    (Math.random() - 0.5) * 3,
                    3.5 + Math.random() * 1,
                    (Math.random() - 0.5) * 3
                );
                tree.add(fruit);
            }
        }
        
        return tree;
    }
    
    createFruit() {
        const fruitType = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        const fruitGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const fruitMaterial = new THREE.MeshStandardMaterial({ 
            color: fruitType.color,
            roughness: 0.3,
            metalness: 0.1
        });
        
        const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
        fruit.castShadow = true;
        fruit.userData = {
            type: 'fruit',
            fruitType: fruitType.name,
            emoji: fruitType.emoji,
            collectible: true
        };
        
        return fruit;
    }
    
    createBuildings() {
        // 집 생성
        const house = this.createHouse();
        house.position.set(15, 0, 15);
        this.engine.scene.add(house);
        this.buildings.push(house);
        
        // 상점 생성
        const shop = this.createShop();
        shop.position.set(-15, 0, 15);
        this.engine.scene.add(shop);
        this.buildings.push(shop);
        
        // 창고 생성
        const storage = this.createStorage();
        storage.position.set(0, 0, 20);
        this.engine.scene.add(storage);
        this.buildings.push(storage);
    }
    
    createHouse() {
        const house = new THREE.Group();
        
        // 집 본체
        const houseGeometry = new THREE.BoxGeometry(4, 3, 4);
        const houseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887,
            roughness: 0.8,
            metalness: 0.2
        });
        const houseBase = new THREE.Mesh(houseGeometry, houseMaterial);
        houseBase.position.y = 1.5;
        houseBase.castShadow = true;
        houseBase.receiveShadow = true;
        house.add(houseBase);
        
        // 지붕
        const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000,
            roughness: 0.7,
            metalness: 0.3
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 4;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        house.add(roof);
        
        // 문
        const doorGeometry = new THREE.BoxGeometry(0.8, 2, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9,
            metalness: 0.1
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1, 2.05);
        door.castShadow = true;
        house.add(door);
        
        // 창문
        const windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });
        
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(-1.2, 2, 2.05);
        house.add(window1);
        
        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(1.2, 2, 2.05);
        house.add(window2);
        
        // 굴뚝
        const chimneyGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(1, 4.75, 1);
        chimney.castShadow = true;
        house.add(chimney);
        
        house.userData = { type: 'house', interactable: true };
        return house;
    }
    
    createShop() {
        const shop = new THREE.Group();
        
        // 상점 본체
        const shopGeometry = new THREE.BoxGeometry(5, 3, 3);
        const shopMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xF4A460,
            roughness: 0.8,
            metalness: 0.2
        });
        const shopBase = new THREE.Mesh(shopGeometry, shopMaterial);
        shopBase.position.y = 1.5;
        shopBase.castShadow = true;
        shopBase.receiveShadow = true;
        shop.add(shopBase);
        
        // 간판
        const signGeometry = new THREE.BoxGeometry(3, 0.8, 0.1);
        const signMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 3.5, 1.6);
        sign.castShadow = true;
        shop.add(sign);
        
        // 상점 문
        const doorGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9,
            metalness: 0.1
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1.25, 1.55);
        door.castShadow = true;
        shop.add(door);
        
        shop.userData = { type: 'shop', interactable: true };
        return shop;
    }
    
    createStorage() {
        const storage = new THREE.Group();
        
        // 창고 본체
        const storageGeometry = new THREE.BoxGeometry(3, 2.5, 3);
        const storageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x708090,
            roughness: 0.9,
            metalness: 0.3
        });
        const storageBase = new THREE.Mesh(storageGeometry, storageMaterial);
        storageBase.position.y = 1.25;
        storageBase.castShadow = true;
        storageBase.receiveShadow = true;
        storage.add(storageBase);
        
        // 창고 문
        const doorGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2F4F4F,
            roughness: 0.9,
            metalness: 0.4
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1, 1.55);
        door.castShadow = true;
        storage.add(door);
        
        storage.userData = { type: 'storage', interactable: true };
        return storage;
    }
    
    createFruits() {
        // 땅에 떨어진 과일들 생성
        const fruitCount = 20;
        
        for (let i = 0; i < fruitCount; i++) {
            const fruit = this.createFruit();
            
            // 랜덤 위치 배치
            let x, z;
            do {
                x = (Math.random() - 0.5) * this.mapSize * 1.2;
                z = (Math.random() - 0.5) * this.mapSize * 1.2;
            } while (Math.abs(x) < 2 && Math.abs(z) < 2); // 중앙 피하기
            
            fruit.position.set(x, 0.2, z);
            
            // 수집 가능 표시
            fruit.userData.collectible = true;
            fruit.userData.onGround = true;
            
            this.engine.scene.add(fruit);
            this.collectibles.push(fruit);
        }
    }
    
    createDecorations() {
        // 꽃 생성
        this.createFlowers();
        
        // 돌 생성
        this.createRocks();
        
        // 버섯 생성
        this.createMushrooms();
    }
    
    createFlowers() {
        const flowerCount = 25;
        
        for (let i = 0; i < flowerCount; i++) {
            const flower = this.createFlower();
            
            let x, z;
            do {
                x = (Math.random() - 0.5) * this.mapSize * 1.5;
                z = (Math.random() - 0.5) * this.mapSize * 1.5;
            } while (Math.abs(x) < 2 && Math.abs(z) < 2);
            
            flower.position.set(x, 0.1, z);
            this.engine.scene.add(flower);
            this.decorations.push(flower);
        }
    }
    
    createFlower() {
        const flower = new THREE.Group();
        
        // 꽃줄기
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        flower.add(stem);
        
        // 꽃잎
        const petalColors = [0xFF69B4, 0xFFD700, 0x8A2BE2, 0xFF6347, 0x40E0D0];
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
        
        const petalGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const petalMaterial = new THREE.MeshStandardMaterial({ 
            color: petalColor,
            roughness: 0.3,
            metalness: 0.1
        });
        
        for (let i = 0; i < 6; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / 6) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.15,
                0.5,
                Math.sin(angle) * 0.15
            );
            flower.add(petal);
        }
        
        // 꽃 중심
        const centerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.5;
        flower.add(center);
        
        return flower;
    }
    
    createRocks() {
        const rockCount = 15;
        
        for (let i = 0; i < rockCount; i++) {
            const rock = this.createRock();
            
            let x, z;
            do {
                x = (Math.random() - 0.5) * this.mapSize * 1.2;
                z = (Math.random() - 0.5) * this.mapSize * 1.2;
            } while (Math.abs(x) < 3 && Math.abs(z) < 3);
            
            rock.position.set(x, 0, z);
            this.engine.scene.add(rock);
            this.decorations.push(rock);
        }
    }
    
    createRock() {
        const rockGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.5, 8, 8);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.scale.set(1, 0.5 + Math.random() * 0.5, 1);
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        return rock;
    }
    
    createMushrooms() {
        const mushroomCount = 12;
        
        for (let i = 0; i < mushroomCount; i++) {
            const mushroom = this.createMushroom();
            
            let x, z;
            do {
                x = (Math.random() - 0.5) * this.mapSize * 1.3;
                z = (Math.random() - 0.5) * this.mapSize * 1.3;
            } while (Math.abs(x) < 2 && Math.abs(z) < 2);
            
            mushroom.position.set(x, 0, z);
            this.engine.scene.add(mushroom);
            this.collectibles.push(mushroom);
        }
    }
    
    createMushroom() {
        const mushroom = new THREE.Group();
        
        // 버섯 줄기
        const stemGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xF5F5DC,
            roughness: 0.8,
            metalness: 0.1
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.15;
        stem.castShadow = true;
        mushroom.add(stem);
        
        // 버섯 갓
        const capGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const capColors = [0xFF0000, 0x8B4513, 0x9400D3];
        const capColor = capColors[Math.floor(Math.random() * capColors.length)];
        const capMaterial = new THREE.MeshStandardMaterial({ 
            color: capColor,
            roughness: 0.7,
            metalness: 0.2
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.35;
        cap.scale.set(1, 0.6, 1);
        cap.castShadow = true;
        mushroom.add(cap);
        
        // 점무늬 (빨간 버섯인 경우)
        if (capColor === 0xFF0000) {
            const spotGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const spotMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            
            for (let i = 0; i < 3; i++) {
                const spot = new THREE.Mesh(spotGeometry, spotMaterial);
                spot.position.set(
                    (Math.random() - 0.5) * 0.3,
                    0.37,
                    (Math.random() - 0.5) * 0.3
                );
                mushroom.add(spot);
            }
        }
        
        mushroom.userData = {
            type: 'mushroom',
            collectible: true,
            mushroomType: capColor === 0xFF0000 ? '빨간버섯' : '갈색버섯'
        };
        
        return mushroom;
    }
    
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.engine.scene.add(sky);
        
        // 구름 생성
        this.createClouds();
    }
    
    createClouds() {
        const cloudCount = 8;
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createCloud();
            cloud.position.set(
                (Math.random() - 0.5) * 150,
                20 + Math.random() * 30,
                (Math.random() - 0.5) * 150
            );
            this.engine.scene.add(cloud);
            this.decorations.push(cloud);
        }
    }
    
    createCloud() {
        const cloud = new THREE.Group();
        const cloudMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        
        // 구름 파트들
        const parts = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < parts; i++) {
            const partGeometry = new THREE.SphereGeometry(2 + Math.random() * 3, 8, 8);
            const part = new THREE.Mesh(partGeometry, cloudMaterial);
            part.position.set(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 8
            );
            cloud.add(part);
        }
        
        return cloud;
    }
    
    update(deltaTime) {
        // 구름 애니메이션
        this.decorations.forEach(decoration => {
            if (decoration.userData && decoration.userData.type === 'cloud') {
                decoration.position.x += deltaTime * 2;
                if (decoration.position.x > 75) {
                    decoration.position.x = -75;
                }
            }
        });
        
        // 과일 애니메이션
        this.collectibles.forEach(item => {
            if (item.userData && item.userData.collectible) {
                const time = Date.now() * 0.001;
                item.rotation.y = time * 0.5;
                if (item.userData.onGround) {
                    item.position.y = 0.2 + Math.sin(time * 3) * 0.1;
                }
            }
        });
    }
    
    getCollectibleAt(position, radius = 1) {
        for (let i = 0; i < this.collectibles.length; i++) {
            const collectible = this.collectibles[i];
            if (collectible.userData && collectible.userData.collectible) {
                const distance = collectible.position.distanceTo(position);
                if (distance <= radius) {
                    return { index: i, item: collectible };
                }
            }
        }
        return null;
    }
    
    removeCollectible(index) {
        if (index >= 0 && index < this.collectibles.length) {
            const item = this.collectibles[index];
            this.engine.scene.remove(item);
            this.collectibles.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getBuildingAt(position, radius = 2) {
        return this.buildings.find(building => {
            const distance = building.position.distanceTo(position);
            return distance <= radius;
        });
    }
    
    getFruitTypes() {
        return this.fruitTypes;
    }
    
    getMapSize() {
        return this.mapSize;
    }
}