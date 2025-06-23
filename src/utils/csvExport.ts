
import { format } from 'date-fns';

export interface DeliveryReportData {
  campaignName: string;
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  sentDate: string;
  status: string;
}

export interface ContactsReportData {
  segment: string;
  contacts: number;
  growth: string;
  engagement: string;
  avgValue: string;
  retention: string;
}

export function exportToCsv(data: any[], filename: string, headers: string[]) {
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportDeliveryReport(data: DeliveryReportData[], dateRange?: { from?: Date; to?: Date }) {
  const dateStr = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
  
  const filename = `delivery_report_${dateStr}.csv`;
  const headers = ['campaignName', 'totalSent', 'delivered', 'failed', 'pending', 'deliveryRate', 'sentDate', 'status'];
  
  exportToCsv(data, filename, headers);
}

export function exportContactsReport(data: ContactsReportData[], dateRange?: { from?: Date; to?: Date }) {
  const dateStr = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
  
  const filename = `contacts_report_${dateStr}.csv`;
  const headers = ['segment', 'contacts', 'growth', 'engagement', 'avgValue', 'retention'];
  
  exportToCsv(data, filename, headers);
}
