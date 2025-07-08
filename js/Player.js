class Player {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.model = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 5;
        this.isMoving = false;
        this.currentAnimation = null;
        this.mixer = null;
        this.actions = {};
        
        // 키보드 입력 상태
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // 레이캐스터 (충돌 감지용)
        this.raycaster = new THREE.Raycaster();
        this.direction = new THREE.Vector3();
        
        // 초기 위치 명시적으로 설정
        this.setPosition(0, 0, 0);
        
        this.init();
    }
    
    init() {
        this.setupControls();
        
        // 즉시 대체 모델 생성
        console.log('플레이어 초기화 시작...');
        this.createFallbackModel();
        
        // 백그라운드에서 GLB 모델 로딩 시도
        this.loadModel();
    }
    
    setupControls() {
        // 키보드 이벤트
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // 마우스 이벤트 (카메라 제어용)
        this.setupMouseControls();
    }
    
    setupMouseControls() {
        let mouseX = 0;
        let mouseY = 0;
        let isMouseDown = false;
        
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // 좌클릭
                isMouseDown = true;
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;
                
                this.rotation.y -= deltaX * 0.005;
                
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        });
    }
    
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'KeyE':
                this.interact();
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
        }
    }
    
    loadModel() {
        console.log('MergedBear.glb 모델 로딩 시작...');
        
        if (this.engine.loadModel) {
            this.engine.loadModel('./MergedBear.glb', (gltf) => {
                console.log('MergedBear.glb 모델 로딩 성공!', gltf);
                
                // 기존 대체 모델 제거
                if (this.model) {
                    this.engine.scene.remove(this.model);
                }
                
                this.model = gltf.scene;
                // 위치를 높은 곳으로 강제 설정
                this.model.position.set(0, 0, 0); // Y를 0으로 설정해서 지면에 닿게
                this.position.set(0, 0, 0);
                this.model.scale.set(2, 2, 2); // 훨씬 크게 만들어서 확실히 보이게
                
                // 그림자 설정
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.engine.scene.add(this.model);
                console.log('MergedBear.glb 모델 교체 완료, 위치:', this.model.position);
                
                // 애니메이션 설정
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    
                    gltf.animations.forEach((clip, index) => {
                        const action = this.mixer.clipAction(clip);
                        this.actions[clip.name] = action;
                        console.log(`애니메이션 ${index + 1}: ${clip.name}`);
                    });
                    
                    // 첫 번째 애니메이션을 Idle로 설정
                    const animationNames = Object.keys(this.actions);
                    if (animationNames.length > 0) {
                        const idleAnimation = this.actions[animationNames[0]];
                        idleAnimation.play();
                        this.currentAnimation = idleAnimation;
                        console.log('기본 애니메이션 재생:', animationNames[0]);
                    }
                }
                
            }, (error) => {
                console.error('MergedBear.glb 모델 로딩 실패:', error);
                console.log('대체 모델을 계속 사용합니다.');
            });
        } else {
            console.warn('GameEngine.loadModel 메서드가 없습니다.');
        }
    }
    
    createFallbackModel() {
        console.log('대체 플레이어 모델 생성 중...');
        
        // 그룹 생성
        const group = new THREE.Group();
        
        // 몸통 - 훨씬 더 크고 눈에 띄게, 발광 효과 추가
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF0000, // 빨간색
            emissive: 0xFF0000, // 자체 발광
            emissiveIntensity: 0.3,
            roughness: 0.5,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2; // 상대적 위치
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // 머리 - 더 크게, 발광 효과
        const headGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4444, // 약간 밝은 빨간색
            emissive: 0xFF2222, // 자체 발광
            emissiveIntensity: 0.2,
            roughness: 0.5,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 5; // 몸통에 맞춰 조정
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // 눈 - 훨씬 더 크게
        const eyeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.6, 5, 1);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.6, 5, 1);
        group.add(rightEye);
        
        // 눈동자 - 더 크게
        const pupilGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.6, 5, 1.1);
        group.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.6, 5, 1.1);
        group.add(rightPupil);
        
        // 방향 표시용 화살표 - 훨씬 더 크게
        const arrowGeometry = new THREE.ConeGeometry(0.8, 2, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(0, 6, 2);
        arrow.rotation.x = -Math.PI / 2;
        group.add(arrow);
        
        // 이름 표시용 텍스트 - 더 크게
        const nameGeometry = new THREE.PlaneGeometry(6, 1.5);
        const nameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.9
        });
        const nameplate = new THREE.Mesh(nameGeometry, nameMaterial);
        nameplate.position.set(0, 8, 0);
        nameplate.lookAt(0, 8, 1); // 카메라를 향하도록
        group.add(nameplate);
        
        this.model = group;
        this.model.position.copy(this.position);
        
        // 강제로 높은 곳에 배치해서 확실히 보이게 함
        this.model.position.set(0, 0, 0); // 지형에 배치
        this.position.set(0, 0, 0);
        
        this.engine.scene.add(this.model);
        console.log('대체 플레이어 모델 생성 완료! 위치:', this.model.position);
        console.log('씬에 추가된 객체 수:', this.engine.scene.children.length);
        
        // 모델이 실제로 씬에 있는지 확인
        const foundInScene = this.engine.scene.children.includes(this.model);
        console.log('모델이 씬에 있는가?', foundInScene);
        
        // 로딩 완료
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // 1초 후 위치 재확인
        setTimeout(() => {
            console.log('1초 후 플레이어 모델 위치:', this.model.position);
            console.log('1초 후 플레이어 내부 위치:', this.position);
        }, 1000);
    }
    
    playAnimation(name) {
        if (this.actions[name] && this.actions[name] !== this.currentAnimation) {
            // 현재 애니메이션 페이드 아웃
            if (this.currentAnimation) {
                this.currentAnimation.fadeOut(0.2);
            }
            
            // 새 애니메이션 페이드 인
            this.currentAnimation = this.actions[name];
            this.currentAnimation.reset().fadeIn(0.2).play();
        }
    }
    
    update(deltaTime) {
        if (!this.model) return;
        
        // 입력 처리
        this.handleInput(deltaTime);
        
        // 애니메이션 업데이트
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // 물리 업데이트
        this.updatePhysics(deltaTime);
        
        // 카메라 업데이트 (3인칭 시점)
        this.updateCamera();
        
        // 이동 상태에 따른 애니메이션 변경
        this.updateAnimation();
    }
    
    handleInput(deltaTime) {
        // 속도 벡터 초기화
        this.velocity.set(0, 0, 0);
        this.isMoving = false;
        
        // 키 입력에 따른 이동 벡터 계산
        let moveVector = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.forward) {
            moveVector.z -= 1;
            this.isMoving = true;
        }
        if (this.keys.backward) {
            moveVector.z += 1;
            this.isMoving = true;
        }
        if (this.keys.left) {
            moveVector.x -= 1;
            this.isMoving = true;
        }
        if (this.keys.right) {
            moveVector.x += 1;
            this.isMoving = true;
        }
        
        // 이동 벡터 정규화 및 속도 적용
        if (this.isMoving) {
            moveVector.normalize();

            // 카메라의 전방 벡터를 가져와 플레이어의 이동 방향으로 사용
            const camera = window.game.smartCamera.camera;
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0; // Y축 이동은 무시 (수평 이동만)
            cameraDirection.normalize();

            const rightDirection = new THREE.Vector3();
            rightDirection.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)); // 카메라의 오른쪽 방향
            rightDirection.normalize();

            let finalMoveVector = new THREE.Vector3();
            if (this.keys.forward) finalMoveVector.add(cameraDirection);
            if (this.keys.backward) finalMoveVector.sub(cameraDirection);
            if (this.keys.left) finalMoveVector.sub(rightDirection);
            if (this.keys.right) finalMoveVector.add(rightDirection);

            finalMoveVector.normalize();
            this.velocity.copy(finalMoveVector.multiplyScalar(this.speed));

            // 플레이어 모델의 Y축 회전을 카메라의 수평 방향에 맞춤
            if (this.model) {
                const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
                this.model.rotation.y = angle;
            }
        }
        
        // 모델이 있을 때만 회전 적용
        if (this.model) {
            this.model.rotation.y = this.rotation.y;
        }
    }
    
    updatePhysics(deltaTime) {
        // 위치 업데이트 (NaN 방지)
        if (isNaN(this.velocity.x) || isNaN(this.velocity.z)) {
            console.warn('속도 벡터에 NaN 값 감지, 초기화합니다.');
            this.velocity.set(0, 0, 0);
            return;
        }
        
        // 위치 업데이트
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(deltaPosition);
        
        // NaN 체크 및 수정
        if (isNaN(this.position.x) || isNaN(this.position.z)) {
            console.warn('플레이어 위치에 NaN 값 감지, 높은 곳으로 재설정합니다.');
            this.position.set(0, 10, 0);
        }
        
        // Y 위치 고정 (디버깅용 - 높은 곳에 고정) 제거
        // this.position.y = 10;
        
        // 맵 경계 확인
        const mapSize = 50;
        this.position.x = Math.max(-mapSize, Math.min(mapSize, this.position.x));
        this.position.z = Math.max(-mapSize, Math.min(mapSize, this.position.z));
        
        // 모델 위치 업데이트
        if (this.model) {
            this.model.position.copy(this.position);
        }
        
        // 디버깅용 위치 출력
        if (this.isMoving) {
            console.log('플레이어 위치:', this.position.x.toFixed(2), this.position.y.toFixed(2), this.position.z.toFixed(2));
        }
    }
    
    updateCamera() {
        // 스마트 카메라가 있는 경우 카메라 업데이트를 위임
        if (window.game && window.game.smartCamera) {
            // 스마트 카메라가 처리
            return;
        }
        
        // 폴백: 기본 카메라 동작
        if (!this.model) return;
        
        const cameraOffset = new THREE.Vector3(0, 1.5, -3);
        const cameraPosition = this.position.clone().add(cameraOffset);
        
        this.engine.camera.position.lerp(cameraPosition, 0.1);
        this.engine.camera.lookAt(this.position);
    }
    
    updateAnimation() {
        if (!this.mixer) return;
        
        if (this.isMoving) {
            // 이동 애니메이션 재생
            const walkingAnim = this.actions['Walking'] || this.actions['Walk'] || this.actions['Running'];
            if (walkingAnim) {
                this.playAnimation('Walking');
            }
        } else {
            // 정지 애니메이션 재생
            const idleAnim = this.actions['Idle'] || this.actions[Object.keys(this.actions)[0]];
            if (idleAnim) {
                this.playAnimation('Idle');
            }
        }
    }
    
    interact() {
        if (!this.model) return;
        
        // 상호작용 가능한 객체 찾기
        const interactDistance = 3;
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.engine.camera);
        
        // 전방향으로 레이캐스트
        this.direction.set(0, 0, -1);
        this.direction.applyQuaternion(this.model.quaternion);
        this.raycaster.set(this.position, this.direction);
        
        // 게임에서 상호작용 이벤트 발생
        if (window.game) {
            window.game.handlePlayerInteraction(this.position, interactDistance);
        }
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getRotation() {
        return this.rotation.clone();
    }
    
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.model) {
            this.model.position.copy(this.position);
        }
    }
    
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        if (this.model) {
            this.model.rotation.copy(this.rotation);
        }
    }
}