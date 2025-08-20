"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSwarmVisualizer = void 0;
const three_1 = require("three");
const Logger_1 = require("../utils/Logger");
class SimpleSwarmVisualizer {
    scene;
    agentGroup;
    agentMeshes = new Map();
    config;
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.agentGroup = new three_1.Group();
        this.scene.add(this.agentGroup);
        Logger_1.logger.info('SimpleSwarmVisualizer', 'Simple swarm visualizer initialized');
    }
    addAgent(agent) {
        const geometry = new three_1.SphereGeometry(0.1, 8, 6);
        const material = new three_1.MeshLambertMaterial({
            color: this.getAgentColor(agent)
        });
        const mesh = new three_1.Mesh(geometry, material);
        mesh.position.copy(agent.position);
        mesh.userData = { agentId: agent.id };
        this.agentMeshes.set(agent.id, mesh);
        this.agentGroup.add(mesh);
    }
    updateAgent(agent) {
        const mesh = this.agentMeshes.get(agent.id);
        if (mesh) {
            mesh.position.copy(agent.position);
            const material = mesh.material;
            material.color = this.getAgentColor(agent);
        }
    }
    removeAgent(agentId) {
        const mesh = this.agentMeshes.get(agentId);
        if (mesh) {
            this.agentGroup.remove(mesh);
            this.agentMeshes.delete(agentId);
        }
    }
    updateAgents(agents) {
        agents.forEach(agent => this.updateAgent(agent));
    }
    update() {
        // Simple update method for compatibility
        // In the full version, this would handle LOD updates, etc.
    }
    getAgentColor(agent) {
        switch (agent.currentState.status) {
            case 'active': return new three_1.Color(0x00ff00);
            case 'idle': return new three_1.Color(0xffff00);
            case 'error': return new three_1.Color(0xff0000);
            case 'paused': return new three_1.Color(0x808080);
            default: return new three_1.Color(0xffffff);
        }
    }
    getAgentCount() {
        return this.agentMeshes.size;
    }
    dispose() {
        this.agentMeshes.clear();
        this.scene.remove(this.agentGroup);
        Logger_1.logger.info('SimpleSwarmVisualizer', 'Simple swarm visualizer disposed');
    }
}
exports.SimpleSwarmVisualizer = SimpleSwarmVisualizer;
