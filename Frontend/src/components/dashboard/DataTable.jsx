import { useEffect, useState } from 'react';
import EmptyState from './EmptyState';
import './DataTable.css';

// Generic paginated table used by both the HR and Coordinator databases.
// Always paginates a fixed page size instead of rendering every row — with
// ~600 trainees/year this is what keeps the view responsive.
function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  onRowClick,
  pageSize = 8,
  selectable = false,
  selectedIds,
  onSelectedChange,
  isRowSelectable = () => true,
  emptyTitle = 'No records found',
  emptyBody = 'Try adjusting your search or filters.',
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  // If a selected row falls out of eligibility (its underlying state
  // changed, not just filtered out of the current search), drop it from
  // the selection instead of leaving a stale, now-ineligible id behind.
  useEffect(() => {
    if (!selectable || !onSelectedChange || !selectedIds || selectedIds.length === 0) return;
    const rowById = new Map(rows.map((row) => [getRowId(row), row]));
    const pruned = selectedIds.filter((id) => {
      const row = rowById.get(id);
      return row ? isRowSelectable(row) : true;
    });
    if (pruned.length !== selectedIds.length) {
      onSelectedChange(pruned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, selectable]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const selectablePageRows = pageRows.filter((row) => isRowSelectable(row));

  const allOnPageSelected =
    selectable && selectablePageRows.length > 0 && selectablePageRows.every((row) => selectedIds?.includes(getRowId(row)));

  const toggleAllOnPage = () => {
    if (!onSelectedChange) return;
    const pageIds = selectablePageRows.map(getRowId);
    if (allOnPageSelected) {
      onSelectedChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      onSelectedChange(Array.from(new Set([...(selectedIds || []), ...pageIds])));
    }
  };

  const toggleRow = (id) => {
    if (!onSelectedChange) return;
    if (selectedIds?.includes(id)) {
      onSelectedChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectedChange([...(selectedIds || []), id]);
    }
  };

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="data-table">
      <div className="data-table__scroll">
        <table>
          <thead>
            <tr>
              {selectable && (
                <th className="data-table__checkbox-col">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const id = getRowId(row);
              const rowSelectable = isRowSelectable(row);
              const rowClasses = [
                onRowClick ? 'data-table__row--clickable' : '',
                selectable && !rowSelectable ? 'data-table__row--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <tr key={id} className={rowClasses || undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  {selectable && (
                    <td className="data-table__checkbox-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={Boolean(selectedIds?.includes(id))}
                        onChange={() => toggleRow(id)}
                        disabled={!rowSelectable}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="data-table__footer">
          <span className="data-table__count">
            Showing {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}
          </span>
          <div className="data-table__pager">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span className="data-table__page-label">
              Page {currentPage} of {totalPages}
            </span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
