export type { Config } from './calc';

export type Fio = {
  id: string;
  nome: string;
  cor: string | null;
  espessura_mm: number | null;
  preco_rolo: number;
  metros_rolo: number;
  tara_g: number;
  peso_fechado_g: number | null;
  created_at: string;
};

export type Rolo = {
  id: string;
  fio_id: string;
  preco: number;
  metros: number;
  status: 'aberto' | 'zerado';
  comprado_em: string;
  created_at: string;
};

export type RoloComSaldo = Rolo & {
  fio: Fio;
  usado_m: number;
  saldo_m: number;
  em_uso: boolean;
  historico: { peca_id: string; nome: string; metros: number }[];
};

export type Material = {
  id: string;
  nome: string;
  unidade: 'un' | 'm' | 'g';
  preco_unitario: number;
  created_at: string;
};

export type Peca = {
  id: string;
  nome: string;
  status: 'em_andamento' | 'finalizada';
  horas: number;
  cronometro_inicio: string | null;
  margem: number;
  mao_obra_fechada: number | null;
  custo_fio: number | null;
  custo_materiais: number | null;
  custo_mao_obra: number | null;
  custo_fixos: number | null;
  custo_total: number | null;
  preco_sugerido: number | null;
  valor_hora_usado: number | null;
  taxa_usada: number | null;
  created_at: string;
  finalizada_em: string | null;
};

export type LancFio = {
  id: string;
  peca_id: string;
  rolo_id: string;
  peso_antes_g: number | null;
  peso_depois_g: number | null;
  metros_manual: number | null;
  metros: number | null;
  custo: number | null;
  created_at: string;
};

export type LancMat = {
  id: string;
  peca_id: string;
  material_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  created_at: string;
};
