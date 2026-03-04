package com.smartattendance.service;

import com.opencsv.CSVWriter;
import com.smartattendance.dto.EmployeeReportCardDTO;
import com.smartattendance.dto.TeamComparisonDTO;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    private static final Logger logger = LoggerFactory.getLogger(ExportService.class);

    // --- CSV EXPORT ---
    public byte[] exportEmployeeReportToCsv(List<EmployeeReportCardDTO> cards) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                OutputStreamWriter writer = new OutputStreamWriter(baos);
                CSVWriter csvWriter = new CSVWriter(writer)) {

            String[] header = { "Employee Code", "Name", "Team", "Working Days", "Present", "Absent", "On Leave",
                    "WFH Days", "Attendance %" };
            csvWriter.writeNext(header);

            for (EmployeeReportCardDTO card : cards) {
                csvWriter.writeNext(new String[] {
                        card.getEmployeeCode(),
                        card.getEmployeeName(),
                        card.getTeamName(),
                        String.valueOf(card.getTotalWorkingDays()),
                        String.valueOf(card.getTotalPresent()),
                        String.valueOf(card.getTotalAbsent()),
                        String.valueOf(card.getTotalOnLeave()),
                        String.valueOf(card.getWfhDays()),
                        String.valueOf(card.getAttendanceRate()) + "%"
                });
            }
            csvWriter.flush();
            return baos.toByteArray();
        } catch (IOException e) {
            logger.error("Failed to export to CSV", e);
            throw new RuntimeException("Failed to generate CSV file");
        }
    }

    // --- EXCEL EXPORT ---
    public byte[] exportEmployeeReportToExcel(List<EmployeeReportCardDTO> cards) {
        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Employee Attendance Report");
            String[] columns = { "Employee Code", "Name", "Team", "Working Days", "Present", "Absent", "On Leave",
                    "WFH Days", "Attendance Rate" };

            // Header Font
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);

            // Row for Header
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            for (EmployeeReportCardDTO card : cards) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(card.getEmployeeCode() != null ? card.getEmployeeCode() : "N/A");
                row.createCell(1).setCellValue(card.getEmployeeName());
                row.createCell(2).setCellValue(card.getTeamName());
                row.createCell(3).setCellValue(card.getTotalWorkingDays());
                row.createCell(4).setCellValue(card.getTotalPresent());
                row.createCell(5).setCellValue(card.getTotalAbsent());
                row.createCell(6).setCellValue(card.getTotalOnLeave());
                row.createCell(7).setCellValue(card.getWfhDays());
                row.createCell(8).setCellValue(card.getAttendanceRate());
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            logger.error("Failed to export to Excel", e);
            throw new RuntimeException("Failed to generate Excel file");
        }
    }

    // --- PDF EXPORT ---
    public byte[] exportTeamComparisonToPdf(List<TeamComparisonDTO> cards) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Team Attendance Comparison", fontTitle);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100f);
            table.setWidths(new float[] { 2.5f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f });

            Font fontCore = FontFactory.getFont(FontFactory.HELVETICA_BOLD);

            // Headers
            String[] headers = { "Team", "Employees", "Present", "Absent", "On Leave", "Rate %" };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, fontCore));
                cell.setPadding(5);
                table.addCell(cell);
            }

            Font fontData = FontFactory.getFont(FontFactory.HELVETICA);
            for (TeamComparisonDTO team : cards) {
                table.addCell(new Phrase(team.getTeamName(), fontData));
                table.addCell(new Phrase(String.valueOf(team.getTotalEmployees()), fontData));
                table.addCell(new Phrase(String.valueOf(team.getTotalPresent()), fontData));
                table.addCell(new Phrase(String.valueOf(team.getTotalAbsent()), fontData));
                table.addCell(new Phrase(String.valueOf(team.getTotalOnLeave()), fontData));
                table.addCell(new Phrase(String.valueOf(team.getAttendanceRate()) + "%", fontData));
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            logger.error("Failed to export to PDF", e);
            throw new RuntimeException("Failed to generate PDF file");
        }
    }
}
