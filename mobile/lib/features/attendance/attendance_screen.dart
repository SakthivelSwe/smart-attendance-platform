import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/attendance/attendance_provider.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceState = ref.watch(attendanceProvider);
    final theme = Theme.of(context);

    // Format today's date for header
    final todayStr = DateFormat('MMM dd, yyyy').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Recent Attendance'),
            Text(
              todayStr,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(attendanceProvider);
        },
        child: attendanceState.when(
          data: (records) {
            if (records.isEmpty) {
              return ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  const Center(child: Text('No attendance records for today')),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: records.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final record = records[index];
                return _buildAttendanceCard(context, record);
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text('Failed to load attendance', style: theme.textTheme.titleMedium),
                TextButton(
                  onPressed: () => ref.invalidate(attendanceProvider),
                  child: const Text('Retry'),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAttendanceCard(BuildContext context, Attendance record) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outline),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left side: Name and Times
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.employeeName,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.login, size: 14, color: theme.colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      record.inTime != null ? _formatTime(record.inTime!) : '--:--',
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.logout, size: 14, color: Colors.orange),
                    const SizedBox(width: 4),
                    Text(
                      record.outTime != null ? _formatTime(record.outTime!) : '--:--',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
                if (record.remarks != null && record.remarks!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Notes: ${record.remarks}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontStyle: FontStyle.italic,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  )
                ]
              ],
            ),
          ),
          
          // Right side: Status Badge
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildStatusBadge(context, record.status),
              if (record.source != null) ...[
                 const SizedBox(height: 8),
                 Text(
                   record.source!,
                   style: theme.textTheme.labelSmall?.copyWith(
                     color: theme.colorScheme.onSurfaceVariant,
                   ),
                 )
              ]
            ],
          )
        ],
      ),
    );
  }

  String _formatTime(String timeString) {
    try {
      // timeString from backend is likely HH:mm:ss
      final parts = timeString.split(':');
      if (parts.length >= 2) {
        final time = TimeOfDay(int.parse(parts[0]), int.parse(parts[1]));
        // Note: Using a dummy context here isn't ideal but works for basic formatting
        // In a real app, use intl DateFormat or pass context
        final now = DateTime.now();
        final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
        return DateFormat('h:mm a').format(dt);
      }
      return timeString;
    } catch (e) {
      return timeString;
    }
  }

  Widget _buildStatusBadge(BuildContext context, String status) {
    Color bgColor;
    Color textColor;

    switch (status.toUpperCase()) {
      case 'WFO':
        bgColor = Colors.blue.withOpacity(0.1);
        textColor = Colors.blue[700]!;
        break;
      case 'WFH':
        bgColor = Colors.orange.withOpacity(0.1);
        textColor = Colors.orange[800]!;
        break;
      case 'LEAVE':
        bgColor = Colors.purple.withOpacity(0.1);
        textColor = Colors.purple[700]!;
        break;
      case 'ABSENT':
        bgColor = Colors.red.withOpacity(0.1);
        textColor = Colors.red[700]!;
        break;
      case 'HOLIDAY':
        bgColor = Colors.teal.withOpacity(0.1);
        textColor = Colors.teal[700]!;
        break;
      default:
        bgColor = Colors.grey.withOpacity(0.1);
        textColor = Colors.grey[700]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
