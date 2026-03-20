# Agent-Mesh-Sim-XR

A Python simulation framework for multi-agent swarms in 2-D space, with physics-based collision avoidance, flocking behaviours, causal trace & rewind, and WebXR-ready JSON export.

## Features

| Module | What it does |
|---|---|
| `AgentSwarm` | Manages N agents with 2-D position, velocity, and role (`worker`/`leader`/`scout`) |
| `PhysicsSimulator` | Euler integration, pairwise repulsion collision avoidance, flocking (separation / alignment / cohesion) |
| `CausalTraceRewind` | Records per-timestep snapshots; supports replay and point-in-time retrieval |
| `XRSceneExporter` | Serialises swarm state to JSON for a WebXR front-end |

## Requirements

- Python ≥ 3.10
- NumPy

## Installation

```bash
pip install numpy
```

No other dependencies required.

## Quick Start

```python
import numpy as np
from agent_mesh_sim_xr import AgentSwarm, PhysicsSimulator, CausalTraceRewind, XRSceneExporter

# Create 50-agent swarm
swarm = AgentSwarm(50)
swarm._set_positions(np.random.uniform(0, 100, (50, 2)))
swarm.set_velocities(np.random.uniform(-1, 1, (50, 2)))

sim      = PhysicsSimulator()
recorder = CausalTraceRewind()
exporter = XRSceneExporter()

for t in range(100):
    recorder.record(t, swarm)
    sim.apply_flocking(swarm)
    sim.step(swarm, dt=0.1)

exporter.export_sequence(recorder, "scene.json")
```

## Demo

Run the included demo (100 agents, 50 steps → `/tmp/xr_scene.json`):

```bash
python demo.py
```

## Tests

```bash
python -m pytest tests/ -v
```

## Architecture

```
agent_mesh_sim_xr/
├── __init__.py              # Public exports
├── agent_swarm.py           # AgentSwarm dataclass + accessors
├── physics_simulator.py     # Euler step, repulsion, flocking
├── causal_trace_rewind.py   # Snapshot history + replay
└── xr_scene_exporter.py     # JSON serialisation for WebXR
tests/
└── test_agent_mesh_sim.py   # 12 pytest tests
demo.py                      # 100-agent end-to-end demo
```

## WebXR JSON Format

Each exported frame looks like:

```json
{
  "timestep": 42,
  "agents": [
    {
      "id": 0,
      "position": [23.4, 57.1, 0.0],
      "velocity": [0.8, -0.3, 0.0],
      "role": "worker"
    }
  ]
}
```

The `z` component is always `0.0` for the 2-D simulation.

## License

MIT
