import SelectField from '../../components/form/SelectField';
import InfoField from '../../components/dashboard/InfoField';

// Shared by the bulk "Assign to DEPT" page and the per-student "Assign to
// Training Coordinator" modal. `departments` is the real backend list (see
// GET /api/hr/departments) — HR picks one, and coordinator/branch/business
// line/building/floor are then just DISPLAY of that department's own record,
// not independently editable: the real assign-department endpoint (REQ-25)
// only accepts a departmentId, and derives the coordinator from
// Department.coordinatorId server-side. Department data itself is read-only
// spreadsheet-sourced reference data (see BACKEND_CONTEXT.md) — HR was never
// meant to edit branch/building/etc per-assignment, only pick a department.
function DepartmentAssignFields({ values, onChange, departments }) {
  const handleDepartmentSelect = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) return;
    onChange((v) => ({
      ...v,
      departmentId,
      department: dept.name,
      coordinatorUsername: dept.coordinatorId,
      coordinatorName: dept.coordinatorName,
      branch: dept.branch,
      businessLine: dept.businessLine,
      buildingNumber: dept.buildingNumber,
      floorNumber: dept.floorNumber,
    }));
  };

  const selected = departments.find((d) => d.id === values.departmentId);

  return (
    <div className="profile-form">
      <SelectField
        label="Department"
        name="departmentId"
        required
        placeholder="Select department"
        options={departments.map((d) => ({ value: d.id, label: d.name }))}
        value={values.departmentId}
        onChange={(e) => handleDepartmentSelect(e.target.value)}
        hint="Branch, business line, building, floor, and coordinator come from the selected department and can't be edited here."
      />
      {selected && (
        <div className="info-grid">
          <InfoField label="Training Coordinator" value={selected.coordinatorName || 'Not yet assigned'} />
          <InfoField label="Branch" value={selected.branch} />
          <InfoField label="Business line" value={selected.businessLine} />
          <InfoField label="Building number" value={selected.buildingNumber} />
          <InfoField label="Floor number" value={selected.floorNumber} />
        </div>
      )}
    </div>
  );
}

export default DepartmentAssignFields;
