package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.enums.AttendanceStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds beautiful HTML email templates for all notification types.
 */
@Service
public class EmailTemplateService {

        private static final String BRAND_COLOR = "#4F46E5";
        private static final String BRAND_NAME = "Smart Attendance";
        private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy (EEEE)");

        /**
         * Team daily summary for Team Leads.
         */
        public String buildTeamDailySummary(String teamName, String teamLeadName,
                        List<AttendanceDTO> attendanceList, LocalDate date) {
                Map<AttendanceStatus, List<AttendanceDTO>> grouped = attendanceList.stream()
                                .collect(Collectors.groupingBy(AttendanceDTO::getStatus));

                long wfo = grouped.getOrDefault(AttendanceStatus.WFO, List.of()).size();
                long wfh = grouped.getOrDefault(AttendanceStatus.WFH, List.of()).size();
                long leave = grouped.getOrDefault(AttendanceStatus.LEAVE, List.of()).size();
                long absent = grouped.getOrDefault(AttendanceStatus.ABSENT, List.of()).size();
                long total = attendanceList.size();
                long present = wfo + wfh;
                int percentage = total > 0 ? (int) ((present * 100) / total) : 0;

                List<String> absentNames = grouped.getOrDefault(AttendanceStatus.ABSENT, List.of())
                                .stream().map(AttendanceDTO::getEmployeeName).collect(Collectors.toList());

                StringBuilder sb = new StringBuilder();
                sb.append(header("📊 Team Daily Summary"));
                sb.append("<div style='padding: 24px;'>");
                sb.append("<p style='margin: 0 0 4px; color: #6B7280; font-size: 13px;'>Hi <b>").append(teamLeadName)
                                .append("</b>,</p>");
                sb.append("<p style='margin: 0 0 20px; color: #374151;'>Here's your team <b>").append(teamName)
                                .append("</b> attendance summary for <b>").append(date.format(DATE_FMT))
                                .append("</b>:</p>");

                // Stats grid
                sb.append("<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:20px;'><tr>");
                sb.append(statCell("🏢 WFO", wfo, "#10B981"));
                sb.append(statCell("🏠 WFH", wfh, "#3B82F6"));
                sb.append(statCell("📋 Leave", leave, "#F59E0B"));
                sb.append(statCell("❌ Absent", absent, "#EF4444"));
                sb.append("</tr></table>");

                // Attendance rate bar
                sb.append(progressBar(percentage));

                // Absentees list
                if (!absentNames.isEmpty()) {
                        sb.append(
                                        "<div style='background:#FEF2F2; border-left:4px solid #EF4444; padding:12px 16px; border-radius:8px; margin-top:16px;'>");
                        sb.append("<p style='margin:0 0 8px; font-weight:700; color:#991B1B; font-size:13px;'>⚠ Absent Members (")
                                        .append(absentNames.size()).append(")</p>");
                        sb.append("<ul style='margin:0; padding-left:18px; color:#B91C1C; font-size:13px;'>");
                        absentNames.forEach(
                                        n -> sb.append("<li style='margin-bottom:4px;'>").append(n).append("</li>"));
                        sb.append("</ul></div>");
                }

                sb.append("</div>");
                sb.append(footer());
                return wrapEmail(sb.toString());
        }

        /**
         * Manager daily summary — aggregated across multiple teams.
         */
        public String buildManagerDailySummary(String managerName, Map<String, List<AttendanceDTO>> teamAttendanceMap,
                        LocalDate date) {
                StringBuilder sb = new StringBuilder();
                sb.append(header("📈 Manager Daily Summary"));
                sb.append("<div style='padding: 24px;'>");
                sb.append("<p style='margin: 0 0 4px; color: #6B7280; font-size: 13px;'>Hi <b>").append(managerName)
                                .append("</b>,</p>");
                sb.append("<p style='margin: 0 0 20px; color: #374151;'>Attendance summary across your teams for <b>")
                                .append(date.format(DATE_FMT)).append("</b>:</p>");

                // Per-team breakdown
                for (Map.Entry<String, List<AttendanceDTO>> entry : teamAttendanceMap.entrySet()) {
                        String teamName = entry.getKey();
                        List<AttendanceDTO> list = entry.getValue();
                        long present = list.stream()
                                        .filter(a -> a.getStatus() == AttendanceStatus.WFO
                                                        || a.getStatus() == AttendanceStatus.WFH)
                                        .count();
                        long absent = list.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
                        int pct = list.size() > 0 ? (int) ((present * 100) / list.size()) : 0;

                        sb.append(
                                        "<div style='background:#F9FAFB; border-radius:12px; padding:16px; margin-bottom:12px; border:1px solid #E5E7EB;'>");
                        sb.append(
                                        "<div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;'>");
                        sb.append("<span style='font-weight:700; color:#111827; font-size:14px;'>").append(teamName)
                                        .append("</span>");
                        sb.append("<span style='font-weight:700; color:")
                                        .append(pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444")
                                        .append("; font-size:14px;'>").append(pct).append("% Present</span>");
                        sb.append("</div>");
                        sb.append("<p style='margin:0; color:#6B7280; font-size:12px;'>")
                                        .append(present).append(" present · ").append(absent).append(" absent · ")
                                        .append(list.size()).append(" total</p>");
                        sb.append(progressBar(pct));
                        sb.append("</div>");
                }

                sb.append("</div>");
                sb.append(footer());
                return wrapEmail(sb.toString());
        }

        /**
         * Absence alert for Team Lead — immediate notification.
         */
        public String buildAbsenceAlert(String teamLeadName, String teamName,
                        List<String> absentEmployees, LocalDate date) {
                StringBuilder sb = new StringBuilder();
                sb.append(header("🚨 Absence Alert"));
                sb.append("<div style='padding: 24px;'>");
                sb.append("<p style='margin: 0 0 4px; color: #6B7280; font-size: 13px;'>Hi <b>").append(teamLeadName)
                                .append("</b>,</p>");
                sb.append("<p style='margin: 0 0 16px; color: #374151;'>The following members of <b>").append(teamName)
                                .append("</b> are absent on <b>").append(date.format(DATE_FMT)).append("</b>:</p>");

                sb.append("<div style='background:#FEF2F2; border-radius:12px; padding:16px; border:1px solid #FECACA;'>");
                sb.append("<ul style='margin:0; padding-left:18px; color:#991B1B; font-size:14px;'>");
                absentEmployees
                                .forEach(n -> sb.append("<li style='margin-bottom:6px; font-weight:600;'>").append(n)
                                                .append("</li>"));
                sb.append("</ul></div>");

                sb.append(
                                "<p style='margin:16px 0 0; color:#6B7280; font-size:12px;'>Please check on your team members and update attendance if needed.</p>");
                sb.append("</div>");
                sb.append(footer());
                return wrapEmail(sb.toString());
        }

        /**
         * Low attendance alert for Manager.
         */
        public String buildLowAttendanceAlert(String managerName, String teamName,
                        int attendancePercentage, int threshold, LocalDate date) {
                StringBuilder sb = new StringBuilder();
                sb.append(header("⚠ Low Attendance Alert"));
                sb.append("<div style='padding: 24px;'>");
                sb.append("<p style='margin: 0 0 4px; color: #6B7280; font-size: 13px;'>Hi <b>").append(managerName)
                                .append("</b>,</p>");
                sb.append("<p style='margin: 0 0 16px; color: #374151;'>Team <b>").append(teamName)
                                .append("</b> has <span style='color:#EF4444; font-weight:700; font-size:18px;'>")
                                .append(attendancePercentage)
                                .append("%</span> attendance on <b>").append(date.format(DATE_FMT))
                                .append("</b>, below your threshold of <b>").append(threshold).append("%</b>.</p>");

                sb.append(progressBar(attendancePercentage));

                sb.append(
                                "<p style='margin:16px 0 0; color:#6B7280; font-size:12px;'>Consider reaching out to the team lead for more details.</p>");
                sb.append("</div>");
                sb.append(footer());
                return wrapEmail(sb.toString());
        }

        /**
         * Leave request alert for Team Lead/Manager.
         */
        public String buildLeaveRequestAlert(String approverName, String employeeName,
                        LocalDate startDate, LocalDate endDate, String reason, String leaveType) {
                StringBuilder sb = new StringBuilder();
                sb.append(header("📋 New Leave Request"));
                sb.append("<div style='padding: 24px;'>");
                sb.append("<p style='margin: 0 0 4px; color: #6B7280; font-size: 13px;'>Hi <b>").append(approverName)
                                .append("</b>,</p>");
                sb.append("<p style='margin: 0 0 16px; color: #374151;'><b>").append(employeeName)
                                .append("</b> has requested ").append(leaveType).append(" leave.</p>");

                sb.append("<div style='background:#F9FAFB; border-radius:12px; padding:16px; border:1px solid #E5E7EB;'>");
                sb.append("<p style='margin:0 0 8px; color:#4B5563; font-size:14px;'><b>From:</b> ")
                                .append(startDate.format(DATE_FMT)).append("</p>");
                sb.append("<p style='margin:0 0 8px; color:#4B5563; font-size:14px;'><b>To:</b> ")
                                .append(endDate.format(DATE_FMT)).append("</p>");
                sb.append("<p style='margin:0; color:#4B5563; font-size:14px;'><b>Reason:</b> ").append(reason)
                                .append("</p>");
                sb.append("</div>");

                sb.append("<p style='margin:16px 0 0; color:#6B7280; font-size:12px;'>Please review this request in the dashboard.</p>");
                sb.append("</div>");
                sb.append(footer());
                return wrapEmail(sb.toString());
        }

        /**
         * Leave status alert for Employee (Approved/Rejected/Cancelled).
         */
        public String buildLeaveStatusAlert(String employeeName, String action, String remarks,
                        LocalDate startDate, LocalDate endDate) {
                String color = action.equals("APPROVED") ? "#10B981"
                                : action.equals("REJECTED") ? "#EF4444" : "#F59E0B";
                String emoji = action.equals("APPROVED") ? "✅" : action.equals("REJECTED") ? "❌" : "ℹ️";

                StringBuilder sb = new StringBuilder();
                sb.append(header(emoji + " Leave Request " + action));
                sb.append("<div style='padding: 24px;'>");
                sb.append("<p style='margin: 0 0 4px; color: #6B7280; font-size: 13px;'>Hi <b>").append(employeeName)
                                .append("</b>,</p>");
                sb.append("<p style='margin: 0 0 16px; color: #374151;'>Your leave request for <b>")
                                .append(startDate.format(DATE_FMT)).append("</b> to <b>")
                                .append(endDate.format(DATE_FMT))
                                .append("</b> has been <span style='color:").append(color)
                                .append("; font-weight:700;'>")
                                .append(action).append("</span>.</p>");

                if (remarks != null && !remarks.isBlank()) {
                        sb.append("<div style='background:#F9FAFB; border-left:4px solid ").append(color)
                                        .append("; padding:12px 16px; border-radius:8px;'>");
                        sb.append("<p style='margin:0 0 4px; font-weight:700; color:#4B5563; font-size:13px;'>Remarks:</p>");
                        sb.append("<p style='margin:0; color:#6B7280; font-size:13px;'>").append(remarks)
                                        .append("</p>");
                        sb.append("</div>");
                }

                sb.append("</div>");
                sb.append(footer());
                return wrapEmail(sb.toString());
        }

        // ─── Shared template helpers ────────────────────────────────────────

        private String wrapEmail(String body) {
                return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                                + "<body style='margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;'>"
                                + "<div style='max-width:600px; margin:24px auto; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);'>"
                                + body
                                + "</div></body></html>";
        }

        private String header(String title) {
                return "<div style='background:linear-gradient(135deg," + BRAND_COLOR
                                + ",#7C3AED); padding:24px 24px 20px; text-align:center;'>"
                                + "<h1 style='margin:0; color:#FFFFFF; font-size:20px; font-weight:800; letter-spacing:-0.5px;'>"
                                + title + "</h1>"
                                + "<p style='margin:4px 0 0; color:rgba(255,255,255,0.8); font-size:11px; text-transform:uppercase; letter-spacing:1px;'>"
                                + BRAND_NAME + "</p>"
                                + "</div>";
        }

        private String footer() {
                return "<div style='background:#F9FAFB; padding:16px 24px; text-align:center; border-top:1px solid #E5E7EB;'>"
                                + "<p style='margin:0; color:#9CA3AF; font-size:11px;'>This is an automated notification from "
                                + BRAND_NAME + ".</p>"
                                + "<p style='margin:4px 0 0; color:#9CA3AF; font-size:11px;'>Manage your notification preferences in Settings.</p>"
                                + "</div>";
        }

        private String statCell(String label, long value, String color) {
                return "<td style='width:25%; text-align:center; padding:12px 4px;'>"
                                + "<div style='background:" + color + "10; border-radius:12px; padding:12px 8px;'>"
                                + "<p style='margin:0; font-size:24px; font-weight:800; color:" + color + ";'>" + value
                                + "</p>"
                                + "<p style='margin:4px 0 0; font-size:11px; color:#6B7280; font-weight:600;'>" + label
                                + "</p>"
                                + "</div></td>";
        }

        private String progressBar(int percentage) {
                String color = percentage >= 80 ? "#10B981" : percentage >= 60 ? "#F59E0B" : "#EF4444";
                return "<div style='margin-top:8px;'>"
                                + "<div style='display:flex; justify-content:space-between; margin-bottom:4px;'>"
                                + "<span style='font-size:11px; color:#6B7280; font-weight:600;'>Attendance Rate</span>"
                                + "<span style='font-size:11px; color:" + color + "; font-weight:700;'>" + percentage
                                + "%</span>"
                                + "</div>"
                                + "<div style='background:#E5E7EB; border-radius:999px; height:8px; overflow:hidden;'>"
                                + "<div style='background:" + color + "; width:" + percentage
                                + "%; height:100%; border-radius:999px;'></div>"
                                + "</div></div>";
        }
}
