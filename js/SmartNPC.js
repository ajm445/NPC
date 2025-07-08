class SmartNPC extends NPC {
    constructor(gameEngine, config) {
        super(gameEngine, config);
        
        // AI 관련 속성
        this.aiState = 'idle'; // idle, wandering, following, interacting, avoiding, curious
        this.playerDetectionRadius = config.detectionRadius || 8;
        this.interactionRadius = config.interactionRadius || 3;
        this.followRadius = config.followRadius || 15;
        this.personalSpace = config.personalSpace || 2;
        
        // 이동 관련
        this.moveSpeed = config.moveSpeed || 1;
        this.runSpeed = config.runSpeed || 2.5;
        this.currentSpeed = this.moveSpeed;
        this.targetPosition = null;
        this.path = [];
        this.pathIndex = 0;
        
        // 감정 및 성격
        this.personality = config.personality || 'friendly'; // friendly, shy, curious, playful, lazy
        this.mood = 1.0; // 0-1, 기분 상태
        this.energy = 1.0; // 0-1, 에너지 상태
        this.attentionSpan = config.attentionSpan || 5; // 초 단위
        this.currentAttention = 0;
        
        // 기억 시스템
        this.memory = {
            lastPlayerPosition: null,
            lastInteractionTime: 0,
            playerMeetCount: 0,
            favoriteSpots: [],
            avoidSpots: []
        };
        
        // 플레이어 참조
        this.player = null;
        this.lastPlayerDistance = Infinity;
        this.isLookingAtPlayer = false;
        this.lookAtTarget = new THREE.Vector3();
        
        // 애니메이션 상태
        this.isMoving = false;
        this.isRunning = false;
        this.headRotation = new THREE.Euler(0, 0, 0);
        
        // 관심 지점들
        this.interestPoints = this.generateInterestPoints();
        this.currentInterestPoint = null;
        
        // 시간 관련
        this.lastStateChange = 0;
        this.stateTimer = 0;
        this.reactionTimer = 0;
        
        this.setupAI();
    }
    
    setupAI() {
        // 성격에 따른 기본 설정 조정
        switch(this.personality) {
            case 'shy':
                this.playerDetectionRadius *= 1.5;
                this.personalSpace *= 2;
                this.moveSpeed *= 0.8;
                break;
            case 'curious':
                this.playerDetectionRadius *= 1.3;
                this.attentionSpan *= 1.5;
                this.moveSpeed *= 1.2;
                break;
            case 'playful':
                this.runSpeed *= 1.3;
                this.attentionSpan *= 0.7;
                break;
            case 'lazy':
                this.moveSpeed *= 0.6;
                this.attentionSpan *= 2;
                break;
        }
    }
    
    generateInterestPoints() {
        const points = [];
        const mapSize = 25;
        
        // 나무 주변
        for (let i = 0; i < 8; i++) {
            points.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * mapSize,
                    0,
                    (Math.random() - 0.5) * mapSize
                ),
                type: 'tree',
                appeal: 0.3 + Math.random() * 0.4
            });
        }
        
        // 건물 주변
        points.push({
            position: new THREE.Vector3(15, 0, 15),
            type: 'house',
            appeal: 0.6
        });
        
        points.push({
            position: new THREE.Vector3(-15, 0, 15),
            type: 'shop',
            appeal: 0.7
        });
        
        // 길 위의 지점들
        for (let i = 0; i < 5; i++) {
            points.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    0,
                    (Math.random() - 0.5) * 30
                ),
                type: 'path',
                appeal: 0.5
            });
        }
        
        return points;
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.player) return;
        
        // AI 상태 업데이트
        this.updateAI(deltaTime);
        
        // 이동 업데이트 (moveToTarget에서 처리됨)
        
        // 시선 업데이트
        this.updateLookAt(deltaTime);
        
        // 애니메이션 업데이트
        this.updateSmartAnimation();
        
        // 에너지와 기분 업데이트
        this.updateMoodAndEnergy(deltaTime);
    }
    
    updateAI(deltaTime) {
        const playerPosition = this.player.getPosition();
        const playerDistance = this.position.distanceTo(playerPosition);
        const previousState = this.aiState;
        
        this.stateTimer += deltaTime;
        this.lastPlayerDistance = playerDistance;
        
        // 플레이어 감지
        const canSeePlayer = this.canSeePlayer(playerPosition);
        const isPlayerClose = playerDistance <= this.playerDetectionRadius;
        const isPlayerVeryClose = playerDistance <= this.interactionRadius;
        const isPlayerTooClose = playerDistance <= this.personalSpace;
        
        // 메모리 업데이트
        if (canSeePlayer) {
            this.memory.lastPlayerPosition = playerPosition.clone();
            this.memory.playerMeetCount++;
        }
        
        // 상태 전환 로직
        switch(this.aiState) {
            case 'idle':
                if (isPlayerVeryClose && canSeePlayer) {
                    this.changeState('interacting');
                } else if (isPlayerClose && canSeePlayer) {
                    this.reactToPlayer(playerDistance);
                } else if (this.stateTimer > 3 + Math.random() * 5) {
                    this.changeState('wandering');
                }
                break;
                
            case 'wandering':
                if (isPlayerVeryClose && canSeePlayer) {
                    this.changeState('interacting');
                } else if (isPlayerClose && canSeePlayer) {
                    this.reactToPlayer(playerDistance);
                } else if (this.stateTimer > 5 + Math.random() * 10) {
                    this.changeState('idle');
                }
                break;
                
            case 'curious':
                if (isPlayerVeryClose) {
                    this.changeState('interacting');
                } else if (!isPlayerClose || this.stateTimer > this.attentionSpan) {
                    this.changeState('idle');
                }
                break;
                
            case 'following':
                if (isPlayerVeryClose) {
                    this.changeState('interacting');
                } else if (playerDistance > this.followRadius || this.stateTimer > 15) {
                    this.changeState('idle');
                }
                break;
                
            case 'avoiding':
                if (playerDistance > this.playerDetectionRadius) {
                    this.changeState('idle');
                } else if (isPlayerTooClose) {
                    this.currentSpeed = this.runSpeed;
                }
                break;
                
            case 'interacting':
                if (!isPlayerVeryClose || this.stateTimer > 10) {
                    this.changeState('idle');
                }
                break;
        }
        
        // 상태별 행동 실행
        this.executeStateAction(deltaTime);
    }
    
    reactToPlayer(distance) {
        switch(this.personality) {
            case 'friendly':
                if (Math.random() < 0.3) {
                    this.changeState('following');
                } else {
                    this.changeState('curious');
                }
                break;
                
            case 'shy':
                if (distance < this.personalSpace * 1.5) {
                    this.changeState('avoiding');
                } else {
                    this.changeState('curious');
                }
                break;
                
            case 'curious':
                this.changeState('following');
                break;
                
            case 'playful':
                if (Math.random() < 0.4) {
                    this.changeState('following');
                } else {
                    this.playfulBehavior();
                }
                break;
                
            case 'lazy':
                if (distance < this.interactionRadius) {
                    this.changeState('curious');
                }
                break;
        }
    }
    
    changeState(newState) {
        if (this.aiState !== newState) {
            this.lastStateChange = Date.now();
            this.aiState = newState;
            this.stateTimer = 0;
            
            // 상태 변경에 따른 즉각적인 반응
            this.onStateChange(newState);
        }
    }
    
    onStateChange(newState) {
        switch(newState) {
            case 'curious':
                this.isLookingAtPlayer = true;
                this.showEmoticon('?');
                break;
                
            case 'following':
                this.isLookingAtPlayer = true;
                this.showEmoticon('♥');
                break;
                
            case 'avoiding':
                this.isLookingAtPlayer = false;
                this.showEmoticon('!');
                this.currentSpeed = this.runSpeed;
                break;
                
            case 'interacting':
                this.isLookingAtPlayer = true;
                this.showEmoticon('💬');
                break;
                
            case 'wandering':
                this.isLookingAtPlayer = false;
                this.selectNewDestination();
                break;
                
            case 'idle':
                this.isLookingAtPlayer = false;
                this.currentSpeed = this.moveSpeed;
                break;
        }
    }
    
    executeStateAction(deltaTime) {
        switch(this.aiState) {
            case 'wandering':
                this.wander(deltaTime);
                break;
                
            case 'following':
                this.followPlayer(deltaTime);
                break;
                
            case 'avoiding':
                this.avoidPlayer(deltaTime);
                break;
                
            case 'curious':
                this.observePlayer(deltaTime);
                break;
                
            case 'interacting':
                this.interactWithPlayer(deltaTime);
                break;
        }
    }
    
    wander(deltaTime) {
        if (!this.targetPosition || this.position.distanceTo(this.targetPosition) < 1) {
            this.selectNewDestination();
        }
        
        this.moveToTarget(deltaTime);
    }
    
    followPlayer(deltaTime) {
        const playerPos = this.player.getPosition();
        const distance = this.position.distanceTo(playerPos);
        
        if (distance > this.interactionRadius * 1.5) {
            // 플레이어 뒤를 따라가되, 너무 가까이 가지 않음
            const direction = new THREE.Vector3()
                .subVectors(playerPos, this.position)
                .normalize();
            
            this.targetPosition = playerPos.clone()
                .sub(direction.multiplyScalar(this.interactionRadius));
            
            this.moveToTarget(deltaTime);
        }
    }
    
    avoidPlayer(deltaTime) {
        const playerPos = this.player.getPosition();
        const direction = new THREE.Vector3()
            .subVectors(this.position, playerPos)
            .normalize();
        
        this.targetPosition = this.position.clone()
            .add(direction.multiplyScalar(5));
        
        // 맵 경계 확인
        const mapSize = 25;
        this.targetPosition.x = Math.max(-mapSize, Math.min(mapSize, this.targetPosition.x));
        this.targetPosition.z = Math.max(-mapSize, Math.min(mapSize, this.targetPosition.z));
        
        this.currentSpeed = this.runSpeed;
        this.moveToTarget(deltaTime);
    }
    
    observePlayer(deltaTime) {
        // 플레이어를 바라보며 호기심 표현
        this.isLookingAtPlayer = true;
        
        // 가끔 플레이어 주위를 배회
        if (Math.random() < 0.002) {
            const playerPos = this.player.getPosition();
            const angle = Math.random() * Math.PI * 2;
            const radius = this.interactionRadius + Math.random() * 3;
            
            this.targetPosition = new THREE.Vector3(
                playerPos.x + Math.cos(angle) * radius,
                0,
                playerPos.z + Math.sin(angle) * radius
            );
        }
        
        if (this.targetPosition) {
            this.moveToTarget(deltaTime);
        }
    }
    
    interactWithPlayer(deltaTime) {
        this.isLookingAtPlayer = true;
        this.currentSpeed = 0; // 상호작용 중에는 멈춤
        
        // 플레이어를 향해 몸 회전
        const playerPos = this.player.getPosition();
        this.model.lookAt(playerPos);
    }
    
    playfulBehavior() {
        // 장난기 많은 행동 패턴
        if (Math.random() < 0.5) {
            this.changeState('following');
        } else {
            // 플레이어 주위를 빠르게 돌기
            const playerPos = this.player.getPosition();
            const angle = Math.random() * Math.PI * 2;
            this.targetPosition = new THREE.Vector3(
                playerPos.x + Math.cos(angle) * 4,
                0,
                playerPos.z + Math.sin(angle) * 4
            );
            this.currentSpeed = this.runSpeed;
        }
    }
    
    selectNewDestination() {
        if (this.interestPoints.length === 0) return;
        
        // 관심 지점 중 하나를 선택 (가중치 기반)
        const weights = this.interestPoints.map(point => {
            const distance = this.position.distanceTo(point.position);
            const distanceWeight = Math.max(0, 1 - distance / 20); // 가까울수록 높은 가중치
            return point.appeal * distanceWeight * (0.5 + Math.random() * 0.5);
        });
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                this.currentInterestPoint = this.interestPoints[i];
                this.targetPosition = this.currentInterestPoint.position.clone();
                
                // 약간의 랜덤 오프셋 추가
                this.targetPosition.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    0,
                    (Math.random() - 0.5) * 4
                ));
                break;
            }
        }
    }
    
    moveToTarget(deltaTime) {
        if (!this.targetPosition) return;
        
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.position)
            .normalize();
        
        const moveDistance = this.currentSpeed * deltaTime;
        this.position.add(direction.multiplyScalar(moveDistance));
        
        if (this.model) {
            this.model.position.copy(this.position);
            
            // 이동 방향으로 회전 (플레이어를 보고 있지 않을 때만)
            if (!this.isLookingAtPlayer) {
                this.model.lookAt(this.targetPosition);
            }
        }
        
        this.isMoving = this.currentSpeed > 0.1;
        this.isRunning = this.currentSpeed > this.moveSpeed * 1.5;
    }
    
    updateLookAt(deltaTime) {
        if (!this.model || !this.player) return;
        
        if (this.isLookingAtPlayer) {
            const playerPos = this.player.getPosition();
            playerPos.y += 1; // 플레이어의 머리 높이
            
            // 부드러운 시선 이동
            this.lookAtTarget.lerp(playerPos, deltaTime * 2);
            this.model.lookAt(this.lookAtTarget);
        }
    }
    
    updateSmartAnimation() {
        if (!this.model) return;
        
        if (this.isRunning) {
            this.animationCallbacks.run ? this.animationCallbacks.run() : this.animationCallbacks.idle();
        } else if (this.isMoving) {
            this.animationCallbacks.walk ? this.animationCallbacks.walk() : this.animationCallbacks.idle();
        } else if (this.isLookingAtPlayer) {
            this.animationCallbacks.talk();
        } else {
            this.animationCallbacks.idle();
        }
    }
    
    updateMoodAndEnergy(deltaTime) {
        // 에너지 감소 (활동량에 따라)
        const energyDrain = this.isRunning ? 0.1 : (this.isMoving ? 0.05 : 0.01);
        this.energy = Math.max(0, this.energy - energyDrain * deltaTime);
        
        // 기분 변화 (플레이어와의 상호작용에 따라)
        if (this.aiState === 'interacting') {
            this.mood = Math.min(1, this.mood + 0.1 * deltaTime);
        } else if (this.aiState === 'avoiding') {
            this.mood = Math.max(0, this.mood - 0.05 * deltaTime);
        }
        
        // 에너지가 낮으면 휴식 선호
        if (this.energy < 0.3 && this.aiState === 'wandering') {
            this.currentSpeed *= 0.5;
        }
    }
    
    canSeePlayer(playerPosition) {
        const distance = this.position.distanceTo(playerPosition);
        if (distance > this.playerDetectionRadius) return false;
        
        // 간단한 시야각 체크 (180도)
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.position)
            .normalize();
        
        const forward = new THREE.Vector3(0, 0, -1);
        if (this.model) {
            forward.applyQuaternion(this.model.quaternion);
        }
        
        const dot = direction.dot(forward);
        return dot > -0.5; // 180도 시야각
    }
    
    showEmoticon(emoji) {
        // 간단한 이모티콘 표시 (콘솔로)
        console.log(`${this.name}: ${emoji}`);
        
        // 실제 3D 이모티콘 구현은 추후 추가 가능
        this.currentEmoticon = emoji;
        setTimeout(() => {
            this.currentEmoticon = null;
        }, 2000);
    }
    
    // NPC 오버라이드
    interact(player) {
        if (this.interactionCooldown > 0) return false;
        
        this.changeState('interacting');
        this.mood = Math.min(1, this.mood + 0.2);
        this.memory.lastInteractionTime = Date.now();
        
        return super.interact(player);
    }
    
    getAIDebugInfo() {
        return {
            state: this.aiState,
            mood: this.mood.toFixed(2),
            energy: this.energy.toFixed(2),
            playerDistance: this.lastPlayerDistance.toFixed(2),
            isLookingAtPlayer: this.isLookingAtPlayer,
            personality: this.personality
        };
    }
}