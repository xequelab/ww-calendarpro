export default {
  editor: {
    label: {
      en: 'Calendar Pro',
      pt: 'Calendário Pro'
    },
    icon: 'calendar'
  },

  triggerEvents: [
    {
      name: 'appointmentClick',
      label: {
        en: 'On appointment click',
        pt: 'Ao clicar em agendamento'
      },
      event: {
        appointment: {},
        appointmentId: null
      },
      default: true
    },
    {
      name: 'emptySlotClick',
      label: {
        en: 'On empty slot click',
        pt: 'Ao clicar em horário vazio'
      },
      event: {
        date: null,
        time: null,
        timestamp: null
      }
    },
    {
      name: 'dateChange',
      label: {
        en: 'On date change',
        pt: 'Ao mudar data'
      },
      event: {
        date: null,
        view: 'month',
        startDate: null,
        endDate: null
      }
    },
    {
      name: 'viewChange',
      label: {
        en: 'On view change',
        pt: 'Ao mudar visualização'
      },
      event: {
        view: 'month',
        previousView: 'month'
      }
    }
  ],

  actions: [
    {
      label: {
        en: 'Go to today',
        pt: 'Ir para hoje'
      },
      action: 'goToToday'
    },
    {
      label: {
        en: 'Go to date',
        pt: 'Ir para data'
      },
      action: 'goToDate',
      args: [
        {
          name: 'date',
          type: 'string'
        }
      ]
    },
    {
      label: {
        en: 'Change view',
        pt: 'Mudar visualização'
      },
      action: 'changeView',
      args: [
        {
          name: 'view',
          type: 'string'
        }
      ]
    },
    {
      label: {
        en: 'Next period',
        pt: 'Próximo período'
      },
      action: 'nextPeriod'
    },
    {
      label: {
        en: 'Previous period',
        pt: 'Período anterior'
      },
      action: 'previousPeriod'
    }
  ],

  properties: {
    // Collections
    agendamentos: {
      label: {
        en: 'Appointments Collection',
        pt: 'Coleção de Agendamentos'
      },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Collection with appointments data'
      }
      /* wwEditor:end */
    },
    bloqueios: {
      label: {
        en: 'Blocks Collection',
        pt: 'Coleção de Bloqueios'
      },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Collection with schedule blocks'
      }
      /* wwEditor:end */
    },
    servicos: {
      label: {
        en: 'Services Collection',
        pt: 'Coleção de Serviços'
      },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Collection with services data'
      }
      /* wwEditor:end */
    },
    profissionais: {
      label: {
        en: 'Professionals Collection',
        pt: 'Coleção de Profissionais'
      },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Collection with professionals data'
      }
      /* wwEditor:end */
    },
    clientes: {
      label: {
        en: 'Clients Collection',
        pt: 'Coleção de Clientes'
      },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Collection with clients data'
      }
      /* wwEditor:end */
    },

    // Initial Configuration
    defaultView: {
      label: {
        en: 'Default View',
        pt: 'Visualização Padrão'
      },
      type: 'TextSelect',
      section: 'settings',
      defaultValue: 'month',
      options: {
        options: [
          { value: 'month', label: 'Mês' },
          { value: 'week', label: 'Semana' },
          { value: 'day', label: 'Dia' }
        ]
      }
    },
    workingHoursStart: {
      label: {
        en: 'Working Hours Start',
        pt: 'Início do Horário'
      },
      type: 'Number',
      section: 'settings',
      defaultValue: 6,
      options: {
        min: 0,
        max: 23
      }
    },
    workingHoursEnd: {
      label: {
        en: 'Working Hours End',
        pt: 'Fim do Horário'
      },
      type: 'Number',
      section: 'settings',
      defaultValue: 22,
      options: {
        min: 0,
        max: 23
      }
    },
    timeSlotMinutes: {
      label: {
        en: 'Time Slot Duration (minutes)',
        pt: 'Duração do Slot (minutos)'
      },
      type: 'Number',
      section: 'settings',
      defaultValue: 30,
      options: {
        min: 15,
        max: 120
      }
    },

    // Visual Styles
    primaryColor: {
      label: {
        en: 'Primary Color',
        pt: 'Cor Primária'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#081B4E'
    },
    backgroundColor: {
      label: {
        en: 'Background Color',
        pt: 'Cor de Fundo'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#FFFFFF'
    },
    borderColor: {
      label: {
        en: 'Border Color',
        pt: 'Cor da Borda'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#E5E7EB'
    },
    textColor: {
      label: {
        en: 'Text Color',
        pt: 'Cor do Texto'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#1F2937'
    },
    mutedTextColor: {
      label: {
        en: 'Muted Text Color',
        pt: 'Cor do Texto Secundário'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#6B7280'
    },
    todayHighlightColor: {
      label: {
        en: 'Today Highlight Color',
        pt: 'Cor de Destaque Hoje'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#EFF6FF'
    },
    appointmentBackgroundColor: {
      label: {
        en: 'Appointment Background',
        pt: 'Fundo do Agendamento'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#DBEAFE'
    },
    appointmentTextColor: {
      label: {
        en: 'Appointment Text Color',
        pt: 'Cor do Texto do Agendamento'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#1E40AF'
    },
    blockBackgroundColor: {
      label: {
        en: 'Block Background',
        pt: 'Fundo do Bloqueio'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#FEE2E2'
    },
    blockTextColor: {
      label: {
        en: 'Block Text Color',
        pt: 'Cor do Texto do Bloqueio'
      },
      type: 'Color',
      section: 'style',
      defaultValue: '#991B1B'
    },
    cancelledOpacity: {
      label: {
        en: 'Cancelled Opacity',
        pt: 'Opacidade de Cancelado'
      },
      type: 'Number',
      section: 'style',
      defaultValue: 0.5,
      options: {
        min: 0.1,
        max: 1,
        step: 0.1
      }
    },

    // Typography
    headerFontSize: {
      label: {
        en: 'Header Font Size',
        pt: 'Tamanho da Fonte do Cabeçalho'
      },
      type: 'Length',
      section: 'style',
      responsive: true,
      defaultValue: '16px',
      options: {
        unitChoices: [
          { value: 'px', label: 'px', min: 10, max: 32 }
        ]
      }
    },
    bodyFontSize: {
      label: {
        en: 'Body Font Size',
        pt: 'Tamanho da Fonte do Corpo'
      },
      type: 'Length',
      section: 'style',
      responsive: true,
      defaultValue: '14px',
      options: {
        unitChoices: [
          { value: 'px', label: 'px', min: 10, max: 24 }
        ]
      }
    },

    // Labels
    monthLabel: {
      label: {
        en: 'Month View Label',
        pt: 'Label Visualização Mês'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: 'Mês',
      multiLang: true
    },
    weekLabel: {
      label: {
        en: 'Week View Label',
        pt: 'Label Visualização Semana'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: 'Semana',
      multiLang: true
    },
    dayLabel: {
      label: {
        en: 'Day View Label',
        pt: 'Label Visualização Dia'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: 'Dia',
      multiLang: true
    },
    todayLabel: {
      label: {
        en: 'Today Button Label',
        pt: 'Label Botão Hoje'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: 'Hoje',
      multiLang: true
    }
  }
};
