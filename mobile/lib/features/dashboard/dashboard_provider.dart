import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/dio_client.dart';

// --- Model ---
class DashboardStats {
  final int totalEmployees;
  final int presentToday;
  final int wfoToday;
  final int wfhToday;
  final int onLeaveToday;
  final int absentToday;

  DashboardStats({
    required this.totalEmployees,
    required this.presentToday,
    required this.wfoToday,
    required this.wfhToday,
    required this.onLeaveToday,
    required this.absentToday,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalEmployees: json['totalEmployees'] ?? 0,
      presentToday: json['presentToday'] ?? 0,
      wfoToday: json['wfoToday'] ?? 0,
      wfhToday: json['wfhToday'] ?? 0,
      onLeaveToday: json['onLeaveToday'] ?? 0,
      absentToday: json['absentToday'] ?? 0,
    );
  }
}

// --- Provider ---
final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStats>((ref) async {
  final dio = ref.watch(dioClientProvider);
  try {
    final response = await dio.get('/dashboard/stats');
    if (response.statusCode == 200) {
      return DashboardStats.fromJson(response.data);
    }
    throw Exception('Failed to load dashboard stats');
  } on DioException catch (e) {
    throw Exception('Network error: ${e.message}');
  }
});
