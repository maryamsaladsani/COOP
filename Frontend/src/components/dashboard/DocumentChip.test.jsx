import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentChipList from './DocumentChip';
import { apiDownload } from '../../data/apiClient';

jest.mock('../../data/apiClient', () => ({
  apiDownload: jest.fn(),
}));

// jsdom doesn't implement these — DocumentChip calls them to trigger the actual browser
// download once apiDownload resolves.
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  apiDownload.mockReset();
});

// Regression test for BUG-005 (document chips not clickable/downloadable). Chips must be
// clickable exactly when the record says a real file is available, and show a clear
// non-interactive state (not a broken link) when it isn't.
describe('DocumentChipList / DocumentChip', () => {
  test('renders a clickable button when the document is available', () => {
    render(
      <DocumentChipList
        documents={[{ field: 'universityTranscript', label: 'Training Plan', fileName: 'Training Plan .pdf', available: true }]}
        buildDownloadPath={(field) => `/api/hr/students/abc123/documents/${field}`}
      />
    );

    const chip = screen.getByRole('button', { name: /Training Plan \.pdf/ });
    expect(chip).toBeInTheDocument();
    expect(chip).not.toBeDisabled();
    expect(chip).toHaveClass('doc-chip--clickable');
  });

  test('clicking an available chip calls apiDownload with the correct role-scoped path', async () => {
    apiDownload.mockResolvedValue({ blob: new Blob(['test']), filename: 'Training Plan .pdf' });

    render(
      <DocumentChipList
        documents={[{ field: 'universityTranscript', label: 'Training Plan', fileName: 'Training Plan .pdf', available: true }]}
        buildDownloadPath={(field) => `/api/coordinator/trainees/xyz789/documents/${field}`}
      />
    );

    userEvent.click(screen.getByRole('button', { name: /Training Plan \.pdf/ }));

    await waitFor(() => expect(apiDownload).toHaveBeenCalledTimes(1));
    expect(apiDownload).toHaveBeenCalledWith('/api/coordinator/trainees/xyz789/documents/universityTranscript');
  });

  test('renders a non-interactive element (not a button) when the document is not available', () => {
    render(
      <DocumentChipList
        documents={[{ field: 'universityTranscript', label: 'Training Plan', fileName: 'Training Plan .pdf', available: false }]}
        buildDownloadPath={(field) => `/api/hr/students/abc123/documents/${field}`}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const chip = screen.getByText('Training Plan .pdf');
    expect(chip).toHaveClass('doc-chip--disabled');
    expect(chip.tagName).toBe('SPAN');
    expect(chip).toHaveAttribute('title', 'Original file not available');
  });

  test('unavailable chip never calls apiDownload (nothing to click)', () => {
    render(
      <DocumentChipList
        documents={[{ field: 'signature', label: 'Signature', fileName: 'AI - 1.png', available: false }]}
        buildDownloadPath={(field) => `/api/hr/students/abc123/documents/${field}`}
      />
    );
    expect(apiDownload).not.toHaveBeenCalled();
  });

  test('renders all five documents in a list, mixing available and unavailable', () => {
    render(
      <DocumentChipList
        documents={[
          { field: 'universityTranscript', label: 'Training Plan', fileName: 'transcript.pdf', available: true },
          { field: 'cv', label: 'CV', fileName: 'CV.pdf', available: false },
          { field: 'universityLetter', label: 'University Letter', fileName: 'letter.pdf', available: true },
          { field: 'personalImage', label: 'Personal Photo', fileName: 'photo.png', available: false },
          { field: 'signature', label: 'Signature', fileName: 'sig.png', available: true },
        ]}
        buildDownloadPath={(field) => `/api/hr/students/abc123/documents/${field}`}
      />
    );

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getAllByText(/\.pdf$|\.png$/)).toHaveLength(5);
  });
});
