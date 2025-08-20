"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeController = void 0;
const eventemitter3_1 = require("eventemitter3");
class TimeController extends eventemitter3_1.EventEmitter {
    config;
    history = [];
    currentFrame = 0;
    recording = true;
    lastRecordTime = 0;
    recordInterval;
    cleanupInterval;
    constructor(config) {
        super();
        this.config = config;
        this.startRecording();
    }
    startRecording() {
        this.recordInterval = setInterval(() => {
            if (this.recording) {
                this.recordFrame();
            }
        }, this.config.recordInterval * 1000);
        // Clean up old frames
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldFrames();
        }, 10000); // Every 10 seconds
    }
    recordFrame() {
        const now = Date.now();
        if (now - this.lastRecordTime < this.config.recordInterval * 1000) {
            return;
        }
        const frame = {
            timestamp: now,
            agents: new Map(), // Would be populated from current agent state
            systemState: this.captureSystemState()
        };
        this.history.push(frame);
        this.currentFrame = this.history.length - 1;
        this.lastRecordTime = now;
    }
    captureSystemState() {
        return {
            frameCount: this.history.length,
            timestamp: Date.now(),
            performance: {
                fps: this.estimateFPS(),
                memoryUsage: this.getMemoryUsage()
            }
        };
    }
    estimateFPS() {
        if (this.history.length < 2)
            return 0;
        const recent = this.history.slice(-10);
        const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
        return (recent.length - 1) / (timeSpan / 1000);
    }
    getMemoryUsage() {
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
    }
    cleanupOldFrames() {
        const maxAge = this.config.maxRewind * 1000;
        const cutoffTime = Date.now() - maxAge;
        this.history = this.history.filter(frame => frame.timestamp > cutoffTime);
        if (this.currentFrame >= this.history.length) {
            this.currentFrame = Math.max(0, this.history.length - 1);
        }
    }
    rewindTo(timestamp) {
        const targetFrame = this.findFrameByTimestamp(timestamp);
        if (targetFrame === -1) {
            return false;
        }
        this.currentFrame = targetFrame;
        const frame = this.history[targetFrame];
        this.emit('rewind', timestamp);
        this.emit('frameChanged', frame);
        return true;
    }
    rewindFrames(frames) {
        const targetFrame = Math.max(0, this.currentFrame - frames);
        if (targetFrame === this.currentFrame) {
            return false;
        }
        this.currentFrame = targetFrame;
        const frame = this.history[targetFrame];
        this.emit('rewind', frame.timestamp);
        this.emit('frameChanged', frame);
        return true;
    }
    fastForward(frames) {
        const targetFrame = Math.min(this.history.length - 1, this.currentFrame + frames);
        if (targetFrame === this.currentFrame) {
            return false;
        }
        this.currentFrame = targetFrame;
        const frame = this.history[targetFrame];
        this.emit('fastForward', frame.timestamp);
        this.emit('frameChanged', frame);
        return true;
    }
    pause() {
        this.recording = false;
        this.emit('paused');
    }
    resume() {
        this.recording = true;
        this.emit('resumed');
    }
    isRecording() {
        return this.recording;
    }
    getCurrentTimestamp() {
        if (this.history.length === 0)
            return Date.now();
        return this.history[this.currentFrame].timestamp;
    }
    getTimeRange() {
        if (this.history.length === 0) {
            const now = Date.now();
            return { start: now, end: now };
        }
        return {
            start: this.history[0].timestamp,
            end: this.history[this.history.length - 1].timestamp
        };
    }
    findFrameByTimestamp(timestamp) {
        let closest = -1;
        let minDiff = Infinity;
        for (let i = 0; i < this.history.length; i++) {
            const diff = Math.abs(this.history[i].timestamp - timestamp);
            if (diff < minDiff) {
                minDiff = diff;
                closest = i;
            }
        }
        return closest;
    }
    update() {
        if (this.recording) {
            this.recordFrame();
        }
    }
    getHistoryLength() {
        return this.history.length;
    }
    getCurrentFrame() {
        if (this.currentFrame < 0 || this.currentFrame >= this.history.length) {
            return null;
        }
        return this.history[this.currentFrame];
    }
    dispose() {
        this.recording = false;
        if (this.recordInterval) {
            clearInterval(this.recordInterval);
            this.recordInterval = undefined;
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.history = [];
        this.removeAllListeners();
    }
}
exports.TimeController = TimeController;
