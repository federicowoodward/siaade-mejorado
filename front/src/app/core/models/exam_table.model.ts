export interface ExamTable {
    id: number;
    name: string;
    startDate: string;   // YYYY-MM-DD
    endDate: string;     // YYYY-MM-DD
    createdBy: number;   // user_id de secretario
  }
  
   // posible busqueda idea: busqueda por creadted y por fechas