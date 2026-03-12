export interface SuggestionNode {
  label: string;
  type: 'topEvent' | 'immediateCause' | 'intermediateCause' | 'undevelopedEvent' | 'basicCause' | 'contributingFactor' | 'andGate' | 'orGate' | 'blockingAction';
  children?: SuggestionNode[];
}

export interface Suggestion {
  event: string;
  tree: SuggestionNode;
}

export const COMMON_EQUIPMENT_FAILURES: Suggestion[] = [
  {
    event: "Quebra da Polia do Gerador a Gás",
    tree: {
      label: "QUEBRA DA POLIA DO GERADOR A GÁS",
      type: "topEvent",
      children: [
        {
          label: "FALHA DURANTE TESTE DE CARGA",
          type: "immediateCause",
          children: [
            {
              label: "OU",
              type: "orGate",
              children: [
                {
                  label: "INTEGRIDADE DOS COMPONENTES MECÂNICOS",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "OU",
                      type: "orGate",
                      children: [
                        {
                          label: "DEFEITO DE FUNDIÇÃO / LAMINAÇÃO",
                          type: "intermediateCause",
                          children: [
                            {
                              label: "ESPECIFICAÇÃO INCORRETA DO MATERIAL",
                              type: "contributingFactor",
                              children: [
                                {
                                  label: "GEOMETRIA INADEQUADA",
                                  type: "undevelopedEvent"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          label: "FADIGA METÁLICA DO MATERIAL",
                          type: "intermediateCause",
                          children: [
                            {
                              label: "VIDA ÚTIL DO MATERIAL EXPIRADA",
                              type: "basicCause",
                              children: [
                                {
                                  label: "PLANO DE TROCA PREVENTIVA\nImplementar cronograma de substituição baseado em horas de voo/operação",
                                  type: "blockingAction"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "MANUTENÇÃO E LUBRIFICAÇÃO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "QUANTIDADE INSUFICIENTE DE GRAXA",
                      type: "intermediateCause",
                      children: [
                        {
                          label: "E",
                          type: "andGate",
                          children: [
                            {
                              label: "LUBRIFICANTE INCOMPATÍVEL",
                              type: "basicCause",
                              children: [
                                {
                                  label: "PADRONIZAÇÃO DE INSUMOS\nRevisar catálogo de fornecedores e treinar equipe de suprimentos",
                                  type: "blockingAction"
                                }
                              ]
                            },
                            {
                              label: "EXCESSO DE GRAXA",
                              type: "basicCause",
                              children: [
                                {
                                  label: "CONTROLE DE DOSAGEM\nInstalar bicos dosadores automáticos e check-list de volume",
                                  type: "blockingAction"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "MONTAGEM / INSTALAÇÃO (ERRO HUMANO)",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "OU",
                      type: "orGate",
                      children: [
                        {
                          label: "ERRO NA MONTAGEM INICIAL",
                          type: "intermediateCause",
                          children: [
                            {
                              label: "DESALINHAMENTO DAS PEÇAS",
                              type: "intermediateCause",
                              children: [
                                {
                                  label: "TORQUE INADEQUADO EM FIXADORES",
                                  type: "intermediateCause",
                                  children: [
                                    {
                                      label: "ESPECIFICAÇÃO DE TORQUE ERRADA",
                                      type: "intermediateCause",
                                      children: [
                                        {
                                          label: "FALHA NA CONSULTA TÉCNICA",
                                          type: "intermediateCause",
                                          children: [
                                            {
                                              label: "MANUAL TÉCNICO INDISPONÍVEL",
                                              type: "intermediateCause",
                                              children: [
                                                {
                                                  label: "MANUAL NÃO FORNECIDO PELO FABRICANTE",
                                                  type: "intermediateCause",
                                                  children: [
                                                    {
                                                      label: "OBSOLESCÊNCIA DA DOCUMENTAÇÃO",
                                                      type: "intermediateCause",
                                                      children: [
                                                        {
                                                          label: "DESCONTINUIDADE DA LINHA DE PRODUTOS",
                                                          type: "intermediateCause",
                                                          children: [
                                                            {
                                                              label: "E",
                                                              type: "andGate",
                                                              children: [
                                                                {
                                                                  label: "DEFICIÊNCIA TÉCNICA DO PROFISSIONAL",
                                                                  type: "basicCause",
                                                                  children: [
                                                                    {
                                                                      label: "TREINAMENTO ESPECIALIZADO\nCapacitar técnicos em equipamentos legados e descontinuados",
                                                                      type: "blockingAction"
                                                                    }
                                                                  ]
                                                                },
                                                                {
                                                                  label: "PROCEDIMENTO INADEQUADO DE MONTAGEM",
                                                                  type: "basicCause",
                                                                  children: [
                                                                    {
                                                                      label: "REVISÃO DE POP\nCriar Procedimento Operacional Padrão específico para este conjunto",
                                                                      type: "blockingAction"
                                                                    }
                                                                  ]
                                                                }
                                                              ]
                                                            }
                                                          ]
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          label: "USO DE FERRAMENTAS INADEQUADAS",
                          type: "intermediateCause",
                          children: [
                            {
                              label: "FALTA DE EXPERIÊNCIA DO TÉCNICO",
                              type: "intermediateCause",
                              children: [
                                {
                                  label: "AUSÊNCIA DE CERTIFICAÇÃO TÉCNICA",
                                  type: "intermediateCause",
                                  children: [
                                    {
                                      label: "FALTA DE GESTÃO DE COMPETÊNCIA",
                                      type: "intermediateCause",
                                      children: [
                                        {
                                          label: "INEXISTÊNCIA DE MATRIZ DE COMPETÊNCIA",
                                          type: "intermediateCause",
                                          children: [
                                            {
                                              label: "INADEQUAÇÃO DA QUALIFICAÇÃO TÉCNICA",
                                              type: "basicCause",
                                              children: [
                                                {
                                                  label: "AUDITORIA DE COMPETÊNCIAS\nImplementar matriz de habilidades e validar certificações anualmente",
                                                  type: "blockingAction"
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          label: "AQUECIMENTO NA POLIA ACIMA DE 120°C",
                          type: "intermediateCause",
                          children: [
                            {
                              label: "TENSÃO EXCESSIVA INCORRETA",
                              type: "intermediateCause",
                              children: [
                                {
                                  label: "TRAVAMENTO MECÂNICO DO ESTICADOR",
                                  type: "intermediateCause",
                                  children: [
                                    {
                                      label: "AJUSTE MANUAL SEM INSTRUMENTOS",
                                      type: "intermediateCause",
                                      children: [
                                        {
                                          label: "AUSÊNCIA DE TENSIÔMETRO DE CORREIA",
                                          type: "intermediateCause",
                                          children: [
                                            {
                                              label: "ITEM NÃO PREVISTO NO PLANEJAMENTO",
                                              type: "intermediateCause",
                                              children: [
                                                {
                                                  label: "FALTA DE EXPERIÊNCIA NA AVALIAÇÃO",
                                                  type: "basicCause",
                                                  children: [
                                                    {
                                                      label: "AQUISIÇÃO DE INSTRUMENTAÇÃO\nComprar tensiômetros digitais e incluir calibração no plano",
                                                      type: "blockingAction"
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    event: "Vibração Excessiva em Turbina",
    tree: {
      label: "VIBRAÇÃO EXCESSIVA EM TURBINA",
      type: "topEvent",
      children: [
        {
          label: "DESBALANCEAMENTO DO ROTOR",
          type: "immediateCause",
          children: [
            {
              label: "OU",
              type: "orGate",
              children: [
                {
                  label: "ACÚMULO DE DEPÓSITOS NAS PALHETAS",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "CONTAMINAÇÃO DO FLUIDO DE TRABALHO",
                      type: "contributingFactor",
                      children: [
                        {
                          label: "FALHA NO SISTEMA DE FILTRAGEM",
                          type: "basicCause",
                          children: [
                            {
                              label: "UPGRADE DE FILTRAGEM\nInstalar filtros de alta eficiência e sensores de pressão diferencial",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "DESGASTE EROSIVO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "PRESENÇA DE PARTÍCULAS SÓLIDAS",
                      type: "contributingFactor",
                      children: [
                        {
                          label: "EROSÃO POR IMPACTO",
                          type: "undevelopedEvent"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    event: "Desarme do Disjuntor Principal (Elétrica)",
    tree: {
      label: "DESARME DO DISJUNTOR PRINCIPAL DA SUBESTAÇÃO",
      type: "topEvent",
      children: [
        {
          label: "ATUAÇÃO DA PROTEÇÃO POR SOBRECORRENTE",
          type: "immediateCause",
          children: [
            {
              label: "OU",
              type: "orGate",
              children: [
                {
                  label: "SOBRECARGA NO SISTEMA ELÉTRICO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "AUMENTO SÚBITO DA DEMANDA DE CARGA",
                      type: "contributingFactor",
                      children: [
                        {
                          label: "FALHA NO PLANEJAMENTO DE EXPANSÃO",
                          type: "basicCause",
                          children: [
                            {
                              label: "REVISÃO DO PLANO DE CARGA\nInstalar medidores inteligentes e realizar estudo de seletividade",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "CURTO-CIRCUITO NA REDE DE DISTRIBUIÇÃO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "DETERIORAÇÃO DA ISOLAÇÃO DOS CABOS",
                      type: "intermediateCause",
                      children: [
                        {
                          label: "ENVELHECIMENTO NATURAL DO ISOLAMENTO",
                          type: "basicCause",
                          children: [
                            {
                              label: "TERMOGRAFIA E MEGÔMETRO\nPlano de inspeção termográfica semestral e teste de isolação anual",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    event: "Queima de Motor de Grande Porte (Elétrica)",
    tree: {
      label: "QUEIMA DE MOTOR ELÉTRICO DE GRANDE PORTE",
      type: "topEvent",
      children: [
        {
          label: "FALHA NA ISOLAÇÃO DO ENROLAMENTO",
          type: "immediateCause",
          children: [
            {
              label: "OU",
              type: "orGate",
              children: [
                {
                  label: "SUPERAQUECIMENTO PROLONGADO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "E",
                      type: "andGate",
                      children: [
                        {
                          label: "SOBRECARGA MECÂNICA CONTÍNUA",
                          type: "basicCause",
                          children: [
                            {
                              label: "MONITORAMENTO DE CORRENTE\nInstalar relés de sobrecarga digitais com log de eventos",
                              type: "blockingAction"
                            }
                          ]
                        },
                        {
                          label: "FALHA NO SISTEMA DE VENTILAÇÃO",
                          type: "basicCause",
                          children: [
                            {
                              label: "LIMPEZA TÉCNICA MENSAL\nRemover obstruções e monitorar temperatura via sensores PT100",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "SURTO DE TENSÃO (TRANSIENTE)",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "DESCARGA ATMOSFÉRICA",
                      type: "contributingFactor",
                      children: [
                        {
                          label: "PROTEÇÃO CONTRA SURTOS INADEQUADA",
                          type: "basicCause",
                          children: [
                            {
                              label: "INSTALAÇÃO DE DPS\nInstalar e revisar Dispositivos de Proteção contra Surtos (DPS)",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    event: "Perda de Comunicação com CLP (Automação)",
    tree: {
      label: "PERDA DE COMUNICAÇÃO COM O CLP",
      type: "topEvent",
      children: [
        {
          label: "FALHA NO LINK DE REDE INDUSTRIAL",
          type: "immediateCause",
          children: [
            {
              label: "OU",
              type: "orGate",
              children: [
                {
                  label: "FALHA DE HARDWARE",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "QUEIMA DA PORTA DE COMUNICAÇÃO",
                      type: "intermediateCause",
                      children: [
                        {
                          label: "INTERFERÊNCIA ELETROMAGNÉTICA (EMI)",
                          type: "basicCause",
                          children: [
                            {
                              label: "BLINDAGEM E ATERRAMENTO\nSubstituir cabos por modelos blindados e validar aterramento",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "FALHA DE CONFIGURAÇÃO / SOFTWARE",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "CONFLITO DE ENDEREÇO IP NA REDE",
                      type: "intermediateCause",
                      children: [
                        {
                          label: "ALTERAÇÃO INDEVIDA DE PARÂMETROS",
                          type: "basicCause",
                          children: [
                            {
                              label: "CONTROLE DE ACESSO\nImplementar senhas de acesso e backup automático de configurações",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    event: "Erro de Leitura em Sensor Crítico (Automação)",
    tree: {
      label: "ERRO DE LEITURA EM SENSOR CRÍTICO",
      type: "topEvent",
      children: [
        {
          label: "SINAL DE SAÍDA FORA DA FAIXA (OUT OF RANGE)",
          type: "immediateCause",
          children: [
            {
              label: "OU",
              type: "orGate",
              children: [
                {
                  label: "DESCALIBRAÇÃO DO INSTRUMENTO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "DESVIO (DRIFT) TEMPORAL DO SENSOR",
                      type: "contributingFactor",
                      children: [
                        {
                          label: "FALTA DE CALIBRAÇÃO PERIÓDICA",
                          type: "basicCause",
                          children: [
                            {
                              label: "PLANO DE CALIBRAÇÃO RBC\nImplementar calibração rastreável a cada 12 meses",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  label: "OBSTRUÇÃO FÍSICA NO PROCESSO",
                  type: "intermediateCause",
                  children: [
                    {
                      label: "ENTUPIMENTO DA TOMADA DE IMPULSO",
                      type: "intermediateCause",
                      children: [
                        {
                          label: "ACÚMULO DE SEDIMENTOS DO PROCESSO",
                          type: "basicCause",
                          children: [
                            {
                              label: "SISTEMA DE PURGA\nInstalar sistema de purga e realizar limpeza quinzenal",
                              type: "blockingAction"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
];
