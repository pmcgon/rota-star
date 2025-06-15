import React from "react";

const RotaOutput = ({ rota }) => {
  if (!rota || rota.status === "no_solution") {
    return <p className="text-danger">⚠️ No valid rota could be generated.</p>;
  }

  return (
    <div className="mt-4">
      <h3>🗓️ Weekly Rota</h3>
      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            {rota.headers.map((head, idx) => (
              <th key={idx}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rota.table.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RotaOutput;
