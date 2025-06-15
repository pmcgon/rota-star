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

    useEffect(() => {
        axios
            .get("http://localhost:8000/api/employees/")
            .then((res) => {
                setEmployees(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch employees", err);
            });
    }, []);

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
            .then(() => console.log("Saved!"))
            .catch((err) => console.error("Save failed", err));
    };

    const handleDelete = (empToDelete) => {
        const updated = employees.filter((emp) => emp !== empToDelete);
        setEmployees(updated);

        axios
            .post("http://localhost:8000/api/employees/", updated)
            .then(() => console.log("Deleted and saved!"))
            .catch((err) => console.error("Delete failed", err));
    };

    const handleGenerateRota = () => {
        axios
            .post("http://localhost:8000/api/generate-rota/", employees)
            .then((res) => {
                console.log("✅ Rota received from server:", res.data);
                setRotaResult(res.data);
            })
            .catch((err) => {
                console.error("❌ Failed to generate rota:", err);
            });
    };

    if (loading) return <p>Loading employees...</p>;

    return (
        <div>
            <h2>Employee Rota Configuration</h2>
            <button
                className="btn btn-primary mb-3"
                onClick={() => {
                    setSelectedEmployee(null);
                    setShowModal(true);
                }}
            >
                + Add Employee
            </button>
            <button className="btn btn-success mb-3" onClick={handleGenerateRota}>
                Generate Rota
            </button>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Supervisor</th>
                        <th>Max Shifts</th>
                        <th>Edit</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp, index) => (
                        <tr key={index}>
                            <td>{emp.name}</td>
                            <td>{emp.is_supervisor ? "✅" : "❌"}</td>
                            <td>{emp.max_shifts}</td>
                            <td>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        setShowModal(true);
                                    }}
                                >
                                    Edit
                                </button>
                            </td>
                            <td>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(emp)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <RotaOutput rota={rotaResult} />
            <EmployeeModal
                show={showModal}
                onClose={() => setShowModal(false)}
                employee={selectedEmployee}
                onSave={(newEmp) => {
                    const updated = [...employees];
                    if (selectedEmployee) {
                        const index = employees.indexOf(selectedEmployee);
                        updated[index] = newEmp;
                    } else {
                        updated.push(newEmp);
                    }
                    setEmployees(updated);

                    axios.post("http://localhost:8000/api/employees/", updated)
                        .then(() => console.log("Saved!"))
                        .catch((err) => console.error("Save failed", err));
                }}
            />

        </div>
    );
};

export default EmployeeTable;
