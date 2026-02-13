export interface Site {
  id: string;
  name: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  isRunning: boolean;
  ownerName: string;
  contact: string;
  createdAt: string;
}

export interface Worker {
  id: string;
  siteId: string;
  name: string;
  age: string;
  contact: string;
  village: string;
  category: 'karigar' | 'majdur';
  photoUri: string | null;
  joiningDate: string;
}

export interface HajariRecord {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  amount: number;
  date: string;
  time: string;
}

export interface ExpenseRecord {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  amount: number;
  date: string;
  time: string;
}

export interface PaymentRecord {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  amount: number;
  date: string;
  time: string;
}

export interface SitePhoto {
  id: string;
  siteId: string;
  uri: string;
  description: string;
  date: string;
  time: string;
}
