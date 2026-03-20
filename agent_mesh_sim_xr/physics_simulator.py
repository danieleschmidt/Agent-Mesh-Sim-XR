"""2-D physics simulator with Euler integration, collision avoidance, and flocking."""

from __future__ import annotations

import numpy as np

from .agent_swarm import AgentSwarm


class PhysicsSimulator:
    """
    Simulates agent-swarm dynamics in 2-D using Euler integration.

    Parameters
    ----------
    repulsion_radius : float
        Distance below which agents exert repulsion on each other.
    repulsion_strength : float
        Magnitude of repulsion force (proportional to 1/distance).
    max_speed : float
        Maximum speed cap for any agent.
    bounds : tuple[float, float] | None
        If set to (width, height), positions are wrapped (toroidal topology).
        If None, positions are unclamped.
    """

    def __init__(
        self,
        repulsion_radius: float = 5.0,
        repulsion_strength: float = 2.0,
        max_speed: float = 3.0,
        bounds: tuple[float, float] | None = (100.0, 100.0),
        flocking_radius: float = 15.0,
        separation_weight: float = 1.5,
        alignment_weight: float = 1.0,
        cohesion_weight: float = 0.5,
    ) -> None:
        self.repulsion_radius = repulsion_radius
        self.repulsion_strength = repulsion_strength
        self.max_speed = max_speed
        self.bounds = bounds

        # Flocking weights
        self.separation_weight = separation_weight
        self.alignment_weight = alignment_weight
        self.cohesion_weight = cohesion_weight
        self.flocking_radius = flocking_radius

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def step(self, swarm: AgentSwarm, dt: float = 0.1) -> None:
        """Advance the simulation by one time step dt (Euler integration)."""
        positions = swarm.get_positions()   # (N, 2)
        velocities = swarm.get_velocities() # (N, 2)

        # Compute collision-avoidance forces
        forces = self._collision_avoidance(positions)

        # Update velocities
        velocities = velocities + forces * dt

        # Cap speed
        velocities = self._cap_speed(velocities)

        # Update positions
        positions = positions + velocities * dt

        # Apply boundary
        if self.bounds is not None:
            positions = self._wrap(positions)

        # Write back
        swarm._set_positions(positions)
        swarm.set_velocities(velocities)

    def apply_flocking(self, swarm: AgentSwarm) -> None:
        """
        Compute flocking forces (separation, alignment, cohesion) and apply
        them as a velocity nudge.  Does *not* advance time.
        """
        positions = swarm.get_positions()
        velocities = swarm.get_velocities()

        sep = self._separation(positions)
        ali = self._alignment(positions, velocities)
        coh = self._cohesion(positions)

        delta = (
            sep * self.separation_weight
            + ali * self.alignment_weight
            + coh * self.cohesion_weight
        )

        velocities = velocities + delta
        velocities = self._cap_speed(velocities)
        swarm.set_velocities(velocities)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _collision_avoidance(self, positions: np.ndarray) -> np.ndarray:
        """Return per-agent repulsion force vectors, shape (N, 2)."""
        n = len(positions)
        forces = np.zeros_like(positions)

        for i in range(n):
            for j in range(i + 1, n):
                diff = positions[i] - positions[j]  # vector i → j (from j to i)
                dist = np.linalg.norm(diff)
                if 0 < dist < self.repulsion_radius:
                    # Force magnitude proportional to 1/distance
                    magnitude = self.repulsion_strength / dist
                    direction = diff / dist
                    forces[i] += magnitude * direction
                    forces[j] -= magnitude * direction

        return forces

    def _separation(self, positions: np.ndarray) -> np.ndarray:
        """Steer to avoid crowding neighbors."""
        n = len(positions)
        steering = np.zeros_like(positions)

        for i in range(n):
            diff = positions[i] - positions  # (N, 2)
            dists = np.linalg.norm(diff, axis=1)  # (N,)
            mask = (dists > 0) & (dists < self.flocking_radius)
            if mask.any():
                # Weighted sum: closer neighbors push harder
                safe_dists = np.where(mask, dists, 1.0)
                weights = np.where(mask, 1.0 / safe_dists, 0.0)  # (N,)
                steering[i] = (diff * weights[:, None]).sum(axis=0)

        return steering

    def _alignment(self, positions: np.ndarray, velocities: np.ndarray) -> np.ndarray:
        """Steer towards the average heading of neighbors."""
        n = len(positions)
        steering = np.zeros_like(positions)

        for i in range(n):
            dists = np.linalg.norm(positions - positions[i], axis=1)
            mask = (dists > 0) & (dists < self.flocking_radius)
            if mask.any():
                avg_vel = velocities[mask].mean(axis=0)
                steering[i] = avg_vel - velocities[i]

        return steering

    def _cohesion(self, positions: np.ndarray) -> np.ndarray:
        """Steer towards the centre of mass of neighbors."""
        n = len(positions)
        steering = np.zeros_like(positions)

        for i in range(n):
            dists = np.linalg.norm(positions - positions[i], axis=1)
            mask = (dists > 0) & (dists < self.flocking_radius)
            if mask.any():
                centre = positions[mask].mean(axis=0)
                steering[i] = centre - positions[i]

        return steering

    def _cap_speed(self, velocities: np.ndarray) -> np.ndarray:
        speeds = np.linalg.norm(velocities, axis=1, keepdims=True)
        # Avoid division by zero
        safe_speeds = np.where(speeds > 0, speeds, 1.0)
        scale = np.where(speeds > self.max_speed, self.max_speed / safe_speeds, 1.0)
        return velocities * scale

    def _wrap(self, positions: np.ndarray) -> np.ndarray:
        w, h = self.bounds
        positions = positions.copy()
        positions[:, 0] = positions[:, 0] % w
        positions[:, 1] = positions[:, 1] % h
        return positions
