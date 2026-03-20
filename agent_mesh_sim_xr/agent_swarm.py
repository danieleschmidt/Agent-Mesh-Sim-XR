"""Agent swarm — N agents with position, velocity, and role."""

from __future__ import annotations

import numpy as np


VALID_ROLES = {"worker", "leader", "scout"}


class AgentSwarm:
    """Collection of N agents living in 2-D space."""

    def __init__(self, n_agents: int, roles: list[str] | None = None) -> None:
        if n_agents <= 0:
            raise ValueError("n_agents must be positive")

        self.n_agents = n_agents

        # Positions and velocities: shape (N, 2)
        self._positions = np.zeros((n_agents, 2), dtype=float)
        self._velocities = np.zeros((n_agents, 2), dtype=float)

        if roles is not None:
            if len(roles) != n_agents:
                raise ValueError("len(roles) must equal n_agents")
            for r in roles:
                if r not in VALID_ROLES:
                    raise ValueError(f"Invalid role '{r}'. Must be one of {VALID_ROLES}")
            self._roles: list[str] = list(roles)
        else:
            # Default: cycle through worker / leader / scout
            role_cycle = ["worker", "leader", "scout"]
            self._roles = [role_cycle[i % 3] for i in range(n_agents)]

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------

    def get_positions(self) -> np.ndarray:
        """Return a copy of all positions, shape (N, 2)."""
        return self._positions.copy()

    def get_velocities(self) -> np.ndarray:
        """Return a copy of all velocities, shape (N, 2)."""
        return self._velocities.copy()

    def set_velocities(self, vels: np.ndarray) -> None:
        """Set velocities from an (N, 2) array."""
        vels = np.asarray(vels, dtype=float)
        if vels.shape != (self.n_agents, 2):
            raise ValueError(f"Expected shape ({self.n_agents}, 2), got {vels.shape}")
        self._velocities = vels.copy()

    def get_agent(self, i: int) -> dict:
        """Return a dict with position, velocity, and role for agent i."""
        if not 0 <= i < self.n_agents:
            raise IndexError(f"Agent index {i} out of range [0, {self.n_agents})")
        return {
            "index": i,
            "position": self._positions[i].copy(),
            "velocity": self._velocities[i].copy(),
            "role": self._roles[i],
        }

    # ------------------------------------------------------------------
    # Internal helpers (used by simulator)
    # ------------------------------------------------------------------

    def _set_positions(self, pos: np.ndarray) -> None:
        self._positions = np.asarray(pos, dtype=float).copy()
