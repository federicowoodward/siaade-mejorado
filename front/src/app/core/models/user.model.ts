export interface User {
    id: string; // UUID
    name: string;
    lastName: string;
    email: string;
    password: string;
    cuil: string;
    roleId: number;
  }
  
// posible busqueda idea: name email lastname cuil