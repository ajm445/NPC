class NPC {
    constructor(gameEngine, config) {
        this.engine = gameEngine;
        this.config = config;
        this.model = null;
        this.position = new THREE.Vector3(config.x || 0, config.y || 0, config.z || 0);
        this.rotation = new THREE.Euler(0, config.rotation || 0, 0);
        this.name = config.name || 'NPC';
        this.type = config.type || 'rabbit';
        this.color = config.color || 0xffffff;
        this.scale = config.scale || 1;
        this.dialogs = config.dialogs || ['안녕하세요!'];
        this.inventory = config.inventory || [];
        this.tradeItems = config.tradeItems || [];
        this.currentDialogIndex = 0;
        this.interactionCooldown = 0;
        this.isInteracting = false;
        
        // 애니메이션 관련
        this.mixer = null;
        this.actions = {};
        this.currentAnimation = null;
        this.idleTime = 0;
        this.wanderTime = 0;
        this.wanderDirection = new THREE.Vector3();
        this.originalPosition = this.position.clone();
        this.wanderRadius = config.wanderRadius || 3;
        
        // 말풍선 관련
        this.speechBubble = null;
        this.speechBubbleTimer = 0;
        
        this.init();
    }
    
    init() {
        this.createModel();
        this.setupBehavior();
    }
    
    createModel() {
        // 동물 타입에 따른 모델 생성
        switch(this.type) {
            case 'rabbit':
                this.createRabbitModel();
                break;
            case 'fox':
                this.createFoxModel();
                break;
            case 'deer':
                this.createDeerModel();
                break;
            case 'owl':
                this.createOwlModel();
                break;
            default:
                this.createRabbitModel();
        }
        
        if (this.model) {
            this.model.position.copy(this.position);
            this.model.rotation.copy(this.rotation);
            this.model.scale.set(this.scale, this.scale, this.scale);
            this.model.userData.npc = this;
            this.engine.scene.add(this.model);
        }
    }
    
    createRabbitModel() {
        const group = new THREE.Group();
        
        // 몸통
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.8,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4; // 땅에서 살짝 위로
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // 머리
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.1; // 몸통 위치에 맞춰 조정
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // 귀
        const earGeometry = new THREE.ConeGeometry(0.1, 0.6, 8);
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
        leftEar.position.set(-0.2, 1.6, 0); // 머리에 맞춰 조정
        leftEar.rotation.x = -0.2;
        leftEar.castShadow = true;
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
        rightEar.position.set(0.2, 1.6, 0); // 머리에 맞춰 조정
        rightEar.rotation.x = -0.2;
        rightEar.castShadow = true;
        group.add(rightEar);
        
        // 눈
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.25, 0.3);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.25, 0.3);
        group.add(rightEye);
        
        // 코
        const noseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const noseMaterial = new THREE.MeshBasicMaterial({ color: 0xff69b4 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 1.15, 0.35);
        group.add(nose);
        
        // 꼬리
        const tailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0.3, -0.4);
        tail.castShadow = true;
        group.add(tail);
        
        this.model = group;
        this.createSimpleAnimations();
    }
    
    createFoxModel() {
        const group = new THREE.Group();
        
        // 몸통
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff6b35,
            roughness: 0.8,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6; // 땅에서 살짝 위로
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // 머리
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.3; // 몸통에 맞춰 조정
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // 주둥이
        const snoutGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const snout = new THREE.Mesh(snoutGeometry, bodyMaterial);
        snout.position.set(0, 1.3, 0.25);
        snout.rotation.x = Math.PI / 2;
        snout.castShadow = true;
        group.add(snout);
        
        // 귀
        const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
        leftEar.position.set(-0.2, 1.65, 0);
        leftEar.castShadow = true;
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
        rightEar.position.set(0.2, 1.65, 0);
        rightEar.castShadow = true;
        group.add(rightEar);
        
        // 눈
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.45, 0.25);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.45, 0.25);
        group.add(rightEye);
        
        // 꼬리
        const tailGeometry = new THREE.ConeGeometry(0.1, 0.8, 8);
        const tailMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff6b35,
            roughness: 0.8,
            metalness: 0.1
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0.8, -0.6);
        tail.rotation.x = Math.PI / 4;
        tail.castShadow = true;
        group.add(tail);
        
        this.model = group;
        this.createSimpleAnimations();
    }
    
    createDeerModel() {
        const group = new THREE.Group();
        
        // 몸통
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // 머리
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.9;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // 뿔
        const hornGeometry = new THREE.ConeGeometry(0.05, 0.8, 8);
        const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.15, 2.3, 0);
        leftHorn.rotation.z = -0.3;
        leftHorn.castShadow = true;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.15, 2.3, 0);
        rightHorn.rotation.z = 0.3;
        rightHorn.castShadow = true;
        group.add(rightHorn);
        
        // 다리
        const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        const positions = [
            [-0.25, 0.4, 0.3],
            [0.25, 0.4, 0.3],
            [-0.25, 0.4, -0.3],
            [0.25, 0.4, -0.3]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });
        
        this.model = group;
        this.createSimpleAnimations();
    }
    
    createOwlModel() {
        const group = new THREE.Group();
        
        // 몸통
        const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // 머리
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.3;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // 눈
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.35, 0.3);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.35, 0.3);
        group.add(rightEye);
        
        // 눈동자
        const pupilGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.2, 1.35, 0.38);
        group.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.2, 1.35, 0.38);
        group.add(rightPupil);
        
        // 부리
        const beakGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
        const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xFF8C00 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, 1.2, 0.35);
        beak.rotation.x = Math.PI / 2;
        beak.castShadow = true;
        group.add(beak);
        
        // 날개
        const wingGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.7, 0.6, 0);
        leftWing.scale.set(0.8, 0.5, 1.2);
        leftWing.castShadow = true;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.7, 0.6, 0);
        rightWing.scale.set(0.8, 0.5, 1.2);
        rightWing.castShadow = true;
        group.add(rightWing);
        
        this.model = group;
        this.createSimpleAnimations();
    }
    
    createSimpleAnimations() {
        // 간단한 애니메이션 효과들
        this.animationCallbacks = {
            idle: () => this.animateIdle(),
            talk: () => this.animateTalk(),
            happy: () => this.animateHappy()
        };
    }
    
    animateIdle() {
        if (this.model) {
            // 살짝 위아래로 흔들리기
            const time = Date.now() * 0.001;
            this.model.position.y = this.position.y + Math.sin(time * 2) * 0.05;
            this.model.rotation.y = this.rotation.y + Math.sin(time * 1.5) * 0.1;
        }
    }
    
    animateTalk() {
        if (this.model) {
            const time = Date.now() * 0.01;
            this.model.rotation.y = this.rotation.y + Math.sin(time) * 0.2;
        }
    }
    
    animateHappy() {
        if (this.model) {
            const time = Date.now() * 0.005;
            this.model.position.y = this.position.y + Math.abs(Math.sin(time)) * 0.3;
            this.model.rotation.y = this.rotation.y + Math.sin(time * 2) * 0.3;
        }
    }
    
    setupBehavior() {
        // 랜덤 방향 설정
        this.wanderDirection.set(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        ).normalize();
    }
    
    update(deltaTime) {
        if (!this.model) return;
        
        // 쿨다운 업데이트
        if (this.interactionCooldown > 0) {
            this.interactionCooldown -= deltaTime;
        }
        
        // 말풍선 타이머
        if (this.speechBubbleTimer > 0) {
            this.speechBubbleTimer -= deltaTime;
            if (this.speechBubbleTimer <= 0) {
                this.hideSpeechBubble();
            }
        }
        
        // 행동 업데이트
        this.updateBehavior(deltaTime);
        
        // 애니메이션 업데이트
        this.updateAnimation();
    }
    
    updateBehavior(deltaTime) {
        if (this.isInteracting) return;
        
        // 가끔 배회
        this.wanderTime += deltaTime;
        if (this.wanderTime > 3) {
            this.wanderTime = 0;
            
            if (Math.random() < 0.3) {
                // 새로운 방향 설정
                this.wanderDirection.set(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                ).normalize();
                
                // 원래 위치에서 너무 멀어지지 않도록
                const distanceFromOrigin = this.position.distanceTo(this.originalPosition);
                if (distanceFromOrigin > this.wanderRadius) {
                    this.wanderDirection.copy(this.originalPosition).sub(this.position).normalize();
                }
                
                // 천천히 이동
                const moveSpeed = 0.5;
                this.position.add(this.wanderDirection.clone().multiplyScalar(moveSpeed * deltaTime));
                this.model.position.copy(this.position);
                
                // 이동 방향으로 회전
                this.model.lookAt(this.position.clone().add(this.wanderDirection));
            }
        }
    }
    
    updateAnimation() {
        if (this.isInteracting) {
            this.animationCallbacks.talk();
        } else {
            this.animationCallbacks.idle();
        }
    }
    
    interact(player) {
        if (this.interactionCooldown > 0) return false;
        
        this.isInteracting = true;
        this.interactionCooldown = 1.0;
        
        // 플레이어 쪽으로 회전
        if (this.model && player) {
            this.model.lookAt(player.getPosition());
        }
        
        // 대화 시작
        this.startDialog();
        
        return true;
    }
    
    startDialog() {
        const dialog = this.getCurrentDialog();
        this.showDialog(dialog);
    }
    
    getCurrentDialog() {
        const dialog = this.dialogs[this.currentDialogIndex];
        this.currentDialogIndex = (this.currentDialogIndex + 1) % this.dialogs.length;
        return dialog;
    }
    
    showDialog(text) {
        const dialogBox = document.getElementById('dialogBox');
        const speaker = document.querySelector('#dialogBox .speaker');
        const content = document.querySelector('#dialogBox .content');
        
        speaker.textContent = this.name;
        content.textContent = text;
        dialogBox.style.display = 'block';
        
        // NPC 애니메이션
        this.animationCallbacks.talk();
        
        // 자동으로 대화 종료
        setTimeout(() => {
            this.endInteraction();
        }, 3000);
    }
    
    endInteraction() {
        this.isInteracting = false;
        const dialogBox = document.getElementById('dialogBox');
        dialogBox.style.display = 'none';
    }
    
    showSpeechBubble(text, duration = 2000) {
        // 간단한 말풍선 표시
        console.log(`${this.name}: ${text}`);
        this.speechBubbleTimer = duration / 1000;
    }
    
    hideSpeechBubble() {
        this.speechBubbleTimer = 0;
    }
    
    canTrade() {
        return this.tradeItems.length > 0;
    }
    
    getTradeItems() {
        return this.tradeItems;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getName() {
        return this.name;
    }
    
    getType() {
        return this.type;
    }
    
    destroy() {
        if (this.model) {
            this.engine.scene.remove(this.model);
        }
        this.endInteraction();
    }
}

// 스마트 NPC 매니저 클래스
class SmartNPCManager {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.npcs = [];
        this.npcConfigs = [
            {
                name: '루나',
                type: 'rabbit',
                x: 10, y: 0, z: 5,
                color: 0xffffff,
                personality: 'friendly',
                dialogs: [
                    '안녕하세요! 저는 루나예요!',
                    '이 숲에서 사과를 찾고 있어요.',
                    '혹시 빨간 사과 있으면 교환해주세요!',
                    '배가 고파요... 🍎'
                ],
                tradeItems: ['당근', '양배추'],
                wanderRadius: 5,
                detectionRadius: 8,
                moveSpeed: 1.2
            },
            {
                name: '폭스',
                type: 'fox',
                x: -8, y: 0, z: 12,
                color: 0xff6b35,
                personality: 'curious',
                dialogs: [
                    '여우 폭스입니다! 🦊',
                    '저는 반짝이는 것을 좋아해요.',
                    '금화나 보석 있으면 좋은 거로 바꿔드릴게요!',
                    '약초도 관심 있어요.'
                ],
                tradeItems: ['금화', '은화', '약초'],
                wanderRadius: 6,
                detectionRadius: 10,
                moveSpeed: 1.5
            },
            {
                name: '노블',
                type: 'deer',
                x: 0, y: 0, z: -15,
                color: 0x8B4513,
                personality: 'shy',
                dialogs: [
                    '안녕하세요, 저는 사슴 노블입니다.',
                    '숲의 지혜를 나누고 싶어요.',
                    '버섯이나 나무열매에 관심이 있어요.',
                    '자연의 선물을 소중히 여겨요.'
                ],
                tradeItems: ['버섯', '나무열매', '꽃'],
                wanderRadius: 4,
                detectionRadius: 12,
                moveSpeed: 0.8
            },
            {
                name: '아르테미스',
                type: 'owl',
                x: 15, y: 0, z: -8,
                color: 0x8B4513,
                personality: 'playful',
                dialogs: [
                    '부엉~ 저는 올빼미 아르테미스입니다.',
                    '밤에 활동하지만 낮에도 깨어있어요.',
                    '신비한 물건들을 수집하고 있어요.',
                    '마법 아이템이 있으면 교환해드릴게요!'
                ],
                tradeItems: ['마법구슬', '깃털', '별가루'],
                wanderRadius: 8,
                detectionRadius: 9,
                moveSpeed: 1.8
            }
        ];
    }
    
    init() {
        this.createNPCs();
    }
    
    createNPCs() {
        this.npcConfigs.forEach(config => {
            const npc = new SmartNPC(this.engine, config);
            this.npcs.push(npc);
        });
    }
    
    setPlayer(player) {
        this.npcs.forEach(npc => {
            npc.setPlayer(player);
        });
    }
    
    update(deltaTime) {
        this.npcs.forEach(npc => {
            npc.update(deltaTime);
        });
    }
    
    handlePlayerInteraction(playerPosition, interactionDistance) {
        let interactedNPC = null;
        
        this.npcs.forEach(npc => {
            const distance = npc.getPosition().distanceTo(playerPosition);
            if (distance <= interactionDistance && !interactedNPC) {
                if (npc.interact()) {
                    interactedNPC = npc;
                }
            }
        });
        
        return interactedNPC;
    }
    
    getNPCs() {
        return this.npcs;
    }
    
    getNPCByName(name) {
        return this.npcs.find(npc => npc.getName() === name);
    }
    
    destroy() {
        this.npcs.forEach(npc => {
            npc.destroy();
        });
        this.npcs = [];
    }
}