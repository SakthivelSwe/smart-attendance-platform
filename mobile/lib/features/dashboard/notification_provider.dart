import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/dio_client.dart';

class SystemNotification {
  final String type;
  final String title;
  final String content;
  final String timeLabel;
  final String icon;
  final String color;
  final int count;

  SystemNotification({
    required this.type,
    required this.title,
    required this.content,
    required this.timeLabel,
    required this.icon,
    required this.color,
    required this.count,
  });

  factory SystemNotification.fromJson(Map<String, dynamic> json) {
    return SystemNotification(
      type: json['type'] ?? 'INFO',
      title: json['title'] ?? 'Notification',
      content: json['content'] ?? '',
      timeLabel: json['timeLabel'] ?? '',
      icon: json['icon'] ?? 'notifications',
      color: json['color'] ?? 'slate',
      count: json['count'] ?? 0,
    );
  }
}

// Provider fetching active notifications
final notificationsProvider = FutureProvider.autoDispose<List<SystemNotification>>((ref) async {
  final dio = ref.watch(dioClientProvider);
  try {
    final response = await dio.get('/notifications');
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data;
      return data.map((e) => SystemNotification.fromJson(e)).toList();
    }
    return [];
  } on DioException catch (e) {
    throw Exception('Failed to load notifications: ${e.message}');
  }
});
