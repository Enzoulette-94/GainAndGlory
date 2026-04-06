import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CircuitWizard } from '../../components/forms/CircuitWizard';
import { CircuitTemplates, CIRCUIT_TEMPLATES } from '../../components/forms/CircuitTemplates';

// ── DnD-kit mocks ─────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: class {},
  KeyboardSensor: class {},
  TouchSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (arr: any[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  },
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// ── CircuitWizard ─────────────────────────────────────────────────────────────

describe('CircuitWizard', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche l\'étape 1 avec les options d\'exercices', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText("Combien d'exercices ?")).toBeInTheDocument();
    expect(screen.getByTestId('wizard-option-2')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-option-3')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-option-6')).toBeInTheDocument();
  });

  it('affiche l\'indicateur de progression 1/3', () => {
    render(<CircuitWizard theme="violet" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('avance à l\'étape 2 après sélection d\'exercices', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('wizard-option-3'));
    expect(screen.getByText('Combien de rounds ?')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('avance à l\'étape 3 après sélection des rounds', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('wizard-option-3')); // étape 1
    fireEvent.click(screen.getByTestId('wizard-option-3')); // étape 2
    expect(screen.getByText('Repos entre les rounds ?')).toBeInTheDocument();
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('appelle onConfirm avec la config correcte à la fin', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('wizard-option-4')); // 4 exercices
    fireEvent.click(screen.getByTestId('wizard-option-3')); // 3 rounds
    fireEvent.click(screen.getByTestId('wizard-option-60')); // 60s repos
    expect(onConfirm).toHaveBeenCalledWith({
      exerciseCount: 4,
      rounds: 3,
      restBetweenRounds: 60,
    });
  });

  it('appelle onConfirm avec les valeurs par défaut si on clique directement', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    // Clique sur option déjà sélectionnée (3 exos = défaut)
    fireEvent.click(screen.getByTestId('wizard-option-3'));
    fireEvent.click(screen.getByTestId('wizard-option-3'));
    fireEvent.click(screen.getByTestId('wizard-option-60'));
    expect(onConfirm).toHaveBeenCalledWith({
      exerciseCount: 3,
      rounds: 3,
      restBetweenRounds: 60,
    });
  });

  it('appelle onCancel quand Annuler est cliqué', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('permet de revenir à l\'étape précédente', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('wizard-option-3')); // avance à étape 2
    expect(screen.getByText('Combien de rounds ?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('← Retour'));
    expect(screen.getByText("Combien d'exercices ?")).toBeInTheDocument();
  });

  it('ne montre pas le bouton Retour à l\'étape 1', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.queryByText('← Retour')).not.toBeInTheDocument();
  });

  it('fonctionne avec les thèmes violet et orange', () => {
    const { rerender } = render(<CircuitWizard theme="violet" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText("Combien d'exercices ?")).toBeInTheDocument();
    rerender(<CircuitWizard theme="orange" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText("Combien d'exercices ?")).toBeInTheDocument();
  });

  it('affiche les suffixes "s" à l\'étape 3 (repos)', () => {
    render(<CircuitWizard theme="red" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('wizard-option-3'));
    fireEvent.click(screen.getByTestId('wizard-option-3'));
    expect(screen.getByTestId('wizard-option-30')).toHaveTextContent('30s');
    expect(screen.getByTestId('wizard-option-90')).toHaveTextContent('90s');
  });
});

// ── CircuitTemplates ──────────────────────────────────────────────────────────

describe('CircuitTemplates', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le bouton templates', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    expect(screen.getByTestId('circuit-templates-btn')).toBeInTheDocument();
  });

  it('le dropdown est fermé par défaut', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    expect(screen.queryByTestId('circuit-templates-dropdown')).not.toBeInTheDocument();
  });

  it('ouvre le dropdown au clic', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    expect(screen.getByTestId('circuit-templates-dropdown')).toBeInTheDocument();
  });

  it('affiche les 4 templates', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    expect(screen.getByText('Push / Pull')).toBeInTheDocument();
    expect(screen.getByText('Corps entier')).toBeInTheDocument();
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    expect(screen.getByText('Core Blast')).toBeInTheDocument();
  });

  it('affiche les descriptions des templates', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    expect(screen.getByText('4 exos · 3 rounds · 60s repos')).toBeInTheDocument();
    expect(screen.getByText('5 exos · 3 rounds · 30s repos')).toBeInTheDocument();
  });

  it('appelle onSelect avec le bon template au clic', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    fireEvent.click(screen.getByTestId('template-Push / Pull'));
    expect(onSelect).toHaveBeenCalledWith(CIRCUIT_TEMPLATES[0]);
  });

  it('ferme le dropdown après sélection', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    fireEvent.click(screen.getByTestId('template-Core Blast'));
    expect(screen.queryByTestId('circuit-templates-dropdown')).not.toBeInTheDocument();
  });

  it('fonctionne avec les thèmes violet et orange', () => {
    const { rerender } = render(<CircuitTemplates theme="violet" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    expect(screen.getByTestId('circuit-templates-dropdown')).toBeInTheDocument();
    rerender(<CircuitTemplates theme="orange" onSelect={onSelect} />);
    expect(screen.getByTestId('circuit-templates-btn')).toBeInTheDocument();
  });

  it('les templates ont les bonnes configs', () => {
    expect(CIRCUIT_TEMPLATES[0]).toMatchObject({ exerciseCount: 4, rounds: 3, restBetweenRounds: 60 });
    expect(CIRCUIT_TEMPLATES[1]).toMatchObject({ exerciseCount: 6, rounds: 3, restBetweenRounds: 60 });
    expect(CIRCUIT_TEMPLATES[2]).toMatchObject({ exerciseCount: 4, rounds: 4, restBetweenRounds: 45 });
    expect(CIRCUIT_TEMPLATES[3]).toMatchObject({ exerciseCount: 5, rounds: 3, restBetweenRounds: 30 });
  });

  it('peut basculer le dropdown en recliquant', () => {
    render(<CircuitTemplates theme="red" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    expect(screen.getByTestId('circuit-templates-dropdown')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('circuit-templates-btn'));
    expect(screen.queryByTestId('circuit-templates-dropdown')).not.toBeInTheDocument();
  });
});

// ── CIRCUIT_TEMPLATES data ────────────────────────────────────────────────────

describe('CIRCUIT_TEMPLATES data', () => {
  it('contient exactement 4 templates', () => {
    expect(CIRCUIT_TEMPLATES).toHaveLength(4);
  });

  it('tous les templates ont les champs requis', () => {
    for (const tpl of CIRCUIT_TEMPLATES) {
      expect(tpl).toHaveProperty('name');
      expect(tpl).toHaveProperty('description');
      expect(tpl).toHaveProperty('exerciseCount');
      expect(tpl).toHaveProperty('rounds');
      expect(tpl).toHaveProperty('restBetweenRounds');
      expect(tpl.exerciseCount).toBeGreaterThan(0);
      expect(tpl.rounds).toBeGreaterThan(0);
      expect(tpl.restBetweenRounds).toBeGreaterThanOrEqual(0);
    }
  });
});
