import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentChipList from './DocumentChip';

// Regression test for BUG-005 (document chips not clickable/downloadable). DocumentChip is
// deliberately generic (Supabase signed-URL migration) — it knows nothing about any role's
// endpoint, it just calls the onView/onDownload callbacks the page supplies. Chips must be
// interactive exactly when the record says a real file is available, and show a clear
// non-interactive state (not a broken control) when it isn't.
describe('DocumentChipList / DocumentChip', () => {
  test('renders label/filename with separate View and Download buttons when available', () => {
    render(
      <DocumentChipList
        documents={[{ field: 'universityTranscript', label: 'Training Plan', fileName: 'Training Plan .pdf', available: true }]}
        onView={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    expect(screen.getByText('Training Plan .pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  test('clicking View calls onView with the document field key, and only that', async () => {
    const onView = jest.fn().mockResolvedValue();
    const onDownload = jest.fn();

    render(
      <DocumentChipList
        documents={[{ field: 'cv', label: 'CV', fileName: 'CV.pdf', available: true }]}
        onView={onView}
        onDownload={onDownload}
      />
    );

    userEvent.click(screen.getByRole('button', { name: 'View' }));

    await waitFor(() => expect(onView).toHaveBeenCalledTimes(1));
    expect(onDownload).not.toHaveBeenCalled();
  });

  test('clicking Download calls onDownload with the document field key, and only that', async () => {
    const onView = jest.fn();
    const onDownload = jest.fn().mockResolvedValue();

    render(
      <DocumentChipList
        documents={[{ field: 'signature', label: 'Signature', fileName: 'sig.png', available: true }]}
        onView={onView}
        onDownload={onDownload}
      />
    );

    userEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(onDownload).toHaveBeenCalledTimes(1));
    expect(onView).not.toHaveBeenCalled();
  });

  test('both buttons disable while a request is in flight, re-enable after it resolves', async () => {
    let resolveView;
    const onView = jest.fn(() => new Promise((resolve) => { resolveView = resolve; }));

    render(
      <DocumentChipList
        documents={[{ field: 'cv', label: 'CV', fileName: 'CV.pdf', available: true }]}
        onView={onView}
        onDownload={jest.fn()}
      />
    );

    userEvent.click(screen.getByRole('button', { name: 'View' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'View' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();

    resolveView();
    await waitFor(() => expect(screen.getByRole('button', { name: 'View' })).not.toBeDisabled());
    expect(screen.getByRole('button', { name: 'Download' })).not.toBeDisabled();
  });

  test('a second click while a request is in flight does not call the handler again', async () => {
    let resolveView;
    const onView = jest.fn(() => new Promise((resolve) => { resolveView = resolve; }));

    render(
      <DocumentChipList
        documents={[{ field: 'cv', label: 'CV', fileName: 'CV.pdf', available: true }]}
        onView={onView}
        onDownload={jest.fn()}
      />
    );

    const viewButton = screen.getByRole('button', { name: 'View' });
    userEvent.click(viewButton);
    await waitFor(() => expect(viewButton).toBeDisabled());
    userEvent.click(viewButton); // disabled — native click is a no-op, no second call

    resolveView();
    await waitFor(() => expect(onView).toHaveBeenCalledTimes(1));
  });

  test('shows an inline error message when the request fails, without crashing', async () => {
    const onView = jest.fn().mockRejectedValue(new Error('Could not reach the server.'));

    render(
      <DocumentChipList
        documents={[{ field: 'cv', label: 'CV', fileName: 'CV.pdf', available: true }]}
        onView={onView}
        onDownload={jest.fn()}
      />
    );

    userEvent.click(screen.getByRole('button', { name: 'View' }));

    expect(await screen.findByText('Could not reach the server.')).toBeInTheDocument();
    // Buttons recover after the failure — not stuck disabled forever.
    expect(screen.getByRole('button', { name: 'View' })).not.toBeDisabled();
  });

  test('renders a non-interactive element (not a button) when the document is not available', () => {
    render(
      <DocumentChipList
        documents={[{ field: 'universityTranscript', label: 'Training Plan', fileName: 'Training Plan .pdf', available: false }]}
        onView={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const chip = screen.getByText('Training Plan .pdf');
    expect(chip).toHaveClass('doc-chip--disabled');
    expect(chip.tagName).toBe('SPAN');
    expect(chip).toHaveAttribute('title', 'Original file not available');
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
        onView={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    // 3 available docs x 2 buttons (View + Download) each.
    expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(3);
    expect(screen.getAllByText(/\.pdf$|\.png$/)).toHaveLength(5);
  });

  test('supports filenames with spaces, Arabic text, and special characters', () => {
    render(
      <DocumentChipList
        documents={[
          { field: 'cv', label: 'CV', fileName: 'شهادة التخرج (نسخة أصلية) #1.pdf', available: true },
        ]}
        onView={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    expect(screen.getByText('شهادة التخرج (نسخة أصلية) #1.pdf')).toBeInTheDocument();
  });
});
