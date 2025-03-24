
export interface LinkData {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  isActive: boolean;
  clicks: number;
  conversions: number;
}

export const sampleLinkData: LinkData[] = [
  {
    id: '1',
    name: 'Product Launch Newsletter',
    url: 'https://example.com/promo/summer-sale',
    createdAt: '2023-05-12T10:30:00Z',
    isActive: true,
    clicks: 532,
    conversions: 48
  },
  {
    id: '2',
    name: 'Summer Sale Campaign',
    url: 'https://example.com/campaign/summer2023',
    createdAt: '2023-06-01T08:15:00Z',
    isActive: true,
    clicks: 1253,
    conversions: 103
  },
  {
    id: '3',
    name: 'Social Media Promotion',
    url: 'https://example.com/social/instagram-promo',
    createdAt: '2023-06-15T14:45:00Z',
    isActive: true,
    clicks: 876,
    conversions: 72
  },
  {
    id: '4',
    name: 'Abandoned Cart Recovery',
    url: 'https://example.com/cart/recovery',
    createdAt: '2023-05-28T16:20:00Z',
    isActive: false,
    clicks: 410,
    conversions: 65
  },
  {
    id: '5',
    name: 'New User Welcome Flow',
    url: 'https://example.com/welcome/new-users',
    createdAt: '2023-04-10T09:00:00Z',
    isActive: true,
    clicks: 896,
    conversions: 124
  }
];
