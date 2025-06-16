import React from "react";

const RotaOutput = ({ rota }) => {
  // Handle different status cases
  if (!rota) {
    return (
      <div className="mt-4">
        <p className="text-muted">👆 Click "Generate Rota" to create a weekly schedule</p>
      </div>
    );
  }

  if (rota.status === "no_solution") {
    return (
      <div className="mt-4">
        <div className="alert alert-warning">
          <h5>⚠️ No Valid Rota Found</h5>
          <p>{rota.message}</p>
          <small className="text-muted">
            Suggestions:
            <ul className="mt-2 mb-0">
              <li>Reduce must-work shift requirements</li>
              <li>Add more employees or supervisors</li>
              <li>Increase max shifts for some employees</li>
              <li>Check for conflicting days off and holidays</li>
            </ul>
          </small>
        </div>
      </div>
    );
  }

  if (rota.status === "error") {
    return (
      <div className="mt-4">
        <div className="alert alert-danger">
          <h5>❌ Error Generating Rota</h5>
          <p>{rota.message || rota.error}</p>
        </div>
      </div>
    );
  }

  // Successful rota generation
  const isOptimal = rota.status === "optimal";
  
  return (
    <div className="mt-4">
      <div className={`alert ${isOptimal ? 'alert-success' : 'alert-info'}`}>
        <h5>
          {isOptimal ? "✅ Optimal Rota Generated!" : "✅ Feasible Rota Generated!"}
        </h5>
        <p>{rota.message}</p>
      </div>

      <h3>🗓️ Weekly Rota</h3>
      
      {/* Main rota table */}
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead className="table-dark">
            <tr>
              {rota.headers?.map((head, idx) => (
                <th key={idx} className="text-center">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rota.table?.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIdx) => (
                  <td 
                    key={cellIdx} 
                    className={`${cellIdx === 0 ? 'fw-bold' : 'text-center'} ${getCellClass(cell)}`}
                    style={{ fontSize: cellIdx === 0 ? '1em' : '0.85em' }}
                  >
                    {formatCellContent(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shift totals summary */}
      {rota.shift_totals && Object.keys(rota.shift_totals).length > 0 && (
        <div className="mt-3">
          <h5>📊 Shift Distribution</h5>
          <div className="row">
            {Object.entries(rota.shift_totals).map(([employee, total]) => (
              <div key={employee} className="col-md-3 col-sm-4 col-6 mb-2">
                <div className="card card-body py-2 px-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">{employee}</span>
                    <span className="badge bg-primary">{total} shifts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3">
        <h6>Legend:</h6>
        <div className="d-flex flex-wrap gap-3">
          <div>
            <strong>Morning Shifts:</strong>
            <div className="small text-muted">
              Mon, Tue, Thu, Fri, Sun: 9:00am–5:30pm<br/>
              Wed, Sat: 8:00am–5:00pm
            </div>
          </div>
          <div>
            <strong>Evening Shifts:</strong>
            <div className="small text-muted">
              Mon, Tue, Thu, Fri, Sun: 5:30pm–2:15am<br/>
              Wed, Sat: 5:00pm–2:15am
            </div>
          </div>
          <span className="text-muted"><strong>Off</strong> - Not Working</span>
          <span className="text-warning"><strong>Holiday</strong> - Scheduled Holiday</span>
          <span className="text-info"><strong>Day Off</strong> - Regular Day Off</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get appropriate CSS class for cell content
const getCellClass = (cell) => {
  if (typeof cell !== 'string') return '';
  
  if (cell.includes('Holiday')) return 'table-warning';
  if (cell.includes('Day Off')) return 'table-info';
  if (cell.includes('9:00am–5:30pm') || cell.includes('5:30pm–2:15am') || 
      cell.includes('8:00am–5:00pm') || cell.includes('5:00pm–2:15am')) return 'table-success';
  if (cell === 'Off') return 'table-light text-muted';
  
  return '';
};

// Helper function to format cell content for better display
const formatCellContent = (cell) => {
  if (typeof cell !== 'string') return cell;
  
  // If cell contains multiple shifts, format them nicely
  if (cell.includes('/')) {
    return cell.split('/').map((shift, index) => (
      <div key={index} className="mb-1">
        {shift.trim()}
      </div>
    ));
  }
  
  return cell;
};

export default RotaOutput;