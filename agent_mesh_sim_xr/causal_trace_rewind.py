"""Causal trace & rewind — record agent states at each timestep and replay them."""

from __future__ import annotations

from typing import Iterator

import numpy as np

from .agent_swarm import AgentSwarm


class CausalTraceRewind:
    """
    Records snapshots of an AgentSwarm at each timestep so you can replay
    or jump to any point in history.
    """

    def __init__(self) -> None:
        # Ordered list of (timestep, state_dict)
        self._history: list[tuple[int, dict]] = []

    # ------------------------------------------------------------------
    # Recording
    # ------------------------------------------------------------------

    def record(self, timestep: int, swarm: AgentSwarm) -> None:
        """Store a snapshot of *swarm* labelled with *timestep*."""
        state = {
            "timestep": timestep,
            "positions": swarm.get_positions(),   # (N, 2) copy
            "velocities": swarm.get_velocities(), # (N, 2) copy
            "roles": list(swarm._roles),
            "n_agents": swarm.n_agents,
        }
        self._history.append((timestep, state))

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def get_state(self, timestep: int) -> dict:
        """
        Return the recorded state for *timestep*.

        Raises KeyError if *timestep* was never recorded.
        """
        for ts, state in self._history:
            if ts == timestep:
                return state
        raise KeyError(f"Timestep {timestep} not found in history")

    def replay(self, from_timestep: int = 0) -> Iterator[dict]:
        """
        Yield recorded states in chronological order starting from
        *from_timestep* (inclusive).
        """
        for ts, state in self._history:
            if ts >= from_timestep:
                yield state

    def num_recorded(self) -> int:
        """Return the number of recorded snapshots."""
        return len(self._history)

    def clear(self) -> None:
        """Discard all history."""
        self._history.clear()
