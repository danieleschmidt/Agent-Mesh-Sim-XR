"""Export agent positions as JSON for a WebXR viewer."""

from __future__ import annotations

import json
from pathlib import Path

from .agent_swarm import AgentSwarm
from .causal_trace_rewind import CausalTraceRewind


class XRSceneExporter:
    """
    Converts agent-swarm state to JSON structures understood by a WebXR
    front-end.  Coordinates are exported as [x, y, 0] (z=0 for 2-D sim).
    """

    # ------------------------------------------------------------------
    # Single-frame export
    # ------------------------------------------------------------------

    def export_frame(self, swarm: AgentSwarm, timestep: int) -> dict:
        """
        Return a dict representing one frame of the XR scene.

        Structure::

            {
                "timestep": <int>,
                "agents": [
                    {
                        "id": 0,
                        "position": [x, y, 0.0],
                        "velocity": [vx, vy, 0.0],
                        "role": "worker"
                    },
                    ...
                ]
            }
        """
        positions = swarm.get_positions()
        velocities = swarm.get_velocities()

        agents = []
        for i in range(swarm.n_agents):
            agents.append(
                {
                    "id": i,
                    "position": [float(positions[i, 0]), float(positions[i, 1]), 0.0],
                    "velocity": [float(velocities[i, 0]), float(velocities[i, 1]), 0.0],
                    "role": swarm._roles[i],
                }
            )

        return {"timestep": timestep, "agents": agents}

    # ------------------------------------------------------------------
    # Sequence export
    # ------------------------------------------------------------------

    def export_sequence(
        self, recorder: CausalTraceRewind, output_file: str | Path
    ) -> None:
        """
        Write a JSON file containing all recorded timesteps.

        Structure::

            {
                "frames": [ <frame_dict>, ... ]
            }
        """
        frames = []
        for state in recorder.replay(from_timestep=0):
            # Reconstruct a minimal swarm-like object from state
            from .agent_swarm import AgentSwarm
            import numpy as np

            swarm = AgentSwarm(state["n_agents"], roles=state["roles"])
            swarm._set_positions(state["positions"])
            swarm.set_velocities(state["velocities"])

            frame = self.export_frame(swarm, state["timestep"])
            frames.append(frame)

        output = {"frames": frames}

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as fh:
            json.dump(output, fh, indent=2)
