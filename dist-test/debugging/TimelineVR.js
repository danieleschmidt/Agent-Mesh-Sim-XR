"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineVR = void 0;
const eventemitter3_1 = require("eventemitter3");
const three_1 = require("three");
class TimelineVR extends eventemitter3_1.EventEmitter {
    config;
    group;
    timelineBar;
    events = [];
    currentTimeMarker;
    timeRange;
    constructor(config) {
        super();
        this.config = config;
        this.group = new three_1.Group();
        this.group.position.copy(config.position);
        this.timeRange = config.timeRange || {
            start: Date.now() - 60000, // 1 minute ago
            end: Date.now()
        };
        this.createTimelineBar();
        this.createTimeMarker();
    }
    createTimelineBar() {
        const geometry = new three_1.BoxGeometry(this.config.length, 0.05, 0.2);
        const material = new three_1.MeshLambertMaterial({ color: 0x333333 });
        this.timelineBar = new three_1.Mesh(geometry, material);
        this.timelineBar.userData = { type: 'timeline-bar' };
        this.group.add(this.timelineBar);
        // Add time scale markers
        this.createTimeScaleMarkers();
    }
    createTimeScaleMarkers() {
        const markerCount = 10;
        const markerGeometry = new three_1.BoxGeometry(0.02, 0.1, 0.02);
        const markerMaterial = new three_1.MeshLambertMaterial({ color: 0x666666 });
        for (let i = 0; i <= markerCount; i++) {
            const marker = new three_1.Mesh(markerGeometry, markerMaterial);
            const x = (i / markerCount - 0.5) * this.config.length;
            marker.position.set(x, -0.1, 0);
            this.group.add(marker);
        }
    }
    createTimeMarker() {
        const geometry = new three_1.BoxGeometry(0.05, this.config.height, 0.05);
        const material = new three_1.MeshLambertMaterial({ color: 0xff0000 });
        this.currentTimeMarker = new three_1.Mesh(geometry, material);
        this.currentTimeMarker.position.y = this.config.height / 2;
        this.currentTimeMarker.userData = { type: 'time-marker' };
        this.group.add(this.currentTimeMarker);
        this.updateTimeMarkerPosition(this.timeRange.end);
    }
    addEvents(events) {
        // Clear existing events
        this.clearEvents();
        events.forEach(event => this.addEvent(event));
    }
    addEvent(event) {
        const position = this.timestampToPosition(event.timestamp);
        const eventMesh = this.createEventMesh(event);
        eventMesh.position.copy(position);
        this.group.add(eventMesh);
        const timelineEvent = {
            timestamp: event.timestamp,
            event,
            position,
            mesh: eventMesh
        };
        this.events.push(timelineEvent);
        // Sort events by timestamp
        this.events.sort((a, b) => a.timestamp - b.timestamp);
    }
    createEventMesh(event) {
        const size = this.getEventSize(event);
        const color = this.getEventColor(event);
        const geometry = new three_1.BoxGeometry(size, size, size);
        const material = new three_1.MeshLambertMaterial({ color });
        const mesh = new three_1.Mesh(geometry, material);
        mesh.userData = {
            type: 'timeline-event',
            event,
            originalColor: color
        };
        return mesh;
    }
    getEventSize(event) {
        const baseSizes = {
            message: 0.05,
            stateChange: 0.08,
            decision: 0.1
        };
        return baseSizes[event.type] || 0.06;
    }
    getEventColor(event) {
        const typeColors = {
            message: 0x00ff00,
            stateChange: 0xff0000,
            decision: 0x0000ff
        };
        return typeColors[event.type] || 0x666666;
    }
    timestampToPosition(timestamp) {
        const timeSpan = this.timeRange.end - this.timeRange.start;
        const normalizedTime = (timestamp - this.timeRange.start) / timeSpan;
        const x = (normalizedTime - 0.5) * this.config.length;
        return new three_1.Vector3(x, 0.2, 0);
    }
    positionToTimestamp(x) {
        const normalizedX = (x / this.config.length) + 0.5;
        return this.timeRange.start + (normalizedX * (this.timeRange.end - this.timeRange.start));
    }
    focusOn(timestamp) {
        this.updateTimeMarkerPosition(timestamp);
        this.emit('focus', timestamp);
    }
    updateTimeMarkerPosition(timestamp) {
        const position = this.timestampToPosition(timestamp);
        this.currentTimeMarker.position.x = position.x;
    }
    onScrub(callback) {
        this.on('scrub', callback);
    }
    handleControllerInteraction(controllerPosition) {
        // Convert controller position to timeline local space
        const localPosition = this.group.worldToLocal(controllerPosition.clone());
        // Check if interacting with timeline bar
        if (Math.abs(localPosition.z) < 0.3 &&
            Math.abs(localPosition.y) < 0.3 &&
            Math.abs(localPosition.x) < this.config.length / 2) {
            const timestamp = this.positionToTimestamp(localPosition.x);
            this.updateTimeMarkerPosition(timestamp);
            this.emit('scrub', timestamp);
        }
    }
    handleControllerEnd() {
        // Handle controller end interaction
    }
    setTimeRange(start, end) {
        this.timeRange = { start, end };
        // Reposition all events
        this.events.forEach(timelineEvent => {
            const newPosition = this.timestampToPosition(timelineEvent.timestamp);
            timelineEvent.mesh.position.copy(newPosition);
            timelineEvent.position = newPosition;
        });
        // Update current time marker
        this.updateTimeMarkerPosition(this.getCurrentTime());
    }
    rewind(seconds) {
        const currentTime = this.getCurrentTime();
        const newTime = Math.max(currentTime - (seconds * 1000), this.timeRange.start);
        this.focusOn(newTime);
        this.emit('rewind', newTime);
    }
    fastForward(seconds) {
        const currentTime = this.getCurrentTime();
        const newTime = Math.min(currentTime + (seconds * 1000), this.timeRange.end);
        this.focusOn(newTime);
        this.emit('fastForward', newTime);
    }
    getCurrentTime() {
        const markerX = this.currentTimeMarker.position.x;
        return this.positionToTimestamp(markerX);
    }
    highlightEventsByAgent(agentId) {
        this.events.forEach(timelineEvent => {
            const material = timelineEvent.mesh.material;
            if (timelineEvent.event.agentId === agentId) {
                material.color = new three_1.Color(0xffff00); // Yellow highlight
                material.emissive = new three_1.Color(0x222200);
            }
            else {
                material.color = new three_1.Color(timelineEvent.mesh.userData.originalColor);
                material.emissive = new three_1.Color(0x000000);
            }
        });
    }
    highlightEventsByType(eventType) {
        this.events.forEach(timelineEvent => {
            const material = timelineEvent.mesh.material;
            if (timelineEvent.event.type === eventType) {
                material.color = new three_1.Color(0xffff00); // Yellow highlight
                material.emissive = new three_1.Color(0x222200);
            }
            else {
                material.color = new three_1.Color(timelineEvent.mesh.userData.originalColor);
                material.emissive = new three_1.Color(0x000000);
            }
        });
    }
    clearHighlights() {
        this.events.forEach(timelineEvent => {
            const material = timelineEvent.mesh.material;
            material.color = new three_1.Color(timelineEvent.mesh.userData.originalColor);
            material.emissive = new three_1.Color(0x000000);
        });
    }
    clearEvents() {
        this.events.forEach(timelineEvent => {
            this.group.remove(timelineEvent.mesh);
        });
        this.events = [];
    }
    getGroup() {
        return this.group;
    }
    getEventsInTimeRange(start, end) {
        return this.events
            .filter(timelineEvent => timelineEvent.timestamp >= start && timelineEvent.timestamp <= end)
            .map(timelineEvent => timelineEvent.event);
    }
    dispose() {
        this.clearEvents();
        this.removeAllListeners();
    }
}
exports.TimelineVR = TimelineVR;
