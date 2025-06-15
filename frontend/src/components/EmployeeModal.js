import React from "react";

const EmployeeModal = ({ show, onClose, employee, onSave }) => {
  const [form, setForm] = React.useState(
    employee || {
      name: "",
      is_supervisor: false,
      max_shifts: 3,
      days_off: [],
      holidays: [],
      unavailable_shifts: [],
      must_work_shifts: [],
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ background: "#00000080" }}>
      <div className="modal-dialog">
        <div className="modal-content p-3">
          <h5>{employee ? "Edit" : "Add"} Employee</h5>
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="form-control mb-2"
            value={form.name}
            onChange={handleChange}
          />
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_supervisor"
              checked={form.is_supervisor}
              onChange={handleChange}
            />
            <label className="form-check-label">Is Supervisor</label>
          </div>
          <input
            type="number"
            name="max_shifts"
            placeholder="Max Shifts"
            className="form-control mb-3"
            value={form.max_shifts}
            onChange={handleChange}
          />
          <button className="btn btn-primary me-2" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;