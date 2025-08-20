import { EventEmitter } from 'eventemitter3';
import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import type { XRSessionConfig } from '../types';
interface XRManagerConfig {
    vrSupported: boolean;
    arSupported: boolean;
}
export declare class XRManager extends EventEmitter {
    private renderer;
    private scene;
    private camera;
    private xrSession;
    private config;
    private isXRSupported;
    constructor(config: XRManagerConfig);
    private createOffscreenCanvas;
    private setupRenderer;
    private setupScene;
    private checkXRSupport;
    startSession(config: XRSessionConfig): Promise<void>;
    endSession(): Promise<void>;
    getScene(): Scene;
    getCamera(): PerspectiveCamera;
    getRenderer(): WebGLRenderer;
    isInXR(): boolean;
    render(): void;
    resetSession(): Promise<void>;
    dispose(): void;
}
export {};
