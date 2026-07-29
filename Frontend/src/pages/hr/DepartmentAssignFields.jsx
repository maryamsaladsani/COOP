HRimport SelectField from '../../components/form/SelectField';
import TextField from '../../components/form/TextField';
import { BRANCHES, COORDINATORS } from '../../data/mockData';
import { DEPARTMENTS } from '../../data/departments';

// Shared by the bulk "Assign to DEPT" page and the per-student "Assign to
// Training Coordinator" modal so both places auto-fill identically from the
// same department record instead of drifting apart. `values`/`onChange`
// follow the { departmentId, department, coordinatorUsername, branch,
// businessLine, buildingNumber, floorNumber } shape both callers already use.
function DepartmentAssignFields({ values, onChange }) {
  const handleDepartmentSelect = (departmentId) => {
    const dept = DEPARTMENTS.find((d) => d.id === departmentId);
    if (!dept) return;
    onChange((v) => ({
      ...v,
      departmentId,
      department: dept.name,
      coordinatorUsername: dept.trainingCoordinator,
      branch: dept.branch,
      businessLine: dept.businessLine,
      buildingNumber: dept.buildingNumber,
      floorNumber: dept.floorNumber,
    }));
  };

  return (
    <div className="profile-form">
      <SelectField
        label="Department"
        name="departmentId"
        required
        placeholder="Select department"
        options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
        value={values.departmentId}
        onChange={(e) => handleDepartmentSelect(e.target.value)}
        hint="Selecting a department auto-fills the fields below — you can still edit them."
      />
      <div className="profile-form__row">
        <SelectField
          label="Training Coordinator"
          name="coordinatorUsername"
          required
          placeholder="Select coordinator"
          options={COORDINATORS.map((c) => ({ value: c.username, label: c.name }))}
          value={values.coordinatorUsername}
          onChange={(e) => onChange((v) => ({ ...v, coordinatorUsername: e.target.value }))}
        />
        <SelectField
          label="Branch"
          name="branch"
          options={BRANCHES.map((b) => ({ value: b, label: b }))}
          value={values.branch}
          onChange={(e) => onChange((v) => ({ ...v, branch: e.target.value }))}
        />
      </div>
      <div className="profile-form__row">
        <TextField
          label="Business line"
          name="businessLine"
          hint="Optional"
          value={values.businessLine}
          onChange={(e) => onChange((v) => ({ ...v, businessLine: e.target.value }))}
        />
        <TextField
          label="Building number"
          name="buildingNumber"
          hint="Optional"
          value={values.buildingNumber}
          onChange={(e) => onChange((v) => ({ ...v, buildingNumber: e.target.value }))}
        />
      </div>
      <div className="profile-form__row">
        <TextField
          label="Floor number"
          name="floorNumber"
          hint="Optional"
          value={values.floorNumber}
          onChange={(e) => onChange((v) => ({ ...v, floorNumber: e.target.value }))}
        />
      </div>
    </div>
  );
}

export default DepartmentAssignFields;
