import React, { useState, useEffect } from "react";

const EmployeeModal = ({ show, onClose, employee, onSave }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    name: "",
    is_supervisor: false,
    max_shifts: 3,
    days_off: [],
    holidays: [],
    unavailable_shifts: [],
    must_work_shifts: [],
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shifts = [
    { value: 0, label: "Morning" },
    { value: 1, label: "Evening" }
  ];

  const getShiftLabel = (shift, dayIndex) => {
    if (dayIndex === 2 || dayIndex === 5) { // Wednesday (2) and Saturday (5)
      return shift === 0 ? "Morning (8:00am–5:00pm)" : "Evening (5:00pm–2:15am)";
    } else {
      return shift === 0 ? "Morning (9:00am–5:30pm)" : "Evening (5:30pm–2:15am)";
    }
  };

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      setForm({
        ...employee,
        max_shifts: parseInt(employee.max_shifts) || 3, // Ensure it's a number
        days_off: employee.days_off || [],
        holidays: employee.holidays || [],
        unavailable_shifts: employee.unavailable_shifts || [],
        must_work_shifts: employee.must_work_shifts || [],
      });
    } else {
      setForm({
        name: "",
        is_supervisor: false,
        max_shifts: 3,
        days_off: [],
        holidays: [],
        unavailable_shifts: [],
        must_work_shifts: [],
      });
    }
    setActiveTab("basic");
  }, [employee, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    });
  };

  const handleArrayToggle = (arrayName, value) => {
    const currentArray = form[arrayName];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setForm({
      ...form,
      [arrayName]: newArray
    });
  };

  const handleShiftToggle = (arrayName, day, shift) => {
    const currentArray = form[arrayName];
    const shiftTuple = [day, shift];
    
    // Check if this shift already exists
    const existingIndex = currentArray.findIndex(
      ([d, s]) => d === day && s === shift
    );
    
    let newArray;
    if (existingIndex !== -1) {
      // Remove existing shift
      newArray = currentArray.filter((_, index) => index !== existingIndex);
    } else {
      // Add new shift
      newArray = [...currentArray, shiftTuple];
    }
    
    setForm({
      ...form,
      [arrayName]: newArray
    });
  };

  const isShiftSelected = (arrayName, day, shift) => {
    return form[arrayName].some(([d, s]) => d === day && s === shift);
  };

  const handleSave = () => {
    // Ensure max_shifts is saved as a number
    const formData = {
      ...form,
      max_shifts: parseInt(form.max_shifts) || 3
    };
    onSave(formData);
    onClose();
  };

  const isValidForm = () => {
    return form.name.trim() !== "" && form.max_shifts > 0;
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ background: "#00000080" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {employee ? "Edit" : "Add"} Employee: {form.name || "New Employee"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "basic" ? "active" : ""}`}
                  onClick={() => setActiveTab("basic")}
                >
                  Basic Info
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "availability" ? "active" : ""}`}
                  onClick={() => setActiveTab("availability")}
                >
                  Days Off & Holidays
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "restrictions" ? "active" : ""}`}
                  onClick={() => setActiveTab("restrictions")}
                >
                  Unavailable Shifts
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "requirements" ? "active" : ""}`}
                  onClick={() => setActiveTab("requirements")}
                >
                  Must Work Shifts
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="tab-pane fade show active">
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter employee name"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_supervisor"
                        checked={form.is_supervisor}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">
                        Is Supervisor
                        <small className="text-muted d-block">
                          Supervisors are required for each shift and typically work 5 shifts per week
                        </small>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Maximum Shifts Per Week *</label>
                    <input
                      type="number"
                      name="max_shifts"
                      className="form-control"
                      value={form.max_shifts}
                      onChange={handleChange}
                      min="1"
                      max="7"
                    />
                    <small className="text-muted">
                      Maximum number of shifts this employee can work in a week (1-7)
                    </small>
                  </div>
                </div>
              )}

              {/* Days Off & Holidays Tab */}
              {activeTab === "availability" && (
                <div className="tab-pane fade show active">
                  <div className="mb-4">
                    <h6>Regular Days Off</h6>
                    <p className="text-muted small mb-3">
                      Select days when this employee is regularly not available to work
                    </p>
                    <div className="row">
                      {days.map((day, index) => (
                        <div key={day} className="col-md-4 col-6 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={form.days_off.includes(index)}
                              onChange={() => handleArrayToggle('days_off', index)}
                            />
                            <label className="form-check-label">{day}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6>Holiday Days</h6>
                    <p className="text-muted small mb-3">
                      Select days when this employee is on holiday this week
                    </p>
                    <div className="row">
                      {days.map((day, index) => (
                        <div key={day} className="col-md-4 col-6 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={form.holidays.includes(index)}
                              onChange={() => handleArrayToggle('holidays', index)}
                            />
                            <label className="form-check-label">{day}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Unavailable Shifts Tab */}
              {activeTab === "restrictions" && (
                <div className="tab-pane fade show active">
                  <h6>Unavailable Shifts</h6>
                  <p className="text-muted small mb-3">
                    Select specific shifts when this employee cannot work (beyond regular days off)
                  </p>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Morning Shift</th>
                          <th>Evening Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((day, dayIndex) => (
                          <tr key={day}>
                            <td className="fw-bold">{day}</td>
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isShiftSelected('unavailable_shifts', dayIndex, 0)}
                                  onChange={() => handleShiftToggle('unavailable_shifts', dayIndex, 0)}
                                />
                                <label className="form-check-label small">
                                  {getShiftLabel(0, dayIndex)}
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isShiftSelected('unavailable_shifts', dayIndex, 1)}
                                  onChange={() => handleShiftToggle('unavailable_shifts', dayIndex, 1)}
                                />
                                <label className="form-check-label small">
                                  {getShiftLabel(1, dayIndex)}
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Must Work Shifts Tab */}
              {activeTab === "requirements" && (
                <div className="tab-pane fade show active">
                  <h6>Must Work Shifts</h6>
                  <p className="text-muted small mb-3">
                    Select specific shifts that this employee must work this week
                  </p>
                  <div className="alert alert-info small">
                    <strong>Note:</strong> Be careful with must-work shifts as they can make the rota unsolvable if there are conflicts.
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Morning Shift</th>
                          <th>Evening Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((day, dayIndex) => (
                          <tr key={day}>
                            <td className="fw-bold">{day}</td>
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isShiftSelected('must_work_shifts', dayIndex, 0)}
                                  onChange={() => handleShiftToggle('must_work_shifts', dayIndex, 0)}
                                />
                                <label className="form-check-label small">
                                  {getShiftLabel(0, dayIndex)}
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isShiftSelected('must_work_shifts', dayIndex, 1)}
                                  onChange={() => handleShiftToggle('must_work_shifts', dayIndex, 1)}
                                />
                                <label className="form-check-label small">
                                  {getShiftLabel(1, dayIndex)}
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Summary of selections */}
            <div className="mt-3">
              <div className="card bg-light">
                <div className="card-body py-2">
                  <h6 className="card-title mb-2">Summary</h6>
                  <div className="row small">
                    <div className="col-md-6">
                      <strong>Days Off:</strong> {form.days_off.length > 0 ? form.days_off.map(d => days[d]).join(', ') : 'None'}
                      <br />
                      <strong>Holidays:</strong> {form.holidays.length > 0 ? form.holidays.map(d => days[d]).join(', ') : 'None'}
                    </div>
                    <div className="col-md-6">
                      <strong>Unavailable Shifts:</strong> {form.unavailable_shifts.length}
                      <br />
                      <strong>Must Work Shifts:</strong> {form.must_work_shifts.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={!isValidForm()}
            >
              {employee ? "Update" : "Add"} Employee
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;