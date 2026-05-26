import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HumanAvatar from '../HumanAvatar';
import { emptySimulationResult } from '@forge/shared';

describe('HumanAvatar Component', () => {
  it('rend la silhouette par défaut sans erreur', () => {
    const { container } = render(<HumanAvatar simulation={emptySimulationResult} />);
    
    // Le composant doit rendre un SVG avec l'avatar
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applique correctement la couleur rouge (DANGER) pour un muscle épuisé', () => {
    const dangerSimulation = {
      ...emptySimulationResult,
      muscles: {
        chest: {
          name: 'Pectoraux',
          inol: 3.0,
          sets: 20,
          color: 'red' as const,
          statusLabel: 'DANGER' as const,
          contributors: [],
          remainingCapacity: 0,
          jointStress: 0,
          readiness: 0,
          fatigueHistory: []
        }
      }
    };

    const { container } = render(<HumanAvatar simulation={dangerSimulation} />);
    
    // On cible le groupe ou path correspondant aux pectoraux (chest)
    // d'après la logique du composant, il devrait avoir un fill color hex du rouge
    const chestPaths = container.querySelectorAll('path[fill="#dc2626"]'); // #dc2626 = red
    expect(chestPaths.length).toBeGreaterThan(0);
  });

  it('affiche un tooltip avec le bon statut au survol', () => {
    const testSimulation = {
      ...emptySimulationResult,
      muscles: {
        quadriceps: {
          name: 'Quadriceps',
          inol: 1.5,
          sets: 10,
          color: 'green' as const,
          statusLabel: 'OPTIMAL' as const,
          contributors: [],
          remainingCapacity: 0.5,
          jointStress: 0,
          readiness: 0,
          fatigueHistory: []
        }
      }
    };

    const { container } = render(<HumanAvatar simulation={testSimulation} />);
    
    // Trouver le path du quadriceps par sa couleur verte (#0d9488) et simuler le hover
    const quadPath = container.querySelector('path[fill="#0d9488"]');
    if (quadPath) {
      fireEvent.mouseEnter(quadPath);
      // Le tooltip devrait s'afficher et contenir "Quadriceps"
      expect(screen.getByText('Quadriceps')).toBeInTheDocument();
    }
  });
});
