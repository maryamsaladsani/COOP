import { render, screen } from '@testing-library/react';
import MilestoneRoadmap from './MilestoneRoadmap';

// Regression test for the onboarding roadmap node/connector alignment fix. Uses the same
// {icon, name, tone, detail} shape getTrackSummaries() produces for the real 7-step
// onboarding sequence (Acceptance -> Company Card -> Department Assignment -> Division
// Assignment -> Account Credentials -> Desk & Device -> Certificate).
const SEVEN_STEPS = [
  { icon: <span>icon</span>, name: 'Acceptance', tone: 'complete', statusLabel: 'Accepted', detail: 'Accepted.' },
  { icon: <span>icon</span>, name: 'Company Card', tone: 'complete', statusLabel: 'Issued', detail: 'Ready to collect.' },
  { icon: <span>icon</span>, name: 'Department Assignment', tone: 'complete', statusLabel: 'Assigned', detail: 'Assigned.' },
  { icon: <span>icon</span>, name: 'Division Assignment', tone: 'pending', statusLabel: 'Pending', detail: 'Not assigned yet.' },
  { icon: <span>icon</span>, name: 'Account Credentials', tone: 'pending', statusLabel: 'Not requested', detail: 'Not requested yet.' },
  { icon: <span>icon</span>, name: 'Desk & Device', tone: 'pending', statusLabel: 'Not requested', detail: 'Not requested yet.' },
  { icon: <span>icon</span>, name: 'Certificate', tone: 'pending', statusLabel: 'Pending', detail: 'Pending.' },
];

describe('MilestoneRoadmap', () => {
  test('renders all 7 milestone nodes, in order, with their labels', () => {
    render(<MilestoneRoadmap steps={SEVEN_STEPS} />);

    const titles = screen.getAllByText(
      /Acceptance|Company Card|Department Assignment|Division Assignment|Account Credentials|Desk & Device|Certificate/
    );
    expect(titles).toHaveLength(7);
    expect(titles.map((t) => t.textContent)).toEqual([
      'Acceptance',
      'Company Card',
      'Department Assignment',
      'Division Assignment',
      'Account Credentials',
      'Desk & Device',
      'Certificate',
    ]);
  });

  test('renders exactly 6 connectors (one between each pair of 7 nodes), none before the first node', () => {
    const { container } = render(<MilestoneRoadmap steps={SEVEN_STEPS} />);
    const connectors = container.querySelectorAll('.milestone-roadmap__connector');
    expect(connectors).toHaveLength(6);
  });

  test('connector is green only when BOTH the step before and after it are complete', () => {
    const { container } = render(<MilestoneRoadmap steps={SEVEN_STEPS} />);
    const connectors = container.querySelectorAll('.milestone-roadmap__connector');

    // Steps: complete, complete, complete, pending, pending, pending, pending
    // Connector i sits between step i and step i+1 (1-indexed steps, 0-indexed connectors
    // since there's no connector before the first node).
    expect(connectors[0]).toHaveClass('milestone-roadmap__connector--green'); // Acceptance -> Company Card
    expect(connectors[1]).toHaveClass('milestone-roadmap__connector--green'); // Company Card -> Department Assignment
    expect(connectors[2]).toHaveClass('milestone-roadmap__connector--gray'); // Department Assignment -> Division Assignment (pending)
    expect(connectors[3]).toHaveClass('milestone-roadmap__connector--gray');
    expect(connectors[4]).toHaveClass('milestone-roadmap__connector--gray');
    expect(connectors[5]).toHaveClass('milestone-roadmap__connector--gray');
  });

  test('renders a marker for every node, one per step', () => {
    const { container } = render(<MilestoneRoadmap steps={SEVEN_STEPS} />);
    const markers = container.querySelectorAll('.milestone-roadmap__marker');
    expect(markers).toHaveLength(7);
  });
});
