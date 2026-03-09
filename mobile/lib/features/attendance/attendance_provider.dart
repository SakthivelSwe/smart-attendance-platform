import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/dio_client.dart';

class Attendance {
  final int id;
  final int employeeId;
  final String employeeName;
  final String? employeeCode;
  final DateTime date;
  final String? inTime;
  final String? outTime;
  final String status;
  final String? source;
  final String? remarks;
  final String? groupName;

  Attendance({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    this.employeeCode,
    required this.date,
    this.inTime,
    this.outTime,
    required this.status,
    this.source,
    this.remarks,
    this.groupName,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'],
      employeeId: json['employeeId'],
      employeeName: json['employeeName'] ?? '',
      employeeCode: json['employeeCode'],
      date: DateTime.parse(json['date']),
      inTime: json['inTime'],
      outTime: json['outTime'],
      status: json['status'] ?? 'UNKNOWN',
      source: json['source'],
      remarks: json['remarks'],
      groupName: json['groupName'],
    );
  }
}

// Provider for fetching today's attendance by default
final attendanceProvider = FutureProvider.autoDispose<List<Attendance>>((ref) async {
  final dio = ref.watch(dioClientProvider);
  final today = DateTime.now().toIso8601String().split('T')[0];
  
  try {
    final response = await dio.get('/attendance/date/$today');
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data;
      return data.map((e) => Attendance.fromJson(e)).toList();
    }
    throw Exception('Failed to load attendance');
  } on DioException catch (e) {
    throw Exception('Network error: ${e.message}');
  }
});
