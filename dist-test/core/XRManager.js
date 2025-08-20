"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XRManager = void 0;
const eventemitter3_1 = require("eventemitter3");
const three_1 = require("three");
class XRManager extends eventemitter3_1.EventEmitter {
    renderer;
    scene;
    camera;
    xrSession = null;
    config;
    isXRSupported = false;
    constructor(config) {
        super();
        this.config = config;
        this.scene = new three_1.Scene();
        // Handle test environment where window may not be available
        const width = (typeof window !== 'undefined' ? window.innerWidth : 1024) || 1024;
        const height = (typeof window !== 'undefined' ? window.innerHeight : 768) || 768;
        this.camera = new three_1.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.renderer = new three_1.WebGLRenderer({
            antialias: true,
            canvas: typeof document !== 'undefined' ? undefined : this.createOffscreenCanvas()
        });
        this.setupRenderer();
        this.setupScene();
        this.checkXRSupport();
    }
    createOffscreenCanvas() {
        // Create mock canvas for testing environment
        const canvas = {
            width: 1024,
            height: 768,
            clientWidth: 1024,
            clientHeight: 768,
            addEventListener: () => { },
            removeEventListener: () => { },
            getContext: () => null
        };
        return canvas;
    }
    setupRenderer() {
        const width = (typeof window !== 'undefined' ? window.innerWidth : 1024) || 1024;
        const height = (typeof window !== 'undefined' ? window.innerHeight : 768) || 768;
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.xr.enabled = true;
        // Only append to DOM if in browser environment
        if (typeof document !== 'undefined' && document.body) {
            document.body.appendChild(this.renderer.domElement);
        }
        // Only add resize listener in browser environment
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }
    }
    setupScene() {
        this.scene.background = new three_1.Color(0x0a0a0a);
        // Lighting
        const ambientLight = new three_1.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new three_1.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        // Grid for spatial reference
        const gridHelper = new three_1.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        // Initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }
    async checkXRSupport() {
        if (typeof navigator !== 'undefined' && 'xr' in navigator) {
            try {
                const vrSupported = this.config.vrSupported &&
                    await navigator.xr.isSessionSupported('immersive-vr');
                const arSupported = this.config.arSupported &&
                    await navigator.xr.isSessionSupported('immersive-ar');
                this.isXRSupported = vrSupported || arSupported;
                this.emit('xrSupportDetected', { vrSupported, arSupported });
            }
            catch (error) {
                this.emit('error', new Error(`XR support detection failed: ${error}`));
                this.isXRSupported = false;
            }
        }
    }
    async startSession(config) {
        if (!this.isXRSupported) {
            throw new Error('XR not supported on this device');
        }
        try {
            const sessionInit = {
                requiredFeatures: [config.referenceSpace]
            };
            if (config.controllers) {
                sessionInit.optionalFeatures = ['hand-tracking'];
            }
            this.xrSession = await navigator.xr.requestSession(config.mode, sessionInit);
            await this.renderer.xr.setSession(this.xrSession);
            if (this.xrSession) {
                this.xrSession.addEventListener('end', () => {
                    this.xrSession = null;
                    this.emit('sessionEnd');
                });
            }
            this.emit('sessionStart', config);
        }
        catch (error) {
            throw new Error(`Failed to start XR session: ${error}`);
        }
    }
    async endSession() {
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
        }
    }
    getScene() {
        return this.scene;
    }
    getCamera() {
        return this.camera;
    }
    getRenderer() {
        return this.renderer;
    }
    isInXR() {
        return this.xrSession !== null;
    }
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    async resetSession() {
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
        }
    }
    dispose() {
        if (this.xrSession) {
            this.xrSession.end();
        }
        this.renderer.dispose();
        if (document.body.contains(this.renderer.domElement)) {
            document.body.removeChild(this.renderer.domElement);
        }
        this.removeAllListeners();
    }
}
exports.XRManager = XRManager;
