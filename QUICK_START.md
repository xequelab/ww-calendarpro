# Calendar Pro - Quick Start Guide

## Instalação

1. Copie a pasta `ww-calendarpro` para seus componentes WeWeb
2. O componente estará disponível como "Calendar Pro" no editor

## Configuração Rápida (5 minutos)

### 1. Adicione o Componente à Página

Arraste "Calendar Pro" para sua página.

### 2. Configure as Collections

No painel de propriedades, seção **Settings**:

#### Agendamentos (obrigatório)
```
Bind to: agendamentos (collection)
Add filters:
  - data_inicio >= [variable: COMPONENT_UID-startDate]
  - data_inicio <= [variable: COMPONENT_UID-endDate]
```

#### Bloqueios (opcional)
```
Bind to: bloqueios_agenda (collection)
Add filters:
  - data_inicio >= [variable: COMPONENT_UID-startDate]
  - data_inicio <= [variable: COMPONENT_UID-endDate]
```

#### Serviços, Profissionais, Clientes (opcional)
```
Bind to: respectivas collections
Sem filtros necessários (usado para enriquecimento)
```

### 3. Configure Horário de Trabalho

No painel de propriedades:
- **Working Hours Start**: 6 (6:00 AM)
- **Working Hours End**: 22 (10:00 PM)
- **Time Slot Duration**: 30 (minutos)

### 4. Ajuste as Cores (Opcional)

Seção **Style**:
- **Primary Color**: #081B4E (seu azul)
- **Background Color**: #FFFFFF
- **Border Color**: #E5E7EB

Deixe os outros valores como padrão ou ajuste conforme sua identidade visual.

## Workflows Essenciais

### Abrir Detalhes do Agendamento

1. No componente, vá em **Events**
2. **On appointment click** → Add action:
   - Navigate to: `/appointment-details`
   - Pass variable: `event.appointmentId`

### Criar Novo Agendamento

1. No componente, **Events**
2. **On empty slot click** → Add action:
   - Navigate to: `/new-appointment`
   - Pass variables:
     - Date: `event.date`
     - Time: `event.time`

### Atualizar Calendário ao Mudar Data

O calendário atualiza automaticamente! As variáveis `startDate` e `endDate` são expostas e os filtros da collection fazem o refetch.

## Variáveis Disponíveis

Use em workflows e formulas:

- `variables['COMPONENT_UID-startDate']` - Data inicial do período
- `variables['COMPONENT_UID-endDate']` - Data final do período
- `variables['COMPONENT_UID-currentView']` - View atual (month/week/day)
- `variables['COMPONENT_UID-currentDate']` - Data selecionada
- `variables['COMPONENT_UID-selectedAppointment']` - Último agendamento clicado

**Substitua `COMPONENT_UID` pelo ID real do seu componente.**

## Ações Disponíveis

Chame de workflows:

### Ir para Hoje
```
Run component action:
  Component: Calendar Pro
  Action: Go to today
```

### Ir para Data Específica
```
Run component action:
  Component: Calendar Pro
  Action: Go to date
  Parameters:
    date: "2026-12-25"
```

### Mudar Visualização
```
Run component action:
  Component: Calendar Pro
  Action: Change view
  Parameters:
    view: "week"  // ou "month", "day"
```

## Exemplo Completo: Sistema de Agendamentos

### 1. Página Principal (Calendar)

- Componente Calendar Pro
- Bind agendamentos com filtros de data
- Event "appointmentClick" → Navigate `/appointment/[id]`
- Event "emptySlotClick" → Navigate `/new-appointment?date=[date]&time=[time]`

### 2. Página Detalhes (/appointment/[id])

- Fetch agendamento por ID
- Mostrar detalhes completos
- Botão "Edit" → Navigate `/appointment/[id]/edit`
- Botão "Cancel" → Update status + Navigate back

### 3. Página Novo Agendamento (/new-appointment)

- Form com campos pré-preenchidos:
  - Data: query param `date`
  - Hora: query param `time`
- Submit → Create appointment
- Redirect → Calendar page

### 4. Atualização Automática

Quando criar/editar agendamento:
- Collection `agendamentos` refetch automaticamente
- Calendário mostra novo dado
- Sem necessidade de refresh manual

## Dicas Pro

### Performance
- Mantenha os filtros de data nas collections
- Não carregue todos agendamentos de uma vez
- Use pagination/limit se necessário

### UX
- Configure "Default View" baseado no dispositivo:
  - Desktop: Month
  - Mobile: Day (mais fácil de navegar)

### Styling
- Teste em diferentes tamanhos de tela
- Ajuste font sizes se necessário
- Use as cores da sua identidade visual

### Validação
- No form de novo agendamento, valide se horário não está ocupado
- Use workflow para checar overlaps antes de criar

## Troubleshooting

### Agendamentos não aparecem
- ✓ Collections bindadas corretamente?
- ✓ Filtros de data configurados?
- ✓ Campo `data_inicio` tem valor válido?
- ✓ Formato ISO timestamp: `2026-01-21T09:00:00.000Z`

### Calendário não navega
- ✓ Verificar console do browser
- ✓ Confirmar que events estão configurados
- ✓ Testar em modo preview (não editor)

### Cores não aplicam
- ✓ Verificar seção Style no painel
- ✓ Confirmar que valores são códigos hex válidos
- ✓ Refresh da página

## Próximos Passos

1. Configure filtros de profissional (se multi-profissional)
2. Adicione botões de ação rápida (reschedule, cancel)
3. Implemente notificações de agendamento
4. Configure sincronização com Google Calendar

## Suporte

- **Documentação Completa**: Ver `CLAUDE.md`
- **README**: Ver `README.md`
- **Schema do Banco**: Ver seu `schema.txt`

---

**Componente pronto para uso! 🎉**

Comece adicionando à sua página e configurando as collections.
