import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/dio_client.dart';

class Employee {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String? whatsappName;
  final String? employeeCode;
  final String? groupName;
  final String? teamName;
  final String? designation;
  final bool isActive;

  Employee({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.whatsappName,
    this.employeeCode,
    this.groupName,
    this.teamName,
    this.designation,
    required this.isActive,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'],
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      whatsappName: json['whatsappName'],
      employeeCode: json['employeeCode'],
      groupName: json['groupName'],
      teamName: json['teamName'],
      designation: json['designation'],
      isActive: json['isActive'] ?? false,
    );
  }
}

final employeeDirectoryProvider = FutureProvider.autoDispose<List<Employee>>((ref) async {
  final dio = ref.watch(dioClientProvider);
  try {
    final response = await dio.get('/employees');
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data;
      return data.map((e) => Employee.fromJson(e)).toList();
    }
    throw Exception('Failed to load employees');
  } on DioException catch (e) {
    throw Exception('Network error: ${e.message}');
  }
});
