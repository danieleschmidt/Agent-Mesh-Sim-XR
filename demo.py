#!/usr/bin/env python3
"""
Demo: 100-agent flock simulation — 50 steps, exported to /tmp/xr_scene.json
"""

import numpy as np

from agent_mesh_sim_xr import AgentSwarm, PhysicsSimulator, CausalTraceRewind, XRSceneExporter


def main() -> None:
    N_AGENTS = 100
    N_STEPS = 50
    OUTPUT_FILE = "/tmp/xr_scene.json"

    rng = np.random.default_rng(42)

    # Create swarm with random positions and velocities
    swarm = AgentSwarm(N_AGENTS)
    swarm._set_positions(rng.uniform(0, 100, size=(N_AGENTS, 2)))
    swarm.set_velocities(rng.uniform(-1, 1, size=(N_AGENTS, 2)))

    sim = PhysicsSimulator(
        repulsion_radius=5.0,
        repulsion_strength=2.0,
        max_speed=3.0,
        bounds=(100.0, 100.0),
    )
    recorder = CausalTraceRewind()
    exporter = XRSceneExporter()

    for step in range(N_STEPS):
        recorder.record(step, swarm)
        sim.apply_flocking(swarm)
        sim.step(swarm, dt=0.1)

    # Record final state
    recorder.record(N_STEPS, swarm)

    exporter.export_sequence(recorder, OUTPUT_FILE)
    print(f"Exported {recorder.num_recorded()} frames to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
