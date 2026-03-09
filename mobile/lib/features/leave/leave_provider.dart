import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/dio_client.dart';

class LeaveApplication {
  final int? id;
  final String startDate;
  final String endDate;
  final String reason;
  final String leaveType;

  LeaveApplication({
    this.id,
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.leaveType = 'PERSONAL',
  });

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'startDate': startDate,
      'endDate': endDate,
      'reason': reason,
      'leaveType': leaveType,
    };
  }
}

// Provider for submitting a leave application
final leaveSubmissionProvider = Provider<LeaveSubmissionService>((ref) {
  return LeaveSubmissionService(dio: ref.watch(dioClientProvider));
});

class LeaveSubmissionService {
  final Dio dio;

  LeaveSubmissionService({required this.dio});

  Future<bool> applyLeave(LeaveApplication application) async {
    try {
      final response = await dio.post(
        '/leaves',
        data: application.toJson(),
      );
      return response.statusCode == 201;
    } on DioException catch (e) {
      // Handle server validation errors or network issues
      throw Exception(e.response?.data?['message'] ?? 'Failed to submit leave application');
    }
  }
}
