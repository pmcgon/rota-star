from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .rota_solver import solve_rota
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

class EmployeeConfigView(APIView):
    def get(self, request):
        with open(CONFIG_PATH, 'r') as f:
            data = json.load(f)
        return Response(data)

    def post(self, request):
        with open(CONFIG_PATH, 'w') as f:
            json.dump(request.data, f, indent=2)
        return Response({"status": "saved"}, status=status.HTTP_200_OK)

class GenerateRotaView(APIView):
    def post(self, request):
        try:
            print("✅ Incoming rota POST with", len(request.data), "employees")
            test_data = [
                {"name": "Test", "is_supervisor": True, "max_shifts": 5, "days_off": [], "holidays": [], "unavailable_shifts": [], "must_work_shifts": []},
                {"name": "Helper", "is_supervisor": False, "max_shifts": 5, "days_off": [], "holidays": [], "unavailable_shifts": [], "must_work_shifts": []}
            ]
            result = solve_rota(test_data)
            print("✅ Rota successfully generated!")
            return Response(result)
        except Exception as e:
            import traceback
            print("❌ Crash Traceback:\n", traceback.format_exc())
            return Response({"error": str(e)}, status=500)