"""Tests for Agent-Mesh-Sim-XR package."""

import json
import os
import subprocess
import sys
import tempfile

import numpy as np
import pytest

from agent_mesh_sim_xr import AgentSwarm, CausalTraceRewind, PhysicsSimulator, XRSceneExporter


# ---------------------------------------------------------------------------
# AgentSwarm tests
# ---------------------------------------------------------------------------

def test_agent_swarm_initializes_with_correct_count():
    swarm = AgentSwarm(10)
    assert swarm.n_agents == 10


def test_agent_swarm_get_positions_shape():
    n = 7
    swarm = AgentSwarm(n)
    pos = swarm.get_positions()
    assert pos.shape == (n, 2)


def test_agent_swarm_roles_assignment_default_cycle():
    swarm = AgentSwarm(6)
    # Default cycle: worker, leader, scout, worker, leader, scout
    expected = ["worker", "leader", "scout", "worker", "leader", "scout"]
    assert swarm._roles == expected


def test_agent_swarm_roles_assignment_custom():
    roles = ["leader", "worker", "scout"]
    swarm = AgentSwarm(3, roles=roles)
    assert swarm._roles == roles


def test_agent_swarm_get_agent_returns_correct_keys():
    swarm = AgentSwarm(5)
    agent = swarm.get_agent(2)
    assert set(agent.keys()) == {"index", "position", "velocity", "role"}
    assert agent["index"] == 2
    assert agent["position"].shape == (2,)
    assert agent["velocity"].shape == (2,)


def test_agent_swarm_set_velocities():
    swarm = AgentSwarm(4)
    vels = np.ones((4, 2)) * 3.0
    swarm.set_velocities(vels)
    np.testing.assert_array_equal(swarm.get_velocities(), vels)


# ---------------------------------------------------------------------------
# PhysicsSimulator tests
# ---------------------------------------------------------------------------

def test_physics_simulator_step_updates_positions():
    swarm = AgentSwarm(5)
    # Give agents some velocity
    swarm.set_velocities(np.ones((5, 2)) * 1.0)
    initial_pos = swarm.get_positions().copy()

    sim = PhysicsSimulator(bounds=None)
    sim.step(swarm, dt=0.1)

    new_pos = swarm.get_positions()
    assert not np.allclose(initial_pos, new_pos), "Positions should have changed"


def test_physics_simulator_collision_avoidance_pushes_agents_apart():
    """Two agents placed very close together should move apart after a step."""
    swarm = AgentSwarm(2)
    # Place agents 1 unit apart (well within repulsion_radius=5)
    swarm._set_positions(np.array([[10.0, 10.0], [10.5, 10.0]]))
    swarm.set_velocities(np.zeros((2, 2)))

    sim = PhysicsSimulator(repulsion_radius=5.0, repulsion_strength=5.0, bounds=None)
    sim.step(swarm, dt=0.5)

    new_pos = swarm.get_positions()
    dist_after = np.linalg.norm(new_pos[0] - new_pos[1])
    assert dist_after > 0.5, f"Agents should have been pushed apart, distance={dist_after}"


def test_physics_simulator_flocking_reduces_velocity_spread():
    """After applying flocking many times, velocity vectors should converge."""
    rng = np.random.default_rng(0)
    n = 20
    swarm = AgentSwarm(n)
    swarm._set_positions(rng.uniform(0, 20, size=(n, 2)))
    swarm.set_velocities(rng.uniform(-3, 3, size=(n, 2)))

    sim = PhysicsSimulator(flocking_radius=50.0, bounds=(100.0, 100.0))

    # Run many flocking + step cycles
    for _ in range(100):
        sim.apply_flocking(swarm)
        sim.step(swarm, dt=0.1)

    # After convergence, standard deviation of speeds should be low
    vels = swarm.get_velocities()
    speeds = np.linalg.norm(vels, axis=1)
    assert speeds.std() < 2.0, f"Speeds did not converge; std={speeds.std():.3f}"


# ---------------------------------------------------------------------------
# CausalTraceRewind tests
# ---------------------------------------------------------------------------

def test_causal_trace_rewind_records_states():
    swarm = AgentSwarm(5)
    recorder = CausalTraceRewind()
    recorder.record(0, swarm)
    assert recorder.num_recorded() == 1


def test_causal_trace_rewind_replay_returns_correct_number():
    swarm = AgentSwarm(3)
    recorder = CausalTraceRewind()
    for t in range(10):
        recorder.record(t, swarm)

    replayed = list(recorder.replay(from_timestep=0))
    assert len(replayed) == 10


def test_causal_trace_rewind_get_state_retrieves_specific_timestep():
    swarm = AgentSwarm(4)
    recorder = CausalTraceRewind()

    # Record with known positions
    swarm._set_positions(np.full((4, 2), 7.0))
    recorder.record(5, swarm)

    swarm._set_positions(np.full((4, 2), 99.0))
    recorder.record(6, swarm)

    state = recorder.get_state(5)
    assert state["timestep"] == 5
    np.testing.assert_array_equal(state["positions"], np.full((4, 2), 7.0))


def test_causal_trace_rewind_replay_from_offset():
    swarm = AgentSwarm(2)
    recorder = CausalTraceRewind()
    for t in range(5):
        recorder.record(t, swarm)

    replayed = list(recorder.replay(from_timestep=3))
    assert len(replayed) == 2  # timesteps 3 and 4


# ---------------------------------------------------------------------------
# XRSceneExporter tests
# ---------------------------------------------------------------------------

def test_xr_scene_exporter_export_frame_returns_dict_with_agents():
    swarm = AgentSwarm(6)
    exporter = XRSceneExporter()
    frame = exporter.export_frame(swarm, timestep=0)

    assert isinstance(frame, dict)
    assert "agents" in frame
    assert len(frame["agents"]) == 6
    assert frame["timestep"] == 0

    agent0 = frame["agents"][0]
    assert "position" in agent0
    assert len(agent0["position"]) == 3  # x, y, z
    assert agent0["position"][2] == 0.0  # z is always 0


def test_xr_scene_exporter_export_sequence_writes_file():
    swarm = AgentSwarm(5)
    recorder = CausalTraceRewind()
    for t in range(3):
        recorder.record(t, swarm)

    exporter = XRSceneExporter()
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as fh:
        tmp_path = fh.name

    try:
        exporter.export_sequence(recorder, tmp_path)
        assert os.path.exists(tmp_path)

        with open(tmp_path) as fh:
            data = json.load(fh)

        assert "frames" in data
        assert len(data["frames"]) == 3
    finally:
        os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Demo integration test
# ---------------------------------------------------------------------------

def test_demo_runs_and_creates_output_file():
    output = "/tmp/xr_scene_test.json"
    # Remove stale file
    if os.path.exists(output):
        os.remove(output)

    # Run demo.py as a subprocess to ensure it works end-to-end
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    demo_script = os.path.join(repo_root, "demo.py")

    # Patch the output path by running with a modified env
    result = subprocess.run(
        [sys.executable, demo_script],
        capture_output=True,
        text=True,
        cwd=repo_root,
        timeout=120,
    )
    assert result.returncode == 0, f"demo.py failed:\n{result.stderr}"
    # demo.py writes to /tmp/xr_scene.json by default
    assert os.path.exists("/tmp/xr_scene.json"), "demo.py should create /tmp/xr_scene.json"
