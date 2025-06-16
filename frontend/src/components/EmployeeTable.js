import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeModal from "./EmployeeModal";
import RotaOutput from "./RotaOutput";

const EmployeeTable = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [rotaResult, setRotaResult] = useState(null);
    const [generating, setGenerating] = useState(false);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = () => {
        axios
            .get("http://localhost:8000/api/employees/")
            .then((res) => {
                // Ensure max_shifts is always a number
                const processedEmployees = res.data.map(emp => ({
                    ...emp,
                    max_shifts: parseInt(emp.max_shifts) || 3
                }));
                setEmployees(processedEmployees);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch employees", err);
                setLoading(false);
            });
    };

    const handleSave = (newEmp) => {
        const updated = [...employees];
        
        if (selectedEmployee) {
            const index = employees.indexOf(selectedEmployee);
            updated[index] = newEmp;
        } else {
            updated.push(newEmp);
        }

        setEmployees(updated);

        axios
            .post("http://localhost:8000/api/employees/", updated)
            .then(() => {
                console.log("Employee saved successfully!");
                setShowModal(false);
            })
            .catch((err) => {
                console.error("Save failed", err);
                alert("Failed to save employee. Please try again.");
            });
    };

    const handleDelete = (empToDelete) => {
        if (!window.confirm(`Are you sure you want to delete ${empToDelete.name}?`)) {
            return;
        }

        const updated = employees.filter((emp) => emp !== empToDelete);
        setEmployees(updated);

        axios
            .post("http://localhost:8000/api/employees/", updated)
            .then(() => console.log("Employee deleted successfully!"))
            .catch((err) => {
                console.error("Delete failed", err);
                alert("Failed to delete employee. Please try again.");
                // Revert the state if deletion failed
                fetchEmployees();
            });
    };

    const handleGenerateRota = () => {
        setGenerating(true);
        setRotaResult(null);
        
        axios
            .post("http://localhost:8000/api/generate-rota/", employees)
            .then((res) => {
                console.log("✅ Rota received from server:", res.data);
                setRotaResult(res.data);
            })
            .catch((err) => {
                console.error("❌ Failed to generate rota:", err);
                
                // Handle different error responses
                if (err.response && err.response.data) {
                    setRotaResult({
                        status: "error",
                        message: err.response.data.message || err.response.data.error || "Failed to generate rota"
                    });
                } else {
                    setRotaResult({
                        status: "error",
                        message: "Network error: Could not connect to server"
                    });
                }
            })
            .finally(() => {
                setGenerating(false);
            });
    };

    const getConstraintsSummary = (emp) => {
        const constraints = [];
        
        if (emp.days_off && emp.days_off.length > 0) {
            constraints.push(`Days off: ${emp.days_off.map(d => days[d]).join(', ')}`);
        }
        
        if (emp.holidays && emp.holidays.length > 0) {
            constraints.push(`Holidays: ${emp.holidays.map(d => days[d]).join(', ')}`);
        }
        
        if (emp.unavailable_shifts && emp.unavailable_shifts.length > 0) {
            constraints.push(`${emp.unavailable_shifts.length} unavailable shifts`);
        }
        
        if (emp.must_work_shifts && emp.must_work_shifts.length > 0) {
            constraints.push(`${emp.must_work_shifts.length} required shifts`);
        }
        
        return constraints.length > 0 ? constraints.join(' • ') : 'No constraints';
    };

    const hasConstraints = (emp) => {
        return (emp.days_off && emp.days_off.length > 0) ||
               (emp.holidays && emp.holidays.length > 0) ||
               (emp.unavailable_shifts && emp.unavailable_shifts.length > 0) ||
               (emp.must_work_shifts && emp.must_work_shifts.length > 0);
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{height: '200px'}}>
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading employees...</span>
            </div>
        </div>
    );

    const supervisorCount = employees.filter(emp => emp.is_supervisor).length;
    const totalEmployees = employees.length;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Employee Rota Configuration</h2>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setSelectedEmployee(null);
                            setShowModal(true);
                        }}
                    >
                        + Add Employee
                    </button>
                    <button 
                        className="btn btn-success" 
                        onClick={handleGenerateRota}
                        disabled={generating || totalEmployees < 2}
                    >
                        {generating ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Generating...
                            </>
                        ) : (
                            'Generate Rota'
                        )}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row mb-3">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body py-2">
                            <h6 className="card-title mb-1">Total Employees</h6>
                            <h4 className="mb-0">{totalEmployees}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body py-2">
                            <h6 className="card-title mb-1">Supervisors</h6>
                            <h4 className="mb-0">{supervisorCount}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body py-2">
                            <h6 className="card-title mb-1">With Constraints</h6>
                            <h4 className="mb-0">{employees.filter(hasConstraints).length}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className={`card ${totalEmployees >= 2 && supervisorCount >= 1 ? 'bg-success' : 'bg-warning'} text-white`}>
                        <div className="card-body py-2">
                            <h6 className="card-title mb-1">Rota Ready</h6>
                            <h4 className="mb-0">{totalEmployees >= 2 && supervisorCount >= 1 ? '✓' : '✗'}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requirements Check */}
            {(totalEmployees < 2 || supervisorCount < 1) && (
                <div className="alert alert-warning">
                    <h6>⚠️ Requirements for Rota Generation:</h6>
                    <ul className="mb-0">
                        {totalEmployees < 2 && <li>Need at least 2 employees (currently have {totalEmployees})</li>}
                        {supervisorCount < 1 && <li>Need at least 1 supervisor (currently have {supervisorCount})</li>}
                    </ul>
                </div>
            )}

            {/* Employee Table */}
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Max Shifts</th>
                            <th>Constraints</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="fw-bold">{emp.name}</div>
                                </td>
                                <td>
                                    <span className={`badge ${emp.is_supervisor ? 'bg-primary' : 'bg-secondary'}`}>
                                        {emp.is_supervisor ? 'Supervisor' : 'Staff'}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge bg-info">{emp.max_shifts} shifts/week</span>
                                </td>
                                <td>
                                    <small className={hasConstraints(emp) ? 'text-warning' : 'text-muted'}>
                                        {getConstraintsSummary(emp)}
                                    </small>
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={() => {
                                                setSelectedEmployee(emp);
                                                setShowModal(true);
                                            }}
                                            title="Edit employee"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => handleDelete(emp)}
                                            title="Delete employee"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {employees.length === 0 && (
                <div className="text-center py-5">
                    <div className="text-muted">
                        <h5>No employees configured</h5>
                        <p>Add employees to start creating rotas</p>
                    </div>
                </div>
            )}

            {/* Rota Output */}
            <RotaOutput rota={rotaResult} />

            {/* Employee Modal */}
            <EmployeeModal
                show={showModal}
                onClose={() => setShowModal(false)}
                employee={selectedEmployee}
                onSave={handleSave}
            />
        </div>
    );
};

export default EmployeeTable;