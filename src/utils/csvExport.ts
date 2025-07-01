import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const downloadCSV = (data: string, filename: string) => {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportDeliveryReport = (data: any[], dateRange?: DateRange | undefined) => {
  const headers = [
    'Campaign Name',
    'Total Sent',
    'Delivered',
    'Failed',
    'Delivery Rate',
  ];

  const csvData = data.map(row => [
    row.campaign_name,
    row.total_sent,
    row.delivered,
    row.failed,
    row.delivery_rate,
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  const dateStr = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
    
  downloadCSV(csvContent, `delivery_report_${dateStr}.csv`);
};

export const exportContactsReport = (data: any[], dateRange?: DateRange | undefined) => {
  const headers = [
    'Segment Name',
    'Total Contacts',
    'New Contacts',
    'Unsubscribed',
  ];

  const csvData = data.map(row => [
    row.segment_name,
    row.total_contacts,
    row.new_contacts,
    row.unsubscribed,
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  const dateStr = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');

  downloadCSV(csvContent, `contacts_report_${dateStr}.csv`);
};

export const exportResponsesReport = (data: any[], dateRange?: DateRange | undefined) => {
  const headers = [
    'Timestamp',
    'Contact Name', 
    'Phone',
    'Message Body',
    'Campaign Name'
  ];

  const csvData = data.map(row => [
    format(new Date(row.sent_at), 'yyyy-MM-dd HH:mm:ss'),
    row.contact_name,
    row.phone,
    `"${row.content.replace(/"/g, '""')}"`, // Escape quotes in message content
    row.campaign_name || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  const dateStr = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
    
  downloadCSV(csvContent, `responses_report_${dateStr}.csv`);
};

export const exportCampaignResponsesReport = (data: any[], dateRange?: DateRange | undefined) => {
  const headers = [
    'Campaign Name',
    'Contact Name',
    'Phone', 
    'Sent Time',
    'First Reply Time',
    'Message'
  ];

  const csvData = data.map(row => [
    row.campaign_name,
    row.contact_name,
    row.phone,
    format(new Date(row.sent_time), 'yyyy-MM-dd HH:mm:ss'),
    format(new Date(row.first_reply_time), 'yyyy-MM-dd HH:mm:ss'),
    `"${row.message.replace(/"/g, '""')}"` // Escape quotes in message content
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  const dateStr = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
    
  downloadCSV(csvContent, `campaign_responses_report_${dateStr}.csv`);
};
