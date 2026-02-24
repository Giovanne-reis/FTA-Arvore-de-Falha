export interface Suggestion {
  event: string;
  causes: string[];
}

export const COMMON_EQUIPMENT_FAILURES: Suggestion[] = [
  {
    event: "Motor não liga",
    causes: [
      "Falha no fornecimento de energia",
      "Fusível queimado ou disjuntor desarmado",
      "Contator ou relé de partida com defeito",
      "Enrolamento do motor em curto-circuito",
      "Intertravamento de segurança acionado"
    ]
  },
  {
    event: "Vibração excessiva",
    causes: [
      "Desalinhamento entre motor e carga",
      "Desbalanceamento de componentes rotativos",
      "Rolamentos desgastados ou danificados",
      "Fixação da base frouxa",
      "Eixo empenado"
    ]
  },
  {
    event: "Vazamento de óleo",
    causes: [
      "Retentores ou selos mecânicos rompidos",
      "Juntas de vedação ressecadas",
      "Excesso de pressão no sistema",
      "Trincas na carcaça do equipamento",
      "Conexões de tubulação frouxas"
    ]
  },
  {
    event: "Superaquecimento",
    causes: [
      "Falta de lubrificação adequada",
      "Sobrecarga mecânica contínua",
      "Sistema de ventilação obstruído",
      "Temperatura ambiente elevada",
      "Baixo nível de fluido de arrefecimento"
    ]
  },
  {
    event: "Ruído anormal",
    causes: [
      "Falta de graxa nos rolamentos",
      "Engrenagens com dentes quebrados ou gastos",
      "Peças internas soltas",
      "Cavitação em bombas",
      "Correias de transmissão patinando"
    ]
  },
  {
    event: "Baixa pressão hidráulica",
    causes: [
      "Nível de óleo baixo no reservatório",
      "Bomba hidráulica desgastada",
      "Válvula de alívio travada aberta",
      "Filtro de sucção obstruído",
      "Vazamento interno em cilindros"
    ]
  },
  {
    event: "Desarme frequente de disjuntor",
    causes: [
      "Sobrecarga no circuito elétrico",
      "Curto-circuito fase-terra",
      "Fuga de corrente por isolação precária",
      "Disjuntor subdimensionado",
      "Picos de partida excessivos"
    ]
  },
  {
    event: "Perda de eficiência térmica",
    causes: [
      "Incrustação em trocadores de calor",
      "Vazamento de gás refrigerante",
      "Ventiladores do condensador parados",
      "Filtros de ar saturados",
      "Isolamento térmico danificado"
    ]
  },
  {
    event: "Falha de comunicação (CLP/IHM)",
    causes: [
      "Cabo de rede desconectado ou rompido",
      "Interferência eletromagnética (EMI)",
      "Porta de comunicação queimada",
      "Erro de configuração de IP/Protocolo",
      "Fonte de alimentação do módulo com falha"
    ]
  },
  {
    event: "Desgaste prematuro de correias",
    causes: [
      "Polias desalinhadas",
      "Tensão da correia inadequada (frouxa/estrita)",
      "Ambiente com contaminação química",
      "Polias com canais gastos",
      "Sobrecarga de partida brusca"
    ]
  }
];
