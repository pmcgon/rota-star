import json
import random
from ortools.sat.python import cp_model
from tabulate import tabulate


def solve_rota(employees_data):
    """
    Solve rota scheduling using OR-Tools CP-SAT solver
    
    Args:
        employees_data: List of employee dictionaries with configuration
        
    Returns:
        Dictionary with status, message, table data, and headers
    """
    try:
        # Initialize the model
        model = cp_model.CpModel()
        
        # Days and shifts configuration
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        shifts_per_day = 2  # 0 = morning (9:00am–5:30pm), 1 = evening (5:30pm–2:15am)
        
        # Extract structured variables for constraint use
        employees = [emp["name"] for emp in employees_data]
        is_supervisor = [emp["is_supervisor"] for emp in employees_data]
        
        # Convert max_shifts to int (handle both string and int input)
        max_shifts_per_employee = []
        for emp in employees_data:
            max_shifts = emp["max_shifts"]
            if isinstance(max_shifts, str):
                max_shifts_per_employee.append(int(max_shifts))
            else:
                max_shifts_per_employee.append(max_shifts)
        
        # Process constraints
        days_off = {i: emp.get("days_off", []) for i, emp in enumerate(employees_data)}
        
        holidays = {
            i: emp.get("holidays", [])
            for i, emp in enumerate(employees_data)
            if emp.get("holidays")
        }
        
        unavailable_shifts = {
            i: [tuple(slot) for slot in emp.get("unavailable_shifts", [])]
            for i, emp in enumerate(employees_data)
            if emp.get("unavailable_shifts")
        }
        
        must_work_shifts = {
            i: [tuple(slot) for slot in emp.get("must_work_shifts", [])]
            for i, emp in enumerate(employees_data)
            if emp.get("must_work_shifts")
        }
        
        # Create decision variables
        shift_assignments = {}
        for e in range(len(employees)):
            for d in range(len(days)):
                for s in range(shifts_per_day):
                    shift_assignments[(e, d, s)] = model.NewBoolVar(f'emp{e}_day{d}_shift{s}')
        
        # Constraint 1: Each shift must have exactly 2 staff
        for d in range(len(days)):
            for s in range(shifts_per_day):
                model.Add(sum(shift_assignments[(e, d, s)] for e in range(len(employees))) == 2)
        
        # Constraint 2: Max total shifts per employee
        for e in range(len(employees)):
            actual_shifts = sum(shift_assignments[(e, d, s)] for d in range(len(days)) for s in range(shifts_per_day))
            holiday_count = len(holidays.get(e, []))  # 0 if no holidays
            
            if is_supervisor[e]:
                # Supervisors must work exactly 5 shifts (including holidays)
                model.Add(actual_shifts + holiday_count == 5)
            else:
                # Non-supervisors work up to their max limit
                model.Add(actual_shifts + holiday_count <= max_shifts_per_employee[e])
        
        # Constraint 3: Max 1 shift per day per employee
        for e in range(len(employees)):
            for d in range(len(days)):
                model.Add(sum(shift_assignments[(e, d, s)] for s in range(shifts_per_day)) <= 1)
        
        # Constraint 4: Respect days off
        for e in range(len(employees)):
            for d in days_off[e]:
                for s in range(shifts_per_day):
                    model.Add(shift_assignments[(e, d, s)] == 0)
        
        # Constraint 5: At least 1 supervisor per shift
        for d in range(len(days)):
            for s in range(shifts_per_day):
                model.Add(sum(shift_assignments[(e, d, s)] for e in range(len(employees)) if is_supervisor[e]) >= 1)
        
        # Constraint 6: Unavailable shifts
        for e, restricted_slots in unavailable_shifts.items():
            for d, s in restricted_slots:
                model.Add(shift_assignments[(e, d, s)] == 0)
        
        # Constraint 7: Enforce must-work shifts
        for e, required_slots in must_work_shifts.items():
            for d, s in required_slots:
                model.Add(shift_assignments[(e, d, s)] == 1)
        
        # Constraint 8: Block all holiday days
        for e, holiday_days in holidays.items():
            for d in holiday_days:
                for s in range(shifts_per_day):
                    model.Add(shift_assignments[(e, d, s)] == 0)
        
        # Solve the model
        solver = cp_model.CpSolver()
        solver.parameters.random_seed = random.randint(1, 10000)
        status = solver.Solve(model)
        
        if status == cp_model.FEASIBLE or status == cp_model.OPTIMAL:
            # Build the result table
            table_data = []
            
            for e in range(len(employees)):
                row = [employees[e]]
                for d in range(len(days)):
                    cell = ""
                    if holidays.get(e) and d in holidays[e]:
                        cell = "Holiday"
                    elif days_off.get(e) and d in days_off[e]:
                        cell = "Day Off"
                    else:
                        shifts = []
                        for s in range(shifts_per_day):
                            if solver.Value(shift_assignments[(e, d, s)]):
                                shifts.append("9:00am–5:30pm" if s == 0 else "5:30pm–2:15am")
                        if shifts:
                            cell = " / ".join(shifts)  # Join multiple shifts with /
                        else:
                            cell = "Off"
                    row.append(cell)
                table_data.append(row)
            
            # Calculate total shifts for verification
            shift_totals = {}
            for e in range(len(employees)):
                total = sum(
                    solver.Value(shift_assignments[(e, d, s)])
                    for d in range(len(days))
                    for s in range(shifts_per_day)
                )
                shift_totals[employees[e]] = total
            
            return {
                "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
                "message": f"Rota successfully generated! Solution status: {'optimal' if status == cp_model.OPTIMAL else 'feasible'}",
                "table": table_data,
                "headers": ["Employee"] + days,
                "shift_totals": shift_totals
            }
        
        elif status == cp_model.INFEASIBLE:
            return {
                "status": "no_solution",
                "message": "No feasible solution found. Try relaxing constraints (fewer must-work shifts, more available employees, or adjust max shifts).",
                "table": [],
                "headers": ["Employee"] + days,
                "shift_totals": {}
            }
        
        else:
            return {
                "status": "error", 
                "message": f"Solver failed with status: {status}",
                "table": [],
                "headers": ["Employee"] + days,
                "shift_totals": {}
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error during rota generation: {str(e)}",
            "table": [],
            "headers": ["Employee"] + days,
            "shift_totals": {}
        }