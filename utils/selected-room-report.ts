import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

declare const process: {
  cwd(): string;
};

export type SelectedRoomRecord = {
  testName: string;
  propertyName: string;
  roomName: string;
};

const reportPath = path.resolve(process.cwd(), 'reports', 'selected-rooms.xlsx');

export function appendSelectedRoom(record: SelectedRoomRecord): void {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const existingRows: SelectedRoomRecord[] = fs.existsSync(reportPath)
    ? (XLSX.utils.sheet_to_json<SelectedRoomRecord>(
        XLSX.readFile(reportPath).Sheets['Selected Rooms'],
      ) as SelectedRoomRecord[])
    : [];

  const rows = [
    ...existingRows,
    {
      ...record,
      recordedAt: new Date().toISOString(),
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Rooms');
  XLSX.writeFile(workbook, reportPath);
}

export function getSelectedRoomReportPath(): string {
  return reportPath;
}
