import { Component, OnInit } from '@angular/core';

interface MetricsData {
  category: string;
  subcategory?: string;
  isHeader?: boolean;
  isSummary?: boolean;
  isSubcategory?: boolean;
  march?: number;
  marchPct?: number;
  april?: number;
  aprilPct?: number;
  may?: number;
  mayPct?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  displayedColumns: string[] = ['category', 'march', 'marchPct', 'april', 'aprilPct', 'may', 'mayPct'];
  
  metricsData: MetricsData[] = [
    { category: 'FACTORSOFT CREDIT REQUEST TOTAL', isHeader: true, march: 1931, marchPct: 100, april: 1954, aprilPct: 100, may: 2221, mayPct: 100 },
    { category: 'Average Credit Request Per Day:', isSummary: true, march: 97, marchPct: 100, april: 89, aprilPct: 100, may: 101, mayPct: 100 },
    
    { category: 'Breakdown by Industry:', isHeader: true },
    { category: 'Breakdown by Industry:', subcategory: 'Commercial', isSubcategory: true, march: 527, marchPct: 27, april: 678, aprilPct: 35, may: 666, mayPct: 30 },
    { category: 'Breakdown by Industry:', subcategory: 'Transportation', isSubcategory: true, march: 1404, marchPct: 73, april: 1276, aprilPct: 65, may: 1555, mayPct: 70 },
    
    { category: 'Breakdown by Region:', isHeader: true },
    { category: 'Breakdown by Region:', subcategory: 'Canadian', isSubcategory: true, march: 1492, marchPct: 77, april: 1387, aprilPct: 71, may: 1665, mayPct: 75 },
    { category: 'Breakdown by Region:', subcategory: 'US', isSubcategory: true, march: 439, marchPct: 23, april: 567, aprilPct: 29, may: 556, mayPct: 25 },
    
    { category: 'Breakdown by Decision:', isHeader: true },
    { category: 'Breakdown by Decision:', subcategory: 'Approved', isSubcategory: true, march: 1508, marchPct: 78, april: 1442, aprilPct: 74, may: 1705, mayPct: 77 },
    { category: 'Breakdown by Decision:', subcategory: 'SOA', isSubcategory: true, march: 277, marchPct: 14, april: 186, aprilPct: 10, may: 308, mayPct: 14 },
    { category: 'Breakdown by Decision:', subcategory: 'Declined', isSubcategory: true, march: 142, marchPct: 7, april: 326, aprilPct: 17, may: 183, mayPct: 8 },
    { category: 'Breakdown by Decision:', subcategory: 'Deleted', isSubcategory: true, march: 4, marchPct: 0, april: 0, aprilPct: 0, may: 25, mayPct: 1 }
  ];

  constructor() {}

  ngOnInit(): void {
    // Any initialization logic
  }

  // Helper function to determine the class for special values
  getCellClass(row: MetricsData, column: string): string {
    if (row.subcategory === 'Canadian' && column.startsWith('may')) {
      return 'highlight-value';
    }
    if (row.subcategory === 'US' && column.startsWith('may')) {
      return 'highlight-value-blue';
    }
    return '';
  }
}