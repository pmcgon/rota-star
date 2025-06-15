from django.urls import path
from . import views

urlpatterns = [
    path("employees/", views.EmployeeConfigView.as_view()),
    path("generate-rota/", views.GenerateRotaView.as_view()),
]
