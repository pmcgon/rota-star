from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .rota_solver import solve_rota
import json
import os
import traceback

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

class EmployeeConfigView(APIView):
    def get(self, request):
        """Get current employee configuration"""
        try:
            with open(CONFIG_PATH, 'r') as f:
                data = json.load(f)
            return Response(data)
        except FileNotFoundError:
            return Response({"error": "Configuration file not found"}, status=status.HTTP_404_NOT_FOUND)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON in configuration file"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """Save employee configuration"""
        try:
            # Validate the incoming data structure
            if not isinstance(request.data, list):
                return Response({"error": "Data must be a list of employees"}, status=status.HTTP_400_BAD_REQUEST)
            
            for emp in request.data:
                required_fields = ['name', 'is_supervisor', 'max_shifts']
                for field in required_fields:
                    if field not in emp:
                        return Response({"error": f"Missing required field: {field}"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Ensure optional fields exist with defaults
                emp.setdefault('days_off', [])
                emp.setdefault('holidays', [])
                emp.setdefault('unavailable_shifts', [])
                emp.setdefault('must_work_shifts', [])
            
            with open(CONFIG_PATH, 'w') as f:
                json.dump(request.data, f, indent=2)
            
            return Response({"status": "saved"}, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Failed to save configuration: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateRotaView(APIView):
    def post(self, request):
        """Generate rota using OR-Tools solver"""
        try:
            print(f"✅ Incoming rota POST with {len(request.data)} employees")
            
            # Validate input data
            if not request.data or not isinstance(request.data, list):
                return Response({"error": "Invalid employee data provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check minimum requirements
            supervisors = [emp for emp in request.data if emp.get('is_supervisor', False)]
            if len(supervisors) < 1:
                return Response({
                    "error": "At least 1 supervisor is required to generate a valid rota"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(request.data) < 2:
                return Response({
                    "error": "At least 2 employees are required to generate a rota (each shift needs 2 people)"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate the rota using OR-Tools
            result = solve_rota(request.data)
            
            print(f"✅ Rota generation completed with status: {result['status']}")
            
            if result['status'] in ['optimal', 'feasible']:
                print("✅ Valid solution found!")
                return Response(result)
            else:
                print(f"❌ No solution found: {result['message']}")
                return Response(result, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                
        except Exception as e:
            error_traceback = traceback.format_exc()
            print(f"❌ Crash Traceback:\n{error_traceback}")
            
            return Response({
                "status": "error",
                "error": f"Server error during rota generation: {str(e)}",
                "message": "An unexpected error occurred. Please check your employee configuration and try again."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)