class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true 
        });
        this.clock = new THREE.Clock();
        this.loader = new THREE.GLTFLoader();
        this.mixer = null;
        this.animations = {};
        this.lights = {};
        
        this.init();
    }
    
    init() {
        // 렌더러 설정
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        
        // 카메라 초기 위치
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
        
        // 조명 설정
        this.setupLights();
        
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 안개 효과
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    setupLights() {
        // 태양광 (DirectionalLight)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        this.lights.sun = sunLight;
        
        // 환경광 (AmbientLight)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        this.lights.ambient = ambientLight;
        
        // 하늘 조명
        const skyLight = new THREE.HemisphereLight(0x87CEEB, 0x98FB98, 0.6);
        this.scene.add(skyLight);
        this.lights.sky = skyLight;
    }
    
    loadModel(path, onLoad, onError) {
        this.loader.load(
            path,
            (gltf) => {
                if (onLoad) onLoad(gltf);
            },
            undefined,
            (error) => {
                console.error('모델 로딩 에러:', error);
                if (onError) onError(error);
            }
        );
    }
    
    createMixer(model) {
        if (model.animations && model.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model.scene);
            
            // 애니메이션 클립들을 저장
            model.animations.forEach(clip => {
                const action = this.mixer.clipAction(clip);
                this.animations[clip.name] = action;
            });
            
            return this.mixer;
        }
        return null;
    }
    
    playAnimation(name, loop = true) {
        if (this.animations[name]) {
            // 모든 애니메이션 정지
            Object.values(this.animations).forEach(action => {
                action.stop();
            });
            
            // 선택된 애니메이션 재생
            const action = this.animations[name];
            action.reset();
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
            action.play();
            
            return action;
        }
        return null;
    }
    
    update() {
        const delta = this.clock.getDelta();
        
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // 유틸리티 함수들
    createGeometry(type, params) {
        switch(type) {
            case 'box':
                return new THREE.BoxGeometry(params.width || 1, params.height || 1, params.depth || 1);
            case 'sphere':
                return new THREE.SphereGeometry(params.radius || 1, params.widthSegments || 32, params.heightSegments || 16);
            case 'cylinder':
                return new THREE.CylinderGeometry(params.radiusTop || 1, params.radiusBottom || 1, params.height || 1, params.radialSegments || 32);
            case 'plane':
                return new THREE.PlaneGeometry(params.width || 1, params.height || 1);
            case 'cone':
                return new THREE.ConeGeometry(params.radius || 1, params.height || 1, params.radialSegments || 32);
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }
    
    createMaterial(type, params) {
        switch(type) {
            case 'basic':
                return new THREE.MeshBasicMaterial(params);
            case 'standard':
                return new THREE.MeshStandardMaterial(params);
            case 'phong':
                return new THREE.MeshPhongMaterial(params);
            case 'lambert':
                return new THREE.MeshLambertMaterial(params);
            default:
                return new THREE.MeshStandardMaterial(params);
        }
    }
    
    createMesh(geometryType, materialType, geometryParams, materialParams) {
        const geometry = this.createGeometry(geometryType, geometryParams);
        const material = this.createMaterial(materialType, materialParams);
        const mesh = new THREE.Mesh(geometry, material);
        
        // 그림자 설정
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }
    
    // 파티클 시스템
    createParticleSystem(count, params) {
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        const color = new THREE.Color(params.color || 0xffffff);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * (params.spread || 100);
            positions[i * 3 + 1] = (Math.random() - 0.5) * (params.spread || 100);
            positions[i * 3 + 2] = (Math.random() - 0.5) * (params.spread || 100);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = params.size || 1;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: params.size || 1,
            vertexColors: true,
            transparent: true,
            opacity: params.opacity || 1
        });
        
        return new THREE.Points(particles, material);
    }
    
    // 텍스처 로더
    loadTexture(path) {
        const loader = new THREE.TextureLoader();
        return loader.load(path);
    }
    
    // 사운드 관련 (Web Audio API)
    createAudioListener() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);
        return listener;
    }
    
    createAudio(listener, path, volume = 0.5) {
        const sound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        
        audioLoader.load(path, (buffer) => {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(volume);
        });
        
        return sound;
    }
    
    createPositionalAudio(listener, path, volume = 0.5) {
        const sound = new THREE.PositionalAudio(listener);
        const audioLoader = new THREE.AudioLoader();
        
        audioLoader.load(path, (buffer) => {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(volume);
            sound.setRefDistance(10);
        });
        
        return sound;
    }
}