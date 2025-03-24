
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { LinkData } from '@/data/sampleLinkData';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface LinksTableProps {
  links: LinkData[];
}

export const LinksTable: React.FC<LinksTableProps> = ({ links }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Link Name</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">Conversions</TableHead>
          <TableHead className="text-right">CTR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => {
          const ctr = link.clicks > 0 
            ? (link.conversions / link.clicks * 100).toFixed(1) + '%' 
            : '0.0%';
          
          return (
            <TableRow key={link.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{link.name}</p>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {link.url}
                  </a>
                </div>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={link.isActive ? "default" : "outline"}
                  className={link.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                >
                  {link.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">{link.clicks}</TableCell>
              <TableCell className="text-right font-medium">{link.conversions}</TableCell>
              <TableCell className="text-right font-medium">{ctr}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
