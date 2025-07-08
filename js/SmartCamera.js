class SmartCamera {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        
        // 카메라 설정
        this.baseOffset = new THREE.Vector3(0, 0, 0); // Only height offset
        this.cameraDistance = 10; // Default distance from player
        this.targetCameraDistance = 10; // Target distance for zoom
        this.currentCameraDistance = 10; // Lerped distance
        
        // 카메라 상태
        this.followSpeed = 0.05;
        this.rotationSpeed = 0.03;
        this.zoomSpeed = 0.1;
        this.lookAtHeight = 1.5;
        
        // 플레이어 움직임 감지
        this.lastPlayerPosition = new THREE.Vector3();
        this.playerVelocity = new THREE.Vector3();
        this.velocitySmoothing = 0.9;
        
        // 카메라 모드
        this.mode = 'first_person'; // follow, cinematic, fixed, first_person
        this.cinematicTarget = null;
        this.cinematicTimer = 0;
        
        // 자동 회전
        this.autoRotate = false;
        this.autoRotateSpeed = 0.5;
        this.autoRotateTimer = 0;
        this.idleRotationDelay = 5; // 5초 후 자동 회전 시작
        
        // 장애물 회피
        this.raycaster = new THREE.Raycaster();
        this.obstacleAvoidance = true;
        this.minDistance = 3;
        this.maxDistance = 25;
        
        // 카메라 쉐이크
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.shakeOffset = new THREE.Vector3();
        
        // 줌 제어
        this.currentZoom = 1;
        this.targetZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 3;
        
        // 마우스 제어
        this.mouseControl = {
            enabled: true,
            sensitivity: 0.005,
            angleY: 0, // Looking straight ahead
            angleX: Math.PI / 2, // Horizontal view
            minAngleX: Math.PI / 2 - Math.PI / 3, // Limit vertical rotation
            maxAngleX: Math.PI / 2 + Math.PI / 6, // Limit vertical rotation
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0
        };
        
        // NPC 추적
        this.npcFocus = null;
        this.focusTransition = 0;
        this.focusSpeed = 0.02;
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.lastPlayerPosition.copy(this.player.getPosition());
        
        // 초기 카메라 위치 설정 - 플레이어를 확실히 보도록
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 10, 0); // 플레이어가 Y=10에 있으므로
        console.log('스마트 카메라 초기화 완료, 카메라 위치:', this.camera.position);
        console.log('카메라가 바라보는 지점: (0, 10, 0)');
    }
    
    setupControls() {
        // 마우스 이벤트
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
        document.addEventListener('wheel', (event) => this.onWheel(event), { passive: false });
        
        // 키보드 이벤트
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        
        // 터치 이벤트 (모바일 지원)
        document.addEventListener('touchstart', (event) => this.onTouchStart(event));
        document.addEventListener('touchmove', (event) => this.onTouchMove(event));
        document.addEventListener('touchend', (event) => this.onTouchEnd(event));
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // 좌클릭
            this.mouseControl.isDragging = true;
            this.mouseControl.lastMouseX = event.clientX;
            this.mouseControl.lastMouseY = event.clientY;
            this.autoRotate = false;
            this.autoRotateTimer = 0;
        }
    }
    
    onMouseMove(event) {
        if (this.mouseControl.isDragging && this.mouseControl.enabled) {
            const deltaX = event.clientX - this.mouseControl.lastMouseX;
            const deltaY = event.clientY - this.mouseControl.lastMouseY;
            
            this.mouseControl.angleY -= deltaX * this.mouseControl.sensitivity;
            this.mouseControl.angleX -= deltaY * this.mouseControl.sensitivity;
            
            // 수직 각도 제한
            this.mouseControl.angleX = Math.max(
                this.mouseControl.minAngleX,
                Math.min(this.mouseControl.maxAngleX, this.mouseControl.angleX)
            );
            
            this.mouseControl.lastMouseX = event.clientX;
            this.mouseControl.lastMouseY = event.clientY;
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) {
            this.mouseControl.isDragging = false;
        }
    }
    
    onWheel(event) {
        event.preventDefault();
        const zoomDelta = event.deltaY > 0 ? 0.1 : -0.1;
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom + zoomDelta));
    }
    
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyC':
                this.toggleCameraMode();
                break;
            case 'KeyV':
                this.autoRotate = !this.autoRotate;
                break;
            case 'KeyR':
                this.resetCamera();
                break;
        }
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.mouseControl.isDragging = true;
            this.mouseControl.lastMouseX = event.touches[0].clientX;
            this.mouseControl.lastMouseY = event.touches[0].clientY;
        }
    }
    
    onTouchMove(event) {
        if (this.mouseControl.isDragging && event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - this.mouseControl.lastMouseX;
            const deltaY = event.touches[0].clientY - this.mouseControl.lastMouseY;
            
            this.mouseControl.angleY -= deltaX * this.mouseControl.sensitivity;
            this.mouseControl.angleX -= deltaY * this.mouseControl.sensitivity;
            
            this.mouseControl.angleX = Math.max(
                this.mouseControl.minAngleX,
                Math.min(this.mouseControl.maxAngleX, this.mouseControl.angleX)
            );
            
            this.mouseControl.lastMouseX = event.touches[0].clientX;
            this.mouseControl.lastMouseY = event.touches[0].clientY;
        }
    }
    
    onTouchEnd(event) {
        this.mouseControl.isDragging = false;
    }
    
    update(deltaTime, npcs = []) {
        const playerPosition = this.player.getPosition();
        
        // 플레이어 속도 계산
        this.updatePlayerVelocity(playerPosition, deltaTime);
        
        // 카메라 모드별 업데이트
        switch(this.mode) {
            case 'follow':
                this.updateFollowMode(deltaTime, npcs);
                break;
            case 'cinematic':
                this.updateCinematicMode(deltaTime);
                break;
            case 'first_person':
                this.updateFirstPersonMode(deltaTime);
                break;
        }
        
        // 자동 회전 처리
        this.updateAutoRotation(deltaTime);
        
        // 카메라 쉐이크 처리
        this.updateCameraShake(deltaTime);
        
        // 줌 처리
        this.updateZoom(deltaTime);
        
        // 최종 카메라 위치 적용
        this.applyCamera(playerPosition);
        
        this.lastPlayerPosition.copy(playerPosition);
    }
    
    updatePlayerVelocity(playerPosition, deltaTime) {
        const velocity = new THREE.Vector3()
            .subVectors(playerPosition, this.lastPlayerPosition)
            .divideScalar(deltaTime);
        
        this.playerVelocity.lerp(velocity, 1 - this.velocitySmoothing);
    }
    
    updateFollowMode(deltaTime, npcs) {
        // 기본 오프셋 계산 (더 이상 사용되지 않음)
        // this.calculateDynamicOffset();
        
        // NPC 포커스 확인
        this.updateNPCFocus(npcs);
        
        // 마우스 회전은 applyCamera에서 직접 처리됩니다.
        
        // 장애물 회피 (현재 비활성화)
        // if (this.obstacleAvoidance) {
        //     this.avoidObstacles();
        // }
    }
    
    
    
    updateNPCFocus(npcs) {
        let closestNPC = null;
        let closestDistance = Infinity;
        const playerPos = this.player.getPosition();
        const focusRange = 8;
        
        // 가장 가까운 NPC 찾기
        npcs.forEach(npc => {
            const distance = npc.getPosition().distanceTo(playerPos);
            if (distance < focusRange && distance < closestDistance) {
                closestNPC = npc;
                closestDistance = distance;
            }
        });
        
        // NPC 포커스 전환
        if (closestNPC && closestNPC !== this.npcFocus) {
            this.npcFocus = closestNPC;
            this.focusTransition = 0;
        } else if (!closestNPC && this.npcFocus) {
            this.npcFocus = null;
            this.focusTransition = 0;
        }
        
        // 포커스 전환 애니메이션
        if (this.npcFocus || this.focusTransition > 0) {
            this.focusTransition = Math.min(1, this.focusTransition + this.focusSpeed);
            
            if (!this.npcFocus) {
                this.focusTransition = Math.max(0, this.focusTransition - this.focusSpeed * 2);
            }
        }
    }
    
    
    
    
    
    updateAutoRotation(deltaTime) {
        if (this.mouseControl.isDragging) {
            this.autoRotateTimer = 0;
            return;
        }
        
        this.autoRotateTimer += deltaTime;
        
        if (this.autoRotateTimer > this.idleRotationDelay && this.autoRotate) {
            this.mouseControl.angleY += this.autoRotateSpeed * deltaTime;
        }
    }
    
    updateCameraShake(deltaTime) {
        if (this.shakeDuration > 0) {
            this.shakeTimer += deltaTime;
            
            const progress = this.shakeTimer / this.shakeDuration;
            const intensity = this.shakeIntensity * (1 - progress);
            
            this.shakeOffset.set(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );
            
            if (progress >= 1) {
                this.shakeDuration = 0;
                this.shakeTimer = 0;
                this.shakeOffset.set(0, 0, 0);
            }
        }
    }
    
    updateZoom(deltaTime) {
        // targetZoom에 따라 targetCameraDistance 업데이트
        this.targetCameraDistance = this.cameraDistance / this.targetZoom;
        this.currentCameraDistance = THREE.MathUtils.lerp(this.currentCameraDistance, this.targetCameraDistance, this.zoomSpeed);
    }
    
    updateCinematicMode(deltaTime) {
        if (!this.cinematicTarget) return;
        
        this.cinematicTimer += deltaTime;
        
        // 시네마틱 카메라 무브먼트 구현
        const targetPos = this.cinematicTarget.position || this.cinematicTarget;
        this.camera.lookAt(targetPos);
    }
    
    updateFirstPersonMode(deltaTime) {
        const playerPos = this.player.getPosition();
        this.camera.position.copy(playerPos);
        this.camera.position.y += 1.7; // 눈 높이
        
        // 플레이어 회전에 따라 카메라 회전
        const playerRotation = this.player.model.rotation.clone(); // 플레이어 모델의 회전 사용
        this.camera.rotation.copy(playerRotation);
        
        // 플레이어의 Y축 회전만 적용하여 좌우 시점 변경
        this.camera.rotation.x = 0;
        this.camera.rotation.z = 0;
    }
    
    applyCamera(playerPosition) {
        // 구면 좌표계를 사용하여 카메라 위치 계산
        const phi = this.mouseControl.angleX; // 극각 (수직)
        const theta = this.mouseControl.angleY; // 방위각 (수평)
        
        const x = this.currentCameraDistance * Math.sin(phi) * Math.sin(theta);
        const y = this.currentCameraDistance * Math.cos(phi);
        const z = this.currentCameraDistance * Math.sin(phi) * Math.cos(theta);
        
        const cameraOffset = new THREE.Vector3(x, y, z);
        
        // 플레이어 위치에 오프셋과 쉐이크 오프셋 적용
        const targetPosition = playerPosition.clone().add(cameraOffset);
        targetPosition.y += this.baseOffset.y; // 기본 높이 오프셋 적용
        targetPosition.add(this.shakeOffset);
        
        // 부드러운 카메라 이동
        this.camera.position.lerp(targetPosition, this.followSpeed);
        
        // 카메라가 바라볼 지점 계산
        let lookAtTarget = playerPosition.clone();
        lookAtTarget.y += this.lookAtHeight;
        
        // NPC 포커스가 있는 경우
        if (this.npcFocus && this.focusTransition > 0) {
            const npcPos = this.npcFocus.getPosition();
            npcPos.y += 1;
            lookAtTarget.lerp(npcPos, this.focusTransition * 0.3);
        }
        
        this.camera.lookAt(lookAtTarget);
    }
    
    // 유틸리티 메서드들
    shake(intensity = 0.5, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }
    
    zoom(factor) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, factor));
    }
    
    focusOnNPC(npc, duration = 2) {
        this.mode = 'cinematic';
        this.cinematicTarget = npc;
        this.cinematicTimer = 0;
        
        setTimeout(() => {
            this.mode = 'follow';
            this.cinematicTarget = null;
        }, duration * 1000);
    }
    
    toggleCameraMode() {
        const modes = ['follow', 'cinematic', 'first_person'];
        const currentIndex = modes.indexOf(this.mode);
        this.mode = modes[(currentIndex + 1) % modes.length];
        
        console.log(`카메라 모드: ${this.mode}`);
    }
    
    resetCamera() {
        this.mouseControl.angleY = 0;
        this.mouseControl.angleX = 0;
        this.targetZoom = 1;
        this.currentOffset.copy(this.baseOffset);
        this.autoRotateTimer = 0;
    }
    
    setFollowDistance(distance) {
        this.baseOffset.z = distance;
        this.targetOffset.z = distance;
    }
    
    setHeight(height) {
        this.baseOffset.y = height;
        this.targetOffset.y = height;
    }
    
    enableMouseControl(enabled = true) {
        this.mouseControl.enabled = enabled;
    }
    
    getDebugInfo() {
        return {
            mode: this.mode,
            zoom: this.currentZoom.toFixed(2),
            angleY: (this.mouseControl.angleY * 180 / Math.PI).toFixed(1) + '°',
            angleX: (this.mouseControl.angleX * 180 / Math.PI).toFixed(1) + '°',
            npcFocus: this.npcFocus ? this.npcFocus.getName() : 'none',
            autoRotate: this.autoRotate
        };
    }
}