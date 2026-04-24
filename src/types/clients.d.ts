
export type Client = {
  id: number;
  business_name: string;
};

export type CreateClientPayload = {
  nombre: string;
  apellidos: string;
  email: string;
  cif: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  provincia: string;
  pais: string;
  telefono: string;
};
