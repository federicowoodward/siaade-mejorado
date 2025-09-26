export interface ExamTableUser {
  id: string;
  name: string;
  last_name?: string;
  email?: string;
}

export interface ExamTable {
  id: number;
  name: string;
  start_date: string;
  end_date: string;  
  created_by: string; 
  created_by_user?: ExamTableUser; 
}